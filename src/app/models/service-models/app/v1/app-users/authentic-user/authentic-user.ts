import { RoleTypeSM } from "../../../enums/role-type-s-m.enum";

export class AuthenticUserSM  {
    public firstName?: string;
    public lastName?: string;
    public role: RoleTypeSM;

    constructor(
        firstName?: string,
        lastName?: string,
        role: RoleTypeSM = RoleTypeSM.Unknown // Assuming a default role; adjust as needed
    ) {
        
        this.firstName = firstName;
        this.lastName = lastName;
        this.role = role;
    }
}