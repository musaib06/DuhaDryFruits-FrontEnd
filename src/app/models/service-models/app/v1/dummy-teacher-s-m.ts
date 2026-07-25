import { DuhaDryFruitsServiceModelBase } from '../base/DuhaDryFruits-service-model-base';

export class DummyTeacherSM extends DuhaDryFruitsServiceModelBase<number> {
  firstName!: string;
  lastName!: string;
  emailAddress!: string;
  profilePictureFileId?: number;
}
