from models import db


class RendezVous(db.Model):
    __tablename__ = 'rendez_vous'

    id_rendez_vous    = db.Column(db.Integer, primary_key=True)
    id_patient        = db.Column(db.Integer, db.ForeignKey('patient.id_patient'), nullable=False)
    id_nutritionniste = db.Column(db.Integer, db.ForeignKey('nutritionniste.id_nutritionniste'), nullable=False)
    date_rendez_vous  = db.Column(db.Date, nullable=False)
    heure             = db.Column(db.Time, nullable=False)
    statut            = db.Column(db.Enum('en_attente', 'confirme', 'annule'), default='en_attente')

    def to_dict(self):
        return {
            'id': self.id_rendez_vous,
            'date': self.date_rendez_vous.isoformat() if self.date_rendez_vous else None,
            'heure': self.heure.strftime('%H:%M') if self.heure else None,
            'statut': self.statut,
        }


class Disponibilite(db.Model):
    __tablename__ = 'disponibilite'

    id_disponibilite  = db.Column(db.Integer, primary_key=True)
    id_nutritionniste = db.Column(db.Integer, db.ForeignKey('nutritionniste.id_nutritionniste'), nullable=False)
    jour              = db.Column(db.String(20))
    date              = db.Column(db.Date)
    heure_debut       = db.Column(db.Time, nullable=False)
    heure_fin         = db.Column(db.Time, nullable=False)
    statut            = db.Column(db.Enum('disponible', 'indisponible'), default='disponible')
