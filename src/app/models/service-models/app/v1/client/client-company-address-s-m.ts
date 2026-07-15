import { WildValleyFoodsServiceModelBase } from "../../base/WildValleyFoods-service-model-base";

export class ClientCompanyAddressSM extends WildValleyFoodsServiceModelBase<number> {
    public country: string;
    public state: string;
    public city: string;
    public address1: string;
    public address2: string;
    public pinCode: string;
    public clientCompanyDetailId: number;

    constructor(
        country: string,
        state: string,
        city: string,
        address1: string,
        address2: string,
        pinCode: string,
        clientCompanyDetailId: number
    ) {
        super(); // Call the constructor of the base class
        this.country = country;
        this.state = state;
        this.city = city;
        this.address1 = address1;
        this.address2 = address2;
        this.pinCode = pinCode;
        this.clientCompanyDetailId = clientCompanyDetailId;
    }
}