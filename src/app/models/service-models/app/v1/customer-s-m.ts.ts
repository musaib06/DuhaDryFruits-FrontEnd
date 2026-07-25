import { DuhaDryFruitsServiceModelBase } from "../base/DuhaDryFruits-service-model-base";
import { CustomerGroupSM } from "./customer-group-s-m-enum.ts";

export class CustomerSM extends DuhaDryFruitsServiceModelBase<number> {
  name!: string;               
  emailId!: string;            
  phoneNumber!: string;        
  country!: string;            
  city!: string;               
  zipCode!: string;            
  address!: string;            
  customerGroup!: CustomerGroupSM;    
  }