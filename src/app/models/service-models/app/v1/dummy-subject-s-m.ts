import { WildValleyFoodsServiceModelBase } from '../base/WildValleyFoods-service-model-base';

export class DummySubjectSM extends WildValleyFoodsServiceModelBase<number> {
  subjectName!: string;
  subjectCode!: string;
  dummyTeacherID?: number;
}
