import { Component, HostBinding, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SidebarComponent } from '../../shared/sidebar/sidebar.component';
import { TopbarComponent } from '../../shared/topbar/topbar.component';
import { ChatbotComponent } from '../../shared/chatbot/chatbot.component';
import { AppointmentService, Slot } from '../../services/appointment.service';

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

  step: 1 | 2 = 1;
  booked = false;
  error = '';
  loading = false;

  selectedDate: CalendarDay | null = null;
  selectedSlot = '';
  slots: Slot[] = [];
  slotsLoading = false;

  workingDays: string[] = [];

  currentMonth = new Date().getMonth();
  currentYear = new Date().getFullYear();
  monthNames = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
  dayNames = ['L','M','M','J','V','S','D'];

  private weekdayFr = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];

  constructor(private appointments: AppointmentService, private router: Router) {}

  ngOnInit() {
    document.body.classList.add('has-shell');
    this.appointments.workingDays().subscribe({
      next: (res) => this.workingDays = res.days,
      error: () => {},
    });
  }

  ngOnDestroy() {
    document.body.classList.remove('has-shell');
  }

  private pad(n: number): string {
    return n < 10 ? '0' + n : '' + n;
  }

  private isFutureOrToday(y: number, m: number, d: number): boolean {
    const day = new Date(y, m, d); day.setHours(0, 0, 0, 0);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return day >= today;
  }

  get calendarDays(): CalendarDay[] {
    const days: CalendarDay[] = [];
    const first = new Date(this.currentYear, this.currentMonth, 1);
    const last = new Date(this.currentYear, this.currentMonth + 1, 0);
    const today = new Date();

    let startDay = first.getDay();
    startDay = startDay === 0 ? 6 : startDay - 1;

    for (let i = startDay - 1; i >= 0; i--) {
      const dt = new Date(this.currentYear, this.currentMonth, -i);
      days.push({ date: dt.getDate(), month: dt.getMonth(), year: dt.getFullYear(), currentMonth: false, available: false, today: false });
    }

    for (let d = 1; d <= last.getDate(); d++) {
      const dt = new Date(this.currentYear, this.currentMonth, d);
      const isToday = today.getFullYear() === this.currentYear && today.getMonth() === this.currentMonth && today.getDate() === d;
      const weekday = this.weekdayFr[dt.getDay()];
      const available = this.isFutureOrToday(this.currentYear, this.currentMonth, d) && this.workingDays.includes(weekday);
      days.push({ date: d, month: this.currentMonth, year: this.currentYear, currentMonth: true, available, today: isToday });
    }

    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      days.push({ date: d, month: this.currentMonth + 1, year: this.currentYear, currentMonth: false, available: false, today: false });
    }

    return days;
  }

  get selectedDateLabel(): string {
    if (!this.selectedDate) return '';
    const months = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
    return `${this.selectedDate.date} ${months[this.selectedDate.month]} ${this.selectedDate.year}`;
  }

  get selectedDateStr(): string {
    if (!this.selectedDate) return '';
    return `${this.selectedDate.year}-${this.pad(this.selectedDate.month + 1)}-${this.pad(this.selectedDate.date)}`;
  }

  get morningSlots(): Slot[] {
    return this.slots.filter(s => s.time < '12:00');
  }

  get afternoonSlots(): Slot[] {
    return this.slots.filter(s => s.time >= '12:00');
  }

  get canConfirm(): boolean {
    return this.selectedDate !== null && this.selectedSlot !== '';
  }

  prevMonth() {
    if (this.currentMonth === 0) { this.currentMonth = 11; this.currentYear--; }
    else this.currentMonth--;
    this.resetSelection();
  }

  nextMonth() {
    if (this.currentMonth === 11) { this.currentMonth = 0; this.currentYear++; }
    else this.currentMonth++;
    this.resetSelection();
  }

  private resetSelection() {
    this.selectedDate = null;
    this.selectedSlot = '';
    this.slots = [];
  }

  selectDay(day: CalendarDay) {
    if (!day.currentMonth || !day.available) return;
    this.selectedDate = day;
    this.selectedSlot = '';
    this.slots = [];
    this.error = '';
    this.slotsLoading = true;
    this.appointments.slots(this.selectedDateStr).subscribe({
      next: (res) => {
        this.slots = res.slots;
        this.slotsLoading = false;
      },
      error: (err) => {
        this.slotsLoading = false;
        this.error = err.error?.error ?? 'Impossible de charger les créneaux.';
      }
    });
  }

  goStep2() {
    if (this.canConfirm) { this.step = 2; this.error = ''; }
  }

  confirm() {
    if (!this.canConfirm) return;
    this.loading = true;
    this.error = '';
    this.appointments.book(this.selectedDateStr, this.selectedSlot).subscribe({
      next: () => {
        this.loading = false;
        this.booked = true;
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.error ?? 'La réservation a échoué.';
      }
    });
  }

  goDashboard() {
    this.router.navigate(['/dashboard']);
  }
}
