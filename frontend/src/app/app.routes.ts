import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/landing/landing.component').then(m => m.LandingComponent) },
  { path: 'login', loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent) },
  { path: 'register', loadComponent: () => import('./pages/register/register.component').then(m => m.RegisterComponent) },

  // Protected routes — redirect to /login if not authenticated
  { path: 'dashboard', canActivate: [authGuard], loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent) },
  { path: 'complete-profile', canActivate: [authGuard], loadComponent: () => import('./pages/complete-profile/complete-profile.component').then(m => m.CompleteProfileComponent) },
  { path: 'appointment', canActivate: [authGuard], loadComponent: () => import('./pages/appointment/appointment.component').then(m => m.AppointmentComponent) },
  { path: 'profile', canActivate: [authGuard], loadComponent: () => import('./pages/profile/profile.component').then(m => m.ProfileComponent) },

  { path: '**', redirectTo: '' }
];
