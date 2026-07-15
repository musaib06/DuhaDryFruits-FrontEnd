import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { AdminNotificationService, CampaignRequest } from '../../services/admin-notification.service';

@Component({
  selector: 'app-campaign-form',
  templateUrl: './campaign-form.component.html',
  styleUrls: ['./campaign-form.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule]
})
export class CampaignFormComponent implements OnInit {
  campaignForm: FormGroup;
  isLoading = false;
  isSaving = false;
  isEditMode = false;
  campaignId: number | null = null;

  // Segment options
  segmentOptions = [
    { value: 'all_customers', label: 'All Customers' },
    { value: 'new_customers', label: 'New Customers' },
    { value: 'repeat_customers', label: 'Repeat Customers' },
    { value: 'active_customers', label: 'Active Customers' },
    { value: 'inactive_customers', label: 'Inactive Customers' },
    { value: 'high_value_customers', label: 'High Value Customers' },
    { value: 'cart_abandoners', label: 'Cart Abandoners' },
    { value: 'recent_buyers', label: 'Recent Buyers' }
  ];

  constructor(
    private fb: FormBuilder,
    private adminService: AdminNotificationService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.campaignForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      // Push is the only supported channel (FCM).
      type: ['push', Validators.required],
      content: this.fb.group({
        title: ['', [Validators.required, Validators.maxLength(100)]],
        body: ['', [Validators.required, Validators.maxLength(240)]],
        mediaUrl: [''],
        buttonText: [''],
        buttonUrl: ['']
      }),
      segment: this.fb.group({
        type: ['all_customers', Validators.required]
      }),
      scheduledAt: [null],
      scheduleLater: [false]
    });
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.campaignId = parseInt(params['id']);
        this.loadCampaign(this.campaignId);
      }
    });
  }

  loadCampaign(id: number): void {
    this.isLoading = true;
    this.adminService.getCampaign(id).subscribe({
      next: (response) => {
        const campaign = response.data.campaign;
        this.campaignForm.patchValue({
          name: campaign.name,
          description: campaign.description,
          type: 'push',
          content: campaign.content,
          segment: campaign.segment
        });
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading campaign:', error);
        this.isLoading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.campaignForm.invalid) {
      this.markFormGroupTouched(this.campaignForm);
      return;
    }

    this.isSaving = true;

    const formValue = this.campaignForm.value;

    const campaign: CampaignRequest = {
      name: formValue.name,
      description: formValue.description,
      type: 'push',
      content: formValue.content,
      segment: formValue.segment,
      scheduledAt: formValue.scheduleLater ? formValue.scheduledAt : undefined
    };

    if (this.isEditMode && this.campaignId) {
      this.adminService.updateCampaign(this.campaignId, campaign).subscribe({
        next: () => {
          this.router.navigate(['/admin/notifications/campaigns']);
        },
        error: (error) => {
          console.error('Error updating campaign:', error);
          alert('Failed to update campaign: ' + error.error?.error);
          this.isSaving = false;
        }
      });
    } else {
      this.adminService.createCampaign(campaign).subscribe({
        next: () => {
          this.router.navigate(['/admin/notifications/campaigns']);
        },
        error: (error) => {
          console.error('Error creating campaign:', error);
          alert('Failed to create campaign: ' + error.error?.error);
          this.isSaving = false;
        }
      });
    }
  }

  onCancel(): void {
    this.router.navigate(['/admin/notifications/campaigns']);
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }
}
