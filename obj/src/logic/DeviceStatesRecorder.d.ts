import { ConfigParams } from 'pip-services3-commons-node';
import { IConfigurable } from 'pip-services3-commons-node';
import { StateUpdateV1 } from '../data/version1/StateUpdateV1';
import { ExternalDependencies } from './ExternalDependencies';
export declare class DeviceStatesRecorder implements IConfigurable {
    private _dependencies;
    private _dumpCacheInterval;
    private _cache;
    setDependencies(dependencies: ExternalDependencies): void;
    configure(config: ConfigParams): void;
    recordState(correlationId: string, state: StateUpdateV1, callback: (err: any) => void): void;
    dumpCache(correlationId: string, callback: (err: any) => void): void;
}
