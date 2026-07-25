import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { BulkOrdersShellComponent } from './components/bulk-orders-shell/bulk-orders-shell.component';
import { BulkDashboardComponent } from './components/bulk-dashboard/bulk-dashboard.component';
import { BulkOrderListComponent } from './components/bulk-order-list/bulk-order-list.component';
import { BulkOrderDetailComponent } from './components/bulk-order-detail/bulk-order-detail.component';

const routes: Routes = [
  {
    path: '',
    component: BulkOrdersShellComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: BulkDashboardComponent },
      { path: 'requests', component: BulkOrderListComponent },
      { path: 'requests/:id', component: BulkOrderDetailComponent },
    ],
  },
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
    BulkOrdersShellComponent,
    BulkDashboardComponent,
    BulkOrderListComponent,
    BulkOrderDetailComponent,
  ],
})
export class BulkOrdersDashboardModule {}
