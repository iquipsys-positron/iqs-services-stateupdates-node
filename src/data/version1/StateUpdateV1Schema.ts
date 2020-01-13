import { ObjectSchema } from 'pip-services3-commons-node';
import { ArraySchema } from 'pip-services3-commons-node';
import { TypeCode } from 'pip-services3-commons-node';

import { StateUpdateDataValueV1Schema } from './StateUpdateDataValueV1Schema';

export class StateUpdateV1Schema extends ObjectSchema {
    public constructor() {
        super();
        this.withOptionalProperty('id', TypeCode.String);
        this.withRequiredProperty('org_id', TypeCode.String);
        this.withRequiredProperty('device_id', TypeCode.String);

        this.withOptionalProperty('freezed', TypeCode.Boolean);
        this.withOptionalProperty('pressed', TypeCode.Boolean);
        this.withOptionalProperty('long_pressed', TypeCode.Boolean);
        this.withOptionalProperty('power', TypeCode.Boolean);

        this.withOptionalProperty('time', null); //TypeCode.DateTime);
        this.withOptionalProperty('lat', TypeCode.Float);
        this.withOptionalProperty('lng', TypeCode.Float);
        this.withOptionalProperty('alt', TypeCode.Float);
        this.withOptionalProperty('angle', TypeCode.Float);
        this.withOptionalProperty('speed', TypeCode.Float);

        this.withOptionalProperty('params', new ArraySchema(new StateUpdateDataValueV1Schema()));
        this.withOptionalProperty('events', new ArraySchema(new StateUpdateDataValueV1Schema()));

        this.withOptionalProperty('beacons', new ArraySchema(TypeCode.String));
    }
}
