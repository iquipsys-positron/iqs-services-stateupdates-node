import { ConfigParams } from 'pip-services3-commons-node';
import { IConfigurable } from 'pip-services3-commons-node';
import { CurrentObjectStateV1 } from 'iqs-clients-currobjectstates-node';
import { OrganizationData } from './OrganizationData';
import { ExternalDependencies } from './ExternalDependencies';
export declare class DataManager implements IConfigurable {
    private _dependencies;
    private _shortCacheTimeout;
    private _longCacheTimeout;
    private _cache;
    setDependencies(dependencies: ExternalDependencies): void;
    configure(config: ConfigParams): void;
    private getCachedData;
    private loadLongLivingData;
    private loadShortLivingData;
    loadData(correlationId: string, orgId: string, callback: (err: any, data: OrganizationData) => void): void;
    forceLoadData(correlationId: string, orgId: string, deviceId: string, callback: (err: any, data: OrganizationData) => void): void;
    private setAndCacheState;
    saveState(correlationId: string, state: CurrentObjectStateV1, callback: (err: any) => void): void;
    saveStates(correlationId: string, states: CurrentObjectStateV1[], callback: (err: any) => void): void;
    clearStaleData(): void;
    clear(): void;
}
