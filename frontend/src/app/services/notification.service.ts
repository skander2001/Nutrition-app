import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

const API = 'http://localhost:5000/api/notifications';

export interface AppNotification {
  id: number;
  titre: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'danger';
  lien: string | null;
  lu: boolean;
  created_at: string | null;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  constructor(private http: HttpClient, private auth: AuthService) {}

  private get headers(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.auth.token ?? ''}` });
  }

  list(): Observable<AppNotification[]> {
    return this.http.get<AppNotification[]>(API, { headers: this.headers });
  }

  unreadCount(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${API}/unread-count`, { headers: this.headers });
  }

  markRead(id: number): Observable<AppNotification> {
    return this.http.patch<AppNotification>(`${API}/${id}/read`, {}, { headers: this.headers });
  }

  markAllRead(): Observable<{ success: boolean }> {
    return this.http.patch<{ success: boolean }>(`${API}/read-all`, {}, { headers: this.headers });
  }
}
