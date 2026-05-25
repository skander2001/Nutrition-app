import {
  Component, HostBinding, OnDestroy, OnInit, AfterViewInit,
  ViewChild, ElementRef, ChangeDetectorRef, NgZone
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SidebarComponent } from '../../shared/sidebar/sidebar.component';
import { TopbarComponent } from '../../shared/topbar/topbar.component';
import { ChatbotComponent } from '../../shared/chatbot/chatbot.component';
import { AuthService } from '../../services/auth.service';
import { AppointmentService, Appointment } from '../../services/appointment.service';
import { ConsultationService, Consultation } from '../../services/consultation.service';
import {
  Chart, LineController, LineElement, PointElement, LinearScale,
  CategoryScale, Tooltip, Filler
} from 'chart.js';

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Filler);

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

interface ConsultationRow {
  d: string; m: string;
  weight: string; weightDelta: string; weightDir: 'down' | 'up' | 'flat';
  imc: string;    imcDelta: string;    imcDir: 'down' | 'up' | 'flat';
  gly: string;    glyDelta: string;    glyDir: 'down' | 'up' | 'flat';
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, SidebarComponent, TopbarComponent, ChatbotComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit, OnDestroy, AfterViewInit {
  @HostBinding('class.dashboard-host') hostClass = true;
  @ViewChild('miniChart') miniChartRef!: ElementRef<HTMLCanvasElement>;

  activeTab: 'next' | 'past' | 'canceled' = 'next';

  patientName = '';
  patientInitials = '';

  info: PatientInfo = {
    email: '', telephone: '', ddn: '', sexe: '',
    adresse: '', objectif: '', allergie: '', maladie_chronique: '', ddc: '',
  };

  // Appointments
  upcomingAppts: Appointment[] = [];
  pastAppts: Appointment[] = [];
  cancelledAppts: Appointment[] = [];
  loadingAppts = true;

  // Consultations
  consultations: Consultation[] = [];
  records: ConsultationRow[] = [];
  loadingConsultations = true;

  private miniChartInstance: Chart | null = null;
  private viewReady = false;
  private dataReady = false;

  constructor(
    private auth: AuthService,
    private apptSvc: AppointmentService,
    private consulSvc: ConsultationService,
    private cdr: ChangeDetectorRef,
    private zone: NgZone
  ) {}

  ngOnInit() {
    document.body.classList.add('has-shell');
    const user = this.auth.currentUser;
    if (user) {
      this.patientName     = `${user.prenom} ${user.nom}`;
      this.patientInitials = (user.prenom[0] + user.nom[0]).toUpperCase();
      this.info.email      = user.email || '';
      this.info.telephone  = user.telephone || '';
      this.info.ddn        = user.ddn || '';
      const p = user.patient;
      if (p) {
        this.info.sexe             = p.sexe || '';
        this.info.adresse          = p.adresse || '';
        this.info.objectif         = p.objectif || '';
        this.info.allergie         = p.allergie || '';
        this.info.maladie_chronique = p.maladie_chronique || '';
      }
    }

    this.loadAppointments();
    this.loadConsultations();
  }

  ngAfterViewInit() {
    this.viewReady = true;
    if (this.dataReady) this.buildMiniChart();
  }

  ngOnDestroy() {
    document.body.classList.remove('has-shell');
    this.miniChartInstance?.destroy();
  }

  private loadAppointments() {
    const today = new Date().toISOString().split('T')[0];
    this.apptSvc.list().subscribe({
      next: (res) => {
        const all = res.appointments;
        this.upcomingAppts  = all.filter(a => a.statut !== 'annule' && a.date >= today);
        this.pastAppts      = all.filter(a => a.statut !== 'annule' && a.date < today);
        this.cancelledAppts = all.filter(a => a.statut === 'annule');
        this.loadingAppts   = false;
      },
      error: () => { this.loadingAppts = false; }
    });
  }

  private loadConsultations() {
    this.consulSvc.list().subscribe({
      next: (res) => {
        this.consultations = res.consultations;
        this.records = this.buildRecords();
        this.loadingConsultations = false;
        this.dataReady = true;
        this.cdr.detectChanges();
        if (this.viewReady) this.buildMiniChart();
      },
      error: () => { this.loadingConsultations = false; }
    });
  }

  get filteredAppts(): Appointment[] {
    if (this.activeTab === 'next')     return this.upcomingAppts;
    if (this.activeTab === 'past')     return this.pastAppts;
    return this.cancelledAppts;
  }

  get latestConsultation(): Consultation | null {
    return this.consultations.length ? this.consultations[this.consultations.length - 1] : null;
  }

  get firstConsultation(): Consultation | null {
    return this.consultations.length ? this.consultations[0] : null;
  }

  delta(field: 'poids' | 'imc' | 'glycemie'): { val: string; dir: 'down' | 'up' | 'flat' } {
    if (!this.latestConsultation || !this.firstConsultation || this.consultations.length < 2)
      return { val: '—', dir: 'flat' };
    const diff = (this.latestConsultation[field] ?? 0) - (this.firstConsultation[field] ?? 0);
    if (Math.abs(diff) < 0.01) return { val: '=', dir: 'flat' };
    const sign = diff < 0 ? '−' : '+';
    return { val: `${sign}${Math.abs(diff).toFixed(1)}`, dir: diff < 0 ? 'down' : 'up' };
  }

  statutLabel(s: string): string {
    return s === 'confirme' ? 'Confirmé' : s === 'en_attente' ? 'En attente' : 'Annulé';
  }

  formatDate(iso: string): string {
    if (!iso) return '—';
    const [y, m, d] = iso.split('-');
    const months = ['jan', 'fév', 'mar', 'avr', 'mai', 'jun',
                    'jul', 'aoû', 'sep', 'oct', 'nov', 'déc'];
    return `${d} ${months[+m - 1]} ${y}`;
  }

  nutInitials(name?: string): string {
    if (!name) return 'N';
    const parts = name.replace('Dr. ', '').split(' ');
    return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : parts[0][0].toUpperCase();
  }

  private buildRecords(): ConsultationRow[] {
    if (!this.consultations.length) return [];
    const sorted = [...this.consultations].reverse(); // most recent first
    return sorted.slice(0, 3).map((c, i) => {
      const prev = sorted[i + 1] ?? null;
      const [, m, d] = (c.date ?? '').split('-');
      const months = ['JAN','FÉV','MAR','AVR','MAI','JUN','JUL','AOÛ','SEP','OCT','NOV','DÉC'];
      return {
        d: d ?? '—',
        m: months[(+m || 1) - 1] ?? '',
        weight:      c.poids    != null ? `${c.poids} kg`    : '—',
        weightDelta: this.diff(c.poids,    prev?.poids),
        weightDir:   this.dir(c.poids,     prev?.poids),
        imc:         c.imc      != null ? `${c.imc}`         : '—',
        imcDelta:    this.diff(c.imc,      prev?.imc),
        imcDir:      this.dir(c.imc,       prev?.imc),
        gly:         c.glycemie != null ? `${c.glycemie} g/L` : '—',
        glyDelta:    this.diff(c.glycemie, prev?.glycemie),
        glyDir:      this.dir(c.glycemie,  prev?.glycemie),
      } as ConsultationRow;
    });
  }

  private diff(curr: number | null | undefined, prev: number | null | undefined): string {
    if (curr == null || prev == null) return '';
    const d = curr - prev;
    if (Math.abs(d) < 0.05) return '=';
    return `${d < 0 ? '−' : '+'}${Math.abs(d).toFixed(1)}`;
  }

  private dir(curr: number | null | undefined, prev: number | null | undefined): 'down' | 'up' | 'flat' {
    if (curr == null || prev == null) return 'flat';
    const d = curr - prev;
    return Math.abs(d) < 0.05 ? 'flat' : d < 0 ? 'down' : 'up';
  }

  private buildMiniChart() {
    if (!this.consultations.length || !this.miniChartRef) return;
    this.miniChartInstance?.destroy();

    this.zone.runOutsideAngular(() => {
      const labels  = this.consultations.map(c => { const [,m,d] = c.date.split('-'); return `${d}/${m}`; });
      const data    = this.consultations.map(c => c.poids);
      const brand   = '#4f46e5';
      const canvas  = this.miniChartRef.nativeElement;

      this.miniChartInstance = new Chart(canvas, {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: 'Poids (kg)',
            data,
            borderColor: brand,
            backgroundColor: (ctx: any) => {
              const g = ctx.chart.ctx.createLinearGradient(0, 0, 0, 140);
              g.addColorStop(0, brand + '40');
              g.addColorStop(1, brand + '00');
              return g;
            },
            borderWidth: 2,
            pointRadius: 3,
            pointBackgroundColor: brand,
            pointBorderColor: '#fff',
            pointBorderWidth: 1.5,
            tension: 0.4,
            fill: true,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#1e293b',
              padding: 8,
              callbacks: { label: (ctx: any) => ` ${ctx.parsed.y} kg` }
            }
          },
          scales: {
            x: { grid: { display: false }, ticks: { font: { size: 10 }, color: '#94a3b8' } },
            y: { grid: { color: '#f1f5f9' }, ticks: { font: { size: 10 }, color: '#94a3b8' } }
          }
        }
      });
    });
  }
}
