import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: '../login/auth.component.css'
})
export class RegisterComponent {
  firstName = '';
  lastName = '';
  email = '';
  phone = '';
  password = '';
  confirm = '';
  accept = false;
  loading = false;
  error = '';

  constructor(private router: Router) {}

  submit() {
    this.error = '';
    if (!this.firstName || !this.lastName || !this.email || !this.password) {
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
      this.error = 'Vous devez accepter les conditions d\'utilisation.';
      return;
    }
    this.loading = true;
    setTimeout(() => {
      this.loading = false;
      this.router.navigate(['/dashboard']);
    }, 800);
  }
}
