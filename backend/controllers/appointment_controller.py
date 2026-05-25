from flask import Blueprint, request, jsonify
from services import appointment_service
from middlewares.auth_middleware import require_auth

appointment_bp = Blueprint('appointment', __name__, url_prefix='/api/appointments')


@appointment_bp.get('/working-days')
@require_auth
def working_days():
    try:
        return jsonify({'days': appointment_service.get_working_days()}), 200
    except ValueError as e:
        return jsonify({'error': str(e)}), 400


@appointment_bp.get('/slots')
@require_auth
def slots():
    date_str = request.args.get('date', '')
    try:
        return jsonify({'slots': appointment_service.get_slots(date_str)}), 200
    except ValueError as e:
        return jsonify({'error': str(e)}), 400


@appointment_bp.post('')
@require_auth
def create():
    data = request.get_json(silent=True) or {}
    try:
        result = appointment_service.book(
            request.user_id, data.get('date'), data.get('heure')
        )
        return jsonify(result), 201
    except ValueError as e:
        return jsonify({'error': str(e)}), 400


@appointment_bp.get('')
@require_auth
def my_list():
    try:
        return jsonify({'appointments': appointment_service.list_for_user(request.user_id)}), 200
    except ValueError as e:
        return jsonify({'error': str(e)}), 400


@appointment_bp.get('/my-plans')
@require_auth
def my_plans():
    from models.patient import Patient
    from models.meal_plan import PatientMealPlan
    patient = Patient.query.filter_by(id_user=request.user_id).first()
    if not patient:
        return jsonify([]), 200
    plans = PatientMealPlan.query\
        .filter_by(id_patient=patient.id_patient)\
        .order_by(PatientMealPlan.created_at.desc())\
        .all()
    return jsonify([p.to_dict() for p in plans]), 200
