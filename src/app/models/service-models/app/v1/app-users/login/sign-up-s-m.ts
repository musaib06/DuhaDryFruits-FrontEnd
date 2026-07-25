import { DuhaDryFruitsServiceModelBase } from "../../../base/DuhaDryFruits-service-model-base";

export class SignUpSM extends DuhaDryFruitsServiceModelBase<number> {
    loginId!: string;
    firstName!: string;
    lastName!: string;
    emailId!: string;
    passwordHash!: string;
}
