import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-complete-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './complete-profile.component.html',
  styleUrls: ['../login/auth.component.css', './complete-profile.component.css']
})
export class CompleteProfileComponent implements OnInit {
  sexe             = '';
  adresse          = '';
  allergie         = '';
  maladie_chronique = '';
  objectif         = '';

  loading = false;
  error   = '';

  userName = '';

  objectifs = [
    { value: 'perte_de_poids',  label: 'Perte de poids',     icon: '⚖️' },
    { value: 'prise_de_masse',  label: 'Prise de masse',     icon: '💪' },
    { value: 'maintien',        label: 'Maintien du poids',  icon: '🎯' },
    { value: 'equilibre',       label: 'Alimentation saine', icon: '🥗' },
    { value: 'sport',           label: 'Nutrition sportive', icon: '🏃' },
    { value: 'medical',         label: 'Objectif médical',   icon: '🩺' },
  ];

  constructor(private router: Router, private auth: AuthService) {}

  ngOnInit() {
    if (!this.auth.isLoggedIn) {
      this.router.navigate(['/register']);
      return;
    }
    const u = this.auth.currentUser;
    if (u) this.userName = u.prenom;
  }

  skip() {
    this.router.navigate(['/dashboard']);
  }

  submit() {
    this.error = '';
    if (!this.sexe || !this.adresse || !this.objectif) {
      this.error = 'Veuillez renseigner au moins le sexe, l\'adresse et l\'objectif.';
      return;
    }
    this.loading = true;
    this.auth.completeProfile({
      sexe: this.sexe,
      adresse: this.adresse.trim(),
      allergie: this.allergie.trim(),
      maladie_chronique: this.maladie_chronique.trim(),
      objectif: this.objectif.trim(),
    }).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.error ?? 'Une erreur est survenue.';
      }
    });
  }
}
