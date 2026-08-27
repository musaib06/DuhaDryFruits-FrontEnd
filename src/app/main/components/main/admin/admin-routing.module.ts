import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminComponentLayoutComponent } from './admin-components-layout/admin-component-layout.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { WebsiteResourcesComponent } from './website-resources/Banner/website-resources.component';
import { AdminCategoryList } from './admin-category-list/admin-category-list';
import { AdminProductList } from './admin-product-list/admin-product-list';
import { ContactUs } from './Contact-Us/contact-us/contact-us';
import { ReviewList } from './Review/review-list/review-list';
import { TestimonialList } from './website-resources/Testimonial/testimonial-list/testimonial-list';
import { VideoList } from './website-resources/video/video-list/video-list';
import { AuthGuard } from '../../../../guard/auth.guard';
import { AdminUnitList } from './admin-unit-list/admin-unit-list';
import { InvoiceListComponent } from './invoice/invoice-list/invoice-list.component';
import { InvoiceDetailComponent } from './invoice/invoice-detail/invoice-detail.component';
import { OrderListComponent } from './order/order-list/order-list.component';
import { OrderDetailComponent } from './order/order-detail/order-detail.component';
import { CustomerListComponent } from './customer/customer-list/customer-list.component';
import { BlogAdminComponent } from './blog/blog-list/blog-admin.component';
import { BlogEditorComponent } from './blog/blog-editor/blog-editor.component';

const routes: Routes = [
  {
    path: '',
    component: AdminComponentLayoutComponent,
    canActivateChild: [AuthGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'website-resources', component: WebsiteResourcesComponent },
      { path: 'category-list', component: AdminCategoryList },
      { path: 'product-list', component: AdminProductList },
      { path: 'contact-us', component: ContactUs },
      { path: 'review-list', component: ReviewList },
      { path: 'testimonial-list', component: TestimonialList },
      { path: 'videos', component: VideoList },
      { path: 'unit-list', component: AdminUnitList },
      { path: 'invoice', component: InvoiceListComponent },
      { path: 'invoice/:invoiceNumber', component: InvoiceDetailComponent },
      { path: 'invoice/order/:orderId', component: InvoiceDetailComponent },
      { path: 'order', component: OrderListComponent },
      { path: 'order/:id', component: OrderDetailComponent },
      { path: 'customer', component: CustomerListComponent },
      { path: 'blog', component: BlogAdminComponent },
      { path: 'blog/create', component: BlogEditorComponent },
      { path: 'blog/edit/:id', component: BlogEditorComponent },
      // Notification Module Routes
      {
        path: 'notifications',
        loadChildren: () => import('../../../../admin/notification-dashboard/notification-dashboard.module')
          .then(m => m.NotificationDashboardModule)
      },
      {
        path: 'bulk-orders',
        loadChildren: () => import('../../../../admin/bulk-orders-dashboard/bulk-orders-dashboard.module')
          .then(m => m.BulkOrdersDashboardModule)
      },
      {
        path: 'partner-revenue',
        loadChildren: () => import('../../../../admin/partner-revenue-dashboard/partner-revenue-dashboard.module')
          .then(m => m.PartnerRevenueDashboardModule)
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule {}
