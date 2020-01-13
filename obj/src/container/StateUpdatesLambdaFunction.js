"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pip_services3_commons_node_1 = require("pip-services3-commons-node");
const pip_services3_aws_node_1 = require("pip-services3-aws-node");
const pip_clients_organizations_node_1 = require("pip-clients-organizations-node");
const iqs_clients_dataprofiles_node_1 = require("iqs-clients-dataprofiles-node");
const iqs_clients_devices_node_1 = require("iqs-clients-devices-node");
const iqs_clients_deviceprofiles_node_1 = require("iqs-clients-deviceprofiles-node");
const iqs_clients_controlobjects_node_1 = require("iqs-clients-controlobjects-node");
const iqs_clients_zones_node_1 = require("iqs-clients-zones-node");
const iqs_clients_currobjectstates_node_1 = require("iqs-clients-currobjectstates-node");
const iqs_clients_currdevicestates_node_1 = require("iqs-clients-currdevicestates-node");
const iqs_clients_objectstates_node_1 = require("iqs-clients-objectstates-node");
const pip_clients_positions_node_1 = require("pip-clients-positions-node");
const pip_clients_transducerdata_node_1 = require("pip-clients-transducerdata-node");
const iqs_clients_attendance_node_1 = require("iqs-clients-attendance-node");
const iqs_clients_rosters_node_1 = require("iqs-clients-rosters-node");
const pip_clients_statistics_node_1 = require("pip-clients-statistics-node");
const iqs_clients_eventgeneration_node_1 = require("iqs-clients-eventgeneration-node");
const pip_clients_routeanalysis_node_1 = require("pip-clients-routeanalysis-node");
const StateUpdatesServiceFactory_1 = require("../build/StateUpdatesServiceFactory");
class StateUpdatesLambdaFunction extends pip_services3_aws_node_1.CommandableLambdaFunction {
    constructor() {
        super("state_updates", "Object state updates function");
        this._dependencyResolver.put('controller', new pip_services3_commons_node_1.Descriptor('iqs-services-stateupdates', 'controller', 'default', '*', '*'));
        this._factories.add(new StateUpdatesServiceFactory_1.StateUpdatesServiceFactory());
        this._factories.add(new pip_clients_organizations_node_1.OrganizationsClientFactory());
        this._factories.add(new iqs_clients_dataprofiles_node_1.DataProfilesClientFactory());
        this._factories.add(new iqs_clients_devices_node_1.DevicesClientFactory());
        this._factories.add(new iqs_clients_deviceprofiles_node_1.DeviceProfilesClientFactory());
        this._factories.add(new iqs_clients_controlobjects_node_1.ControlObjectsClientFactory());
        this._factories.add(new iqs_clients_zones_node_1.ZonesClientFactory());
        this._factories.add(new iqs_clients_currobjectstates_node_1.CurrentObjectStatesClientFactory());
        this._factories.add(new iqs_clients_currdevicestates_node_1.CurrentDeviceStatesClientFactory());
        this._factories.add(new iqs_clients_objectstates_node_1.ObjectStatesClientFactory());
        this._factories.add(new pip_clients_positions_node_1.PositionsClientFactory());
        this._factories.add(new pip_clients_transducerdata_node_1.TransducerDataClientFactory());
        this._factories.add(new iqs_clients_attendance_node_1.AttendanceClientFactory());
        this._factories.add(new iqs_clients_rosters_node_1.RostersClientFactory());
        this._factories.add(new pip_clients_statistics_node_1.StatisticsClientFactory());
        this._factories.add(new iqs_clients_eventgeneration_node_1.EventGenerationClientFactory());
        this._factories.add(new pip_clients_routeanalysis_node_1.RouteAnalysisClientFactory());
    }
    getReferences() {
        return this._references;
    }
}
exports.StateUpdatesLambdaFunction = StateUpdatesLambdaFunction;
exports.handler = new StateUpdatesLambdaFunction().getHandler();
//# sourceMappingURL=StateUpdatesLambdaFunction.js.map