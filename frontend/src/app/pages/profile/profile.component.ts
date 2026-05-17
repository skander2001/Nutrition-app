import { Component, HostBinding, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../shared/sidebar/sidebar.component';
import { TopbarComponent } from '../../shared/topbar/topbar.component';
import { ChatbotComponent } from '../../shared/chatbot/chatbot.component';

type ProfileSection = 'identite' | 'coordonnees' | 'sante' | 'mutuelle' | 'notifications' | 'securite';

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
    { id: 'identite', label: 'Identité', icon: 'user' },
    { id: 'coordonnees', label: 'Coordonnées', icon: 'map-pin' },
    { id: 'sante', label: 'Santé & antécédents', icon: 'heart' },
    { id: 'mutuelle', label: 'Mutuelle & assurance', icon: 'shield' },
    { id: 'notifications', label: 'Notifications', icon: 'bell' },
    { id: 'securite', label: 'Sécurité & accès', icon: 'lock' },
  ];

  // Identité
  firstName = 'Bechir';
  lastName = 'Kanzari';
  birthDate = '1989-03-14';
  gender = 'M';
  nationality = 'Tunisienne';

  // Coordonnées
  email = 'bechir.kanzari@gmail.com';
  phone = '+216 22 451 308';
  address = '14 rue des Oliviers';
  city = 'Tunis';
  postalCode = '1002';

  // Santé
  height = '1.78';
  weight = '82.4';
  bloodGroup = 'A+';
  allergies = 'Fruits à coque, lactose';
  treatments = 'Aucun traitement en cours';
  antecedents = 'Aucun antécédent notable';

  // Mutuelle
  mutuelleName = 'CNAM';
  mutuelleNum = 'TN-0042 851';
  mutuellePlan = 'Couverture de base';
  mutuelleExpiry = '2026-12-31';

  // Notifications
  notifRdv = true;
  notifSms = true;
  notifEmail = true;
  notifRappel = true;
  notifResultats = false;
  notifActualites = false;

  // Sécurité
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';

  save() {
    this.saveSuccess = true;
    setTimeout(() => this.saveSuccess = false, 3000);
  }

  ngOnInit() {
    document.body.classList.add('has-shell');
  }

  ngOnDestroy() {
    document.body.classList.remove('has-shell');
  }
}
