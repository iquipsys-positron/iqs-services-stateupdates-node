import { ConfigParams } from 'pip-services3-commons-node';
import { IConfigurable } from 'pip-services3-commons-node';
import { CurrentObjectStateV1 } from 'iqs-clients-currobjectstates-node';
import { ExternalDependencies } from './ExternalDependencies';
export declare class PositionsRecorder implements IConfigurable {
    private _dependencies;
    private _positionsInterval;
    private _dumpCacheInterval;
    private _cache;
    setDependencies(dependencies: ExternalDependencies): void;
    configure(config: ConfigParams): void;
    recordPositions(correlationId: string, state: CurrentObjectStateV1, callback: (err: any) => void): void;
    dumpCache(correlationId: string, callback: (err: any) => void): void;
}
