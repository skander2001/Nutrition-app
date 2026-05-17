import { Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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
export class ChatbotComponent {
  @ViewChild('body') bodyRef?: ElementRef<HTMLDivElement>;
  @ViewChild('input') inputRef?: ElementRef<HTMLTextAreaElement>;

  open = false;
  showPulse = true;
  messages: ChatMessage[] = [];
  draft = '';
  typing = false;

  chips = [
    'Comment prendre un RDV ?',
    'Voir mon plan alimentaire',
    'Annuler une consultation',
    'Tarifs et remboursement',
  ];

  toggle() {
    this.open = !this.open;
    if (this.open) {
      this.showPulse = false;
      if (this.messages.length === 0) {
        this.messages.push({
          role: 'bot',
          text: "Bonjour Bechir 👋\nJe suis l'assistant NutriCare. Je peux répondre à vos questions sur l'application, votre suivi, ou vous aider à prendre rendez-vous. Comment puis-je vous aider ?"
        });
      }
      setTimeout(() => this.inputRef?.nativeElement.focus(), 120);
    }
  }

  pickChip(label: string) {
    this.draft = label;
    this.submit();
  }

  async submit() {
    const text = this.draft.trim();
    if (!text || this.typing) return;
    this.messages.push({ role: 'user', text });
    this.draft = '';
    this.chips = [];
    this.typing = true;
    this.scrollToBottom();

    setTimeout(() => {
      this.typing = false;
      this.messages.push({
        role: 'bot',
        text: this.fakeReply(text)
      });
      this.scrollToBottom();
    }, 900);
  }

  onKey(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      this.submit();
    }
  }

  private fakeReply(input: string): string {
    const t = input.toLowerCase();
    if (t.includes('rdv') || t.includes('rendez')) {
      return "Pour prendre un rendez-vous, cliquez sur « Nouvelle consultation » dans le menu latéral. Vous pourrez choisir le motif, la formule et un créneau disponible.";
    }
    if (t.includes('plan')) {
      return "Votre plan alimentaire est disponible dans la section « Plan alimentaire » de votre espace. Il est mis à jour à chaque consultation.";
    }
    if (t.includes('annul')) {
      return "L'annulation est gratuite jusqu'à 12 h avant le rendez-vous. Rendez-vous dans « Mes rendez-vous » pour annuler ou décaler.";
    }
    if (t.includes('tarif') || t.includes('rembours')) {
      return "Première consultation : 70 DT · Suivi : 45 DT · Téléconsultation : 40 DT. Le cabinet est conventionné secteur 1 (CNAM).";
    }
    return "Merci pour votre message. Pour toute question médicale précise, je vous recommande de prendre rendez-vous directement avec Dr. Benali.";
  }

  private scrollToBottom() {
    setTimeout(() => {
      const el = this.bodyRef?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    }, 30);
  }
}