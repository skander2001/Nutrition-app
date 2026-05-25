import { Component, HostBinding, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AdminSidebarComponent } from '../../../shared/admin-sidebar/admin-sidebar.component';
import { TopbarComponent } from '../../../shared/topbar/topbar.component';
import {
  AdminService,
  PatientRow,
  ConsultationRow,
  PatientMealPlan,
  MealPlanTemplate
} from '../../../services/admin.service';

@Component({
  selector: 'app-admin-patient-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AdminSidebarComponent, TopbarComponent],
  templateUrl: './admin-patient-detail.component.html',
  styleUrl: './admin-patient-detail.component.css'
})
export class AdminPatientDetailComponent implements OnInit, OnDestroy {
  @HostBinding('class.admin-host') hostClass = true;

  id!: number;
  patient: PatientRow | null = null;
  consultations: ConsultationRow[] = [];
  plans: PatientMealPlan[] = [];
  templates: MealPlanTemplate[] = [];

  assignModalOpen = false;
  newPlan = { id_template: '', nom: '', date_debut: '', date_fin: '', notes: '' };

  aiModalOpen = false;
  aiForm = { cuisine: '', notes: '' };
  aiGenerating = false;
  aiError = '';

  readonly cuisines = [
    'Mediterranean', 'Indian', 'Asian', 'American',
    'Middle Eastern', 'African', 'European', 'Latin American',
  ];

  loading = true;
  error = '';

  constructor(private admin: AdminService, private route: ActivatedRoute) {}

  ngOnInit() {
    document.body.classList.add('has-shell');
    this.id = Number(this.route.snapshot.paramMap.get('id'));
    this.load();
  }
  ngOnDestroy() {
    document.body.classList.remove('has-shell');
  }

  load() {
    this.loading = true;
    this.admin.getPatient(this.id).subscribe({
      next: (p) => { this.patient = p; this.loading = false; },
      error: (err) => { this.error = err.error?.error ?? 'Erreur'; this.loading = false; }
    });
    this.admin.listConsultations(this.id).subscribe(rows => this.consultations = rows);
    this.admin.listPatientPlans(this.id).subscribe(rows => this.plans = rows);
    this.admin.listTemplates().subscribe(rows => this.templates = rows);
  }

  openAssign() { this.assignModalOpen = true; this.newPlan = { id_template: '', nom: '', date_debut: '', date_fin: '', notes: '' }; }
  closeAssign() { this.assignModalOpen = false; }
  assign() {
    const body: any = {
      id_template: this.newPlan.id_template ? Number(this.newPlan.id_template) : null,
      nom: this.newPlan.nom || undefined,
      date_debut: this.newPlan.date_debut || undefined,
      date_fin: this.newPlan.date_fin || undefined,
      notes: this.newPlan.notes || undefined,
    };
    this.admin.assignPlan(this.id, body).subscribe({
      next: () => { this.closeAssign(); this.load(); },
      error: (err) => alert(err.error?.error ?? 'Erreur')
    });
  }

  deletePlan(p: PatientMealPlan) {
    if (!confirm(`Supprimer le plan « ${p.nom} » ?`)) return;
    this.admin.deletePatientPlan(p.id).subscribe(() => this.load());
  }

  openAi()  { this.aiModalOpen = true; this.aiForm = { cuisine: '', notes: '' }; this.aiError = ''; }
  closeAi() { if (!this.aiGenerating) this.aiModalOpen = false; }

  generateAi() {
    if (!this.aiForm.cuisine) { this.aiError = 'Choisissez une cuisine.'; return; }
    this.aiGenerating = true;
    this.aiError = '';
    this.admin.generateAiPlan(this.id, this.aiForm.cuisine, this.aiForm.notes).subscribe({
      next: () => { this.aiGenerating = false; this.closeAi(); this.load(); },
      error: (err: any) => {
        this.aiGenerating = false;
        this.aiError = err.error?.error ?? 'Erreur lors de la génération.';
      },
    });
  }

  private readonly DAY_ORDER = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];
  private readonly MEAL_ORDER = ['petit_dejeuner','dejeuner','collation','diner'];

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
}
