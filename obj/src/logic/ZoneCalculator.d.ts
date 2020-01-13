import { ConfigParams } from 'pip-services3-commons-node';
import { IConfigurable } from 'pip-services3-commons-node';
import { CurrentObjectStateV1 } from 'iqs-clients-currobjectstates-node';
import { OrganizationData } from './OrganizationData';
import { ExternalDependencies } from './ExternalDependencies';
export declare class ZoneCalculator implements IConfigurable {
    private _dependencies;
    setDependencies(dependencies: ExternalDependencies): void;
    configure(config: ConfigParams): void;
    private checkInCircleZone;
    private checkInPolygonZone;
    polylineDistance(point: any, polyline: any): number;
    private checkInLineZone;
    private contains;
    private checkObjectMatch;
    private checkInObjectZone;
    private checkInZone;
    private calculateCurrentZones;
    private calculateExitedZones;
    calculateZones(oldState: CurrentObjectStateV1, newState: CurrentObjectStateV1, organizationData: OrganizationData): void;
}
