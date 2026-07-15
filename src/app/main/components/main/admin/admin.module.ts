// src/app/auth/auth.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TopNavComponent } from '../../internal/Admin/top-nav/top-nav.component';
import { SideNavComponent } from '../../internal/Admin/side-nav/side-nav.component';
import { AdminRoutingModule } from './admin-routing.module';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    AdminRoutingModule,
    RouterModule,
    TopNavComponent,
    SideNavComponent
  ],
  exports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    AdminRoutingModule,
    RouterModule,
    TopNavComponent,
    SideNavComponent
  ]
})
export class AdminModule {}
