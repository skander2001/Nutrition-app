import { Component, HostBinding, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminSidebarComponent } from '../../../shared/admin-sidebar/admin-sidebar.component';
import { TopbarComponent } from '../../../shared/topbar/topbar.component';
import { AdminService, PatientRow } from '../../../services/admin.service';

@Component({
  selector: 'app-admin-patients',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AdminSidebarComponent, TopbarComponent],
  templateUrl: './admin-patients.component.html',
  styleUrl: './admin-patients.component.css'
})
export class AdminPatientsComponent implements OnInit, OnDestroy {
  @HostBinding('class.admin-host') hostClass = true;

  patients: PatientRow[] = [];
  search = '';
  loading = true;
  error = '';

  // Formulaire « Ajouter un patient »
  showCreate = false;
  creating = false;
  createError = '';
  form = {
    firstName: '', lastName: '', email: '', phone: '',
    password: '', confirm: '', sexe: '', objectif: '',
  };

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
    this.admin.listPatients(this.search).subscribe({
      next: (rows) => { this.patients = rows; this.loading = false; },
      error: (err) => { this.error = err.error?.error ?? 'Erreur'; this.loading = false; }
    });
  }

  onSearch() { this.load(); }

  openCreate() {
    this.createError = '';
    this.form = {
      firstName: '', lastName: '', email: '', phone: '',
      password: '', confirm: '', sexe: '', objectif: '',
    };
    this.showCreate = true;
  }

  closeCreate() {
    if (this.creating) return;
    this.showCreate = false;
  }

  submitCreate() {
    this.createError = '';
    const f = this.form;
    if (!f.firstName || !f.lastName || !f.email || !f.phone || !f.password) {
      this.createError = 'Veuillez compléter tous les champs obligatoires.';
      return;
    }
    if (f.password.length < 8) {
      this.createError = 'Le mot de passe doit contenir au moins 8 caractères.';
      return;
    }
    if (f.password !== f.confirm) {
      this.createError = 'Les mots de passe ne correspondent pas.';
      return;
    }

    this.creating = true;
    this.admin.createPatient({
      prenom: f.firstName.trim(),
      nom: f.lastName.trim(),
      email: f.email.trim().toLowerCase(),
      telephone: f.phone.trim(),
      password: f.password,
      sexe: f.sexe || undefined,
      objectif: f.objectif.trim() || undefined,
    }).subscribe({
      next: () => {
        this.creating = false;
        this.showCreate = false;
        this.load();
      },
      error: (err) => {
        this.creating = false;
        this.createError = err.error?.error ?? 'Une erreur est survenue. Veuillez réessayer.';
      }
    });
  }
}
