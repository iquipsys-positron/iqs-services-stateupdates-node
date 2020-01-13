import { ConfigParams } from 'pip-services3-commons-node';
import { IConfigurable } from 'pip-services3-commons-node';
import { OrganizationV1 } from 'pip-clients-organizations-node';
import { CurrentObjectStateV1 } from 'iqs-clients-currobjectstates-node';
import { StatCounterIncrementV1 } from 'pip-clients-statistics-node';
import { StateUpdateV1 } from '../data/version1/StateUpdateV1';
import { OrganizationData } from './OrganizationData';
import { ExternalDependencies } from './ExternalDependencies';
export declare class StatisticsRecorder implements IConfigurable {
    private _dependencies;
    private _dumpCacheInterval;
    private _cache;
    setDependencies(dependencies: ExternalDependencies): void;
    configure(config: ConfigParams): void;
    generateUsageIncrements(organization: OrganizationV1, oldState: CurrentObjectStateV1, newState: CurrentObjectStateV1): StatCounterIncrementV1[];
    generateErrorIncrements(organization: OrganizationV1, stateUpdate: StateUpdateV1): StatCounterIncrementV1[];
    generateParamIncrements(organization: OrganizationV1, oldState: CurrentObjectStateV1, newState: CurrentObjectStateV1): StatCounterIncrementV1[];
    generatePresenceIncrements(organization: OrganizationV1, oldState: CurrentObjectStateV1, newState: CurrentObjectStateV1): StatCounterIncrementV1[];
    generateIncrements(organization: OrganizationV1, oldState: CurrentObjectStateV1, newState: CurrentObjectStateV1): StatCounterIncrementV1[];
    recordStatistics(correlationId: string, oldState: CurrentObjectStateV1, newState: CurrentObjectStateV1, organizationData: OrganizationData, callback: (err: any) => void): void;
    recordErrorStats(correlationId: string, organization: OrganizationV1, stateUpdate: StateUpdateV1, callback: (err: any) => void): void;
    dumpCache(correlationId: string, callback: (err: any) => void): void;
}
