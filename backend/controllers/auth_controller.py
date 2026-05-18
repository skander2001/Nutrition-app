from flask import Blueprint, request, jsonify, redirect, current_app, session
from authlib.integrations.flask_client import OAuth
from services import auth_service
from middlewares.auth_middleware import require_auth

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')
oauth = OAuth()

def init_oauth(app):
    oauth.init_app(app)
    if app.config.get('GOOGLE_CLIENT_ID'):
        oauth.register(
            name='google',
            client_id=app.config['GOOGLE_CLIENT_ID'],
            client_secret=app.config['GOOGLE_CLIENT_SECRET'],
            server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
            client_kwargs={'scope': 'openid email profile'},
        )


@auth_bp.post('/register')
def register():
    data = request.get_json(silent=True) or {}
    required = ['nom', 'prenom', 'email', 'telephone', 'password']
    missing = [f for f in required if not data.get(f)]
    if missing:
        return jsonify({'error': f'Champs manquants : {", ".join(missing)}'}), 400

    if len(data['password']) < 8:
        return jsonify({'error': 'Le mot de passe doit contenir au moins 8 caractères'}), 400

    try:
        result = auth_service.register(
            nom=data['nom'].strip(),
            prenom=data['prenom'].strip(),
            email=data['email'].strip().lower(),
            telephone=data['telephone'].strip(),
            password=data['password'],
        )
        return jsonify(result), 201
    except ValueError as e:
        return jsonify({'error': str(e)}), 409


@auth_bp.post('/login')
def login():
    data = request.get_json(silent=True) or {}
    if not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Email et mot de passe requis'}), 400

    try:
        result = auth_service.login(
            email=data['email'].strip().lower(),
            password=data['password'],
        )
        return jsonify(result), 200
    except ValueError as e:
        return jsonify({'error': str(e)}), 401


GOOGLE_CALLBACK = 'http://localhost:5000/api/auth/google/callback'


@auth_bp.get('/google')
def google_login():
    return oauth.google.authorize_redirect(GOOGLE_CALLBACK)


@auth_bp.get('/google/callback')
def google_callback():
    frontend_url = current_app.config['FRONTEND_URL']
    try:
        token_data = oauth.google.authorize_access_token()
        userinfo = token_data.get('userinfo') or oauth.google.userinfo()
        result = auth_service.find_or_create_oauth_user(
            provider='google',
            oauth_id=userinfo['sub'],
            email=userinfo.get('email', ''),
            prenom=userinfo.get('given_name', ''),
            nom=userinfo.get('family_name', ''),
        )
        profile_complete = result.get('profile_complete', False)
        next_page = 'complete-profile' if not profile_complete else 'dashboard'
        return redirect(f"{frontend_url}/{next_page}?token={result['token']}")
    except Exception as e:
        current_app.logger.error(f"OAuth error: {e}")
        return redirect(f"{frontend_url}/login?error=oauth_failed")


@auth_bp.patch('/complete-profile')
@require_auth
def complete_profile():
    data = request.get_json(silent=True) or {}
    try:
        result = auth_service.complete_profile(
            user_id=request.user_id,
            sexe=data.get('sexe'),
            adresse=data.get('adresse', ''),
            allergie=data.get('allergie', ''),
            maladie_chronique=data.get('maladie_chronique', ''),
            objectif=data.get('objectif', ''),
        )
        return jsonify(result), 200
    except ValueError as e:
        return jsonify({'error': str(e)}), 404


@auth_bp.get('/me')
@require_auth
def me():
    try:
        result = auth_service.get_me(request.user_id)
        return jsonify(result), 200
    except ValueError as e:
        return jsonify({'error': str(e)}), 404
