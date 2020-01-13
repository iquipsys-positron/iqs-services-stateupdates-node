"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pip_services3_commons_node_1 = require("pip-services3-commons-node");
const pip_services3_commons_node_2 = require("pip-services3-commons-node");
const pip_services3_commons_node_3 = require("pip-services3-commons-node");
const pip_services3_commons_node_4 = require("pip-services3-commons-node");
const StateUpdateV1Schema_1 = require("../data/version1/StateUpdateV1Schema");
class StateUpdatesCommandSet extends pip_services3_commons_node_1.CommandSet {
    constructor(logic) {
        super();
        this._logic = logic;
        // Register commands to the database
        this.addCommand(this.makeBeginUpdateStateCommand());
        this.addCommand(this.makeUpdateStateCommand());
    }
    makeBeginUpdateStateCommand() {
        return new pip_services3_commons_node_2.Command("begin_update_state", new pip_services3_commons_node_3.ObjectSchema(true)
            .withRequiredProperty('state_update', new StateUpdateV1Schema_1.StateUpdateV1Schema()), (correlationId, args, callback) => {
            let stateUpdate = args.get("state_update");
            stateUpdate.time = pip_services3_commons_node_4.DateTimeConverter.toNullableDateTime(stateUpdate.time);
            this._logic.beginUpdateState(correlationId, stateUpdate, (err) => {
                callback(err, null);
            });
        });
    }
    makeUpdateStateCommand() {
        return new pip_services3_commons_node_2.Command("update_state", new pip_services3_commons_node_3.ObjectSchema(true)
            .withRequiredProperty('state_update', new StateUpdateV1Schema_1.StateUpdateV1Schema()), (correlationId, args, callback) => {
            let stateUpdate = args.get("state_update");
            stateUpdate.time = pip_services3_commons_node_4.DateTimeConverter.toNullableDateTime(stateUpdate.time);
            this._logic.updateState(correlationId, stateUpdate, callback);
        });
    }
}
exports.StateUpdatesCommandSet = StateUpdatesCommandSet;
//# sourceMappingURL=StateUpdatesCommandSet.js.map