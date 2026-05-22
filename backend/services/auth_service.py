import jwt
from datetime import datetime, timezone, timedelta
from flask import current_app
from flask_bcrypt import Bcrypt
from models import db
from models.user import User
from models.patient import Patient
from models.nutritionniste import Nutritionniste

bcrypt = Bcrypt()

def _make_token(user: User) -> str:
    role = 'nutritionniste' if user.nutritionniste else 'patient'
    payload = {
        'user_id': user.id,
        'role': role,
        'exp': datetime.now(timezone.utc) + timedelta(
            hours=current_app.config['JWT_EXPIRY_HOURS']
        ),
    }
    return jwt.encode(payload, current_app.config['JWT_SECRET'], algorithm='HS256')

def _user_response(user: User, token: str) -> dict:
    role = 'nutritionniste' if user.nutritionniste else 'patient'
    data = {**user.to_dict(), 'role': role, 'token': token}
    if user.patient:
        data['patient'] = user.patient.to_dict()
        data['profile_complete'] = user.patient.profile_complete
    return data


def register(nom: str, prenom: str, email: str, telephone: str, password: str) -> dict:
    if User.query.filter_by(email=email).first():
        raise ValueError('Cette adresse e-mail est déjà utilisée')

    hashed = bcrypt.generate_password_hash(password).decode('utf-8')
    user = User(nom=nom, prenom=prenom, email=email, telephone=telephone,
                password=hashed, status='actif')
    db.session.add(user)
    db.session.flush()  # get user.id before committing

    patient = Patient(id_user=user.id)
    db.session.add(patient)
    db.session.commit()

    token = _make_token(user)
    return _user_response(user, token)


def login(email: str, password: str) -> dict:
    user = User.query.filter_by(email=email).first()
    if not user or not user.password:
        raise ValueError('Email ou mot de passe incorrect')
    if not bcrypt.check_password_hash(user.password, password):
        raise ValueError('Email ou mot de passe incorrect')

    token = _make_token(user)
    return _user_response(user, token)


def find_or_create_oauth_user(provider: str, oauth_id: str,
                               email: str, prenom: str, nom: str) -> dict:
    # Try to find by OAuth identity first, then by email
    user = User.query.filter_by(oauth_provider=provider, oauth_id=oauth_id).first()
    if not user and email:
        user = User.query.filter_by(email=email).first()
        if user:
            # Link the OAuth identity to the existing account
            user.oauth_provider = provider
            user.oauth_id = oauth_id
            db.session.commit()

    if not user:
        user = User(nom=nom, prenom=prenom, email=email,
                    oauth_provider=provider, oauth_id=oauth_id, status='actif')
        db.session.add(user)
        db.session.flush()
        patient = Patient(id_user=user.id)
        db.session.add(patient)
        db.session.commit()

    token = _make_token(user)
    return _user_response(user, token)


def complete_profile(user_id: int, sexe: str, adresse: str,
                     allergie: str, maladie_chronique: str, objectif: str) -> dict:
    patient = Patient.query.filter_by(id_user=user_id).first()
    if not patient:
        raise ValueError('Profil patient introuvable')

    patient.sexe = sexe or patient.sexe
    patient.adresse = adresse or patient.adresse
    patient.allergie = allergie
    patient.maladie_chronique = maladie_chronique
    patient.objectif = objectif or patient.objectif
    db.session.commit()

    user = User.query.get(user_id)
    token = _make_token(user)
    return _user_response(user, token)


def get_me(user_id: int) -> dict:
    user = User.query.get(user_id)
    if not user:
        raise ValueError('Utilisateur introuvable')
    token = _make_token(user)
    return _user_response(user, token)


def update_profile(user_id: int, nom=None, prenom=None, ddn=None, telephone=None,
                    email=None, sexe=None, adresse=None, allergie=None,
                    maladie_chronique=None, objectif=None) -> dict:
    user = User.query.get(user_id)
    if not user:
        raise ValueError('Utilisateur introuvable')

    if email and email != user.email:
        if User.query.filter(User.email == email, User.id != user_id).first():
            raise ValueError('Cette adresse e-mail est déjà utilisée')
        user.email = email

    if nom is not None:
        user.nom = nom
    if prenom is not None:
        user.prenom = prenom
    if telephone is not None:
        user.telephone = telephone
    if ddn:
        try:
            user.ddn = datetime.strptime(ddn, '%Y-%m-%d').date()
        except ValueError:
            raise ValueError('Date de naissance invalide')

    patient = user.patient
    if patient:
        if sexe is not None:
            patient.sexe = sexe or None
        if adresse is not None:
            patient.adresse = adresse
        if allergie is not None:
            patient.allergie = allergie
        if maladie_chronique is not None:
            patient.maladie_chronique = maladie_chronique
        if objectif is not None:
            patient.objectif = objectif

    db.session.commit()
    token = _make_token(user)
    return _user_response(user, token)


def change_password(user_id: int, current_password: str, new_password: str) -> dict:
    user = User.query.get(user_id)
    if not user:
        raise ValueError('Utilisateur introuvable')
    if not user.password:
        raise ValueError('Ce compte utilise la connexion Google, le mot de passe ne peut pas être modifié')
    if not bcrypt.check_password_hash(user.password, current_password or ''):
        raise ValueError('Mot de passe actuel incorrect')
    if not new_password or len(new_password) < 8:
        raise ValueError('Le nouveau mot de passe doit contenir au moins 8 caractères')

    user.password = bcrypt.generate_password_hash(new_password).decode('utf-8')
    db.session.commit()
    return {'message': 'Mot de passe mis à jour'}
