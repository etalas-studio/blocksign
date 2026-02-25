import { Routes } from '@angular/router';
import { SignPageComponent } from './features/sign/pages';

export const routes: Routes = [
  { path: '', redirectTo: '/sign', pathMatch: 'full' },
  { path: 'sign', component: SignPageComponent }
];
