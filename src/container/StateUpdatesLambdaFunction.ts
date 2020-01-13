import { Descriptor } from 'pip-services3-commons-node';
import { IReferences } from 'pip-services3-commons-node';
import { CommandableLambdaFunction } from 'pip-services3-aws-node';

import { OrganizationsClientFactory } from 'pip-clients-organizations-node';
import { DataProfilesClientFactory } from 'iqs-clients-dataprofiles-node';
import { DevicesClientFactory } from 'iqs-clients-devices-node';
import { DeviceProfilesClientFactory } from 'iqs-clients-deviceprofiles-node';
import { ControlObjectsClientFactory } from 'iqs-clients-controlobjects-node';
import { ZonesClientFactory } from 'iqs-clients-zones-node';
import { CurrentObjectStatesClientFactory } from 'iqs-clients-currobjectstates-node';
import { CurrentDeviceStatesClientFactory } from 'iqs-clients-currdevicestates-node';
import { ObjectStatesClientFactory } from 'iqs-clients-objectstates-node';
import { PositionsClientFactory } from 'pip-clients-positions-node';
import { TransducerDataClientFactory } from 'pip-clients-transducerdata-node';
import { AttendanceClientFactory } from 'iqs-clients-attendance-node';
import { RostersClientFactory } from 'iqs-clients-rosters-node';
import { StatisticsClientFactory } from 'pip-clients-statistics-node';
import { EventGenerationClientFactory } from 'iqs-clients-eventgeneration-node';
import { RouteAnalysisClientFactory } from 'pip-clients-routeanalysis-node';

import { StateUpdatesServiceFactory } from '../build/StateUpdatesServiceFactory';

export class StateUpdatesLambdaFunction extends CommandableLambdaFunction {
    public constructor() {
        super("state_updates", "Object state updates function");
        this._dependencyResolver.put('controller', new Descriptor('iqs-services-stateupdates', 'controller', 'default', '*', '*'));

        this._factories.add(new StateUpdatesServiceFactory());
        this._factories.add(new OrganizationsClientFactory());
        this._factories.add(new DataProfilesClientFactory());
        this._factories.add(new DevicesClientFactory());
        this._factories.add(new DeviceProfilesClientFactory());
        this._factories.add(new ControlObjectsClientFactory());
        this._factories.add(new ZonesClientFactory());
        this._factories.add(new CurrentObjectStatesClientFactory());
        this._factories.add(new CurrentDeviceStatesClientFactory());
        this._factories.add(new ObjectStatesClientFactory());
        this._factories.add(new PositionsClientFactory());
        this._factories.add(new TransducerDataClientFactory());
        this._factories.add(new AttendanceClientFactory());
        this._factories.add(new RostersClientFactory());
        this._factories.add(new StatisticsClientFactory());
        this._factories.add(new EventGenerationClientFactory());
        this._factories.add(new RouteAnalysisClientFactory());
    }

    public getReferences(): IReferences {
        return this._references;
    }
}

export const handler = new StateUpdatesLambdaFunction().getHandler();