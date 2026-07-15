import { Component, inject } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { StorageService } from '../../../../../services/storage.service';

@Component({
  selector: 'app-auth-layout',
  imports: [RouterModule],
  templateUrl: './admin-component-layout.component.html',
  styleUrls: ['./admin-component-layout.component.scss']

})
export class AdminComponentLayoutComponent {
 isSidebarOpen = false;
 private router = inject(Router);
 private storageService = inject(StorageService);

 logout(): void {
   // Clear all auth tokens and user data
   this.storageService.clearStorage();
   // Redirect to login page
   this.router.navigate(['/login']);
 }
}
