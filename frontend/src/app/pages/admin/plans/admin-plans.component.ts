import { Component, HostBinding, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminSidebarComponent } from '../../../shared/admin-sidebar/admin-sidebar.component';
import { TopbarComponent } from '../../../shared/topbar/topbar.component';
import {
  AdminService,
  MealPlanTemplate,
  PatientRow,
  PatientMealPlan,
} from '../../../services/admin.service';

const JOURS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
const MEALS = ['petit_dej', 'dej', 'collation', 'diner'];

@Component({
  selector: 'app-admin-plans',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminSidebarComponent, TopbarComponent],
  templateUrl: './admin-plans.component.html',
  styleUrl: './admin-plans.component.css'
})
export class AdminPlansComponent implements OnInit, OnDestroy {
  @HostBinding('class.admin-host') hostClass = true;

  tab: 'patients' | 'templates' = 'patients';

  // ── Patient plans ──────────────────────────────────────────────
  patients: PatientRow[] = [];
  selectedPatient: PatientRow | null = null;
  patientQuery = '';
  patientDropdownOpen = false;
  patientPlans: PatientMealPlan[] = [];
  plansLoading = false;
  planSelectedDay: Record<number, string> = {};

  aiModalOpen = false;
  aiForm = { cuisine: '', notes: '' };
  aiGenerating = false;
  aiError = '';

  readonly cuisines = [
    'Mediterranean', 'Indian', 'Asian', 'American',
    'Middle Eastern', 'African', 'European', 'Latin American',
  ];

  readonly mealDisplayLabels: Record<string, string> = {
    petit_dejeuner: 'Petit-déjeuner', dejeuner: 'Déjeuner', collation: 'Collation', diner: 'Dîner',
  };

  // ── Templates ──────────────────────────────────────────────────
  templates: MealPlanTemplate[] = [];
  loading = true;
  error = '';
  modalOpen = false;
  editing: MealPlanTemplate | null = null;
  form: any = this._emptyForm();

  readonly jours = JOURS;
  readonly meals = MEALS;
  readonly objectifs = ['perte_poids', 'prise_masse', 'equilibre', 'maintien'];
  readonly mealLabels: Record<string, string> = {
    petit_dej: 'Petit-déjeuner', dej: 'Déjeuner', collation: 'Collation', diner: 'Dîner'
  };

  private readonly DAY_ORDER = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];
  private readonly MEAL_ORDER = ['petit_dejeuner','dejeuner','collation','diner'];

  constructor(private admin: AdminService) {}

  ngOnInit() {
    document.body.classList.add('has-shell');
    this.admin.listPatients().subscribe({ next: (rows) => { this.patients = rows; }, error: () => {} });
    this.loadTemplates();
  }
  ngOnDestroy() { document.body.classList.remove('has-shell'); }

  setTab(t: 'patients' | 'templates') { this.tab = t; }

  // ── Patient dropdown ───────────────────────────────────────────

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

  clearSearch() {
    this.patientQuery = '';
    this.selectedPatient = null;
    this.patientPlans = [];
    this.planSelectedDay = {};
    this.patientDropdownOpen = false;
  }

  initials(p: PatientRow): string {
    return `${p.user?.prenom?.[0] ?? ''}${p.user?.nom?.[0] ?? ''}`.toUpperCase();
  }

  getDayForPlan(planId: number, days: string[]): string {
    return this.planSelectedDay[planId] ?? (days[0] ?? '');
  }

  setDayForPlan(planId: number, day: string) {
    this.planSelectedDay[planId] = day;
  }

  onPatientInput() {
    this.patientDropdownOpen = true;
    if (this.selectedPatient && this.patientQuery !== this.patientLabel(this.selectedPatient)) {
      this.selectedPatient = null;
      this.patientPlans = [];
    }
  }

  selectPatient(p: PatientRow) {
    this.selectedPatient = p;
    this.patientQuery = this.patientLabel(p);
    this.patientDropdownOpen = false;
    this.loadPatientPlans();
  }

  closeDropdown() { setTimeout(() => { this.patientDropdownOpen = false; }, 150); }

  loadPatientPlans() {
    if (!this.selectedPatient) return;
    this.plansLoading = true;
    this.admin.listPatientPlans(this.selectedPatient.id_patient).subscribe({
      next: (rows) => {
        this.patientPlans = rows;
        this.planSelectedDay = {};
        for (const p of rows) {
          const days = this.contenuKeys(p.contenu);
          if (days.length) this.planSelectedDay[p.id] = days[0];
        }
        this.plansLoading = false;
      },
      error: () => { this.plansLoading = false; }
    });
  }

  deletePlan(p: PatientMealPlan) {
    if (!confirm(`Supprimer « ${p.nom} » ?`)) return;
    this.admin.deletePatientPlan(p.id).subscribe(() => this.loadPatientPlans());
  }

  openAi() { this.aiModalOpen = true; this.aiForm = { cuisine: '', notes: '' }; this.aiError = ''; }
  closeAi() { if (!this.aiGenerating) this.aiModalOpen = false; }

  generateAi() {
    if (!this.aiForm.cuisine) { this.aiError = 'Choisissez une cuisine.'; return; }
    if (!this.selectedPatient) return;
    this.aiGenerating = true;
    this.aiError = '';
    this.admin.generateAiPlan(this.selectedPatient.id_patient, this.aiForm.cuisine, this.aiForm.notes).subscribe({
      next: () => { this.aiGenerating = false; this.closeAi(); this.loadPatientPlans(); },
      error: (err: any) => {
        this.aiGenerating = false;
        this.aiError = err.error?.error ?? 'Erreur lors de la génération.';
      },
    });
  }

  // ── Plan content helpers ───────────────────────────────────────

  contenuKeys(c: any): string[] {
    return Object.keys(c || {}).sort((a, b) => {
      const ia = this.DAY_ORDER.indexOf(a), ib = this.DAY_ORDER.indexOf(b);
      if (ia === -1 && ib === -1) return a.localeCompare(b);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });
  }

  contenuMealKeys(c: any, jour: string): string[] {
    return Object.keys(c?.[jour] || {}).sort((a, b) => {
      const ia = this.MEAL_ORDER.indexOf(a), ib = this.MEAL_ORDER.indexOf(b);
      if (ia === -1 && ib === -1) return a.localeCompare(b);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });
  }

  isMealObject(v: any): boolean { return v !== null && typeof v === 'object'; }

  // ── Templates ──────────────────────────────────────────────────

  private _emptyForm() {
    const contenu: any = {};
    for (const j of JOURS) { contenu[j] = {}; for (const m of MEALS) contenu[j][m] = ''; }
    return { nom: '', objectif: 'equilibre', description: '', kcal_total: 0, contenu };
  }

  loadTemplates() {
    this.loading = true;
    this.admin.listTemplates().subscribe({
      next: (rows) => { this.templates = rows; this.loading = false; },
      error: (err) => { this.error = err.error?.error ?? 'Erreur'; this.loading = false; }
    });
  }

  openCreate() { this.editing = null; this.form = this._emptyForm(); this.modalOpen = true; }

  openEdit(t: MealPlanTemplate) {
    this.editing = t;
    const contenu: any = this._emptyForm().contenu;
    for (const j of JOURS) for (const m of MEALS) contenu[j][m] = t.contenu?.[j]?.[m] || '';
    this.form = { nom: t.nom, objectif: t.objectif || 'equilibre', description: t.description || '', kcal_total: t.kcal_total || 0, contenu };
    this.modalOpen = true;
  }

  close() { this.modalOpen = false; }

  save() {
    if (this.editing) {
      this.admin.updateTemplate(this.editing.id, this.form).subscribe({
        next: () => { this.close(); this.loadTemplates(); },
        error: (err) => alert(err.error?.error ?? 'Erreur')
      });
    } else {
      this.admin.createTemplate(this.form).subscribe({
        next: () => { this.close(); this.loadTemplates(); },
        error: (err) => alert(err.error?.error ?? 'Erreur')
      });
    }
  }

  remove(t: MealPlanTemplate) {
    if (!confirm(`Supprimer « ${t.nom} » ?`)) return;
    this.admin.deleteTemplate(t.id).subscribe(() => this.loadTemplates());
  }
}
