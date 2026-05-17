import { Component, HostBinding, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../shared/sidebar/sidebar.component';
import { TopbarComponent } from '../../shared/topbar/topbar.component';
import { ChatbotComponent } from '../../shared/chatbot/chatbot.component';

interface TimeSlot {
  time: string;
  available: boolean;
}

interface CalendarDay {
  date: number;
  month: number;
  year: number;
  currentMonth: boolean;
  available: boolean;
  today: boolean;
}

@Component({
  selector: 'app-appointment',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, TopbarComponent, ChatbotComponent],
  templateUrl: './appointment.component.html',
  styleUrl: './appointment.component.css'
})
export class AppointmentComponent implements OnInit, OnDestroy {
  @HostBinding('class.dashboard-host') hostClass = true;

  step: 1 | 2 | 3 = 1;

  reasons = [
    { id: 'bilan', label: 'Bilan nutritionnel', icon: '📋' },
    { id: 'poids', label: 'Perte de poids', icon: '⚖️' },
    { id: 'diabete', label: 'Diabète & glycémie', icon: '🩸' },
    { id: 'grossesse', label: 'Grossesse', icon: '🤰' },
    { id: 'sport', label: 'Nutrition sportive', icon: '🏃' },
    { id: 'digestif', label: 'Troubles digestifs', icon: '🌿' },
    { id: 'cholesterol', label: 'Cholestérol', icon: '❤️' },
    { id: 'autre', label: 'Autre motif', icon: '✦' },
  ];

  consultTypes = [
    { id: 'premiere', label: 'Première consultation', desc: 'Bilan complet + plan alimentaire personnalisé', price: '70 DT', duration: '60 min', icon: 'star' },
    { id: 'suivi', label: 'Consultation de suivi', desc: 'Ajustements du plan et suivi des objectifs', price: '45 DT', duration: '30 min', icon: 'refresh' },
    { id: 'tele', label: 'Téléconsultation', desc: 'Consultation en vidéo, depuis chez vous', price: '40 DT', duration: '30 min', icon: 'video' },
  ];

  selectedReason = '';
  selectedType = '';
  selectedDate: CalendarDay | null = null;
  selectedSlot = '';
  notes = '';

  currentMonth = new Date().getMonth();
  currentYear = new Date().getFullYear();
  monthNames = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
  dayNames = ['L','M','M','J','V','S','D'];

  availableDays = new Set([3, 5, 8, 10, 12, 15, 17, 19, 22, 24, 26]);

  morningSlots: TimeSlot[] = [
    { time: '08:30', available: true },
    { time: '09:00', available: false },
    { time: '09:30', available: true },
    { time: '10:00', available: true },
    { time: '10:30', available: false },
    { time: '11:00', available: true },
    { time: '11:30', available: true },
  ];

  afternoonSlots: TimeSlot[] = [
    { time: '14:00', available: false },
    { time: '14:30', available: true },
    { time: '15:00', available: true },
    { time: '15:30', available: true },
    { time: '16:00', available: false },
    { time: '16:30', available: true },
    { time: '17:00', available: true },
  ];

  get calendarDays(): CalendarDay[] {
    const days: CalendarDay[] = [];
    const first = new Date(this.currentYear, this.currentMonth, 1);
    const last = new Date(this.currentYear, this.currentMonth + 1, 0);
    const today = new Date();

    let startDay = first.getDay();
    startDay = startDay === 0 ? 6 : startDay - 1;

    for (let i = startDay - 1; i >= 0; i--) {
      const d = new Date(this.currentYear, this.currentMonth, -i);
      days.push({ date: d.getDate(), month: d.getMonth(), year: d.getFullYear(), currentMonth: false, available: false, today: false });
    }

    for (let d = 1; d <= last.getDate(); d++) {
      const isToday = today.getFullYear() === this.currentYear && today.getMonth() === this.currentMonth && today.getDate() === d;
      days.push({ date: d, month: this.currentMonth, year: this.currentYear, currentMonth: true, available: this.availableDays.has(d), today: isToday });
    }

    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      days.push({ date: d, month: this.currentMonth + 1, year: this.currentYear, currentMonth: false, available: false, today: false });
    }

    return days;
  }

  get selectedReasonLabel() {
    return this.reasons.find(r => r.id === this.selectedReason)?.label ?? '';
  }

  get selectedTypeLabel() {
    return this.consultTypes.find(t => t.id === this.selectedType)?.label ?? '';
  }

  get selectedTypePrice() {
    return this.consultTypes.find(t => t.id === this.selectedType)?.price ?? '';
  }

  get selectedTypeDuration() {
    return this.consultTypes.find(t => t.id === this.selectedType)?.duration ?? '';
  }

  get selectedDateLabel() {
    if (!this.selectedDate) return '';
    const months = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
    return `${this.selectedDate.date} ${months[this.selectedDate.month]} ${this.selectedDate.year}`;
  }

  get canGoStep2() {
    return this.selectedReason !== '' && this.selectedType !== '';
  }

  get canConfirm() {
    return this.selectedDate !== null && this.selectedSlot !== '';
  }

  prevMonth() {
    if (this.currentMonth === 0) { this.currentMonth = 11; this.currentYear--; }
    else this.currentMonth--;
    this.selectedDate = null;
    this.selectedSlot = '';
  }

  nextMonth() {
    if (this.currentMonth === 11) { this.currentMonth = 0; this.currentYear++; }
    else this.currentMonth++;
    this.selectedDate = null;
    this.selectedSlot = '';
  }

  selectDay(day: CalendarDay) {
    if (!day.currentMonth || !day.available) return;
    this.selectedDate = day;
    this.selectedSlot = '';
  }

  goStep2() {
    if (this.canGoStep2) this.step = 2;
  }

  goStep3() {
    if (this.canConfirm) this.step = 3;
  }

  confirm() {
    // Booking confirmed — would call backend API
    alert('Rendez-vous confirmé !');
  }

  ngOnInit() {
    document.body.classList.add('has-shell');
  }

  ngOnDestroy() {
    document.body.classList.remove('has-shell');
  }
}
