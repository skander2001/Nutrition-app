import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface Consultation {
  id: number;
  date: string;
  poids: number | null;
  taille: number | null;
  imc: number | null;
  glycemie: number | null;
  tension: string | null;
  tension_systolique: number | null;
  tension_diastolique: number | null;
  diagnostic: string | null;
  remarque: string | null;
}

@Injectable({ providedIn: 'root' })
export class ConsultationService {
  private base = 'http://localhost:5000/api';

  constructor(private http: HttpClient, private auth: AuthService) {}

  list(): Observable<{ consultations: Consultation[] }> {
    const token = this.auth.token;
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    return this.http.get<{ consultations: Consultation[] }>(`${this.base}/consultations`, { headers });
  }
}
