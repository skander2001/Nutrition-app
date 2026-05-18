from models import db
from datetime import date

class Patient(db.Model):
    __tablename__ = 'patient'

    id_patient        = db.Column(db.Integer, primary_key=True)
    id_user           = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    sexe              = db.Column(db.Enum('M', 'F'), nullable=True)
    adresse           = db.Column(db.String(255), nullable=True)
    allergie          = db.Column(db.String(255), nullable=True)
    maladie_chronique = db.Column(db.String(255), nullable=True)
    objectif          = db.Column(db.String(255), nullable=True)
    ddc               = db.Column(db.Date, default=date.today)

    @property
    def profile_complete(self):
        return all([self.sexe, self.adresse, self.objectif])

    def to_dict(self):
        return {
            'id_patient': self.id_patient,
            'sexe': self.sexe,
            'adresse': self.adresse,
            'allergie': self.allergie,
            'maladie_chronique': self.maladie_chronique,
            'objectif': self.objectif,
            'ddc': self.ddc.isoformat() if self.ddc else None,
            'profile_complete': self.profile_complete,
        }
