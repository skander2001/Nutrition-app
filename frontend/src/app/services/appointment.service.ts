import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

const API = 'http://localhost:5000/api/appointments';

export interface Slot {
  time: string;
  available: boolean;
}

export interface Appointment {
  id: number;
  date: string;
  heure: string;
  statut: 'en_attente' | 'confirme' | 'annule';
  nutritionniste?: string;
}

export interface PatientPlan {
  id: number;
  nom: string;
  date_debut: string | null;
  date_fin: string | null;
  contenu: Record<string, Record<string, any>>;
  notes: string | null;
  template_nom: string | null;
  created_at: string | null;
}

@Injectable({ providedIn: 'root' })
export class AppointmentService {
  constructor(private http: HttpClient, private auth: AuthService) {}

  private get headers() {
    return { Authorization: `Bearer ${this.auth.token}` };
  }

  workingDays(): Observable<{ days: string[] }> {
    return this.http.get<{ days: string[] }>(`${API}/working-days`, { headers: this.headers });
  }

  slots(date: string): Observable<{ slots: Slot[] }> {
    return this.http.get<{ slots: Slot[] }>(`${API}/slots`, {
      headers: this.headers,
      params: { date },
    });
  }

  book(date: string, heure: string): Observable<Appointment> {
    return this.http.post<Appointment>(API, { date, heure }, { headers: this.headers });
  }

  list(): Observable<{ appointments: Appointment[] }> {
    return this.http.get<{ appointments: Appointment[] }>(API, { headers: this.headers });
  }

  getMyPlans(): Observable<PatientPlan[]> {
    return this.http.get<PatientPlan[]>(`${API}/my-plans`, { headers: this.headers });
  }
}
