import { WildValleyFoodsServiceModelBase } from "../../base/WildValleyFoods-service-model-base";


export class ApplicationUserAddressSM extends WildValleyFoodsServiceModelBase<number> {
    country!: string;
    state!: string;
    city!: string;
    address1!: string;
    address2!: string;
    pinCode!: string;
    applicationUserId!: number;
}
