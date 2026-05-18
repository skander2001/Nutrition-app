import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: '../login/auth.component.css'
})
export class RegisterComponent {
  firstName = '';
  lastName  = '';
  email     = '';
  phone     = '';
  password  = '';
  confirm   = '';
  accept    = false;
  loading   = false;
  error     = '';

  constructor(private router: Router, private auth: AuthService) {}

  submit() {
    this.error = '';
    if (!this.firstName || !this.lastName || !this.email || !this.phone || !this.password) {
      this.error = 'Veuillez compléter tous les champs obligatoires.';
      return;
    }
    if (this.password.length < 8) {
      this.error = 'Votre mot de passe doit contenir au moins 8 caractères.';
      return;
    }
    if (this.password !== this.confirm) {
      this.error = 'Les mots de passe ne correspondent pas.';
      return;
    }
    if (!this.accept) {
      this.error = "Vous devez accepter les conditions d'utilisation.";
      return;
    }

    this.loading = true;
    this.auth.register({
      prenom: this.firstName.trim(),
      nom: this.lastName.trim(),
      email: this.email.trim().toLowerCase(),
      telephone: this.phone.trim(),
      password: this.password,
    }).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/complete-profile']);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.error ?? 'Une erreur est survenue. Veuillez réessayer.';
      }
    });
  }

  loginWithGoogle() {
    window.location.href = 'http://localhost:5000/api/auth/google';
  }
}
