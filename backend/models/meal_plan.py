from models import db
from datetime import datetime


class MealPlanTemplate(db.Model):
    """Template predefini de plan alimentaire (ex: perte poids, prise masse)."""
    __tablename__ = 'meal_plan_template'

    id          = db.Column(db.Integer, primary_key=True)
    nom         = db.Column(db.String(150), nullable=False)
    objectif    = db.Column(db.String(50))   # perte_poids, prise_masse, equilibre, maintien
    description = db.Column(db.Text)
    kcal_total  = db.Column(db.Integer)
    # JSON serialise : {"lundi": {"petit_dej": "...", "dej": "...", "diner": "...", "collation": "..."}, ...}
    contenu     = db.Column(db.Text)
    created_at  = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        import json
        try:
            contenu = json.loads(self.contenu) if self.contenu else {}
        except (ValueError, TypeError):
            contenu = {}
        return {
            'id': self.id,
            'nom': self.nom,
            'objectif': self.objectif,
            'description': self.description,
            'kcal_total': self.kcal_total,
            'contenu': contenu,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class PatientMealPlan(db.Model):
    """Plan alimentaire affecte a un patient (eventuellement base sur un template)."""
    __tablename__ = 'patient_meal_plan'

    id          = db.Column(db.Integer, primary_key=True)
    id_patient  = db.Column(db.Integer, db.ForeignKey('patient.id_patient'), nullable=False)
    id_template = db.Column(db.Integer, db.ForeignKey('meal_plan_template.id'), nullable=True)
    nom         = db.Column(db.String(150))
    date_debut  = db.Column(db.Date)
    date_fin    = db.Column(db.Date)
    contenu     = db.Column(db.Text)   # JSON (peut surcharger le template)
    notes       = db.Column(db.Text)
    created_at  = db.Column(db.DateTime, default=datetime.utcnow)

    patient  = db.relationship('Patient', backref='meal_plans')
    template = db.relationship('MealPlanTemplate')

    def to_dict(self):
        import json
        try:
            contenu = json.loads(self.contenu) if self.contenu else {}
        except (ValueError, TypeError):
            contenu = {}
        return {
            'id': self.id,
            'id_patient': self.id_patient,
            'id_template': self.id_template,
            'template_nom': self.template.nom if self.template else None,
            'nom': self.nom,
            'date_debut': self.date_debut.isoformat() if self.date_debut else None,
            'date_fin': self.date_fin.isoformat() if self.date_fin else None,
            'contenu': contenu,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
