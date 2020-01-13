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
export declare class ExternalDependencies {
    logger: CompositeLogger;
    counters: LogCounters;
    organizationsClient: IOrganizationsClientV1;
    dataProfilesClient: IDataProfilesClientV1;
    devicesClient: IDevicesClientV1;
    deviceProfilesClient: IDeviceProfilesClientV1;
    objectsClient: IControlObjectsClientV1;
    zonesClient: IZonesClientV1;
    currentStatesClient: ICurrentObjectStatesClientV1;
    deviceStatesClient: ICurrentDeviceStatesClientV1;
    statesClient: IObjectStatesClientV1;
    positionsClient: IPositionsClientV1;
    dataClient: ITransducerDataClientV1;
    attendanceClient: IAttendanceClientV1;
    rostersClient: IRostersClientV1;
    statisticsClient: IStatisticsClientV1;
    eventGenerationClient: IEventGenerationClientV1;
    routesAnalysisClient: IRouteAnalysisClientV1;
}
