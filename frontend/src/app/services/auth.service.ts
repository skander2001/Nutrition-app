import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

const API = 'http://localhost:5000/api/auth';
const TOKEN_KEY = 'nutricare_token';
const USER_KEY  = 'nutricare_user';

export interface AuthUser {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  role: 'patient' | 'nutritionniste';
  token: string;
  profile_complete?: boolean;
  patient?: {
    id_patient: number;
    sexe: string | null;
    adresse: string | null;
    allergie: string | null;
    maladie_chronique: string | null;
    objectif: string | null;
    profile_complete: boolean;
  };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private http: HttpClient) {}

  register(body: {
    nom: string; prenom: string; email: string;
    telephone: string; password: string;
  }): Observable<AuthUser> {
    return this.http.post<AuthUser>(`${API}/register`, body).pipe(
      tap(res => this._store(res))
    );
  }

  login(body: { email: string; password: string }): Observable<AuthUser> {
    return this.http.post<AuthUser>(`${API}/login`, body).pipe(
      tap(res => this._store(res))
    );
  }

  completeProfile(body: {
    sexe: string; adresse: string; allergie: string;
    maladie_chronique: string; objectif: string;
  }): Observable<AuthUser> {
    return this.http.patch<AuthUser>(`${API}/complete-profile`, body, {
      headers: { Authorization: `Bearer ${this.token}` }
    }).pipe(tap(res => this._store(res)));
  }

  me(): Observable<AuthUser> {
    return this.http.get<AuthUser>(`${API}/me`, {
      headers: { Authorization: `Bearer ${this.token}` }
    }).pipe(tap(res => this._store(res)));
  }

  get token(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  get currentUser(): AuthUser | null {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  get isLoggedIn(): boolean {
    return !!this.token;
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  private _store(user: AuthUser): void {
    localStorage.setItem(TOKEN_KEY, user.token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
}
