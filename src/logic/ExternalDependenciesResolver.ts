import { DependencyResolver } from 'pip-services3-commons-node';
import { ConfigParams } from 'pip-services3-commons-node';

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

import { ExternalDependencies } from './ExternalDependencies';

export class ExternalDependenciesResolver extends DependencyResolver {
    private static _defaultConfig: ConfigParams = ConfigParams.fromTuples(
        'dependencies.msgdistribution', 'pip-services-msgdistribution:client:*:*:1.0',
        'dependencies.organizations', 'pip-services-organizations:client:*:*:1.0',
        'dependencies.data-profiles', 'iqs-services-dataprofiles:client:*:*:1.0',
        'dependencies.devices', 'iqs-services-devices:client:*:*:1.0',
        'dependencies.device-profiles', 'iqs-services-deviceprofiles:client:*:*:1.0',
        'dependencies.control-objects', 'iqs-services-controlobjects:client:*:*:1.0',
        'dependencies.zones', 'iqs-services-zones:client:*:*:1.0',
        'dependencies.current-object-states', 'iqs-services-currobjectstates:client:*:*:1.0',
        'dependencies.current-device-states', 'iqs-services-currdevicestates:client:*:*:1.0',
        'dependencies.object-positions', 'pip-services-positions:client:*:*:1.0',
        'dependencies.object-states', 'iqs-services-objectstates:client:*:*:1.0',
        'dependencies.object-data', 'pip-services-transducerdata:client:*:*:1.0',
        'dependencies.attendance', 'iqs-services-attendance:client:*:*:1.0',
        'dependencies.rosters', 'iqs-services-rosters:client:*:*:1.0',
        'dependencies.event-generation', 'iqs-services-eventgeneration:client:*:*:1.0',
        'dependencies.route-analysis', 'pip-services-routeanalysis:client:*:*:1.0',
        'dependencies.statistics', 'pip-services-statistics:client:*:*:1.0'
    );

    public constructor() {
        super(ExternalDependenciesResolver._defaultConfig);
    }

    public resolve(): ExternalDependencies {
        let dependencies = new ExternalDependencies();

        dependencies.organizationsClient = this.getOneRequired<IOrganizationsClientV1>('organizations');
        dependencies.dataProfilesClient = this.getOneRequired<IDataProfilesClientV1>('data-profiles');
        dependencies.devicesClient = this.getOneRequired<IDevicesClientV1>('devices');
        dependencies.deviceProfilesClient = this.getOneRequired<IDeviceProfilesClientV1>('device-profiles');
        dependencies.objectsClient = this.getOneRequired<IControlObjectsClientV1>('control-objects');
        dependencies.zonesClient = this.getOneRequired<IZonesClientV1>('zones');
        dependencies.currentStatesClient = this.getOneRequired<ICurrentObjectStatesClientV1>('current-object-states');
        dependencies.deviceStatesClient = this.getOneRequired<ICurrentDeviceStatesClientV1>('current-device-states');
        dependencies.statesClient = this.getOneRequired<IObjectStatesClientV1>('object-states');
        dependencies.positionsClient = this.getOneRequired<IPositionsClientV1>('object-positions');
        dependencies.dataClient = this.getOneRequired<ITransducerDataClientV1>('object-data');
        dependencies.attendanceClient = this.getOneRequired<IAttendanceClientV1>('attendance');
        dependencies.rostersClient = this.getOneRequired<IRostersClientV1>('rosters');
        dependencies.statisticsClient = this.getOneRequired<IStatisticsClientV1>('statistics');
        dependencies.eventGenerationClient = this.getOneRequired<IEventGenerationClientV1>('event-generation');
        dependencies.routesAnalysisClient = this.getOneRequired<IRouteAnalysisClientV1>('route-analysis');
        
        return dependencies;
    }
}