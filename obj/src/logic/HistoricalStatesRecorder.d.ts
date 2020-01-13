import { ConfigParams } from 'pip-services3-commons-node';
import { IConfigurable } from 'pip-services3-commons-node';
import { CurrentObjectStateV1 } from 'iqs-clients-currobjectstates-node';
import { ExternalDependencies } from './ExternalDependencies';
export declare class HistoricalStatesRecorder implements IConfigurable {
    private _dependencies;
    private _stateInterval;
    private _dumpCacheInterval;
    private _cache;
    setDependencies(dependencies: ExternalDependencies): void;
    configure(config: ConfigParams): void;
    recordDue(state: CurrentObjectStateV1): boolean;
    recordState(correlationId: string, state: CurrentObjectStateV1, force: boolean, callback: (err: any) => void): void;
    recordStates(correlationId: string, states: CurrentObjectStateV1[], force: boolean, callback: (err: any) => void): void;
    dumpCache(correlationId: string, callback: (err: any) => void): void;
}
