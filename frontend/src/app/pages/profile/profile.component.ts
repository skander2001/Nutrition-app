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

  sections: { id: ProfileSection; label: string; icon: string }[] = [
    { id: 'identite',      label: 'Identité',           icon: 'user'    },
    { id: 'coordonnees',   label: 'Coordonnées',        icon: 'map-pin' },
    { id: 'sante',         label: 'Santé & antécédents', icon: 'heart'   },
    { id: 'notifications', label: 'Notifications',      icon: 'bell'    },
    { id: 'securite',      label: 'Sécurité & accès',   icon: 'lock'    },
  ];

  // Identité — loaded from connected user
  firstName = '';
  lastName  = '';
  birthDate = '';
  gender    = '';
  initials  = '';

  // Coordonnées
  email      = '';
  phone      = '';
  address    = '';
  city       = '';
  postalCode = '';

  // Santé
  height     = '';
  weight     = '';
  allergies  = '';
  treatments = '';
  antecedents = '';

  // Notifications
  notifRdv       = true;
  notifSms       = true;
  notifEmail     = true;
  notifResultats = false;
  notifActualites = false;

  // Sécurité
  currentPassword = '';
  newPassword     = '';
  confirmPassword = '';

  constructor(private auth: AuthService) {}

  save() {
    this.saveSuccess = true;
    setTimeout(() => this.saveSuccess = false, 3000);
  }

  ngOnInit() {
    document.body.classList.add('has-shell');
    const user = this.auth.currentUser;
    if (user) {
      this.firstName = user.prenom;
      this.lastName  = user.nom;
      this.email     = user.email;
      this.phone     = user.telephone || '';
      this.initials  = (user.prenom[0] + user.nom[0]).toUpperCase();
      if (user.patient) {
        this.address = user.patient.adresse || '';
        this.allergies = user.patient.allergie || '';
        this.gender    = user.patient.sexe || '';
      }
    }
  }

  ngOnDestroy() {
    document.body.classList.remove('has-shell');
  }
}
