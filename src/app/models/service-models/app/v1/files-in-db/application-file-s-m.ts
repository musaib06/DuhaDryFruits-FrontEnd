import { WildValleyFoodsServiceModelBase } from "../../base/WildValleyFoods-service-model-base";


export class ApplicationFileSM extends WildValleyFoodsServiceModelBase<number> {
    fileName!: string;
    fileType!: string;
    fileDescription!: string;
    fileBytes!: string;
}
