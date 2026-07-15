import { WildValleyFoodsServiceModelBase } from "../../base/WildValleyFoods-service-model-base";

export class ClientCompanyDetailSM extends WildValleyFoodsServiceModelBase<number> {
    public companyCode: string;
    public name: string;
    public description: string;
    public contactEmail: string;
    public companyMobileNumber: string;
    public companyWebsite: string;
    public companyLogoPath: string;
    public companyDateOfEstablishment: Date;
    public clientCompanyAddressId: number;

    constructor(
        companyCode: string,
        name: string,
        description: string,
        contactEmail: string,
        companyMobileNumber: string,
        companyWebsite: string,
        companyLogoPath: string,
        companyDateOfEstablishment: Date,
        clientCompanyAddressId: number
    ) {
        super(); // Call the constructor of the base class
        this.companyCode = companyCode;
        this.name = name;
        this.description = description;
        this.contactEmail = contactEmail;
        this.companyMobileNumber = companyMobileNumber;
        this.companyWebsite = companyWebsite;
        this.companyLogoPath = companyLogoPath;
        this.companyDateOfEstablishment = companyDateOfEstablishment;
        this.clientCompanyAddressId = clientCompanyAddressId;
    }
}
