from models.consultation import Consultation
from models.rendez_vous import RendezVous
from models.patient import Patient


def list_for_user(user_id: int) -> list[dict]:
    """Historique des consultations du patient connecté, de la plus ancienne
    à la plus récente."""
    patient = Patient.query.filter_by(id_user=user_id).first()
    if not patient:
        raise ValueError('Profil patient introuvable')

    rows = (Consultation.query
            .join(RendezVous, Consultation.id_rendez_vous == RendezVous.id_rendez_vous)
            .filter(RendezVous.id_patient == patient.id_patient)
            .order_by(Consultation.date_consultation)
            .all())
    return [c.to_dict() for c in rows]
