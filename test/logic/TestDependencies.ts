import { CompositeLogger } from 'pip-services3-components-node';

import { OrganizationsMemoryClientV1 } from 'pip-clients-organizations-node';
import { DataProfilesMemoryClientV1 } from 'iqs-clients-dataprofiles-node';
import { DevicesMemoryClientV1 } from 'iqs-clients-devices-node';
import { DeviceProfilesMemoryClientV1 } from 'iqs-clients-deviceprofiles-node';
import { ControlObjectsMemoryClientV1 } from 'iqs-clients-controlobjects-node';
import { ZonesMemoryClientV1 } from 'iqs-clients-zones-node';
import { CurrentObjectStatesMemoryClientV1 } from 'iqs-clients-currobjectstates-node';
import { CurrentDeviceStatesNullClientV1 } from 'iqs-clients-currdevicestates-node';
import { ObjectStatesNullClientV1 } from 'iqs-clients-objectstates-node';
import { PositionsNullClientV1 } from 'pip-clients-positions-node';
import { TransducerDataNullClientV1 } from 'pip-clients-transducerdata-node';
import { AttendanceNullClientV1 } from 'iqs-clients-attendance-node';
import { RostersMemoryClientV1 } from 'iqs-clients-rosters-node';
import { StatisticsNullClientV1 } from 'pip-clients-statistics-node';
import { EventGenerationNullClientV1 } from 'iqs-clients-eventgeneration-node';
import { RouteAnalysisNullClientV1 } from 'pip-clients-routeanalysis-node';

import { ExternalDependencies } from '../../src/logic/ExternalDependencies';

export class TestDependencies extends ExternalDependencies {
    public constructor() {
        super();

        this.organizationsClient = new OrganizationsMemoryClientV1();
        this.dataProfilesClient = new DataProfilesMemoryClientV1();
        this.devicesClient = new DevicesMemoryClientV1();
        this.deviceProfilesClient = new DeviceProfilesMemoryClientV1();
        this.objectsClient = new ControlObjectsMemoryClientV1();
        this.zonesClient = new ZonesMemoryClientV1();
        this.currentStatesClient = new CurrentObjectStatesMemoryClientV1();
        this.deviceStatesClient = new CurrentDeviceStatesNullClientV1();
        this.statesClient = new ObjectStatesNullClientV1();
        this.positionsClient = new PositionsNullClientV1();
        this.dataClient = new TransducerDataNullClientV1();
        this.attendanceClient = new AttendanceNullClientV1();
        this.rostersClient = new RostersMemoryClientV1();
        this.statisticsClient = new StatisticsNullClientV1();
        this.eventGenerationClient = new EventGenerationNullClientV1();
        this.routesAnalysisClient = new RouteAnalysisNullClientV1();
    }
}