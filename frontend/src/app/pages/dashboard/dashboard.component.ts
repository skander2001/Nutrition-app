import { Component, HostBinding, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SidebarComponent } from '../../shared/sidebar/sidebar.component';
import { TopbarComponent } from '../../shared/topbar/topbar.component';
import { ChatbotComponent } from '../../shared/chatbot/chatbot.component';
import { AuthService } from '../../services/auth.service';

interface Appointment {
  num: string;
  date: string;
  dateMeta: string;
  reason: string;
  reasonMeta: string;
  practitioner: string;
  practitionerInitials: string;
  status: 'ok' | 'info' | 'warn';
  statusLabel: string;
  next?: boolean;
}

interface PatientInfo {
  email: string;
  telephone: string;
  ddn: string;
  sexe: string;
  adresse: string;
  objectif: string;
  allergie: string;
  maladie_chronique: string;
  ddc: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, SidebarComponent, TopbarComponent, ChatbotComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit, OnDestroy {
  activeTab: 'next' | 'past' | 'canceled' = 'next';

  patientName = '';
  patientInitials = '';

  info: PatientInfo = {
    email: '',
    telephone: '',
    ddn: '',
    sexe: '',
    adresse: '',
    objectif: '',
    allergie: '',
    maladie_chronique: '',
    ddc: '',
  };

  appointments: Appointment[] = [];
  records: any[] = [];

  constructor(private auth: AuthService) {}

  @HostBinding('class.dashboard-host') hostClass = true;

  ngOnInit() {
    document.body.classList.add('has-shell');
    const user = this.auth.currentUser;
    if (user) {
      this.patientName = `${user.prenom} ${user.nom}`;
      this.patientInitials = (user.prenom[0] + user.nom[0]).toUpperCase();
      this.info.email = user.email || '';
      this.info.telephone = user.telephone || '';
      const p = user.patient;
      if (p) {
        this.info.sexe = p.sexe || '';
        this.info.adresse = p.adresse || '';
        this.info.objectif = p.objectif || '';
        this.info.allergie = p.allergie || '';
        this.info.maladie_chronique = p.maladie_chronique || '';
      }
    }
  }
  ngOnDestroy() {
    document.body.classList.remove('has-shell');
  }
}
