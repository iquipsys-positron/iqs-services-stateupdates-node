import { CurrentObjectStateV1 } from 'iqs-clients-currobjectstates-node';
import { RosterV1 } from 'iqs-clients-rosters-node';
import { OrganizationV1 } from 'pip-clients-organizations-node';
import { DataProfileV1 } from 'iqs-clients-dataprofiles-node';
import { DeviceV1 } from 'iqs-clients-devices-node';
import { BaseDeviceProfileV1 } from 'iqs-clients-deviceprofiles-node';
import { DeviceProfileV1 } from 'iqs-clients-deviceprofiles-node';
import { ControlObjectV1 } from 'iqs-clients-controlobjects-node';
import { ZoneV1 } from 'iqs-clients-zones-node';
export declare class OrganizationData {
    org_id: string;
    short_update_time: Date;
    states: CurrentObjectStateV1[];
    lng_update_time: Date;
    organization: OrganizationV1;
    data_profile: DataProfileV1;
    devices: DeviceV1[];
    base_device_profiles: BaseDeviceProfileV1[];
    device_profiles: DeviceProfileV1[];
    objects: ControlObjectV1[];
    zones: ZoneV1[];
    rosters: RosterV1[];
}
