"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pip_services3_components_node_1 = require("pip-services3-components-node");
const pip_services3_commons_node_1 = require("pip-services3-commons-node");
const StateUpdatesController_1 = require("../logic/StateUpdatesController");
const StateUpdatesHttpServiceV1_1 = require("../services/version1/StateUpdatesHttpServiceV1");
class StateUpdatesServiceFactory extends pip_services3_components_node_1.Factory {
    constructor() {
        super();
        this.registerAsType(StateUpdatesServiceFactory.ControllerDescriptor, StateUpdatesController_1.StateUpdatesController);
        this.registerAsType(StateUpdatesServiceFactory.HttpServiceDescriptor, StateUpdatesHttpServiceV1_1.StateUpdatesHttpServiceV1);
    }
}
exports.StateUpdatesServiceFactory = StateUpdatesServiceFactory;
StateUpdatesServiceFactory.Descriptor = new pip_services3_commons_node_1.Descriptor("iqs-services-stateupdates", "factory", "default", "default", "1.0");
StateUpdatesServiceFactory.ControllerDescriptor = new pip_services3_commons_node_1.Descriptor("iqs-services-stateupdates", "controller", "default", "*", "1.0");
StateUpdatesServiceFactory.HttpServiceDescriptor = new pip_services3_commons_node_1.Descriptor("iqs-services-stateupdates", "service", "http", "*", "1.0");
//# sourceMappingURL=StateUpdatesServiceFactory.js.map