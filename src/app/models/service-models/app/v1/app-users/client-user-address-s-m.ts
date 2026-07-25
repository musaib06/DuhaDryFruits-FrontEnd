import { DuhaDryFruitsServiceModelBase } from "../../base/DuhaDryFruits-service-model-base";


export class ClientUserAddressSM extends DuhaDryFruitsServiceModelBase<number> {
    country!: string;
    state!: string;
    city!: string;
    address1!: string;
    address2!: string;
    pinCode!: string;
    clientUserId!: number;
}
