import { WildValleyFoodsServiceModelBase } from '../base/WildValleyFoods-service-model-base';

export class DummyTeacherSM extends WildValleyFoodsServiceModelBase<number> {
  firstName!: string;
  lastName!: string;
  emailAddress!: string;
  profilePictureFileId?: number;
}
