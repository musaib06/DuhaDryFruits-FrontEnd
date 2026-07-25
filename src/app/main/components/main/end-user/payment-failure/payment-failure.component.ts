import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';

@Component({
  selector: 'app-payment-failure',
  templateUrl: './payment-failure.component.html',
  styleUrls: ['./payment-failure.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule]
})
export class PaymentFailureComponent implements OnInit {
  orderId: string | null = null;
  errorMessage: string | null = null;

  constructor(
    private router: Router,
    private meta: Meta,
    private title: Title
  ) {}

  ngOnInit(): void {
    // Get error details from query params or navigation state
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state) {
      this.orderId = navigation.extras.state['orderId'];
      this.errorMessage = navigation.extras.state['errorMessage'];
    } else {
      // Try to get from query params
      const queryParams = new URLSearchParams(window.location.search);
      this.orderId = queryParams.get('order_id');
      this.errorMessage = queryParams.get('error');
    }

    // Update meta tags
    this.title.setTitle('Payment Failed - Duha Dryfruits');
    this.meta.updateTag({ name: 'description', content: 'Your payment could not be processed. Please try again or contact support.' });
  }

  tryAgain(): void {
    // Navigate back to checkout with order details
    if (this.orderId) {
      this.router.navigate(['/checkout'], { state: { orderId: this.orderId } });
    } else {
      this.router.navigate(['/shopping-cart']);
    }
  }

  goToCart(): void {
    this.router.navigate(['/shopping-cart']);
  }

  contactSupport(): void {
    this.router.navigate(['/contact']);
  }
}
