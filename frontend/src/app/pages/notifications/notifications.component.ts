import { Component, HostBinding, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SidebarComponent } from '../../shared/sidebar/sidebar.component';
import { AdminSidebarComponent } from '../../shared/admin-sidebar/admin-sidebar.component';
import { TopbarComponent } from '../../shared/topbar/topbar.component';
import { AuthService } from '../../services/auth.service';
import { NotificationService, AppNotification } from '../../services/notification.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, SidebarComponent, AdminSidebarComponent, TopbarComponent],
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.css',
})
export class NotificationsComponent implements OnInit, OnDestroy {
  @HostBinding('class.dashboard-host') hostClass = true;

  isNutritionniste = false;
  notifications: AppNotification[] = [];
  unreadCount = 0;
  loading = true;

  constructor(
    private auth: AuthService,
    private notif: NotificationService,
    private router: Router,
  ) {}

  ngOnInit() {
    document.body.classList.add('has-shell');
    this.isNutritionniste = this.auth.currentUser?.role === 'nutritionniste';
    this.load();
  }

  ngOnDestroy() {
    document.body.classList.remove('has-shell');
  }

  load() {
    this.loading = true;
    this.notif.list().subscribe({
      next: (rows) => {
        this.notifications = rows;
        this.unreadCount = rows.filter((n) => !n.lu).length;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  open(n: AppNotification) {
    if (!n.lu) {
      this.notif.markRead(n.id).subscribe(() => {
        n.lu = true;
        this.unreadCount = this.notifications.filter((x) => !x.lu).length;
      });
    }
    if (n.lien) this.router.navigateByUrl(n.lien);
  }

  markAll() {
    this.notif.markAllRead().subscribe(() => {
      this.notifications.forEach((n) => (n.lu = true));
      this.unreadCount = 0;
    });
  }

  formatTime(iso: string | null): string {
    if (!iso) return '';
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60_000);
    if (diffMin < 1) return 'À l\'instant';
    if (diffMin < 60) return `Il y a ${diffMin} min`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `Il y a ${diffH}h`;
    const diffD = Math.floor(diffH / 24);
    if (diffD === 1) return 'Hier';
    if (diffD < 7) return `Il y a ${diffD} jours`;
    const months = ['jan', 'fév', 'mar', 'avr', 'mai', 'jun', 'jul', 'aoû', 'sep', 'oct', 'nov', 'déc'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  }
}
