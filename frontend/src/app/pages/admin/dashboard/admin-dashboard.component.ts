import { Component, HostBinding, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminSidebarComponent } from '../../../shared/admin-sidebar/admin-sidebar.component';
import { TopbarComponent } from '../../../shared/topbar/topbar.component';
import { AdminService, AdminStats, RdvRow } from '../../../services/admin.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, AdminSidebarComponent, TopbarComponent],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  @HostBinding('class.admin-host') hostClass = true;

  loading = true;
  error = '';
  stats: AdminStats | null = null;
  todayRdv: RdvRow[] = [];
  upcomingRdv: RdvRow[] = [];
  nutritionnisteName = '';

  constructor(private admin: AdminService, private auth: AuthService) {}

  ngOnInit() {
    document.body.classList.add('has-shell');
    const u = this.auth.currentUser;
    if (u) this.nutritionnisteName = `${u.prenom} ${u.nom}`;
    this.load();
  }

  ngOnDestroy() {
    document.body.classList.remove('has-shell');
  }

  load() {
    this.loading = true;
    this.admin.getStats().subscribe({
      next: (s) => this.stats = s,
      error: (err) => this.error = err.error?.error ?? 'Erreur de chargement'
    });

    const today = new Date().toISOString().split('T')[0];
    this.admin.listRdv({ from: today, to: today }).subscribe({
      next: (rows) => this.todayRdv = rows,
    });

    this.admin.listRdv({ statut: 'en_attente' }).subscribe({
      next: (rows) => {
        this.upcomingRdv = rows.slice(0, 5);
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  confirm(rdv: RdvRow) {
    this.admin.updateRdvStatus(rdv.id_rendez_vous, 'confirme').subscribe(() => this.load());
  }
  cancel(rdv: RdvRow) {
    if (!confirm('Annuler ce rendez-vous ?')) return;
    this.admin.updateRdvStatus(rdv.id_rendez_vous, 'annule').subscribe(() => this.load());
  }
}
