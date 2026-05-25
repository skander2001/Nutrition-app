from models import db


class RendezVous(db.Model):
    __tablename__ = 'rendez_vous'

    id_rendez_vous    = db.Column(db.Integer, primary_key=True)
    id_patient        = db.Column(db.Integer, db.ForeignKey('patient.id_patient'), nullable=False)
    id_nutritionniste = db.Column(db.Integer, db.ForeignKey('nutritionniste.id_nutritionniste'), nullable=False)
    date_rendez_vous  = db.Column(db.Date, nullable=False)
    heure             = db.Column(db.Time, nullable=False)
    statut            = db.Column(db.Enum('en_attente', 'confirme', 'annule'), default='en_attente')

    # Relationships — `patient.rendez_vous` + `rdv.patient`
    patient = db.relationship('Patient', backref='rendez_vous')

    def to_dict(self):
        date_iso = self.date_rendez_vous.isoformat() if self.date_rendez_vous else None
        heure_str = self.heure.strftime('%H:%M') if self.heure else None
        return {
            # patient-side aliases (back-compat)
            'id': self.id_rendez_vous,
            'date': date_iso,
            # admin-side canonical column names
            'id_rendez_vous': self.id_rendez_vous,
            'id_patient': self.id_patient,
            'id_nutritionniste': self.id_nutritionniste,
            'date_rendez_vous': date_iso,
            # shared
            'heure': heure_str,
            'statut': self.statut,
        }
