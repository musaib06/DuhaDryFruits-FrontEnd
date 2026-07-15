// src/app/auth/auth.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { RouterModule } from '@angular/router';
import {  EndUserRoutingModule } from './end-user-routing.module';
import { Home } from './home/home';
import { EndUserLayout } from './end-user-layout/end-user-layout';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    EndUserRoutingModule,
    RouterModule,
    Home,
    EndUserLayout
  ],
  exports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    EndUserRoutingModule,
    Home,
    EndUserLayout
  
  ]
})
export class EndUserModule {}
