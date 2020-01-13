import { ConfigParams } from 'pip-services3-commons-node';
import { IConfigurable } from 'pip-services3-commons-node';
import { CurrentObjectStateV1 } from 'iqs-clients-currobjectstates-node';
import { RosterV1 } from 'iqs-clients-rosters-node';
import { OrganizationData } from './OrganizationData';
import { ExternalDependencies } from './ExternalDependencies';
export declare class RosterManager implements IConfigurable {
    private _dependencies;
    setDependencies(dependencies: ExternalDependencies): void;
    configure(config: ConfigParams): void;
    getShiftRoster(time: Date, organizationData: OrganizationData): RosterV1;
    getAllDayRoster(time: Date, organizationData: OrganizationData): RosterV1;
    defineAssignedObject(newState: CurrentObjectStateV1, organizationData: OrganizationData): void;
    defineExpected(newState: CurrentObjectStateV1, organizationData: OrganizationData): void;
    getCurrentShiftRosters(correlationId: string, skip: number, take: number, callback: (err: any, rosters: RosterV1[]) => void): void;
    getRosterObjectIds(roster: RosterV1): string[];
}
