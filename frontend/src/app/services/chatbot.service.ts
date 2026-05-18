import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

const API = 'http://localhost:5000/api/chatbot';

export interface ChatbotReply {
  reply: string;
  suggestions: string[];
}

export interface ChatHistoryItem {
  role: 'user' | 'assistant';
  content: string;
}

@Injectable({ providedIn: 'root' })
export class ChatbotService {
  constructor(private http: HttpClient, private auth: AuthService) {}

  send(message: string, history: ChatHistoryItem[]): Observable<ChatbotReply> {
    return this.http.post<ChatbotReply>(API, { message, history }, {
      headers: { Authorization: `Bearer ${this.auth.token}` }
    });
  }
}
