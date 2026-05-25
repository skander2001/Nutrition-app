import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const nutritionnisteGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isLoggedIn) {
    router.navigate(['/login']);
    return false;
  }
  if (auth.currentUser?.role !== 'nutritionniste') {
    router.navigate(['/dashboard']);
    return false;
  }
  return true;
};
