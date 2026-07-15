import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { JwtHelperService } from '@auth0/angular-jwt';
import { StorageService } from '../services/storage.service';
import { AccountService } from '../services/account.service';
import { CommonService } from '../services/common.service';
// import { decode } from 'jwt-decode';

import { RoleTypeSM } from '../models/service-models/app/enums/role-type-s-m.enum';
import { jwtDecode } from 'jwt-decode';
import { AppConstants } from '../../app-constants';
const jwtHelper = new JwtHelperService();

@Injectable({
  providedIn: 'root'
})
export class AuthGuard {

  constructor(
    private storageService: StorageService,
    private accountService: AccountService,
    public router: Router,
    private commonService: CommonService) {

  }
  async canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Promise<boolean> {
    if (!await this.IsTokenValid()) {
      await this.router.navigate([AppConstants.WebRoutes.LOGIN]);
      await this.accountService.logoutUser();
      return false;
    }
    const expectedRole = route.data['allowedRole'];
    let isValidRole = false;
    for (let index = 0; index < expectedRole.length; index++) {
      if (!isValidRole)
        isValidRole = await this.IsRoleValidForRoute(expectedRole[index]);
    }
    if (isValidRole)
      return true;
    else {
      // this.commonService.layoutViewModel.showOrganisationLoginMenu = false;
      this.router.navigate([AppConstants.WebRoutes.HOME]);
      return false;
    }
  }

  async canActivateChild(
    childRoute: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Promise<boolean> {
    const token: string = await this.storageService.getDataFromAnyStorage(AppConstants.DbKeys.ACCESS_TOKEN);
    return !jwtHelper.isTokenExpired(token);
  }

  async IsTokenValid(): Promise<boolean> {
    const token: string = await this.accountService.getTokenFromStorage();
    return token != null && token != "" && !jwtHelper.isTokenExpired(token);
  }

  async IsRoleValidForRoute(expectedRole: any): Promise<boolean> {
    let tokenRole = await this.GetRoleFromToken();

    if (tokenRole === expectedRole) return true;
    return false;
  }

  async GetRoleFromToken(): Promise<RoleTypeSM> {
    let resp: any = RoleTypeSM.Unknown;
    const token: string = await this.accountService.getTokenFromStorage();
    const tokenPayload: any = jwtDecode(token);
    resp = RoleTypeSM[tokenPayload[AppConstants.Token_Info_Keys.Role]];
    this.commonService.layoutVM.tokenRole = resp;
    return resp;
  }

}
