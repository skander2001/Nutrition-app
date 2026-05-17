import { Component, HostBinding, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../shared/sidebar/sidebar.component';
import { TopbarComponent } from '../../shared/topbar/topbar.component';
import { ChatbotComponent } from '../../shared/chatbot/chatbot.component';

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

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, SidebarComponent, TopbarComponent, ChatbotComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit, OnDestroy {
  activeTab: 'next' | 'past' | 'canceled' = 'next';

  appointments: Appointment[] = [
    { num: '01', date: '22 mai · 10:00', dateMeta: 'Cabinet · 30 min', reason: 'Suivi mensuel', reasonMeta: 'Phase 2 · Équilibre', practitioner: 'Dr. Benali', practitionerInitials: 'SB', status: 'ok', statusLabel: 'Confirmé', next: true },
    { num: '02', date: '04 juin · 14:30', dateMeta: 'Téléconsultation · 30 min', reason: 'Bilan biologique', reasonMeta: 'Lipidique + CRP', practitioner: 'Dr. Benali', practitionerInitials: 'SB', status: 'info', statusLabel: 'À confirmer' },
    { num: '03', date: '19 juin · 09:00', dateMeta: 'Cabinet · 45 min', reason: 'Réévaluation', reasonMeta: 'Mi-parcours', practitioner: 'Dr. Benali', practitionerInitials: 'SB', status: 'ok', statusLabel: 'Confirmé' },
    { num: '04', date: '02 juil. · 16:00', dateMeta: 'Cabinet · 30 min', reason: 'Suivi mensuel', reasonMeta: 'Phase 3', practitioner: 'Dr. Benali', practitionerInitials: 'SB', status: 'warn', statusLabel: 'En attente' },
    { num: '05', date: '23 juil. · 11:30', dateMeta: 'Cabinet · 60 min', reason: 'Bilan phase 2', reasonMeta: 'Clôture de cycle', practitioner: 'Dr. Benali', practitionerInitials: 'SB', status: 'ok', statusLabel: 'Confirmé' },
  ];

  documents = [
    { name: 'Plan alimentaire — mai', meta: 'PDF · 2,3 Mo · 02 mai', color: 'indigo' },
    { name: 'Bilan sanguin lipidique', meta: 'PDF · 1,1 Mo · 14 avr.', color: 'green' },
    { name: 'Ordonnance — vit. D, B12', meta: 'PDF · 320 Ko · 02 avr.', color: 'orange' },
    { name: 'Mesures anthropométriques', meta: 'XLSX · 48 Ko · 18 mars', color: 'cyan' },
    { name: 'Compte-rendu — 1re consult.', meta: 'PDF · 480 Ko · 12 févr.', color: 'pink' },
  ];

  records = [
    { d: '02', m: 'Mai', weight: '82,4 kg', weightDelta: '−0,9', weightDir: 'down', bmi: '26,0', bmiDelta: '−0,3', bmiDir: 'down', fat: '21,8 %', fatDelta: '−0,4', fatDir: 'down' },
    { d: '04', m: 'Avr', weight: '83,3 kg', weightDelta: '−1,2', weightDir: 'down', bmi: '26,3', bmiDelta: '−0,4', bmiDir: 'down', fat: '22,2 %', fatDelta: '−0,6', fatDir: 'down' },
    { d: '06', m: 'Mar', weight: '84,5 kg', weightDelta: '−0,5', weightDir: 'down', bmi: '26,7', bmiDelta: '−0,2', bmiDir: 'down', fat: '22,8 %', fatDelta: '+0,1', fatDir: 'up' },
    { d: '12', m: 'Fév', weight: '85,0 kg', weightDelta: '—', weightDir: '', bmi: '26,9', bmiDelta: '—', bmiDir: '', fat: '22,7 %', fatDelta: '—', fatDir: '' },
  ];

  @HostBinding('class.dashboard-host') hostClass = true;

  ngOnInit() {
    document.body.classList.add('has-shell');
  }
  ngOnDestroy() {
    document.body.classList.remove('has-shell');
  }
}
