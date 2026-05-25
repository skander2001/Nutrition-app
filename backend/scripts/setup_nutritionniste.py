"""
Script de setup du nutritionniste unique de la plateforme.

Usage:
    cd backend
    python scripts/setup_nutritionniste.py

Comportement:
  1. Supprime tous les nutritionnistes existants (un seul autorise).
  2. Cree ou met a jour un compte utilisateur dedie.
  3. Lie ce compte a la table `nutritionniste`.
  4. Affiche les credentials a la fin.

Tu peux changer les constantes ci-dessous avant execution.
"""

import os
import sys

# Ajoute backend/ au PYTHONPATH pour pouvoir importer les modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app
from models import db
from models.user import User
from models.nutritionniste import Nutritionniste
from services.auth_service import bcrypt


NUTRITIONNISTE_EMAIL    = 'nutritionniste@nutricare.com'
NUTRITIONNISTE_PASSWORD = 'Nutricare2026!'
NUTRITIONNISTE_NOM      = 'NutriCare'
NUTRITIONNISTE_PRENOM   = 'Dr.'
NUTRITIONNISTE_TEL      = '20000000'


def main():
    app = create_app()
    with app.app_context():
        # 1. Supprime tous les nutritionnistes existants
        deleted = Nutritionniste.query.delete()
        db.session.commit()
        print(f"[OK] {deleted} entree(s) nutritionniste supprimee(s)")

        # 2. Cree ou met a jour le user
        user = User.query.filter_by(email=NUTRITIONNISTE_EMAIL).first()
        hashed = bcrypt.generate_password_hash(NUTRITIONNISTE_PASSWORD).decode('utf-8')

        if user:
            user.nom       = NUTRITIONNISTE_NOM
            user.prenom    = NUTRITIONNISTE_PRENOM
            user.telephone = NUTRITIONNISTE_TEL
            user.password  = hashed
            user.status    = 'actif'
            print(f"[OK] Compte mis a jour : {NUTRITIONNISTE_EMAIL} (id={user.id})")
        else:
            user = User(
                nom=NUTRITIONNISTE_NOM,
                prenom=NUTRITIONNISTE_PRENOM,
                email=NUTRITIONNISTE_EMAIL,
                telephone=NUTRITIONNISTE_TEL,
                password=hashed,
                status='actif',
            )
            db.session.add(user)
            db.session.flush()
            print(f"[OK] Compte cree : {NUTRITIONNISTE_EMAIL} (id={user.id})")

        # 3. Lie ce user a la table nutritionniste
        nutri = Nutritionniste(id_user=user.id)
        db.session.add(nutri)
        db.session.commit()
        print(f"[OK] Nutritionniste lie (id_nutritionniste={nutri.id_nutritionniste}, id_user={user.id})")

        print()
        print("=" * 50)
        print("  CREDENTIALS NUTRITIONNISTE")
        print("=" * 50)
        print(f"  Email    : {NUTRITIONNISTE_EMAIL}")
        print(f"  Password : {NUTRITIONNISTE_PASSWORD}")
        print("=" * 50)


if __name__ == '__main__':
    main()
