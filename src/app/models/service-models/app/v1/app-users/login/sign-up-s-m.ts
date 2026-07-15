import { WildValleyFoodsServiceModelBase } from "../../../base/WildValleyFoods-service-model-base";

export class SignUpSM extends WildValleyFoodsServiceModelBase<number> {
    loginId!: string;
    firstName!: string;
    lastName!: string;
    emailId!: string;
    passwordHash!: string;
}
