from flask import current_app
from flask_mail import Mail, Message

mail = Mail()


def send_reset_email(to_email: str, reset_link: str) -> None:
    """Envoie un e-mail de réinitialisation de mot de passe.

    Si MAIL_USERNAME n'est pas configuré, affiche le lien dans les logs
    (mode développement).
    """
    if not current_app.config.get('MAIL_USERNAME'):
        current_app.logger.info(f"[DEV] Lien de réinitialisation pour {to_email}: {reset_link}")
        return

    msg = Message(
        subject='Réinitialisation de votre mot de passe NutriCare',
        recipients=[to_email],
    )
    msg.html = f"""
    <div style="font-family:'Segoe UI',sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#f8fafc">
      <div style="background:#fff;border-radius:12px;padding:32px;border:1px solid #e2e8f0">
        <h2 style="margin:0 0 8px;color:#1e293b;font-size:1.3rem">Réinitialisation du mot de passe</h2>
        <p style="color:#64748b;margin:0 0 24px;font-size:.95rem">
          Vous avez demandé la réinitialisation de votre mot de passe sur <strong>NutriCare</strong>.
          Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe.
        </p>
        <a href="{reset_link}"
           style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;
                  padding:12px 28px;border-radius:8px;font-weight:600;font-size:.95rem">
          Réinitialiser mon mot de passe
        </a>
        <p style="color:#94a3b8;font-size:.8rem;margin:24px 0 0">
          Ce lien est valable <strong>1 heure</strong>.
          Si vous n'avez pas fait cette demande, ignorez cet e-mail.
        </p>
      </div>
    </div>
    """
    mail.send(msg)


def send_welcome_email(to_email: str, prenom: str) -> None:
    """Envoie un e-mail de bienvenue après inscription."""
    if not current_app.config.get('MAIL_USERNAME'):
        current_app.logger.info(f"[DEV] E-mail de bienvenue pour {to_email} ({prenom})")
        return

    msg = Message(
        subject='Bienvenue sur NutriCare !',
        recipients=[to_email],
    )
    msg.html = f"""
    <div style="font-family:'Segoe UI',sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#f8fafc">
      <div style="background:#fff;border-radius:12px;padding:32px;border:1px solid #e2e8f0">
        <h2 style="margin:0 0 8px;color:#1e293b;font-size:1.3rem">Bienvenue, {prenom} !</h2>
        <p style="color:#64748b;margin:0 0 16px;font-size:.95rem">
          Votre compte <strong>NutriCare</strong> a bien été créé.
          Vous pouvez dès maintenant accéder à votre espace patient, suivre vos indicateurs de santé
          et prendre rendez-vous avec votre nutritionniste.
        </p>
        <p style="color:#94a3b8;font-size:.8rem;margin:16px 0 0">
          L'équipe NutriCare
        </p>
      </div>
    </div>
    """
    mail.send(msg)


def _rdv_email(to_email: str, subject: str, title: str, body_html: str) -> None:
    """Envoi générique pour les e-mails de rendez-vous."""
    if not current_app.config.get('MAIL_USERNAME'):
        current_app.logger.info(f"[DEV] E-mail RDV pour {to_email}: {subject}")
        return
    msg = Message(subject=subject, recipients=[to_email])
    msg.html = f"""
    <div style="font-family:'Segoe UI',sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#f8fafc">
      <div style="background:#fff;border-radius:12px;padding:32px;border:1px solid #e2e8f0">
        <h2 style="margin:0 0 8px;color:#1e293b;font-size:1.3rem">{title}</h2>
        {body_html}
        <p style="color:#94a3b8;font-size:.8rem;margin:24px 0 0">L'équipe NutriCare</p>
      </div>
    </div>
    """
    mail.send(msg)


def send_rdv_confirme(to_email: str, prenom: str, date_str: str, heure_str: str) -> None:
    """Notifie le patient que son rendez-vous est confirmé."""
    _rdv_email(
        to_email,
        subject='Votre rendez-vous est confirmé · NutriCare',
        title=f'Bonjour {prenom}, votre rendez-vous est confirmé',
        body_html=f"""
        <p style="color:#64748b;margin:0 0 16px;font-size:.95rem">
          Votre nutritionniste a <strong>confirmé</strong> votre rendez-vous :
        </p>
        <div style="background:#eef2ff;padding:14px 18px;border-radius:8px;margin:12px 0">
          <div style="color:#4f46e5;font-weight:700;font-size:1rem">{date_str} · {heure_str}</div>
        </div>
        <p style="color:#64748b;margin:16px 0 0;font-size:.9rem">
          À très bientôt au cabinet.
        </p>
        """,
    )


def send_rdv_refuse(to_email: str, prenom: str, date_str: str) -> None:
    """Notifie le patient que son rendez-vous a été refusé."""
    _rdv_email(
        to_email,
        subject='Mise à jour de votre rendez-vous · NutriCare',
        title=f'Bonjour {prenom}',
        body_html=f"""
        <p style="color:#64748b;margin:0 0 16px;font-size:.95rem">
          Nous sommes désolés, votre rendez-vous du <strong>{date_str}</strong>
          n'a pas pu être confirmé. Merci de réserver un nouveau créneau depuis votre espace patient.
        </p>
        """,
    )
