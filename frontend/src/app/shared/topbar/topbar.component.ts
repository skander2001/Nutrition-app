import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-topbar',
  standalone: true,
  templateUrl: './topbar.component.html'
})
export class TopbarComponent {
  @Input() userName = 'Bechir Kanzari';
  @Input() userRole = 'Patient';
  @Input() initials = 'BK';
}