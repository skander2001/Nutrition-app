from flask import Flask
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from config import Config
from models import db
from models.user import User
from models.patient import Patient
from models.nutritionniste import Nutritionniste
from models.rendez_vous import RendezVous, Disponibilite
from models.consultation import Consultation
from controllers.auth_controller import auth_bp, init_oauth
from controllers.chatbot_controller import chatbot_bp
from controllers.appointment_controller import appointment_bp
from controllers.consultation_controller import consultation_bp
from services.auth_service import bcrypt

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    app.secret_key = app.config['SECRET_KEY']

    db.init_app(app)
    bcrypt.init_app(app)

    CORS(app, resources={r'/api/*': {
        'origins': [app.config['FRONTEND_URL']],
        'supports_credentials': True,
    }})

    init_oauth(app)

    app.register_blueprint(auth_bp)
    app.register_blueprint(chatbot_bp)
    app.register_blueprint(appointment_bp)
    app.register_blueprint(consultation_bp)

    return app


app = create_app()

if __name__ == '__main__':
    app.run(debug=True, port=5000)
