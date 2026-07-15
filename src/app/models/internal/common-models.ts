import { DBSchema } from 'idb';
import { RoleTypeSM } from '../service-models/app/enums/role-type-s-m.enum';

export interface LoaderInfo {
  message: string;
  showLoader: boolean;
}

// export interface ConfirmModalInfo {
//   title: string;
//   subTitle: string;
//   message: string;
//   showModal: boolean;
// }
export interface IndexedDBStorage extends DBSchema {
  majorData: {
    key: string;
    value: string;
  };
  tempData: {
    key: string;
    value: string;
  };
}

export interface LayoutViewModel {
  leftMenuClass: string;
  rightMenuClass: string;
  showRightMenu: boolean;
  showLeftMenu: boolean;
  showNav: boolean;
  userLoggedIn: boolean;
  loggedInUserType: RoleTypeSM;
}
export class layoutVM {
  tokenRole: RoleTypeSM = RoleTypeSM.Unknown;
  showNavigation: boolean = true;
  showDefaultClass: boolean = true;
  showCustomSettings: boolean = true;
  topNavExpand = 'header';
  sideNavExpand: boolean = true;
  displayAreaExpand = 'container-fluid';
  displayLoginArea = 'display-login-area';
  showSideAndTopNav: boolean = true;
  sideMenuItems: {
    itemRoute: string;
    permission: boolean;
    iconName: string;
    itemName: string;
    subItems?: {
      itemRoute: string;
      permission: boolean;
      iconName: string;
      itemName: string;
    }[];
    showSubItems?: boolean;
  }[] = [
    {
      itemRoute: 'dashboard',
      permission: true,
      iconName: 'bi bi-house',
      itemName: 'Dashboard',
    },
    {
      itemRoute: 'farms',
      permission: true,
      iconName: 'bi bi-stack',
      itemName: 'Farms',
    },
    {
      itemRoute: '',
      permission: true,
      iconName: 'bi bi-file-earmark-person ',
      itemName: 'Reports',
      subItems: [
        {
          itemRoute: 'report/crops',
          permission: true,
          iconName: 'bi bi-caret-right ',
          itemName: 'Crop Reports',
        },
        {
          itemRoute: 'report/farms',
          permission: true,
          iconName: 'bi bi-caret-right ',
          itemName: 'Farm Reports',
        },
      ],
    },
    {
      itemRoute: 'settings',
      permission: true,
      iconName: 'bi bi-gear',
      itemName: 'Settings',
    },
  ];
}

export interface MenuItem {
  routePath: string;
  routeName: string;
  isActive: boolean;
  iconName: boolean;
}

export interface InputControlInformation {
  controlName: string;
  hasError: boolean;
  placeHolder: string;
  errorMessage: string;
  isRequired: boolean;
  pattern?: string;
  maxlength?: number;
  minlength?: number;
  validations: ValidationMessageInformation[];
}

export interface ValidationMessageInformation {
  type: string;
  message: string;
}
