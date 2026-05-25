import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { nutritionnisteGuard } from './guards/nutritionniste.guard';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/landing/landing.component').then(m => m.LandingComponent) },
  { path: 'login', loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent) },
  { path: 'register', loadComponent: () => import('./pages/register/register.component').then(m => m.RegisterComponent) },
  { path: 'forgot-password', loadComponent: () => import('./pages/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent) },
  { path: 'reset-password', loadComponent: () => import('./pages/reset-password/reset-password.component').then(m => m.ResetPasswordComponent) },
  { path: 'oauth-callback', loadComponent: () => import('./pages/oauth-callback/oauth-callback.component').then(m => m.OAuthCallbackComponent) },

  // Patient-protected routes
  { path: 'dashboard', canActivate: [authGuard], loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent) },
  { path: 'complete-profile', canActivate: [authGuard], loadComponent: () => import('./pages/complete-profile/complete-profile.component').then(m => m.CompleteProfileComponent) },
  { path: 'appointment', canActivate: [authGuard], loadComponent: () => import('./pages/appointment/appointment.component').then(m => m.AppointmentComponent) },
  { path: 'suivi', canActivate: [authGuard], loadComponent: () => import('./pages/suivi/suivi.component').then(m => m.SuiviComponent) },
  { path: 'profile', canActivate: [authGuard], loadComponent: () => import('./pages/profile/profile.component').then(m => m.ProfileComponent) },
  { path: 'notifications', canActivate: [authGuard], loadComponent: () => import('./pages/notifications/notifications.component').then(m => m.NotificationsComponent) },
  { path: 'plan', canActivate: [authGuard], loadComponent: () => import('./pages/meal-plan/meal-plan.component').then(m => m.MealPlanComponent) },

  // Admin (nutritionniste) routes
  { path: 'admin', canActivate: [nutritionnisteGuard], loadComponent: () => import('./pages/admin/dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent) },
  { path: 'admin/patients', canActivate: [nutritionnisteGuard], loadComponent: () => import('./pages/admin/patients/admin-patients.component').then(m => m.AdminPatientsComponent) },
  { path: 'admin/patients/:id', canActivate: [nutritionnisteGuard], loadComponent: () => import('./pages/admin/patient-detail/admin-patient-detail.component').then(m => m.AdminPatientDetailComponent) },
  { path: 'admin/rendez-vous', canActivate: [nutritionnisteGuard], loadComponent: () => import('./pages/admin/rendez-vous/admin-rdv.component').then(m => m.AdminRdvComponent) },
  { path: 'admin/consultations', canActivate: [nutritionnisteGuard], loadComponent: () => import('./pages/admin/consultations/admin-consultations.component').then(m => m.AdminConsultationsComponent) },
  { path: 'admin/disponibilites', canActivate: [nutritionnisteGuard], loadComponent: () => import('./pages/admin/disponibilites/admin-disponibilites.component').then(m => m.AdminDisponibilitesComponent) },
  { path: 'admin/plans', canActivate: [nutritionnisteGuard], loadComponent: () => import('./pages/admin/plans/admin-plans.component').then(m => m.AdminPlansComponent) },

  { path: '**', redirectTo: '' }
];
