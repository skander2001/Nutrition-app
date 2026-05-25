import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-oauth-callback',
  standalone: true,
  template: `
    <div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:'Plus Jakarta Sans',sans-serif;color:#64748b">
      <div style="text-align:center">
        <div style="width:40px;height:40px;border:3px solid #e2e8f0;border-top-color:#4f46e5;border-radius:50%;animation:spin 0.8s linear infinite;margin:0 auto 16px"></div>
        <p>Connexion en cours…</p>
      </div>
      <style>@keyframes spin{to{transform:rotate(360deg)}}</style>
    </div>
  `
})
export class OAuthCallbackComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const token = params['token'];
      if (!token) {
        this.router.navigate(['/login'], { queryParams: { error: 'oauth_failed' } });
        return;
      }
      // Store token temporarily so auth.me() can use it
      this.auth.storeToken(token);
      // Fetch full user data from server
      this.auth.me().subscribe({
        next: (user) => {
          let dest = '/dashboard';
          if (user.role === 'nutritionniste') {
            dest = '/admin';
          } else if (user.profile_complete === false) {
            dest = '/complete-profile';
          }
          this.router.navigate([dest]);
        },
        error: () => {
          this.router.navigate(['/login'], { queryParams: { error: 'oauth_failed' } });
        }
      });
    });
  }
}
