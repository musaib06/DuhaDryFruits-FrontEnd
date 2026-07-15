import { WildValleyFoodsServiceModelBase } from '../../../base/WildValleyFoods-service-model-base';
import { RoleTypeSM } from '../../../enums/role-type-s-m.enum';
import { LoginStatusSM } from '../../../enums/login-status-s-m.enum';

export class LoginUserSM extends WildValleyFoodsServiceModelBase<number> {
    // _id!: string; // Assuming _id is of type string after conversion
    loginId!: string;
    firstName!: string;
    middleName!: string;
    lastName!: string;
    phoneNumber!: string;
    profilePicturePath!: string;
    isPhoneNumberConfirmed!: boolean;
    isEmailConfirmed!: boolean;
    loginStatus!: LoginStatusSM;
    dateOfBirth!: Date;
    email!: string;
    passwordHash!: string;
    role!: RoleTypeSM;
}