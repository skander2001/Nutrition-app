"""Service du back-office nutritionniste.

Le nutritionniste etant unique, beaucoup d'endpoints n'ont pas besoin
de filtrer par `id_nutritionniste` mais on garde la coherence.
"""

from __future__ import annotations
import json
from datetime import datetime, date, time
from sqlalchemy import func, or_
from models import db
from models.user import User
from models.patient import Patient
from models.nutritionniste import Nutritionniste
from models.rendez_vous import RendezVous
from models.consultation import Consultation
from models.disponibilite import Disponibilite
from models.meal_plan import MealPlanTemplate, PatientMealPlan
from services import notification_service
from services import email_service


# ---------- helpers ----------

def _parse_date(s):
    if not s:
        return None
    return datetime.strptime(s, '%Y-%m-%d').date()


def _parse_time(s):
    if not s:
        return None
    parts = s.split(':')
    return time(int(parts[0]), int(parts[1]) if len(parts) > 1 else 0)


CONSULTATION_DUREE_MIN = 30  # duree fixe d'une consultation


def _minutes(t) -> int:
    return t.hour * 60 + t.minute


def _creneau_en_conflit(nutri_id: int, d, h) -> bool:
    """Vrai si un RDV non annule chevauche le creneau (consultation de 30 min)."""
    same_day = RendezVous.query.filter(
        RendezVous.id_nutritionniste == nutri_id,
        RendezVous.date_rendez_vous == d,
        RendezVous.statut != 'annule',
    ).all()
    return any(abs(_minutes(r.heure) - _minutes(h)) < CONSULTATION_DUREE_MIN
               for r in same_day if r.heure)


def get_nutritionniste():
    """Retourne l'unique nutritionniste (ou None)."""
    return Nutritionniste.query.first()


def _patient_payload(p: Patient) -> dict:
    user = p.user
    data = p.to_dict()
    if user:
        data['user'] = {
            'id': user.id,
            'nom': user.nom,
            'prenom': user.prenom,
            'email': user.email,
            'telephone': user.telephone,
            'ddn': user.ddn.isoformat() if user.ddn else None,
            'status': user.status,
        }
    return data


# ---------- stats ----------

def get_stats():
    today = date.today()
    return {
        'total_patients': Patient.query.count(),
        'rdv_today': RendezVous.query.filter_by(date_rendez_vous=today).count(),
        'rdv_pending': RendezVous.query.filter_by(statut='en_attente').count(),
        'rdv_confirmed_upcoming': RendezVous.query
            .filter(RendezVous.statut == 'confirme', RendezVous.date_rendez_vous >= today)
            .count(),
        'total_consultations': Consultation.query.count(),
        'total_templates': MealPlanTemplate.query.count(),
        'active_plans': PatientMealPlan.query.count(),
    }


# ---------- patients ----------

def list_patients(search: str = '') -> list:
    q = Patient.query.join(User, Patient.id_user == User.id)
    if search:
        like = f"%{search}%"
        q = q.filter(or_(User.nom.ilike(like), User.prenom.ilike(like), User.email.ilike(like)))
    return [_patient_payload(p) for p in q.all()]


def get_patient(id_patient: int) -> dict:
    p = Patient.query.get(id_patient)
    if not p:
        raise ValueError('Patient introuvable')
    return _patient_payload(p)


def update_patient(id_patient: int, data: dict) -> dict:
    p = Patient.query.get(id_patient)
    if not p:
        raise ValueError('Patient introuvable')
    for field in ('sexe', 'adresse', 'taille', 'poids_initial', 'allergie', 'maladie_chronique', 'objectif'):
        if field in data:
            setattr(p, field, data[field])
    db.session.commit()
    return _patient_payload(p)


def create_patient(data: dict) -> dict:
    """Cree un compte patient depuis le back-office nutritionniste."""
    from services.auth_service import bcrypt

    for f in ('prenom', 'nom', 'email', 'password'):
        if not (data.get(f) or '').strip():
            raise ValueError('Veuillez completer tous les champs obligatoires.')

    password = data['password']
    if len(password) < 8:
        raise ValueError('Le mot de passe doit contenir au moins 8 caracteres.')

    email = data['email'].strip().lower()
    if User.query.filter_by(email=email).first():
        raise ValueError('Cette adresse e-mail est deja utilisee.')

    hashed = bcrypt.generate_password_hash(password).decode('utf-8')
    user = User(
        nom=data['nom'].strip(),
        prenom=data['prenom'].strip(),
        email=email,
        telephone=(data.get('telephone') or '').strip(),
        password=hashed,
        status='actif',
    )
    db.session.add(user)
    db.session.flush()  # recupere user.id

    patient = Patient(
        id_user=user.id,
        taille=0,
        poids_initial=0,
        sexe=data.get('sexe') or None,
        adresse=(data.get('adresse') or '').strip() or None,
        objectif=(data.get('objectif') or '').strip() or None,
    )
    db.session.add(patient)
    db.session.commit()
    return _patient_payload(patient)


# ---------- rendez-vous ----------

def _rdv_payload(rdv: RendezVous) -> dict:
    data = rdv.to_dict()
    if rdv.patient and rdv.patient.user:
        u = rdv.patient.user
        data['patient'] = {
            'id_patient': rdv.patient.id_patient,
            'nom': u.nom,
            'prenom': u.prenom,
            'email': u.email,
            'telephone': u.telephone,
        }
    data['has_consultation'] = len(rdv.consultations) > 0
    return data


def list_rdv(statut: str | None = None, date_from: str | None = None, date_to: str | None = None) -> list:
    q = RendezVous.query
    if statut:
        q = q.filter_by(statut=statut)
    if date_from:
        q = q.filter(RendezVous.date_rendez_vous >= _parse_date(date_from))
    if date_to:
        q = q.filter(RendezVous.date_rendez_vous <= _parse_date(date_to))
    q = q.order_by(RendezVous.date_rendez_vous.desc(), RendezVous.heure.desc())
    return [_rdv_payload(r) for r in q.all()]


def create_rdv(data: dict) -> dict:
    """Le nutritionniste planifie un rendez-vous pour un patient choisi."""
    nutri = get_nutritionniste()
    if not nutri:
        raise ValueError('Aucun nutritionniste configure')

    id_patient = data.get('id_patient')
    if not id_patient:
        raise ValueError('Veuillez selectionner un patient.')
    patient = Patient.query.get(id_patient)
    if not patient:
        raise ValueError('Patient introuvable')

    if not data.get('date_rendez_vous') or not data.get('heure'):
        raise ValueError('Date et heure requises.')

    d = _parse_date(data['date_rendez_vous'])
    h = _parse_time(data['heure'])

    statut = data.get('statut') or 'confirme'
    if statut not in ('en_attente', 'confirme', 'annule'):
        raise ValueError('Statut invalide')

    # Une consultation dure 30 min : on bloque tout chevauchement.
    if _creneau_en_conflit(nutri.id_nutritionniste, d, h):
        raise ValueError('Ce creneau chevauche un rendez-vous existant '
                         '(consultation de 30 min).')

    rdv = RendezVous(
        id_patient=patient.id_patient,
        id_nutritionniste=nutri.id_nutritionniste,
        date_rendez_vous=d,
        heure=h,
        statut=statut,
    )
    db.session.add(rdv)
    db.session.commit()

    notification_service.create(
        patient.id_user, 'Nouveau rendez-vous',
        f"Un rendez-vous a ete planifie le {d} a {h.strftime('%H:%M')}.",
        'info', '/dashboard')
    return _rdv_payload(rdv)


def update_rdv_status(id_rdv: int, statut: str) -> dict:
    if statut not in ('en_attente', 'confirme', 'annule'):
        raise ValueError('Statut invalide')
    r = RendezVous.query.get(id_rdv)
    if not r:
        raise ValueError('Rendez-vous introuvable')
    r.statut = statut
    db.session.commit()

    if r.patient:
        user = r.patient.user
        heure_str = r.heure.strftime('%H:%M') if r.heure else ''
        date_str = r.date_rendez_vous.strftime('%d/%m/%Y') if r.date_rendez_vous else ''
        if statut == 'confirme':
            notification_service.create(
                r.patient.id_user, 'Rendez-vous confirmé',
                f"Votre rendez-vous du {r.date_rendez_vous} à {heure_str} a été confirmé.",
                'success', '/dashboard')
            if user and user.email:
                email_service.send_rdv_confirme(user.email, user.prenom, date_str, heure_str)
        elif statut == 'annule':
            notification_service.create(
                r.patient.id_user, 'Rendez-vous refusé',
                f"Votre rendez-vous du {r.date_rendez_vous} a été refusé. "
                f"Veuillez réserver un autre créneau.",
                'danger', '/appointment')
            if user and user.email:
                email_service.send_rdv_refuse(user.email, user.prenom, date_str)
    return _rdv_payload(r)


def delete_rdv(id_rdv: int) -> None:
    r = RendezVous.query.get(id_rdv)
    if not r:
        raise ValueError('Rendez-vous introuvable')
    db.session.delete(r)
    db.session.commit()


# ---------- consultations ----------

def create_consultation(data: dict) -> dict:
    required = ('id_rendez_vous',)
    for f in required:
        if not data.get(f):
            raise ValueError(f'Champ requis : {f}')

    rdv = RendezVous.query.get(data['id_rendez_vous'])
    if not rdv:
        raise ValueError('Rendez-vous introuvable')

    c = Consultation(
        id_rendez_vous=data['id_rendez_vous'],
        date_consultation=_parse_date(data.get('date_consultation')) or date.today(),
        poids=data.get('poids'),
        tension_arterielle=data.get('tension_arterielle'),
        glycemie=data.get('glycemie'),
        diagnostic=data.get('diagnostic'),
        remarque=data.get('remarque'),
    )
    db.session.add(c)
    db.session.commit()

    if rdv.patient:
        notification_service.create(
            rdv.patient.id_user, 'Nouvelle consultation',
            'Une nouvelle consultation a été enregistrée dans votre dossier.',
            'info', '/dashboard')
    return c.to_dict()


def list_consultations(id_patient: int | None = None) -> list:
    q = Consultation.query.join(RendezVous, Consultation.id_rendez_vous == RendezVous.id_rendez_vous)
    if id_patient:
        q = q.filter(RendezVous.id_patient == id_patient)
    q = q.order_by(Consultation.date_consultation.desc())
    result = []
    for c in q.all():
        d = c.to_dict()
        rdv = c.rendez_vous
        if rdv:
            d['rdv_date'] = rdv.date_rendez_vous.isoformat() if rdv.date_rendez_vous else None
            d['rdv_heure'] = rdv.heure.strftime('%H:%M') if rdv.heure else None
            p = rdv.patient
            if p:
                u = User.query.get(p.id_user)
                d['patient'] = {
                    'id_patient': p.id_patient,
                    'nom': u.nom if u else '',
                    'prenom': u.prenom if u else '',
                    'email': u.email if u else '',
                    'telephone': u.telephone if u else '',
                }
            else:
                d['patient'] = None
        result.append(d)
    return result


def get_consultation(id_c: int) -> dict:
    c = Consultation.query.get(id_c)
    if not c:
        raise ValueError('Consultation introuvable')
    return c.to_dict()


def update_consultation(id_c: int, data: dict) -> dict:
    c = Consultation.query.get(id_c)
    if not c:
        raise ValueError('Consultation introuvable')
    if 'date_consultation' in data:
        c.date_consultation = _parse_date(data['date_consultation'])
    for f in ('poids', 'tension_arterielle', 'glycemie', 'diagnostic', 'remarque'):
        if f in data:
            setattr(c, f, data[f])
    db.session.commit()
    return c.to_dict()


# ---------- disponibilites ----------

def list_disponibilites() -> list:
    return [d.to_dict() for d in Disponibilite.query
            .order_by(Disponibilite.jour, Disponibilite.heure_debut).all()]


def create_disponibilite(data: dict) -> dict:
    nutri = get_nutritionniste()
    if not nutri:
        raise ValueError('Aucun nutritionniste configure')

    for f in ('heure_debut', 'heure_fin'):
        if not data.get(f):
            raise ValueError(f'Champ requis : {f}')

    d = Disponibilite(
        id_nutritionniste=nutri.id_nutritionniste,
        jour=data.get('jour'),
        date=_parse_date(data.get('date')),
        heure_debut=_parse_time(data['heure_debut']),
        heure_fin=_parse_time(data['heure_fin']),
        statut=data.get('statut', 'disponible'),
    )
    db.session.add(d)
    db.session.commit()
    return d.to_dict()


def update_disponibilite(id_d: int, data: dict) -> dict:
    d = Disponibilite.query.get(id_d)
    if not d:
        raise ValueError('Disponibilite introuvable')
    if 'jour' in data:        d.jour = data['jour']
    if 'date' in data:        d.date = _parse_date(data['date'])
    if 'heure_debut' in data: d.heure_debut = _parse_time(data['heure_debut'])
    if 'heure_fin' in data:   d.heure_fin = _parse_time(data['heure_fin'])
    if 'statut' in data:      d.statut = data['statut']
    db.session.commit()
    return d.to_dict()


def delete_disponibilite(id_d: int) -> None:
    d = Disponibilite.query.get(id_d)
    if not d:
        raise ValueError('Disponibilite introuvable')
    db.session.delete(d)
    db.session.commit()


# ---------- meal plan templates ----------

def list_templates() -> list:
    return [t.to_dict() for t in MealPlanTemplate.query.order_by(MealPlanTemplate.created_at.desc()).all()]


def create_template(data: dict) -> dict:
    if not data.get('nom'):
        raise ValueError('Le nom est requis')

    t = MealPlanTemplate(
        nom=data['nom'],
        objectif=data.get('objectif'),
        description=data.get('description'),
        kcal_total=data.get('kcal_total'),
        contenu=json.dumps(data.get('contenu') or {}, ensure_ascii=False),
    )
    db.session.add(t)
    db.session.commit()
    return t.to_dict()


def update_template(id_t: int, data: dict) -> dict:
    t = MealPlanTemplate.query.get(id_t)
    if not t:
        raise ValueError('Template introuvable')
    if 'nom' in data:         t.nom = data['nom']
    if 'objectif' in data:    t.objectif = data['objectif']
    if 'description' in data: t.description = data['description']
    if 'kcal_total' in data:  t.kcal_total = data['kcal_total']
    if 'contenu' in data:     t.contenu = json.dumps(data['contenu'] or {}, ensure_ascii=False)
    db.session.commit()
    return t.to_dict()


def delete_template(id_t: int) -> None:
    t = MealPlanTemplate.query.get(id_t)
    if not t:
        raise ValueError('Template introuvable')
    db.session.delete(t)
    db.session.commit()


# ---------- plans patient ----------

def list_patient_plans(id_patient: int) -> list:
    plans = PatientMealPlan.query.filter_by(id_patient=id_patient)\
        .order_by(PatientMealPlan.created_at.desc()).all()
    return [p.to_dict() for p in plans]


def assign_plan(id_patient: int, data: dict) -> dict:
    p = Patient.query.get(id_patient)
    if not p:
        raise ValueError('Patient introuvable')

    contenu = data.get('contenu')
    nom     = data.get('nom')
    template = None

    if data.get('id_template'):
        template = MealPlanTemplate.query.get(data['id_template'])
        if not template:
            raise ValueError('Template introuvable')
        if not contenu:
            try:
                contenu = json.loads(template.contenu) if template.contenu else {}
            except (ValueError, TypeError):
                contenu = {}
        if not nom:
            nom = template.nom

    plan = PatientMealPlan(
        id_patient=id_patient,
        id_template=template.id if template else None,
        nom=nom or 'Plan personnalise',
        date_debut=_parse_date(data.get('date_debut')),
        date_fin=_parse_date(data.get('date_fin')),
        contenu=json.dumps(contenu or {}, ensure_ascii=False),
        notes=data.get('notes'),
    )
    db.session.add(plan)
    db.session.commit()

    notification_service.create(
        p.id_user, 'Nouveau plan alimentaire',
        f"Un plan alimentaire « {plan.nom} » vous a été assigné.",
        'success', '/dashboard')
    return plan.to_dict()


def delete_patient_plan(id_plan: int) -> None:
    plan = PatientMealPlan.query.get(id_plan)
    if not plan:
        raise ValueError('Plan introuvable')
    db.session.delete(plan)
    db.session.commit()


# ---------- AI meal plan generation ----------

def _infer_diet_type(maladie: str, objectif: str) -> str:
    m = (maladie or '').lower()
    o = (objectif or '').lower()
    if any(w in m for w in ('diabet', 'sucre', 'glycem')):
        return 'Low_Carb'
    if any(w in m for w in ('hypertension', 'cardio', 'tension', 'cardiaque')):
        return 'Low_Sodium'
    if any(w in o for w in ('muscle', 'masse', 'sportif', 'protein')):
        return 'High_Protein'
    if any(w in o for w in ('gras', 'cholesterol', 'obese', 'obesite')):
        return 'Low_Fat'
    return 'Balanced'


def _infer_goal(objectif: str, bmi: float) -> str:
    o = (objectif or '').lower()
    if any(w in o for w in ('perte', 'mincir', 'maigrir', 'poids')):
        return 'Weight Loss'
    if any(w in o for w in ('muscle', 'masse', 'prise')):
        return 'Muscle Gain'
    if bmi < 18.5:
        return 'Weight Gain'
    if bmi >= 30:
        return 'Weight Loss'
    return 'Maintenance'


def _target_calories(weight_kg: float, height_cm: float, age: int, gender: str) -> int:
    if gender == 'M':
        bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age + 5
    else:
        bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age - 161
    return round(bmr * 1.375)  # activité modérée par défaut


def generate_ai_plan(id_patient: int, cuisine: str, notes: str = '') -> dict:
    """
    Génère un plan alimentaire 7 jours pour un patient via RAG + OpenAI,
    puis le sauvegarde dans patient_meal_plan.
    """
    import os
    from ai.retriever import RAGRetriever
    from ai import generator as gen_module
    from datetime import date

    p = Patient.query.get(id_patient)
    if not p:
        raise ValueError('Patient introuvable')

    user = p.user
    if not user:
        raise ValueError('Données utilisateur manquantes')

    # Calculer l'âge depuis ddn
    age = 30  # fallback
    if user.ddn:
        today = date.today()
        age = today.year - user.ddn.year - (
            (today.month, today.day) < (user.ddn.month, user.ddn.day)
        )

    weight_kg = float(p.poids_initial or 70)
    height_cm = float(p.taille or 170) * 100 if float(p.taille or 170) < 10 else float(p.taille or 170)
    bmi = round(weight_kg / (height_cm / 100) ** 2, 1)
    gender = 'Male' if p.sexe == 'M' else 'Female'

    diet_type = _infer_diet_type(p.maladie_chronique or '', p.objectif or '')
    goal = _infer_goal(p.objectif or '', bmi)
    target_cal = _target_calories(weight_kg, height_cm, age, 'M' if p.sexe == 'M' else 'F')

    profile = {
        'age':                 age,
        'gender':              gender,
        'weight_kg':           weight_kg,
        'height_cm':           height_cm,
        'bmi':                 bmi,
        'disease':             p.maladie_chronique or 'None',
        'severity':            'Moderate',
        'diet_type':           diet_type,
        'goal':                goal,
        'activity_level':      'Moderate',
        'target_calories':     target_cal,
        'cuisine':             cuisine,
        'allergies':           p.allergie or 'None',
        'dietary_restrictions': 'None',
    }

    db_path = os.path.join(os.path.dirname(__file__), '..', 'ai', 'chroma_db')
    retriever = RAGRetriever(db_path=os.path.abspath(db_path))
    result = gen_module.generate(profile, retriever)

    # Sauvegarder dans patient_meal_plan
    nom_plan = f"Plan IA — {cuisine} ({date.today().isoformat()})"
    plan = PatientMealPlan(
        id_patient=id_patient,
        nom=nom_plan,
        contenu=json.dumps(result['meal_plan'], ensure_ascii=False),
        notes=notes or f"Généré automatiquement. Sources : {result['tokens_used']} tokens.",
    )
    db.session.add(plan)
    db.session.commit()

    notification_service.create(
        p.id_user, 'Nouveau plan alimentaire',
        f'Un plan alimentaire personnalisé « {nom_plan} » a été généré pour vous.',
        'success', '/dashboard'
    )

    return {**result, 'id_plan': plan.id, 'nom': nom_plan}
