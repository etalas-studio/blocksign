import { Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';
import { DashboardComponent } from './features/dashboard/pages/dashboard-page/dashboard-page.component';
import { SignPageComponent } from './features/sign/pages/sign-page/sign-page.component';
import { VerifyPageComponent } from './features/verify/pages/verify-page/verify-page.component';
import { AuditPageComponent } from './features/audit/pages/audit-page/audit-page.component';
import { BlockchainPageComponent } from './features/blockchain/pages/blockchain-page/blockchain-page.component';
import { SettingsPageComponent } from './features/settings/pages/settings-page/settings-page.component';
import { DocumentDetailsPageComponent } from './features/documents/pages/document-details-page/document-details-page.component';

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'sign', component: SignPageComponent },
      { path: 'upload', component: SignPageComponent },
      { path: 'documents', component: DashboardComponent },
      { path: 'documents/:hash', component: DocumentDetailsPageComponent },
      { path: 'signatures', component: DashboardComponent },
      { path: 'verify', component: VerifyPageComponent },
      { path: 'verify/:hash', component: VerifyPageComponent },
      { path: 'blockchain', component: BlockchainPageComponent },
      { path: 'contracts', component: DashboardComponent },
      { path: 'audit', component: AuditPageComponent },
      { path: 'wallets', component: DashboardComponent },
      { path: 'identity', component: DashboardComponent },
      { path: 'reports', component: DashboardComponent },
      { path: 'settings', component: SettingsPageComponent },
      { path: 'help', component: DashboardComponent },
      { path: 'api-keys', component: DashboardComponent },
      { path: 'profile', component: DashboardComponent }
    ]
  }
];
