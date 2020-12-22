import { QueryOptions } from 'winston';
import { DexEvent } from '../../component/chian_event';


export interface IndexerSubscribe {
    subscribe(queryOptions: QueryOptions, event: DexEvent): void;
}