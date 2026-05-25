import { Component, HostBinding, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminSidebarComponent } from '../../../shared/admin-sidebar/admin-sidebar.component';
import { TopbarComponent } from '../../../shared/topbar/topbar.component';
import { AdminService, RdvRow, PatientRow } from '../../../services/admin.service';

@Component({
  selector: 'app-admin-rdv',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AdminSidebarComponent, TopbarComponent],
  templateUrl: './admin-rdv.component.html',
  styleUrl: './admin-rdv.component.css'
})
export class AdminRdvComponent implements OnInit, OnDestroy {
  @HostBinding('class.admin-host') hostClass = true;

  allRdv: RdvRow[] = [];
  rdvByDate: Record<string, RdvRow[]> = {};
  loading = true;
  error = '';

  // ── Calendar ───────────────────────────────────────────────────
  currentDate = new Date();
  calendarWeeks: (string | null)[][] = [];
  selectedDate: string | null = null;

  readonly DOW_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  // ── Create modal ───────────────────────────────────────────────
  showCreate = false;
  creating = false;
  createError = '';
  form = { date_rendez_vous: '', heure: '', statut: 'confirme' };

  patients: PatientRow[] = [];
  selectedPatient: PatientRow | null = null;
  patientQuery = '';
  patientDropdownOpen = false;

  readonly morningSlots   = ['08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30'];
  readonly afternoonSlots = ['14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'];
  readonly CONSULT_DURATION = 30;

  constructor(private admin: AdminService) {}

  ngOnInit() {
    document.body.classList.add('has-shell');
    this.buildCalendar();
    this.load();
  }
  ngOnDestroy() { document.body.classList.remove('has-shell'); }

  load() {
    this.loading = true;
    this.admin.listRdv({}).subscribe({
      next: (rows) => { this.allRdv = rows; this.buildRdvByDate(); this.loading = false; },
      error: (err) => { this.error = err.error?.error ?? 'Erreur'; this.loading = false; }
    });
  }

  // ── Calendar logic ─────────────────────────────────────────────

  get monthLabel(): string {
    return this.currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  }

  prevMonth() {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1, 1);
    this.buildCalendar();
    this.selectedDate = null;
  }

  nextMonth() {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 1);
    this.buildCalendar();
    this.selectedDate = null;
  }

  buildCalendar() {
    const y = this.currentDate.getFullYear();
    const m = this.currentDate.getMonth();
    const first = new Date(y, m, 1);
    const last  = new Date(y, m + 1, 0);

    let dow = first.getDay();
    dow = (dow + 6) % 7; // Mon = 0

    const cells: (string | null)[] = Array(dow).fill(null);
    for (let d = 1; d <= last.getDate(); d++) {
      cells.push(`${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
    }
    while (cells.length % 7) cells.push(null);

    this.calendarWeeks = [];
    for (let i = 0; i < cells.length; i += 7) {
      this.calendarWeeks.push(cells.slice(i, i + 7));
    }
  }

  buildRdvByDate() {
    this.rdvByDate = {};
    for (const r of this.allRdv) {
      const d = r.date_rendez_vous;
      if (!this.rdvByDate[d]) this.rdvByDate[d] = [];
      this.rdvByDate[d].push(r);
    }
  }

  dayRdv(date: string | null): RdvRow[] {
    return date ? (this.rdvByDate[date] ?? []) : [];
  }

  selectDay(date: string | null) {
    if (!date) return;
    this.selectedDate = this.selectedDate === date ? null : date;
  }

  isToday(date: string): boolean {
    const n = new Date();
    const today = `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
    return date === today;
  }

  dayCountByStatus(date: string, statut: string): number {
    return (this.rdvByDate[date] ?? []).filter(r => r.statut === statut).length;
  }

  get selectedDayRdv(): RdvRow[] { return this.dayRdv(this.selectedDate); }

  dayLabel(date: string): string {
    const [y, m, d] = date.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
  }

  // ── Status actions ─────────────────────────────────────────────

  setStatus(r: RdvRow, statut: string) {
    this.admin.updateRdvStatus(r.id_rendez_vous, statut).subscribe(() => this.load());
  }

  remove(r: RdvRow) {
    if (!confirm('Supprimer ce rendez-vous ?')) return;
    this.admin.deleteRdv(r.id_rendez_vous).subscribe(() => this.load());
  }

  // ── Create modal ───────────────────────────────────────────────

  openCreate() {
    this.createError = '';
    this.form = { date_rendez_vous: this.selectedDate ?? '', heure: '', statut: 'confirme' };
    this.selectedPatient = null;
    this.patientQuery = '';
    this.patientDropdownOpen = false;
    this.showCreate = true;
    if (this.patients.length === 0) {
      this.admin.listPatients().subscribe({ next: (rows) => { this.patients = rows; }, error: () => {} });
    }
  }

  closeCreate() { if (!this.creating) this.showCreate = false; }

  private toMinutes(hhmm: string): number {
    const [h, m] = hhmm.split(':').map(Number);
    return h * 60 + (m || 0);
  }

  slotTaken(heure: string): boolean {
    if (!this.form.date_rendez_vous) return false;
    const target = this.toMinutes(heure);
    return this.allRdv.some(r =>
      r.statut !== 'annule' &&
      r.date_rendez_vous === this.form.date_rendez_vous &&
      !!r.heure &&
      Math.abs(this.toMinutes(r.heure) - target) < this.CONSULT_DURATION
    );
  }

  selectSlot(heure: string) { if (!this.slotTaken(heure)) this.form.heure = heure; }
  onDateChange() { this.form.heure = ''; }

  patientLabel(p: PatientRow): string {
    return `${p.user?.prenom ?? ''} ${p.user?.nom ?? ''}`.trim();
  }

  get filteredPatients(): PatientRow[] {
    const q = this.patientQuery.trim().toLowerCase();
    if (!q) return this.patients;
    return this.patients.filter(p => {
      const u = p.user;
      return `${u?.prenom ?? ''} ${u?.nom ?? ''} ${u?.email ?? ''} ${u?.telephone ?? ''}`.toLowerCase().includes(q);
    });
  }

  onPatientInput() {
    this.patientDropdownOpen = true;
    if (this.selectedPatient && this.patientQuery !== this.patientLabel(this.selectedPatient)) {
      this.selectedPatient = null;
    }
  }

  selectPatient(p: PatientRow) {
    this.selectedPatient = p;
    this.patientQuery = this.patientLabel(p);
    this.patientDropdownOpen = false;
  }

  closeDropdown() { setTimeout(() => { this.patientDropdownOpen = false; }, 150); }

  submitCreate() {
    this.createError = '';
    if (!this.selectedPatient) { this.createError = 'Veuillez sélectionner un patient.'; return; }
    if (!this.form.date_rendez_vous || !this.form.heure) { this.createError = 'Date et heure requis.'; return; }
    if (this.slotTaken(this.form.heure)) { this.createError = 'Ce créneau est déjà réservé.'; return; }

    this.creating = true;
    this.admin.createRdv({
      id_patient: this.selectedPatient.id_patient,
      date_rendez_vous: this.form.date_rendez_vous,
      heure: this.form.heure,
      statut: this.form.statut,
    }).subscribe({
      next: () => { this.creating = false; this.showCreate = false; this.load(); },
      error: (err) => { this.creating = false; this.createError = err.error?.error ?? 'Erreur.'; }
    });
  }
}
