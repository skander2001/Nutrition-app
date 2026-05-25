import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

const API = 'http://localhost:5000/api/admin';

export interface AdminStats {
  total_patients: number;
  rdv_today: number;
  rdv_pending: number;
  rdv_confirmed_upcoming: number;
  total_consultations: number;
  total_templates: number;
  active_plans: number;
}

export interface PatientRow {
  id_patient: number;
  sexe: string | null;
  adresse: string | null;
  taille: number;
  poids_initial: number;
  allergie: string | null;
  maladie_chronique: string | null;
  objectif: string | null;
  ddc: string | null;
  profile_complete: boolean;
  user?: {
    id: number;
    nom: string;
    prenom: string;
    email: string;
    telephone: string;
    ddn: string | null;
    status: string;
  };
}

export interface RdvRow {
  id_rendez_vous: number;
  id_patient: number;
  id_nutritionniste: number;
  date_rendez_vous: string;
  heure: string;
  statut: 'en_attente' | 'confirme' | 'annule';
  has_consultation: boolean;
  patient?: {
    id_patient: number;
    nom: string;
    prenom: string;
    email: string;
    telephone: string;
  };
}

export interface ConsultationRow {
  id_consultation: number;
  id_rendez_vous: number;
  date_consultation: string | null;
  poids: number | null;
  tension_arterielle: string | null;
  glycemie: string | null;
  diagnostic: string | null;
  remarque: string | null;
  rdv_date: string | null;
  rdv_heure: string | null;
  patient?: {
    id_patient: number;
    nom: string;
    prenom: string;
    email: string;
    telephone: string;
  };
}

export interface DisponibiliteRow {
  id_disponibilite: number;
  id_nutritionniste: number;
  jour: string | null;
  date: string | null;
  heure_debut: string;
  heure_fin: string;
  statut: 'disponible' | 'indisponible';
}

export interface MealPlanTemplate {
  id: number;
  nom: string;
  objectif: string | null;
  description: string | null;
  kcal_total: number | null;
  contenu: Record<string, Record<string, any>>;
  created_at: string | null;
}

export interface PatientMealPlan {
  id: number;
  id_patient: number;
  id_template: number | null;
  template_nom: string | null;
  nom: string;
  date_debut: string | null;
  date_fin: string | null;
  contenu: Record<string, Record<string, any>>;
  notes: string | null;
  created_at: string | null;
}


@Injectable({ providedIn: 'root' })
export class AdminService {
  constructor(private http: HttpClient, private auth: AuthService) {}

  private get headers(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.auth.token ?? ''}` });
  }

  // stats
  getStats(): Observable<AdminStats> {
    return this.http.get<AdminStats>(`${API}/stats`, { headers: this.headers });
  }

  // patients
  listPatients(search = ''): Observable<PatientRow[]> {
    const params = search ? new HttpParams().set('search', search) : new HttpParams();
    return this.http.get<PatientRow[]>(`${API}/patients`, { headers: this.headers, params });
  }
  getPatient(id: number): Observable<PatientRow> {
    return this.http.get<PatientRow>(`${API}/patients/${id}`, { headers: this.headers });
  }
  createPatient(body: {
    prenom: string; nom: string; email: string;
    telephone: string; password: string;
    sexe?: string; objectif?: string;
  }): Observable<PatientRow> {
    return this.http.post<PatientRow>(`${API}/patients`, body, { headers: this.headers });
  }
  updatePatient(id: number, body: Partial<PatientRow>): Observable<PatientRow> {
    return this.http.patch<PatientRow>(`${API}/patients/${id}`, body, { headers: this.headers });
  }

  // rendez-vous
  listRdv(filters: { statut?: string; from?: string; to?: string } = {}): Observable<RdvRow[]> {
    let params = new HttpParams();
    if (filters.statut) params = params.set('statut', filters.statut);
    if (filters.from)   params = params.set('from', filters.from);
    if (filters.to)     params = params.set('to', filters.to);
    return this.http.get<RdvRow[]>(`${API}/rendez-vous`, { headers: this.headers, params });
  }
  createRdv(body: {
    id_patient: number; date_rendez_vous: string;
    heure: string; statut?: string;
  }): Observable<RdvRow> {
    return this.http.post<RdvRow>(`${API}/rendez-vous`, body, { headers: this.headers });
  }
  updateRdvStatus(id: number, statut: string): Observable<RdvRow> {
    return this.http.patch<RdvRow>(`${API}/rendez-vous/${id}/statut`, { statut }, { headers: this.headers });
  }
  deleteRdv(id: number): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${API}/rendez-vous/${id}`, { headers: this.headers });
  }

  // consultations
  listConsultations(id_patient?: number): Observable<ConsultationRow[]> {
    let params = new HttpParams();
    if (id_patient) params = params.set('id_patient', String(id_patient));
    return this.http.get<ConsultationRow[]>(`${API}/consultations`, { headers: this.headers, params });
  }
  getConsultation(id: number): Observable<ConsultationRow> {
    return this.http.get<ConsultationRow>(`${API}/consultations/${id}`, { headers: this.headers });
  }
  createConsultation(body: Partial<ConsultationRow>): Observable<ConsultationRow> {
    return this.http.post<ConsultationRow>(`${API}/consultations`, body, { headers: this.headers });
  }
  updateConsultation(id: number, body: Partial<ConsultationRow>): Observable<ConsultationRow> {
    return this.http.patch<ConsultationRow>(`${API}/consultations/${id}`, body, { headers: this.headers });
  }

  // disponibilites
  listDisponibilites(): Observable<DisponibiliteRow[]> {
    return this.http.get<DisponibiliteRow[]>(`${API}/disponibilites`, { headers: this.headers });
  }
  createDisponibilite(body: Partial<DisponibiliteRow>): Observable<DisponibiliteRow> {
    return this.http.post<DisponibiliteRow>(`${API}/disponibilites`, body, { headers: this.headers });
  }
  updateDisponibilite(id: number, body: Partial<DisponibiliteRow>): Observable<DisponibiliteRow> {
    return this.http.patch<DisponibiliteRow>(`${API}/disponibilites/${id}`, body, { headers: this.headers });
  }
  deleteDisponibilite(id: number): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${API}/disponibilites/${id}`, { headers: this.headers });
  }

  // templates
  listTemplates(): Observable<MealPlanTemplate[]> {
    return this.http.get<MealPlanTemplate[]>(`${API}/templates`, { headers: this.headers });
  }
  createTemplate(body: Partial<MealPlanTemplate>): Observable<MealPlanTemplate> {
    return this.http.post<MealPlanTemplate>(`${API}/templates`, body, { headers: this.headers });
  }
  updateTemplate(id: number, body: Partial<MealPlanTemplate>): Observable<MealPlanTemplate> {
    return this.http.patch<MealPlanTemplate>(`${API}/templates/${id}`, body, { headers: this.headers });
  }
  deleteTemplate(id: number): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${API}/templates/${id}`, { headers: this.headers });
  }

  // plans patient
  listPatientPlans(id_patient: number): Observable<PatientMealPlan[]> {
    return this.http.get<PatientMealPlan[]>(`${API}/patients/${id_patient}/plans`, { headers: this.headers });
  }
  assignPlan(id_patient: number, body: Partial<PatientMealPlan>): Observable<PatientMealPlan> {
    return this.http.post<PatientMealPlan>(`${API}/patients/${id_patient}/plans`, body, { headers: this.headers });
  }
  deletePatientPlan(id_plan: number): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${API}/plans/${id_plan}`, { headers: this.headers });
  }

  generateAiPlan(id_patient: number, cuisine: string, notes: string = ''): Observable<any> {
    return this.http.post<any>(`${API}/patients/${id_patient}/generate-plan`, { cuisine, notes }, { headers: this.headers });
  }
}
