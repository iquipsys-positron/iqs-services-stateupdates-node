import { CurrentObjectStateV1 } from 'iqs-clients-currobjectstates-node';
import { RosterV1 } from 'iqs-clients-rosters-node';

import { OrganizationV1 } from 'pip-clients-organizations-node';
import { DataProfileV1 } from 'iqs-clients-dataprofiles-node';
import { DeviceV1 } from 'iqs-clients-devices-node';
import { BaseDeviceProfileV1 } from 'iqs-clients-deviceprofiles-node';
import { DeviceProfileV1 } from 'iqs-clients-deviceprofiles-node';
import { ControlObjectV1 } from 'iqs-clients-controlobjects-node';
import { ZoneV1 } from 'iqs-clients-zones-node';

export class OrganizationData {
    public org_id: string;

    public short_update_time: Date;
    public states: CurrentObjectStateV1[];

    public lng_update_time: Date;
    public organization: OrganizationV1;
    public data_profile: DataProfileV1;
    public devices: DeviceV1[];
    public base_device_profiles: BaseDeviceProfileV1[];
    public device_profiles: DeviceProfileV1[];
    public objects: ControlObjectV1[];
    public zones: ZoneV1[];
    public rosters: RosterV1[];
}