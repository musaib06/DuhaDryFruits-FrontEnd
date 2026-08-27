import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { PartnerRevenueShellComponent } from './components/partner-revenue-shell/partner-revenue-shell.component';
import { PartnerDashboardComponent } from './components/partner-dashboard/partner-dashboard.component';
import { PartnerListComponent } from './components/partner-list/partner-list.component';
import { PartnerRevenueComponent } from './components/partner-revenue/partner-revenue.component';
import { PartnerSettlementsComponent } from './components/partner-settlements/partner-settlements.component';
import { PartnerReportsComponent } from './components/partner-reports/partner-reports.component';
import { PartnerPercentageHistoryComponent } from './components/partner-percentage-history/partner-percentage-history.component';

const routes: Routes = [
  {
    path: '',
    component: PartnerRevenueShellComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: PartnerDashboardComponent },
      { path: 'partners', component: PartnerListComponent },
      { path: 'revenue', component: PartnerRevenueComponent },
      { path: 'settlements', component: PartnerSettlementsComponent },
      { path: 'reports', component: PartnerReportsComponent },
      { path: 'percentage-history', component: PartnerPercentageHistoryComponent },
    ],
  },
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild(routes),
    PartnerRevenueShellComponent,
    PartnerDashboardComponent,
    PartnerListComponent,
    PartnerRevenueComponent,
    PartnerSettlementsComponent,
    PartnerReportsComponent,
    PartnerPercentageHistoryComponent,
  ],
})
export class PartnerRevenueDashboardModule {}
