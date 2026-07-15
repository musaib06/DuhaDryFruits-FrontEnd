import { WildValleyFoodsServiceModelBase } from "../base/WildValleyFoods-service-model-base";
import { CustomerGroupSM } from "./customer-group-s-m-enum.ts";

export class CustomerSM extends WildValleyFoodsServiceModelBase<number> {
  name!: string;               
  emailId!: string;            
  phoneNumber!: string;        
  country!: string;            
  city!: string;               
  zipCode!: string;            
  address!: string;            
  customerGroup!: CustomerGroupSM;    
  }