"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pip_services3_commons_node_1 = require("pip-services3-commons-node");
const pip_services3_commons_node_2 = require("pip-services3-commons-node");
const pip_services3_commons_node_3 = require("pip-services3-commons-node");
const StateUpdateDataValueV1Schema_1 = require("./StateUpdateDataValueV1Schema");
class StateUpdateV1Schema extends pip_services3_commons_node_1.ObjectSchema {
    constructor() {
        super();
        this.withOptionalProperty('id', pip_services3_commons_node_3.TypeCode.String);
        this.withRequiredProperty('org_id', pip_services3_commons_node_3.TypeCode.String);
        this.withRequiredProperty('device_id', pip_services3_commons_node_3.TypeCode.String);
        this.withOptionalProperty('freezed', pip_services3_commons_node_3.TypeCode.Boolean);
        this.withOptionalProperty('pressed', pip_services3_commons_node_3.TypeCode.Boolean);
        this.withOptionalProperty('long_pressed', pip_services3_commons_node_3.TypeCode.Boolean);
        this.withOptionalProperty('power', pip_services3_commons_node_3.TypeCode.Boolean);
        this.withOptionalProperty('time', null); //TypeCode.DateTime);
        this.withOptionalProperty('lat', pip_services3_commons_node_3.TypeCode.Float);
        this.withOptionalProperty('lng', pip_services3_commons_node_3.TypeCode.Float);
        this.withOptionalProperty('alt', pip_services3_commons_node_3.TypeCode.Float);
        this.withOptionalProperty('angle', pip_services3_commons_node_3.TypeCode.Float);
        this.withOptionalProperty('speed', pip_services3_commons_node_3.TypeCode.Float);
        this.withOptionalProperty('params', new pip_services3_commons_node_2.ArraySchema(new StateUpdateDataValueV1Schema_1.StateUpdateDataValueV1Schema()));
        this.withOptionalProperty('events', new pip_services3_commons_node_2.ArraySchema(new StateUpdateDataValueV1Schema_1.StateUpdateDataValueV1Schema()));
        this.withOptionalProperty('beacons', new pip_services3_commons_node_2.ArraySchema(pip_services3_commons_node_3.TypeCode.String));
    }
}
exports.StateUpdateV1Schema = StateUpdateV1Schema;
//# sourceMappingURL=StateUpdateV1Schema.js.map