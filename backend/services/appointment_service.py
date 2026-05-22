from datetime import datetime, date, time, timedelta
from sqlalchemy.exc import IntegrityError
from models import db
from models.rendez_vous import RendezVous, Disponibilite
from models.patient import Patient
from models.nutritionniste import Nutritionniste

JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
SLOT_MINUTES = 30


def _nutritionniste_id() -> int:
    nut = Nutritionniste.query.first()
    if not nut:
        raise ValueError('Aucun nutritionniste disponible')
    return nut.id_nutritionniste


def _patient_for_user(user_id: int) -> Patient:
    patient = Patient.query.filter_by(id_user=user_id).first()
    if not patient:
        raise ValueError('Profil patient introuvable')
    return patient


def _parse_date(date_str: str) -> date:
    try:
        return datetime.strptime(date_str, '%Y-%m-%d').date()
    except (ValueError, TypeError):
        raise ValueError('Date invalide')


def _gen_slots(start: time, end: time) -> list[str]:
    slots = []
    cur = datetime.combine(date.today(), start)
    end_dt = datetime.combine(date.today(), end)
    while cur + timedelta(minutes=SLOT_MINUTES) <= end_dt:
        slots.append(cur.time().strftime('%H:%M'))
        cur += timedelta(minutes=SLOT_MINUTES)
    return slots


def get_working_days() -> list[str]:
    nid = _nutritionniste_id()
    rows = Disponibilite.query.filter_by(id_nutritionniste=nid, statut='disponible').all()
    days = {r.jour for r in rows if r.jour}
    return sorted(days, key=lambda j: JOURS.index(j) if j in JOURS else 99)


def get_slots(date_str: str) -> list[dict]:
    d = _parse_date(date_str)
    nid = _nutritionniste_id()
    jour = JOURS[d.weekday()]

    dispos = Disponibilite.query.filter_by(
        id_nutritionniste=nid, jour=jour, statut='disponible'
    ).all()

    all_slots: list[str] = []
    for dispo in dispos:
        all_slots.extend(_gen_slots(dispo.heure_debut, dispo.heure_fin))
    all_slots = sorted(set(all_slots))

    booked = RendezVous.query.filter(
        RendezVous.id_nutritionniste == nid,
        RendezVous.date_rendez_vous == d,
        RendezVous.statut != 'annule',
    ).all()
    taken = {rv.heure.strftime('%H:%M') for rv in booked}

    is_past = d < date.today()
    return [
        {'time': s, 'available': (s not in taken) and not is_past}
        for s in all_slots
    ]


def book(user_id: int, date_str: str, heure_str: str) -> dict:
    patient = _patient_for_user(user_id)
    nid = _nutritionniste_id()
    d = _parse_date(date_str)
    try:
        h = datetime.strptime(heure_str, '%H:%M').time()
    except (ValueError, TypeError):
        raise ValueError('Heure invalide')

    if d < date.today():
        raise ValueError('Impossible de réserver une date passée')

    existing = RendezVous.query.filter(
        RendezVous.id_nutritionniste == nid,
        RendezVous.date_rendez_vous == d,
        RendezVous.heure == h,
        RendezVous.statut != 'annule',
    ).first()
    if existing:
        raise ValueError('Ce créneau est déjà réservé')

    rv = RendezVous(
        id_patient=patient.id_patient,
        id_nutritionniste=nid,
        date_rendez_vous=d,
        heure=h,
        statut='en_attente',
    )
    try:
        db.session.add(rv)
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        raise ValueError('Ce créneau est déjà réservé')

    return rv.to_dict()


def list_for_user(user_id: int) -> list[dict]:
    patient = _patient_for_user(user_id)
    rows = (RendezVous.query
            .filter_by(id_patient=patient.id_patient)
            .order_by(RendezVous.date_rendez_vous, RendezVous.heure)
            .all())
    return [rv.to_dict() for rv in rows]
