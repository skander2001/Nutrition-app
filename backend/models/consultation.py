from models import db


class Consultation(db.Model):
    __tablename__ = 'consultation'

    id_consultation    = db.Column(db.Integer, primary_key=True)
    id_rendez_vous     = db.Column(db.Integer, db.ForeignKey('rendez_vous.id_rendez_vous'), nullable=False)
    date_consultation  = db.Column(db.Date)
    poids              = db.Column(db.Numeric(5, 2))
    taille             = db.Column(db.Numeric(4, 2))
    glycemie           = db.Column(db.Numeric(4, 2))
    tension_arterielle = db.Column(db.String(20))
    diagnostic         = db.Column(db.String(255))
    remarque           = db.Column(db.String(255))

    # `rdv.consultations` + `consultation.rendez_vous`
    rendez_vous = db.relationship('RendezVous', backref='consultations')

    @staticmethod
    def _split_tension(value):
        """'12.3/8.0' -> (12.3, 8.0). Renvoie (None, None) si non parsable."""
        if not value or '/' not in value:
            return None, None
        try:
            sys_, dia = value.split('/', 1)
            return float(sys_), float(dia)
        except (ValueError, TypeError):
            return None, None

    def to_dict(self):
        poids = float(self.poids) if self.poids is not None else None
        taille = float(self.taille) if self.taille is not None else None
        imc = round(poids / (taille * taille), 1) if poids and taille else None
        sys_, dia = self._split_tension(self.tension_arterielle)
        date_iso = self.date_consultation.isoformat() if self.date_consultation else None
        glycemie = float(self.glycemie) if self.glycemie is not None else None
        return {
            # patient-side aliases (back-compat)
            'id': self.id_consultation,
            'date': date_iso,
            'tension': self.tension_arterielle,
            # admin-side canonical column names
            'id_consultation': self.id_consultation,
            'id_rendez_vous': self.id_rendez_vous,
            'date_consultation': date_iso,
            'tension_arterielle': self.tension_arterielle,
            # shared
            'poids': poids,
            'taille': taille,
            'imc': imc,
            'glycemie': glycemie,
            'tension_systolique': sys_,
            'tension_diastolique': dia,
            'diagnostic': self.diagnostic,
            'remarque': self.remarque,
        }
