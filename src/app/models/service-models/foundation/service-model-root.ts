import { ServiceModelBase } from './service-model-base';

export abstract class SModelRoot<T> extends ServiceModelBase {
    id!: T;
    createdBy!: string;
    lastModifiedBy!: string;
}
