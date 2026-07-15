import { QueryFilter } from './query-filter';

export class OdataQueryFilter extends QueryFilter {
    orderByCommand!: string;
    filterByCommand!: string;
}
