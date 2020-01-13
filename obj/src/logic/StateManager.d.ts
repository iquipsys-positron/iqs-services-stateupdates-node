import { ConfigParams } from 'pip-services3-commons-node';
import { IConfigurable } from 'pip-services3-commons-node';
import { CurrentObjectStateV1 } from 'iqs-clients-currobjectstates-node';
import { RosterV1 } from 'iqs-clients-rosters-node';
import { StateUpdateV1 } from '../data/version1/StateUpdateV1';
import { OrganizationData } from './OrganizationData';
import { ExternalDependencies } from './ExternalDependencies';
export declare class StateManager implements IConfigurable {
    private _dependencies;
    private _config;
    private _offlineTimeout;
    private _immobileThreshold;
    private _immobileTimeout;
    setDependencies(dependencies: ExternalDependencies): void;
    configure(config: ConfigParams): void;
    private createInitialState;
    private getDevice;
    private getActiveDevice;
    getOldState(correlationId: string, stateUpdate: StateUpdateV1, organizationData: OrganizationData, callback: (err: any, state: CurrentObjectStateV1) => void): void;
    private calculateAssignedObject;
    private calculateNewState;
    getNewState(correlationId: string, oldState: CurrentObjectStateV1, stateUpdate: StateUpdateV1, organizationData: OrganizationData, callback: (err: any, state: CurrentObjectStateV1) => void): void;
    private getRosterObjectIds;
    getOfflineStates(roster: RosterV1, organizationData: OrganizationData): CurrentObjectStateV1[];
}
