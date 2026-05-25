import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrl: '../login/auth.component.css'
})
export class ForgotPasswordComponent {
  email   = '';
  loading = false;
  error   = '';
  success = false;

  constructor(private auth: AuthService) {}

  submit() {
    this.error = '';
    if (!this.email.trim()) {
      this.error = 'Veuillez saisir votre adresse e-mail.';
      return;
    }
    this.loading = true;
    this.auth.forgotPassword(this.email.trim().toLowerCase()).subscribe({
      next: () => {
        this.loading = false;
        this.success = true;
      },
      error: () => {
        this.loading = false;
        this.success = true; // Show success even on error to avoid email enumeration
      }
    });
  }
}
