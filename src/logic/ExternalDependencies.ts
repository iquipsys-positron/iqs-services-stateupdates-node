import { CompositeLogger } from 'pip-services3-components-node';
import { LogCounters } from 'pip-services3-components-node';

import { IOrganizationsClientV1 } from 'pip-clients-organizations-node';
import { IDataProfilesClientV1 } from 'iqs-clients-dataprofiles-node';
import { IDevicesClientV1 } from 'iqs-clients-devices-node';
import { IDeviceProfilesClientV1 } from 'iqs-clients-deviceprofiles-node';
import { IControlObjectsClientV1 } from 'iqs-clients-controlobjects-node';
import { IZonesClientV1 } from 'iqs-clients-zones-node';
import { ICurrentObjectStatesClientV1 } from 'iqs-clients-currobjectstates-node';
import { ICurrentDeviceStatesClientV1 } from 'iqs-clients-currdevicestates-node';
import { IObjectStatesClientV1 } from 'iqs-clients-objectstates-node';
import { IPositionsClientV1 } from 'pip-clients-positions-node';
import { ITransducerDataClientV1 } from 'pip-clients-transducerdata-node';
import { IAttendanceClientV1 } from 'iqs-clients-attendance-node';
import { IRostersClientV1 } from 'iqs-clients-rosters-node';
import { IStatisticsClientV1 } from 'pip-clients-statistics-node';
import { IEventGenerationClientV1 } from 'iqs-clients-eventgeneration-node';
import { IRouteAnalysisClientV1 } from 'pip-clients-routeanalysis-node';

export class ExternalDependencies {
    public logger: CompositeLogger;
    public counters: LogCounters;

    public organizationsClient: IOrganizationsClientV1;
    public dataProfilesClient: IDataProfilesClientV1;
    public devicesClient: IDevicesClientV1;
    public deviceProfilesClient: IDeviceProfilesClientV1;
    public objectsClient: IControlObjectsClientV1;
    public zonesClient: IZonesClientV1;
    public currentStatesClient: ICurrentObjectStatesClientV1;
    public deviceStatesClient: ICurrentDeviceStatesClientV1;
    public statesClient: IObjectStatesClientV1;
    public positionsClient: IPositionsClientV1;
    public dataClient: ITransducerDataClientV1;
    public attendanceClient: IAttendanceClientV1;
    public rostersClient: IRostersClientV1;
    public statisticsClient: IStatisticsClientV1;
    public eventGenerationClient: IEventGenerationClientV1;
    public routesAnalysisClient: IRouteAnalysisClientV1;
}