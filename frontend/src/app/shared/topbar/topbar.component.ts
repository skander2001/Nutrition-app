import { Component, Input, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  templateUrl: './topbar.component.html'
})
export class TopbarComponent implements OnInit {
  @Input() userName = '';
  @Input() userRole = 'Patient';
  @Input() initials = '';

  constructor(private auth: AuthService) {}

  ngOnInit() {
    const user = this.auth.currentUser;
    if (user) {
      if (!this.userName) this.userName = `${user.prenom} ${user.nom}`;
      if (!this.initials) this.initials = (user.prenom[0] + user.nom[0]).toUpperCase();
    }
  }
}