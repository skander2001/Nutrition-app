from flask import Blueprint, request, jsonify
from services import consultation_service
from middlewares.auth_middleware import require_auth

consultation_bp = Blueprint('consultation', __name__, url_prefix='/api/consultations')


@consultation_bp.get('')
@require_auth
def my_consultations():
    try:
        return jsonify({'consultations': consultation_service.list_for_user(request.user_id)}), 200
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
