import { Component, HostBinding, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AdminSidebarComponent } from '../../../shared/admin-sidebar/admin-sidebar.component';
import { TopbarComponent } from '../../../shared/topbar/topbar.component';
import { AdminService, ConsultationRow, RdvRow } from '../../../services/admin.service';

interface PatientGroup {
  id_patient: number;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  consultations: ConsultationRow[];
}

@Component({
  selector: 'app-admin-consultations',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminSidebarComponent, TopbarComponent],
  templateUrl: './admin-consultations.component.html',
  styleUrl: './admin-consultations.component.css'
})
export class AdminConsultationsComponent implements OnInit, OnDestroy {
  @HostBinding('class.admin-host') hostClass = true;

  consultations: ConsultationRow[] = [];
  patientGroups: PatientGroup[] = [];
  expandedGroups = new Set<number>();

  rdvList: RdvRow[] = [];
  filterPatientId: number | null = null;

  modalOpen = false;
  editing: ConsultationRow | null = null;
  form: any = {
    id_rendez_vous: '',
    date_consultation: '',
    poids: '',
    tension_arterielle: '',
    glycemie: '',
    diagnostic: '',
    remarque: '',
  };

  loading = true;
  error = '';

  constructor(private admin: AdminService, private route: ActivatedRoute) {}

  ngOnInit() {
    document.body.classList.add('has-shell');
    this.load();
  }
  ngOnDestroy() { document.body.classList.remove('has-shell'); }

  load() {
    this.loading = true;
    this.admin.listConsultations().subscribe({
      next: (rows) => {
        this.consultations = rows;
        this.buildGroups();
        this.loading = false;
        const idRdv = this.route.snapshot.queryParamMap.get('id_rdv');
        if (idRdv) this.openCreate(Number(idRdv));
      },
      error: (err) => { this.error = err.error?.error ?? 'Erreur'; this.loading = false; }
    });
  }

  buildGroups() {
    const map: Record<number, PatientGroup> = {};
    for (const c of this.consultations) {
      if (!c.patient) continue;
      const pid = c.patient.id_patient;
      if (!map[pid]) {
        map[pid] = { ...c.patient, consultations: [] };
        this.expandedGroups.add(pid);
      }
      map[pid].consultations.push(c);
    }
    this.patientGroups = Object.values(map).sort((a, b) =>
      `${a.prenom} ${a.nom}`.localeCompare(`${b.prenom} ${b.nom}`)
    );
  }

  isExpanded(pid: number): boolean { return this.expandedGroups.has(pid); }
  toggleGroup(pid: number) {
    if (this.expandedGroups.has(pid)) this.expandedGroups.delete(pid);
    else this.expandedGroups.add(pid);
  }

  initials(g: { prenom: string; nom: string }): string {
    return `${g.prenom[0] ?? ''}${g.nom[0] ?? ''}`.toUpperCase();
  }

  get filteredRdvList(): RdvRow[] {
    if (!this.filterPatientId) return this.rdvList;
    return this.rdvList.filter(r => r.id_patient === this.filterPatientId);
  }

  private ensureRdvList() {
    if (this.rdvList.length === 0) {
      this.admin.listRdv({ statut: 'confirme' }).subscribe(rows => { this.rdvList = rows; });
    }
  }

  openCreate(idRdv?: number) {
    this.editing = null;
    this.filterPatientId = null;
    this.form = {
      id_rendez_vous: idRdv ?? '',
      date_consultation: new Date().toISOString().split('T')[0],
      poids: '', tension_arterielle: '', glycemie: '', diagnostic: '', remarque: '',
    };
    this.ensureRdvList();
    this.modalOpen = true;
  }

  openCreateForPatient(g: PatientGroup) {
    this.editing = null;
    this.filterPatientId = g.id_patient;
    this.form = {
      id_rendez_vous: '',
      date_consultation: new Date().toISOString().split('T')[0],
      poids: '', tension_arterielle: '', glycemie: '', diagnostic: '', remarque: '',
    };
    this.ensureRdvList();
    this.modalOpen = true;
  }

  openEdit(c: ConsultationRow) {
    this.editing = c;
    this.filterPatientId = null;
    this.form = { ...c };
    this.ensureRdvList();
    this.modalOpen = true;
  }

  close() { this.modalOpen = false; }

  save() {
    const body: any = { ...this.form };
    if (this.editing) {
      this.admin.updateConsultation(this.editing.id_consultation, body).subscribe({
        next: () => { this.close(); this.load(); },
        error: (err) => alert(err.error?.error ?? 'Erreur')
      });
    } else {
      this.admin.createConsultation(body).subscribe({
        next: () => { this.close(); this.load(); },
        error: (err) => alert(err.error?.error ?? 'Erreur')
      });
    }
  }
}
