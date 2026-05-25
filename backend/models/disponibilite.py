from models import db


class Disponibilite(db.Model):
    __tablename__ = 'disponibilite'

    id_disponibilite  = db.Column(db.Integer, primary_key=True)
    id_nutritionniste = db.Column(db.Integer, db.ForeignKey('nutritionniste.id_nutritionniste'), nullable=False)
    jour              = db.Column(db.String(20))
    date              = db.Column(db.Date)
    heure_debut       = db.Column(db.Time, nullable=False)
    heure_fin         = db.Column(db.Time, nullable=False)
    statut            = db.Column(db.Enum('disponible', 'indisponible'), default='disponible')

    def to_dict(self):
        return {
            'id_disponibilite': self.id_disponibilite,
            'id_nutritionniste': self.id_nutritionniste,
            'jour': self.jour,
            'date': self.date.isoformat() if self.date else None,
            'heure_debut': self.heure_debut.strftime('%H:%M') if self.heure_debut else None,
            'heure_fin': self.heure_fin.strftime('%H:%M') if self.heure_fin else None,
            'statut': self.statut,
        }
