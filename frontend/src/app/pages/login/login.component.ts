import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './auth.component.css'
})
export class LoginComponent {
  email = '';
  password = '';
  remember = true;
  loading = false;
  error = '';

  constructor(private router: Router) {}

  submit() {
    this.error = '';
    if (!this.email || !this.password) {
      this.error = 'Veuillez renseigner votre adresse e-mail et votre mot de passe.';
      return;
    }
    this.loading = true;
    setTimeout(() => {
      this.loading = false;
      this.router.navigate(['/dashboard']);
    }, 700);
  }
}
