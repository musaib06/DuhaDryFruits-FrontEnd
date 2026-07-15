import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-service-banner',
  imports: [CommonModule, FormsModule],
  templateUrl: './service-banner.html',
  styleUrl: './service-banner.scss',
  standalone: true,
})
export class ServiceBanner {
  features = [
    {
      icon: 'bi bi-truck',
      title: 'Shipping',
      desc: 'Shipping World Wide',
    },
    {
      icon: 'bi bi-clock-history',
      title: '24 X 7 Service',
      desc: 'Online Service For 24 X 7',
    },
    {
      icon: 'bi bi-credit-card',
      title: 'Online Pay',
      desc: 'Online Payment Available',
    },
  ];
}
