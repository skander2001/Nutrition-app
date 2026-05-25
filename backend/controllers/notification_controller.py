"""Controller des notifications — accessible a tout utilisateur connecte."""

from flask import Blueprint, request, jsonify
from middlewares.auth_middleware import require_auth
from services import notification_service

notification_bp = Blueprint('notification', __name__, url_prefix='/api/notifications')


@notification_bp.get('')
@require_auth
def list_notifications():
    return jsonify(notification_service.list_for_user(request.user_id)), 200


@notification_bp.get('/unread-count')
@require_auth
def unread_count():
    return jsonify({'count': notification_service.unread_count(request.user_id)}), 200


@notification_bp.patch('/<int:notif_id>/read')
@require_auth
def mark_read(notif_id):
    try:
        return jsonify(notification_service.mark_read(notif_id, request.user_id)), 200
    except ValueError as e:
        return jsonify({'error': str(e)}), 404


@notification_bp.patch('/read-all')
@require_auth
def mark_all_read():
    notification_service.mark_all_read(request.user_id)
    return jsonify({'success': True}), 200
