"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pip_services3_commons_node_1 = require("pip-services3-commons-node");
const pip_services3_commons_node_2 = require("pip-services3-commons-node");
const ExternalDependencies_1 = require("./ExternalDependencies");
class ExternalDependenciesResolver extends pip_services3_commons_node_1.DependencyResolver {
    constructor() {
        super(ExternalDependenciesResolver._defaultConfig);
    }
    resolve() {
        let dependencies = new ExternalDependencies_1.ExternalDependencies();
        dependencies.organizationsClient = this.getOneRequired('organizations');
        dependencies.dataProfilesClient = this.getOneRequired('data-profiles');
        dependencies.devicesClient = this.getOneRequired('devices');
        dependencies.deviceProfilesClient = this.getOneRequired('device-profiles');
        dependencies.objectsClient = this.getOneRequired('control-objects');
        dependencies.zonesClient = this.getOneRequired('zones');
        dependencies.currentStatesClient = this.getOneRequired('current-object-states');
        dependencies.deviceStatesClient = this.getOneRequired('current-device-states');
        dependencies.statesClient = this.getOneRequired('object-states');
        dependencies.positionsClient = this.getOneRequired('object-positions');
        dependencies.dataClient = this.getOneRequired('object-data');
        dependencies.attendanceClient = this.getOneRequired('attendance');
        dependencies.rostersClient = this.getOneRequired('rosters');
        dependencies.statisticsClient = this.getOneRequired('statistics');
        dependencies.eventGenerationClient = this.getOneRequired('event-generation');
        dependencies.routesAnalysisClient = this.getOneRequired('route-analysis');
        return dependencies;
    }
}
exports.ExternalDependenciesResolver = ExternalDependenciesResolver;
ExternalDependenciesResolver._defaultConfig = pip_services3_commons_node_2.ConfigParams.fromTuples('dependencies.msgdistribution', 'pip-services-msgdistribution:client:*:*:1.0', 'dependencies.organizations', 'pip-services-organizations:client:*:*:1.0', 'dependencies.data-profiles', 'iqs-services-dataprofiles:client:*:*:1.0', 'dependencies.devices', 'iqs-services-devices:client:*:*:1.0', 'dependencies.device-profiles', 'iqs-services-deviceprofiles:client:*:*:1.0', 'dependencies.control-objects', 'iqs-services-controlobjects:client:*:*:1.0', 'dependencies.zones', 'iqs-services-zones:client:*:*:1.0', 'dependencies.current-object-states', 'iqs-services-currobjectstates:client:*:*:1.0', 'dependencies.current-device-states', 'iqs-services-currdevicestates:client:*:*:1.0', 'dependencies.object-positions', 'pip-services-positions:client:*:*:1.0', 'dependencies.object-states', 'iqs-services-objectstates:client:*:*:1.0', 'dependencies.object-data', 'pip-services-transducerdata:client:*:*:1.0', 'dependencies.attendance', 'iqs-services-attendance:client:*:*:1.0', 'dependencies.rosters', 'iqs-services-rosters:client:*:*:1.0', 'dependencies.event-generation', 'iqs-services-eventgeneration:client:*:*:1.0', 'dependencies.route-analysis', 'pip-services-routeanalysis:client:*:*:1.0', 'dependencies.statistics', 'pip-services-statistics:client:*:*:1.0');
//# sourceMappingURL=ExternalDependenciesResolver.js.map