from models import db

class User(db.Model):
    __tablename__ = 'user'

    id           = db.Column(db.Integer, primary_key=True)
    nom          = db.Column(db.String(255))
    prenom       = db.Column(db.String(255))
    ddn          = db.Column(db.Date)
    email        = db.Column(db.String(255), unique=True)
    password     = db.Column(db.String(255), nullable=True)
    telephone    = db.Column(db.String(20))
    status       = db.Column(db.Enum('temporaire', 'actif'), default='actif')
    oauth_provider = db.Column(db.String(50), nullable=True)
    oauth_id       = db.Column(db.String(255), nullable=True)

    patient      = db.relationship('Patient', backref='user', uselist=False)
    nutritionniste = db.relationship('Nutritionniste', backref='user', uselist=False)

    def to_dict(self):
        return {
            'id': self.id,
            'nom': self.nom,
            'prenom': self.prenom,
            'email': self.email,
            'telephone': self.telephone,
            'ddn': self.ddn.isoformat() if self.ddn else None,
            'status': self.status,
        }
