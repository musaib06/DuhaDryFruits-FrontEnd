import { QueryFilter } from '../query-filter';

export class ApiRequest<T> {
    get(arg0: string): string {
      throw new Error('Method not implemented.');
    }
    reqData!: T;
    queryFilter!: QueryFilter;
}
