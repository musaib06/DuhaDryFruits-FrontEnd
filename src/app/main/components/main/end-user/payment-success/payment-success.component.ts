import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';

@Component({
  selector: 'app-payment-success',
  templateUrl: './payment-success.component.html',
  styleUrls: ['./payment-success.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule]
})
export class PaymentSuccessComponent implements OnInit {
  orderId: string | null = null;
  amount: number | null = null;

  constructor(
    private router: Router,
    private meta: Meta,
    private title: Title
  ) {}

  ngOnInit(): void {
    // Get order details from query params or local storage
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state) {
      this.orderId = navigation.extras.state['orderId'];
      this.amount = navigation.extras.state['amount'];
    } else {
      // Try to get from query params
      const queryParams = new URLSearchParams(window.location.search);
      this.orderId = queryParams.get('order_id');
      this.amount = queryParams.get('amount') ? parseFloat(queryParams.get('amount')!) : null;
    }

    // Update meta tags
    this.title.setTitle('Payment Successful - Wild Valley Foods');
    this.meta.updateTag({ name: 'description', content: 'Your payment has been successfully processed. Thank you for shopping with Wild Valley Foods!' });
  }

  continueShopping(): void {
    this.router.navigate(['/shop']);
  }

  viewOrders(): void {
    this.router.navigate(['/my-orders']);
  }
}
