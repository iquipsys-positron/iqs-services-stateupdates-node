"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pip_services3_commons_node_1 = require("pip-services3-commons-node");
const pip_services3_rpc_node_1 = require("pip-services3-rpc-node");
class StateUpdatesHttpServiceV1 extends pip_services3_rpc_node_1.CommandableHttpService {
    constructor() {
        super('v1/state_updates');
        this._dependencyResolver.put('controller', new pip_services3_commons_node_1.Descriptor('iqs-services-stateupdates', 'controller', 'default', '*', '1.0'));
    }
}
exports.StateUpdatesHttpServiceV1 = StateUpdatesHttpServiceV1;
//# sourceMappingURL=StateUpdatesHttpServiceV1.js.map