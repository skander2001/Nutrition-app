import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ChatbotService, ChatHistoryItem } from '../../services/chatbot.service';

interface ChatMessage {
  role: 'user' | 'bot';
  text: string;
}

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chatbot.component.html',
  styleUrl: './chatbot.component.css'
})
export class ChatbotComponent implements OnInit {
  @ViewChild('body') bodyRef?: ElementRef<HTMLDivElement>;
  @ViewChild('input') inputRef?: ElementRef<HTMLTextAreaElement>;

  open = false;
  showPulse = true;
  messages: ChatMessage[] = [];
  draft = '';
  typing = false;

  private firstName = '';

  chips = [
    'Comment prendre un RDV ?',
    'Que manger pour perdre du poids ?',
    'Idées de petit-déjeuner sain',
    'Aliments à éviter en cas d\'allergie',
  ];

  constructor(private auth: AuthService, private chatbot: ChatbotService) {}

  ngOnInit() {
    const u = this.auth.currentUser;
    if (u?.prenom) this.firstName = u.prenom;
  }

  toggle() {
    this.open = !this.open;
    if (this.open) {
      this.showPulse = false;
      if (this.messages.length === 0) {
        const greeting = this.firstName ? `Bonjour ${this.firstName} 👋` : 'Bonjour 👋';
        this.messages.push({
          role: 'bot',
          text: `${greeting}\nJe suis l'assistant NutriCare. Posez-moi vos questions sur la nutrition, vos repas, vos allergies ou votre suivi.`
        });
      }
      setTimeout(() => this.inputRef?.nativeElement.focus(), 120);
    }
  }

  pickChip(label: string) {
    this.draft = label;
    this.submit();
  }

  submit() {
    const text = this.draft.trim();
    if (!text || this.typing) return;
    this.messages.push({ role: 'user', text });
    this.draft = '';
    this.chips = [];
    this.typing = true;
    this.scrollToBottom();

    const history: ChatHistoryItem[] = this.messages
      .slice(0, -1)
      .filter(m => m.role === 'bot' || m.role === 'user')
      .slice(-6)
      .map(m => ({
        role: m.role === 'bot' ? 'assistant' : 'user',
        content: m.text,
      }));

    this.chatbot.send(text, history).subscribe({
      next: (res) => {
        this.typing = false;
        this.messages.push({ role: 'bot', text: res.reply });
        this.chips = res.suggestions || [];
        this.scrollToBottom();
      },
      error: (err) => {
        this.typing = false;
        const msg = err?.error?.error || "Désolé, le service est momentanément indisponible.";
        this.messages.push({ role: 'bot', text: msg });
        this.scrollToBottom();
      }
    });
  }

  onKey(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      this.submit();
    }
  }

  private scrollToBottom() {
    setTimeout(() => {
      const el = this.bodyRef?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    }, 30);
  }
}
