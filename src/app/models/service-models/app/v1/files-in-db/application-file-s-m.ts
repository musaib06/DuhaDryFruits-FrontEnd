import { DuhaDryFruitsServiceModelBase } from "../../base/DuhaDryFruits-service-model-base";


export class ApplicationFileSM extends DuhaDryFruitsServiceModelBase<number> {
    fileName!: string;
    fileType!: string;
    fileDescription!: string;
    fileBytes!: string;
}
