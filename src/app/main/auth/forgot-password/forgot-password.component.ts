import { Component } from '@angular/core';
import { BaseComponent } from '../../../base.component';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ForgotViewModel } from '../../../models/view/auth-viewModels/forgot.viewmodel';
import { CommonService } from '../../../services/common.service';
import { LogHandlerService } from '../../../services/log-handler.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-forgot-password',
  imports: [FormsModule,CommonModule,ReactiveFormsModule],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss'
})
export class ForgotPasswordComponent extends BaseComponent<ForgotViewModel> {
  constructor(commonService: CommonService, logHandler: LogHandlerService,private fb: FormBuilder) {
    super(commonService, logHandler);
    this.viewModel = new ForgotViewModel();
  }

  ngOnInit(): void {
    this.viewModel.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit() {
    if (this.viewModel.forgotForm.valid) {
      console.log(this.viewModel.forgotForm.value);
      // forgot password logic
    }
  }

}
