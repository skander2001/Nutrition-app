"""Seed — historique de consultations pour un patient.

Crée 8 consultations mensuelles (rendez-vous + mesures) montrant une
évolution réaliste : perte de poids, baisse de la glycémie et de la
tension. Alimente les courbes de la page « Suivi nutritionnel ».

Exécution :
    cd backend && source venv/bin/activate
    python migrations/seed_consultations.py [email]

  - Sans argument : patient de démonstration skander@nutricare.tn
    (créé s'il n'existe pas — mot de passe demo1234).
  - Avec un email : seed l'historique d'un patient déjà inscrit.

Réexécutable : seuls les rendez-vous déjà liés à une consultation sont
supprimés avant réinsertion — les rendez-vous réels du patient sont
préservés.
"""
import os
import sys
from datetime import date, timedelta

from dotenv import load_dotenv
load_dotenv()
import pymysql
from flask_bcrypt import Bcrypt

bcrypt = Bcrypt()

DEMO_EMAIL = 'skander@nutricare.tn'
DEMO_PASSWORD = 'demo1234'
TAILLE = 1.78

# (poids kg, glycémie g/L, tension, diagnostic, remarque) — du plus ancien au plus récent
POINTS = [
    (92.0, 1.32, '14.2/9.2', 'Surpoids · glycémie élevée', 'Début de programme — objectif perte de poids'),
    (90.2, 1.28, '14.0/9.0', 'Surpoids',                   'Bonne adhésion au plan alimentaire'),
    (88.5, 1.22, '13.6/8.8', 'Surpoids',                   'Perte régulière, activité physique en hausse'),
    (87.1, 1.18, '13.3/8.6', 'Surpoids modéré',            'Glycémie en nette amélioration'),
    (85.8, 1.12, '13.0/8.4', 'Surpoids modéré',            'Tension stabilisée'),
    (84.6, 1.08, '12.8/8.2', 'Proche de la normale',       'Glycémie quasi normale'),
    (83.5, 1.05, '12.5/8.1', 'Proche de la normale',       'Excellents résultats'),
    (82.4, 1.02, '12.3/8.0', 'Normale',                    'Objectif intermédiaire atteint'),
]

CREATE_CONSULTATION = """
CREATE TABLE IF NOT EXISTS `consultation` (
  `id_consultation`    INT NOT NULL AUTO_INCREMENT,
  `id_rendez_vous`     INT NOT NULL,
  `date_consultation`  DATE DEFAULT NULL,
  `poids`              DECIMAL(5,2) DEFAULT NULL,
  `taille`             DECIMAL(4,2) DEFAULT NULL,
  `glycemie`           DECIMAL(4,2) DEFAULT NULL,
  `tension_arterielle` VARCHAR(20) DEFAULT NULL,
  `diagnostic`         VARCHAR(255) DEFAULT NULL,
  `remarque`           VARCHAR(255) DEFAULT NULL,
  PRIMARY KEY (`id_consultation`),
  KEY `id_rendez_vous` (`id_rendez_vous`),
  CONSTRAINT `consultation_rdv_fk` FOREIGN KEY (`id_rendez_vous`)
    REFERENCES `rendez_vous` (`id_rendez_vous`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
"""


def find_patient(cur, email):
    """id_patient du patient lié à cet email, ou None."""
    cur.execute(
        "SELECT p.id_patient FROM patient p "
        "JOIN user u ON u.id = p.id_user WHERE u.email = %s",
        (email,),
    )
    row = cur.fetchone()
    return row[0] if row else None


def create_demo_patient(cur):
    """Crée (ou recrée) le patient de démonstration et renvoie son id_patient."""
    cur.execute("DELETE FROM user WHERE email = %s", (DEMO_EMAIL,))
    pw = bcrypt.generate_password_hash(DEMO_PASSWORD).decode()
    cur.execute(
        "INSERT INTO user (nom, prenom, ddn, email, password, telephone, status) "
        "VALUES (%s, %s, %s, %s, %s, %s, 'actif')",
        ('Gharbi', 'Skander', '1989-03-14', DEMO_EMAIL, pw, '+216 22 451 308'),
    )
    user_id = cur.lastrowid
    suivi_depuis = date.today() - timedelta(days=len(POINTS) * 30)
    cur.execute(
        "INSERT INTO patient (id_user, sexe, adresse, allergie, maladie_chronique, objectif, ddc) "
        "VALUES (%s, 'M', %s, %s, %s, 'perte_de_poids', %s)",
        (user_id, 'Tunis, Tunisie', 'Aucune', 'Hypertension', suivi_depuis),
    )
    return cur.lastrowid


def seed_consultations(cur, patient_id, nutri_id):
    """Recrée 8 rendez-vous confirmés + consultations pour le patient.

    Les dates sont décalées de `patient_id` jours pour éviter toute
    collision sur la contrainte d'unicité du créneau entre patients.
    """
    # supprime uniquement les rendez-vous déjà liés à une consultation
    cur.execute(
        "DELETE rv FROM rendez_vous rv "
        "JOIN consultation c ON c.id_rendez_vous = rv.id_rendez_vous "
        "WHERE rv.id_patient = %s",
        (patient_id,),
    )

    n = len(POINTS)
    for i, (poids, gly, tension, diag, rem) in enumerate(POINTS):
        d = date.today() - timedelta(days=(n - 1 - i) * 30 + patient_id)
        heure = '09:00:00' if i % 2 == 0 else '10:30:00'
        cur.execute(
            "INSERT INTO rendez_vous (id_patient, id_nutritionniste, date_rendez_vous, heure, statut) "
            "VALUES (%s, %s, %s, %s, 'confirme')",
            (patient_id, nutri_id, d, heure),
        )
        rdv_id = cur.lastrowid
        cur.execute(
            "INSERT INTO consultation (id_rendez_vous, date_consultation, poids, taille, "
            "glycemie, tension_arterielle, diagnostic, remarque) "
            "VALUES (%s, %s, %s, %s, %s, %s, %s, %s)",
            (rdv_id, d, poids, TAILLE, gly, tension, diag, rem),
        )


def main():
    email = sys.argv[1] if len(sys.argv) > 1 else DEMO_EMAIL

    conn = pymysql.connect(
        host=os.getenv('DB_HOST', 'localhost'),
        port=int(os.getenv('DB_PORT', 3306)),
        user=os.getenv('DB_USER', 'root'),
        password=os.getenv('DB_PASSWORD', ''),
        database=os.getenv('DB_NAME', 'nutrition_db'),
    )
    cur = conn.cursor()

    cur.execute(CREATE_CONSULTATION)

    cur.execute("SELECT id_nutritionniste FROM nutritionniste LIMIT 1")
    row = cur.fetchone()
    if not row:
        print("ERREUR : aucun nutritionniste. Lance d'abord migrations/clean_schema.sql.")
        sys.exit(1)
    nutri_id = row[0]

    patient_id = find_patient(cur, email)
    if patient_id is None:
        if email == DEMO_EMAIL:
            patient_id = create_demo_patient(cur)
        else:
            print(f"ERREUR : aucun patient inscrit avec l'email {email}.")
            print("Le compte doit déjà exister et avoir un profil patient.")
            sys.exit(1)

    seed_consultations(cur, patient_id, nutri_id)

    conn.commit()
    cur.close()
    conn.close()

    n = len(POINTS)
    suivi_depuis = date.today() - timedelta(days=(n - 1) * 30 + patient_id)
    derniere = date.today() - timedelta(days=patient_id)
    print(f"OK — {n} consultations seedées pour {email} (patient #{patient_id})")
    print(f"     du {suivi_depuis} au {derniere}")


if __name__ == '__main__':
    main()
