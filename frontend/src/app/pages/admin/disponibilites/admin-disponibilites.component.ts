import { Component, HostBinding, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminSidebarComponent } from '../../../shared/admin-sidebar/admin-sidebar.component';
import { TopbarComponent } from '../../../shared/topbar/topbar.component';
import { AdminService, DisponibiliteRow } from '../../../services/admin.service';

@Component({
  selector: 'app-admin-disponibilites',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminSidebarComponent, TopbarComponent],
  templateUrl: './admin-disponibilites.component.html',
  styleUrl: './admin-disponibilites.component.css'
})
export class AdminDisponibilitesComponent implements OnInit, OnDestroy {
  @HostBinding('class.admin-host') hostClass = true;

  dispos: DisponibiliteRow[] = [];
  joursOrder = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
  loading = true;
  error = '';

  modalOpen = false;
  editing: DisponibiliteRow | null = null;
  form: any = { jour: 'Lundi', date: '', heure_debut: '09:00', heure_fin: '12:00', statut: 'disponible' };

  constructor(private admin: AdminService) {}

  ngOnInit() {
    document.body.classList.add('has-shell');
    this.load();
  }
  ngOnDestroy() {
    document.body.classList.remove('has-shell');
  }

  load() {
    this.loading = true;
    this.admin.listDisponibilites().subscribe({
      next: (rows) => { this.dispos = rows; this.loading = false; },
      error: (err) => { this.error = err.error?.error ?? 'Erreur'; this.loading = false; }
    });
  }

  byJour(jour: string): DisponibiliteRow[] {
    return this.dispos.filter(d => d.jour === jour).sort((a, b) => a.heure_debut.localeCompare(b.heure_debut));
  }

  openCreate() {
    this.editing = null;
    this.form = { jour: 'Lundi', date: '', heure_debut: '09:00', heure_fin: '12:00', statut: 'disponible' };
    this.modalOpen = true;
  }

  openEdit(d: DisponibiliteRow) {
    this.editing = d;
    this.form = { ...d };
    this.modalOpen = true;
  }

  close() { this.modalOpen = false; }

  save() {
    const body: any = { ...this.form };
    if (!body.date) delete body.date;
    if (this.editing) {
      this.admin.updateDisponibilite(this.editing.id_disponibilite, body).subscribe({
        next: () => { this.close(); this.load(); },
        error: (err) => alert(err.error?.error ?? 'Erreur')
      });
    } else {
      this.admin.createDisponibilite(body).subscribe({
        next: () => { this.close(); this.load(); },
        error: (err) => alert(err.error?.error ?? 'Erreur')
      });
    }
  }

  remove(d: DisponibiliteRow) {
    if (!confirm('Supprimer ce créneau ?')) return;
    this.admin.deleteDisponibilite(d.id_disponibilite).subscribe(() => this.load());
  }
}
