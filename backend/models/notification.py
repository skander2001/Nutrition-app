from models import db
from datetime import datetime


class Notification(db.Model):
    __tablename__ = 'notification'

    id         = db.Column(db.Integer, primary_key=True)
    id_user    = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    titre      = db.Column(db.String(150), nullable=False)
    message    = db.Column(db.Text)
    type       = db.Column(db.String(20), default='info')   # info, success, warning, danger
    lien       = db.Column(db.String(255))
    lu         = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'titre': self.titre,
            'message': self.message,
            'type': self.type,
            'lien': self.lien,
            'lu': self.lu,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
