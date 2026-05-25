import { Component, Input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

export type AdminSidebarKey =
  | 'dashboard'
  | 'patients'
  | 'rendez-vous'
  | 'consultations'
  | 'disponibilites'
  | 'plans'
  | 'notifications';

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './admin-sidebar.component.html'
})
export class AdminSidebarComponent {
  @Input() active: AdminSidebarKey = 'dashboard';

  constructor(private auth: AuthService, private router: Router) {}

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
