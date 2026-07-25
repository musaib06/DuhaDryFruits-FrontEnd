import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-service-banner',
  imports: [CommonModule],
  templateUrl: './service-banner.html',
  styleUrl: './service-banner.scss',
  standalone: true,
})
export class ServiceBanner {
  features = [
    {
      icon: 'ri-leaf-line',
      title: 'Farm Fresh Picks',
      desc: 'Hand-sorted dry fruits packed at peak flavour.',
    },
    {
      icon: 'ri-truck-line',
      title: 'Pan-India Delivery',
      desc: 'Sealed packs shipped fast to your doorstep.',
    },
    {
      icon: 'ri-shield-check-line',
      title: 'Secure Checkout',
      desc: 'Encrypted payments with trusted gateways.',
    },
    {
      icon: 'ri-gift-2-line',
      title: 'Gifting Ready',
      desc: 'Hampers & bulk boxes for every celebration.',
    },
  ];
}
