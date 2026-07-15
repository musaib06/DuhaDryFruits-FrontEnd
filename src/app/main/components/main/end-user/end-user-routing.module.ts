// src/app/auth/auth-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Home } from './home/home';
import { EndUserLayout } from './end-user-layout/end-user-layout';
import { SingleProduct } from './single-product/single-product';
import { Shop } from './shop/shop';
import { CartComponent } from './cart/cart';
import { Checkout } from './checkout/checkout';
import { WishlistComponent } from './wishlist/wishlist';
import { MyOrders } from './my-orders/my-orders';
import { ContactUs } from './contact-us/contact-us';
import { AboutUs } from './static-pages/about-us/about-us';
import { PrivacyPolicy } from './static-pages/privacy-policy/privacy-policy';
import { TermsAndConditions } from './static-pages/terms-and-conditions/terms-and-conditions';
import { RefundAndReturnPolicy } from './static-pages/refund-and-return-policy/refund-and-return-policy';
import { HealthConcerns } from './health-concerns/health-concerns';
import { BlogListComponent } from './blog/blog-list/blog-list';
import { BlogDetailComponent } from './blog/blog-detail/blog-detail';
import { PaymentSuccessComponent } from './payment-success/payment-success.component';
import { PaymentFailureComponent } from './payment-failure/payment-failure.component';
const routes: Routes = [
  {
    path: '',
    component: EndUserLayout,
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      { path: 'home', component: Home },
      {
        path: 'product/:slug',
        component: SingleProduct,
      },
      {
        path: 'shop/:categoryName/:categoryId',
        component: Shop,
      },
      { path: 'shop', component: Shop },
      { path: 'cart', component: CartComponent },
      { path: 'checkout', component: Checkout },
      { path: 'wishlist', component: WishlistComponent },
      { path: 'my-orders',component: MyOrders,},
      {path:'contact-us',component:ContactUs},
      {path:'health-concerns',component:HealthConcerns},
      {path:'about-us',component:AboutUs},
      {path:'privacy-policy',component:PrivacyPolicy},
      {path:'terms-and-conditions',component:TermsAndConditions},
      {path:'refund-and-return-policy',component:RefundAndReturnPolicy},
      { path: 'blog', component: BlogListComponent },
      { path: 'blog/:slug', component: BlogDetailComponent },
      { path: 'payment/success', component: PaymentSuccessComponent },
      { path: 'payment/failure', component: PaymentFailureComponent }
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EndUserRoutingModule {}
