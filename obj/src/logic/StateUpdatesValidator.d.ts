import { OrganizationData } from './OrganizationData';
import { CurrentObjectStateV1 } from 'iqs-clients-currobjectstates-node';
import { StateUpdateV1 } from '../data/version1/StateUpdateV1';
export declare class StateUpdatesValidator {
    private static MAX_SPEED;
    private static OUT_OF_SITE_DELTA;
    private static checkFutureTime;
    private static checkTimeBehind;
    private static checkTooHighSpeed;
    private static checkOutOfOrganization;
    static validate(correlationId: string, stateUpdate: StateUpdateV1, state: CurrentObjectStateV1, organizationData: OrganizationData): any;
}
