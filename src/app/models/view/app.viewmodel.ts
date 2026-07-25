import { BaseViewModel } from "../internal/base.viewmodel";

export class AppViewModel extends BaseViewModel {
    title = 'DuhaDryFruits';
    routerSubscription: any;
    location: any;
  
    // isSidebarToggled
    isSidebarToggled = false;
  
    // isToggled
    isToggled = false;
}