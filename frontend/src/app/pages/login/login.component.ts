import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './auth.component.css'
})
export class LoginComponent implements OnInit {
  email    = '';
  password = '';
  remember = true;
  loading  = false;
  error    = '';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private auth: AuthService
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['error']) {
        this.error = 'La connexion avec Google a échoué. Veuillez réessayer.';
      }
    });
  }

  submit() {
    this.error = '';
    if (!this.email || !this.password) {
      this.error = 'Veuillez renseigner votre adresse e-mail et votre mot de passe.';
      return;
    }
    this.loading = true;
    this.auth.login({ email: this.email.trim().toLowerCase(), password: this.password })
      .subscribe({
        next: (user) => {
          this.loading = false;
          let dest = '/dashboard';
          if (user.role === 'nutritionniste') {
            dest = '/admin';
          } else if (user.profile_complete === false) {
            dest = '/complete-profile';
          }
          this.router.navigate([dest]);
        },
        error: (err) => {
          this.loading = false;
          this.error = err.error?.error ?? 'Email ou mot de passe incorrect.';
        }
      });
  }

  loginWithGoogle() {
    window.location.href = 'http://localhost:5000/api/auth/google';
  }
}
