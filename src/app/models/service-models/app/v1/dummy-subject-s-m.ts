import { DuhaDryFruitsServiceModelBase } from '../base/DuhaDryFruits-service-model-base';

export class DummySubjectSM extends DuhaDryFruitsServiceModelBase<number> {
  subjectName!: string;
  subjectCode!: string;
  dummyTeacherID?: number;
}
