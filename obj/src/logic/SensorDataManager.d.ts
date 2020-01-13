import { ConfigParams } from 'pip-services3-commons-node';
import { IConfigurable } from 'pip-services3-commons-node';
import { CurrentObjectStateV1 } from 'iqs-clients-currobjectstates-node';
import { StateUpdateV1 } from '../data/version1/StateUpdateV1';
import { OrganizationData } from './OrganizationData';
import { ExternalDependencies } from './ExternalDependencies';
export declare class SensorDataManager implements IConfigurable {
    private _dependencies;
    private _config;
    setDependencies(dependencies: ExternalDependencies): void;
    configure(config: ConfigParams): void;
    private getDeviceProfile;
    private calculateParameters;
    private calculateEvents;
    calculateSensorData(correlationId: string, newState: CurrentObjectStateV1, stateUpdate: StateUpdateV1, organizationData: OrganizationData): void;
}
