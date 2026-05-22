import { Component, HostBinding, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../shared/sidebar/sidebar.component';
import { TopbarComponent } from '../../shared/topbar/topbar.component';
import { ChatbotComponent } from '../../shared/chatbot/chatbot.component';
import { AuthService } from '../../services/auth.service';

type ProfileSection = 'identite' | 'coordonnees' | 'sante' | 'notifications' | 'securite';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, TopbarComponent, ChatbotComponent],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit, OnDestroy {
  @HostBinding('class.dashboard-host') hostClass = true;

  activeSection: ProfileSection = 'identite';
  saveSuccess = false;
  error = '';
  loading = false;

  sections: { id: ProfileSection; label: string; icon: string }[] = [
    { id: 'identite',      label: 'Identité',            icon: 'user'    },
    { id: 'coordonnees',   label: 'Coordonnées',         icon: 'map-pin' },
    { id: 'sante',         label: 'Santé & antécédents', icon: 'heart'   },
    { id: 'notifications', label: 'Notifications',       icon: 'bell'    },
    { id: 'securite',      label: 'Sécurité & accès',    icon: 'lock'    },
  ];

  // Identité
  firstName = '';
  lastName  = '';
  birthDate = '';
  gender    = '';
  initials  = '';

  // Coordonnées
  email   = '';
  phone   = '';
  address = '';

  // Santé
  allergies         = '';
  maladieChronique  = '';
  objectif          = '';

  objectifs = [
    { value: 'perte_de_poids', label: 'Perte de poids' },
    { value: 'prise_de_masse', label: 'Prise de masse' },
    { value: 'maintien',       label: 'Maintien du poids' },
    { value: 'equilibre',      label: 'Alimentation saine' },
    { value: 'sport',          label: 'Nutrition sportive' },
    { value: 'medical',        label: 'Objectif médical' },
  ];

  // Notifications
  notifRdv        = true;
  notifSms        = true;
  notifEmail      = true;
  notifResultats  = false;

  // Sécurité
  currentPassword = '';
  newPassword     = '';
  confirmPassword = '';

  constructor(private auth: AuthService) {}

  ngOnInit() {
    document.body.classList.add('has-shell');
    this.loadFromUser();
  }

  ngOnDestroy() {
    document.body.classList.remove('has-shell');
  }

  private loadFromUser() {
    const user = this.auth.currentUser;
    if (!user) return;
    this.firstName = user.prenom;
    this.lastName  = user.nom;
    this.email     = user.email;
    this.phone     = user.telephone || '';
    this.birthDate = user.ddn || '';
    this.initials  = (user.prenom[0] + user.nom[0]).toUpperCase();
    if (user.patient) {
      this.address          = user.patient.adresse || '';
      this.allergies        = user.patient.allergie || '';
      this.maladieChronique = user.patient.maladie_chronique || '';
      this.objectif         = user.patient.objectif || '';
      this.gender           = user.patient.sexe || '';
    }
  }

  save() {
    this.error = '';
    if (this.activeSection === 'securite') { this.savePassword(); return; }
    if (this.activeSection === 'notifications') { this.flashSuccess(); return; }
    this.saveProfile();
  }

  private saveProfile() {
    this.loading = true;
    this.auth.updateProfile({
      nom: this.lastName.trim(),
      prenom: this.firstName.trim(),
      ddn: this.birthDate || null,
      telephone: this.phone.trim(),
      email: this.email.trim().toLowerCase(),
      sexe: this.gender,
      adresse: this.address.trim(),
      allergie: this.allergies.trim(),
      maladie_chronique: this.maladieChronique.trim(),
      objectif: this.objectif,
    }).subscribe({
      next: () => {
        this.loading = false;
        this.initials = (this.firstName[0] + this.lastName[0]).toUpperCase();
        this.flashSuccess();
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.error ?? 'Une erreur est survenue.';
      }
    });
  }

  private savePassword() {
    if (!this.currentPassword || !this.newPassword) {
      this.error = 'Veuillez renseigner votre mot de passe actuel et le nouveau.';
      return;
    }
    if (this.newPassword.length < 8) {
      this.error = 'Le nouveau mot de passe doit contenir au moins 8 caractères.';
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.error = 'Les deux mots de passe ne correspondent pas.';
      return;
    }
    this.loading = true;
    this.auth.changePassword({
      current_password: this.currentPassword,
      new_password: this.newPassword,
    }).subscribe({
      next: () => {
        this.loading = false;
        this.currentPassword = '';
        this.newPassword = '';
        this.confirmPassword = '';
        this.flashSuccess();
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.error ?? 'Une erreur est survenue.';
      }
    });
  }

  private flashSuccess() {
    this.saveSuccess = true;
    setTimeout(() => this.saveSuccess = false, 3000);
  }
}
