"""Controller du back-office nutritionniste.

Toutes les routes sont sous /api/admin et protegees par require_nutritionniste.
"""

from flask import Blueprint, request, jsonify
from middlewares.auth_middleware import require_nutritionniste
from services import admin_service

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')


# ---------- stats ----------

@admin_bp.get('/stats')
@require_nutritionniste
def stats():
    return jsonify(admin_service.get_stats()), 200


# ---------- patients ----------

@admin_bp.get('/patients')
@require_nutritionniste
def list_patients():
    search = request.args.get('search', '').strip()
    return jsonify(admin_service.list_patients(search)), 200


@admin_bp.post('/patients')
@require_nutritionniste
def create_patient():
    data = request.get_json(silent=True) or {}
    try:
        return jsonify(admin_service.create_patient(data)), 201
    except ValueError as e:
        return jsonify({'error': str(e)}), 400


@admin_bp.get('/patients/<int:id_patient>')
@require_nutritionniste
def get_patient(id_patient):
    try:
        return jsonify(admin_service.get_patient(id_patient)), 200
    except ValueError as e:
        return jsonify({'error': str(e)}), 404


@admin_bp.patch('/patients/<int:id_patient>')
@require_nutritionniste
def update_patient(id_patient):
    data = request.get_json(silent=True) or {}
    try:
        return jsonify(admin_service.update_patient(id_patient, data)), 200
    except ValueError as e:
        return jsonify({'error': str(e)}), 404


# ---------- rendez-vous ----------

@admin_bp.get('/rendez-vous')
@require_nutritionniste
def list_rdv():
    statut    = request.args.get('statut')
    date_from = request.args.get('from')
    date_to   = request.args.get('to')
    return jsonify(admin_service.list_rdv(statut, date_from, date_to)), 200


@admin_bp.post('/rendez-vous')
@require_nutritionniste
def create_rdv():
    data = request.get_json(silent=True) or {}
    try:
        return jsonify(admin_service.create_rdv(data)), 201
    except ValueError as e:
        return jsonify({'error': str(e)}), 400


@admin_bp.patch('/rendez-vous/<int:id_rdv>/statut')
@require_nutritionniste
def update_rdv_status(id_rdv):
    data = request.get_json(silent=True) or {}
    statut = data.get('statut')
    try:
        return jsonify(admin_service.update_rdv_status(id_rdv, statut)), 200
    except ValueError as e:
        return jsonify({'error': str(e)}), 400


@admin_bp.delete('/rendez-vous/<int:id_rdv>')
@require_nutritionniste
def delete_rdv(id_rdv):
    try:
        admin_service.delete_rdv(id_rdv)
        return jsonify({'success': True}), 200
    except ValueError as e:
        return jsonify({'error': str(e)}), 404


# ---------- consultations ----------

@admin_bp.get('/consultations')
@require_nutritionniste
def list_consultations():
    id_patient = request.args.get('id_patient', type=int)
    return jsonify(admin_service.list_consultations(id_patient)), 200


@admin_bp.get('/consultations/<int:id_c>')
@require_nutritionniste
def get_consultation(id_c):
    try:
        return jsonify(admin_service.get_consultation(id_c)), 200
    except ValueError as e:
        return jsonify({'error': str(e)}), 404


@admin_bp.post('/consultations')
@require_nutritionniste
def create_consultation():
    data = request.get_json(silent=True) or {}
    try:
        return jsonify(admin_service.create_consultation(data)), 201
    except ValueError as e:
        return jsonify({'error': str(e)}), 400


@admin_bp.patch('/consultations/<int:id_c>')
@require_nutritionniste
def update_consultation(id_c):
    data = request.get_json(silent=True) or {}
    try:
        return jsonify(admin_service.update_consultation(id_c, data)), 200
    except ValueError as e:
        return jsonify({'error': str(e)}), 404


# ---------- disponibilites ----------

@admin_bp.get('/disponibilites')
@require_nutritionniste
def list_disponibilites():
    return jsonify(admin_service.list_disponibilites()), 200


@admin_bp.post('/disponibilites')
@require_nutritionniste
def create_disponibilite():
    data = request.get_json(silent=True) or {}
    try:
        return jsonify(admin_service.create_disponibilite(data)), 201
    except ValueError as e:
        return jsonify({'error': str(e)}), 400


@admin_bp.patch('/disponibilites/<int:id_d>')
@require_nutritionniste
def update_disponibilite(id_d):
    data = request.get_json(silent=True) or {}
    try:
        return jsonify(admin_service.update_disponibilite(id_d, data)), 200
    except ValueError as e:
        return jsonify({'error': str(e)}), 404


@admin_bp.delete('/disponibilites/<int:id_d>')
@require_nutritionniste
def delete_disponibilite(id_d):
    try:
        admin_service.delete_disponibilite(id_d)
        return jsonify({'success': True}), 200
    except ValueError as e:
        return jsonify({'error': str(e)}), 404


# ---------- meal plan templates ----------

@admin_bp.get('/templates')
@require_nutritionniste
def list_templates():
    return jsonify(admin_service.list_templates()), 200


@admin_bp.post('/templates')
@require_nutritionniste
def create_template():
    data = request.get_json(silent=True) or {}
    try:
        return jsonify(admin_service.create_template(data)), 201
    except ValueError as e:
        return jsonify({'error': str(e)}), 400


@admin_bp.patch('/templates/<int:id_t>')
@require_nutritionniste
def update_template(id_t):
    data = request.get_json(silent=True) or {}
    try:
        return jsonify(admin_service.update_template(id_t, data)), 200
    except ValueError as e:
        return jsonify({'error': str(e)}), 404


@admin_bp.delete('/templates/<int:id_t>')
@require_nutritionniste
def delete_template(id_t):
    try:
        admin_service.delete_template(id_t)
        return jsonify({'success': True}), 200
    except ValueError as e:
        return jsonify({'error': str(e)}), 404


# ---------- plans patient ----------

@admin_bp.get('/patients/<int:id_patient>/plans')
@require_nutritionniste
def list_patient_plans(id_patient):
    return jsonify(admin_service.list_patient_plans(id_patient)), 200


@admin_bp.post('/patients/<int:id_patient>/plans')
@require_nutritionniste
def assign_plan(id_patient):
    data = request.get_json(silent=True) or {}
    try:
        return jsonify(admin_service.assign_plan(id_patient, data)), 201
    except ValueError as e:
        return jsonify({'error': str(e)}), 400


@admin_bp.delete('/plans/<int:id_plan>')
@require_nutritionniste
def delete_patient_plan(id_plan):
    try:
        admin_service.delete_patient_plan(id_plan)
        return jsonify({'success': True}), 200
    except ValueError as e:
        return jsonify({'error': str(e)}), 404


# ---------- AI meal plan generation ----------

@admin_bp.post('/patients/<int:id_patient>/generate-plan')
@require_nutritionniste
def generate_plan(id_patient):
    data = request.get_json(silent=True) or {}
    cuisine = (data.get('cuisine') or '').strip()
    if not cuisine:
        return jsonify({'error': 'Le champ cuisine est requis.'}), 400
    try:
        result = admin_service.generate_ai_plan(id_patient, cuisine, data.get('notes', ''))
        return jsonify(result), 201
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': f'Erreur génération IA : {str(e)}'}), 500
