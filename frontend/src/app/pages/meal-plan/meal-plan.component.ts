import { Component, HostBinding, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../shared/sidebar/sidebar.component';
import { TopbarComponent } from '../../shared/topbar/topbar.component';
import { AppointmentService, PatientPlan } from '../../services/appointment.service';

@Component({
  selector: 'app-meal-plan',
  standalone: true,
  imports: [CommonModule, SidebarComponent, TopbarComponent],
  templateUrl: './meal-plan.component.html',
  styleUrl: './meal-plan.component.css'
})
export class MealPlanComponent implements OnInit, OnDestroy {
  @HostBinding('class.meal-plan-host') hostClass = true;

  plans: PatientPlan[] = [];
  loading = true;
  selectedPlanId: number | null = null;
  planSelectedDay: Record<number, string> = {};

  private readonly DAY_ORDER = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];
  private readonly MEAL_ORDER = ['petit_dejeuner','dejeuner','collation','diner'];

  readonly mealLabels: Record<string, string> = {
    petit_dejeuner: 'Petit-déjeuner',
    dejeuner: 'Déjeuner',
    collation: 'Collation',
    diner: 'Dîner',
  };

  constructor(private appt: AppointmentService) {}

  ngOnInit() {
    document.body.classList.add('has-shell');
    this.appt.getMyPlans().subscribe({
      next: (plans) => {
        this.plans = plans;
        this.planSelectedDay = {};
        for (const p of plans) {
          const days = this.contenuKeys(p.contenu);
          if (days.length) this.planSelectedDay[p.id] = days[0];
        }
        if (plans.length) this.selectedPlanId = plans[0].id;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }
  ngOnDestroy() { document.body.classList.remove('has-shell'); }

  get selectedPlan(): PatientPlan | null {
    return this.plans.find(p => p.id === this.selectedPlanId) ?? null;
  }

  selectPlan(id: number) { this.selectedPlanId = id; }

  contenuKeys(c: any): string[] {
    return Object.keys(c || {}).sort((a, b) => {
      const ia = this.DAY_ORDER.indexOf(a), ib = this.DAY_ORDER.indexOf(b);
      if (ia === -1 && ib === -1) return a.localeCompare(b);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });
  }

  contenuMealKeys(c: any, jour: string): string[] {
    return Object.keys(c?.[jour] || {}).sort((a, b) => {
      const ia = this.MEAL_ORDER.indexOf(a), ib = this.MEAL_ORDER.indexOf(b);
      if (ia === -1 && ib === -1) return a.localeCompare(b);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });
  }

  isMealObject(v: any): boolean { return v !== null && typeof v === 'object'; }

  getDayForPlan(planId: number, days: string[]): string {
    return this.planSelectedDay[planId] ?? (days[0] ?? '');
  }

  setDayForPlan(planId: number, day: string) {
    this.planSelectedDay[planId] = day;
  }

  totalCalories(plan: PatientPlan, day: string): number {
    const meals = this.contenuMealKeys(plan.contenu, day);
    return meals.reduce((sum, meal) => {
      const v = plan.contenu[day][meal];
      return sum + (this.isMealObject(v) ? (v.calories ?? 0) : 0);
    }, 0);
  }
}
