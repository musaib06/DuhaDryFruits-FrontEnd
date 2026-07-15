import { Component, OnInit } from '@angular/core';
import { AuthViewModel } from '../../../models/view/auth-viewModels/auth.viewmodel';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { LogHandlerService } from '../../../services/log-handler.service';
import { CommonService } from '../../../services/common.service';
import { BaseComponent } from '../../../base.component';
import { CommonModule } from '@angular/common';
import { AccountService } from '../../../services/account.service';
import { signUpViewModel } from '../../../models/view/auth-viewModels/sign-up.viewmodel';
import { Router } from '@angular/router';

@Component({
  selector: 'app-sign-up',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './sign-up.component.html',
  styleUrl: './sign-up.component.scss',
})
export class SignUpComponent
  extends BaseComponent<signUpViewModel>
  implements OnInit
{
  logHandler: LogHandlerService;

  constructor(
    commonService: CommonService,
    logService: LogHandlerService,
    private fb: FormBuilder,
    private accountService: AccountService,
    private roouter :Router
  ) {
    super(commonService, logService);
    this.logHandler = logService;
    this.viewModel = new signUpViewModel();
  }

  ngOnInit(): void {
    this.viewModel.signupForm = this.fb.group({
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      confirmPassword: ['', Validators.required],
      role: ['', Validators.required],
    });
  }

  togglePassword(field: 'password' | 'confirm') {
    if (field === 'password') {
      this.viewModel.showPassword = !this.viewModel.showPassword;
    } else {
      this.viewModel.showConfirmPassword = !this.viewModel.showConfirmPassword;
    }
  }

  async onSubmit() {
    try {
      this._commonService.presentLoading();
      if (this.viewModel.signupForm.valid) {
        this.viewModel.userSM = this.viewModel.signupForm.value;
      let resp = await this.accountService.RegisterNewUser(
        this.viewModel.userSM
      );
      if (resp.isError) {
        await this.logHandler.logObject(resp.errorData);
        this._commonService.showSweetAlertToast({
          title: 'Error',
          text: resp.errorData.displayMessage,
          icon: 'error',
          confirmButtonText: 'OK',
        });
      } else {
        console.log('User registered successfully:', resp.successData);
        this.roouter.navigate(['/admin/login']);
        this._commonService.showSweetAlertToast({
          title: 'Success',
          text: 'User registered successfully',
          icon: 'success',
          confirmButtonText: 'OK',
        });
      }
 }
    } catch (error) {
      throw error;
    }
    finally {
      this._commonService.dismissLoader();
    }
  }

  redirectToLogin() {
    this.roouter.navigate(['/auth/login']);
  }
}
