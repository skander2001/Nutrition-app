import { Component, Input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

export type SidebarKey = 'dashboard' | 'appointment' | 'records' | 'messages' | 'plan' | 'tracking' | 'billing' | 'profile';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html'
})
export class SidebarComponent {
  @Input() active: SidebarKey = 'dashboard';
}
