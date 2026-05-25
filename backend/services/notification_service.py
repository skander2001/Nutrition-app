"""Service de gestion des notifications utilisateur."""

from models import db
from models.notification import Notification


def create(id_user, titre, message='', type='info', lien=None):
    """Cree une notification pour un utilisateur. Tolere les erreurs
    pour ne jamais bloquer l'operation metier qui l'a declenchee."""
    if not id_user:
        return None
    try:
        n = Notification(id_user=id_user, titre=titre, message=message,
                         type=type, lien=lien)
        db.session.add(n)
        db.session.commit()
        return n
    except Exception:
        db.session.rollback()
        return None


def list_for_user(user_id, limit=30):
    rows = (Notification.query
            .filter_by(id_user=user_id)
            .order_by(Notification.created_at.desc())
            .limit(limit).all())
    return [n.to_dict() for n in rows]


def unread_count(user_id):
    return Notification.query.filter_by(id_user=user_id, lu=False).count()


def mark_read(notif_id, user_id):
    n = Notification.query.filter_by(id=notif_id, id_user=user_id).first()
    if not n:
        raise ValueError('Notification introuvable')
    n.lu = True
    db.session.commit()
    return n.to_dict()


def mark_all_read(user_id):
    Notification.query.filter_by(id_user=user_id, lu=False).update({'lu': True})
    db.session.commit()
