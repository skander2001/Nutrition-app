from models import db

class Nutritionniste(db.Model):
    __tablename__ = 'nutritionniste'

    id_nutritionniste = db.Column(db.Integer, primary_key=True)
    id_user           = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
