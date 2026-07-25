// src/app/main/components/main/end-user/end-user-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Home } from './home/home';
import { EndUserLayout } from './end-user-layout/end-user-layout';
import { SingleProduct } from './single-product/single-product';
import { Shop } from './shop/shop';
import { CartComponent } from './cart/cart';
import { Checkout } from './checkout/checkout';
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
import { BulkOrders } from './bulk-orders/bulk-orders';
import { MyBulkOrders } from './my-bulk-orders/my-bulk-orders';
import { EndUserPaths } from './end-user.paths';

const routes: Routes = [
  {
    path: '',
    component: EndUserLayout,
    children: [
      // ——— Primary SEO routes ———
      { path: '', component: Home },
      { path: EndUserPaths.product + '/:slug', component: SingleProduct },
      {
        path: EndUserPaths.shop + '/:categoryName/:categoryId',
        component: Shop,
      },
      { path: EndUserPaths.shop, component: Shop },
      { path: EndUserPaths.cart, component: CartComponent },
      { path: EndUserPaths.checkout, component: Checkout },
      {
        path: EndUserPaths.wishlist,
        loadComponent: () =>
          import('./wishlist/wishlist').then((m) => m.WishlistComponent),
      },
      { path: EndUserPaths.orders, component: MyOrders },
      { path: EndUserPaths.contact, component: ContactUs },
      { path: EndUserPaths.health, component: HealthConcerns },
      { path: EndUserPaths.about, component: AboutUs },
      { path: EndUserPaths.privacy, component: PrivacyPolicy },
      { path: EndUserPaths.terms, component: TermsAndConditions },
      { path: EndUserPaths.returns, component: RefundAndReturnPolicy },
      { path: EndUserPaths.journal, component: BlogListComponent },
      { path: EndUserPaths.journal + '/:slug', component: BlogDetailComponent },
      { path: EndUserPaths.paymentSuccess, component: PaymentSuccessComponent },
      { path: EndUserPaths.paymentFailure, component: PaymentFailureComponent },
      { path: EndUserPaths.wholesale, component: BulkOrders },
      { path: EndUserPaths.myWholesale, component: MyBulkOrders },

      // ——— Legacy redirects (preserve old indexed / bookmarked URLs) ———
      { path: 'home', redirectTo: '', pathMatch: 'full' },
      { path: 'shop/:categoryName/:categoryId', redirectTo: EndUserPaths.shop + '/:categoryName/:categoryId' },
      { path: 'shop', redirectTo: EndUserPaths.shop, pathMatch: 'full' },
      { path: 'product/:slug', redirectTo: EndUserPaths.product + '/:slug' },
      { path: 'cart', redirectTo: EndUserPaths.cart, pathMatch: 'full' },
      { path: 'wishlist', redirectTo: EndUserPaths.wishlist, pathMatch: 'full' },
      { path: 'my-orders', redirectTo: EndUserPaths.orders, pathMatch: 'full' },
      { path: 'contact-us', redirectTo: EndUserPaths.contact, pathMatch: 'full' },
      { path: 'health-concerns', redirectTo: EndUserPaths.health, pathMatch: 'full' },
      { path: 'about-us', redirectTo: EndUserPaths.about, pathMatch: 'full' },
      { path: 'refund-and-return-policy', redirectTo: EndUserPaths.returns, pathMatch: 'full' },
      { path: 'blog/:slug', redirectTo: EndUserPaths.journal + '/:slug' },
      { path: 'blog', redirectTo: EndUserPaths.journal, pathMatch: 'full' },
      { path: 'bulk-orders', redirectTo: EndUserPaths.wholesale, pathMatch: 'full' },
      { path: 'my-bulk-orders', redirectTo: EndUserPaths.myWholesale, pathMatch: 'full' },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EndUserRoutingModule {}
