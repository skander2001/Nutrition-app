from flask import Blueprint, request, jsonify, current_app
from services import chatbot_service
from middlewares.auth_middleware import require_auth

chatbot_bp = Blueprint('chatbot', __name__, url_prefix='/api/chatbot')


@chatbot_bp.post('')
@require_auth
def chat():
    data = request.get_json(silent=True) or {}
    message = (data.get('message') or '').strip()
    history = data.get('history') or []

    if not message:
        return jsonify({'error': 'Message requis'}), 400

    if not chatbot_service.is_configured():
        return jsonify({'error': 'Service IA non configuré (OPENAI_API_KEY manquant)'}), 503

    try:
        result = chatbot_service.get_reply(message, history)
        return jsonify(result), 200
    except Exception as e:
        current_app.logger.exception('Chatbot service failed')
        return jsonify({'error': 'Service IA indisponible', 'detail': str(e)}), 502
