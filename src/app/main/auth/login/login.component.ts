import { Component, OnInit } from '@angular/core';

import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { BaseComponent } from '../../../base.component';
import { AuthViewModel } from '../../../models/view/auth-viewModels/auth.viewmodel';
import { AccountService } from '../../../services/account.service';
import { CommonService } from '../../../services/common.service';
import { LogHandlerService } from '../../../services/log-handler.service';
import { Router, RouterModule } from '@angular/router';


@Component({
  selector: 'app-login',
  imports: [RouterModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent extends BaseComponent <AuthViewModel> implements OnInit {
  
  logHandler: LogHandlerService;

  constructor(logHandler:LogHandlerService,commonService:CommonService,private accountService:AccountService,private fb: FormBuilder,private router:Router) {
    super( commonService, logHandler);
    this.logHandler = logHandler;
    this.viewModel = new AuthViewModel();
  }


  ngOnInit(): void {
     this.viewModel.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
      role: ['Admin',]
    });
  }

  redirectToSignUp() {
    this.router.navigate(['/admin/sign-up']);
  }
  redirctToForgotPassword() {
    this.router.navigate(['/admin/forgot-password']);  
  }
   async onSubmit() {
    try {
      this._commonService.presentLoading();
   if (this.viewModel.loginForm.valid) {
      this.viewModel.loginObj = this.viewModel.loginForm.value
    }
      let resp= await  this.accountService.generateToken(this.viewModel.loginObj,this.viewModel.rememberMe);
        if (resp.isError) {
        await this.logHandler.logObject(resp.errorData);
        this._commonService.showSweetAlertToast({
          title: 'Error',
          text: resp.errorData.displayMessage,
          icon: 'error',
          confirmButtonText: 'OK',
        })}
         else {
          this.router.navigate(['/admin/dashboard']);
          this._commonService.showSweetAlertToast({
            title: 'Success',
            text: 'Login successful',
            icon: 'success',
            confirmButtonText: 'OK',
          });           
        // Optionally, redirect or perform other actions after successful registration
      }
      
    } catch (error) {
      
    }
    
  }

}
