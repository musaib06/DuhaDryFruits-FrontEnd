import { QueryFilter } from './query-filter-base';

export class ApiRequest<T> {
  reqData!: T;
  queryFilter!: QueryFilter;
}
