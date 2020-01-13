"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
let _ = require('lodash');
let geojson = require('geojson-utils');
const pip_services3_commons_node_1 = require("pip-services3-commons-node");
class StateUpdatesValidator {
    static checkFutureTime(correlationId, stateUpdate, state) {
        if (new Date().getTime() < stateUpdate.time.getTime()) {
            return new pip_services3_commons_node_1.InvalidStateException(correlationId, 'INVALID_UPDATE', 'State update for device ' + stateUpdate.device_id + ' has invalid time').withDetails('device_id', stateUpdate.device_id);
        }
        return null;
    }
    static checkTimeBehind(correlationId, stateUpdate, state) {
        if (state == null)
            return null;
        if (state.time.getTime() > stateUpdate.time.getTime()) {
            return new pip_services3_commons_node_1.InvalidStateException(correlationId, 'OBSOLETE_UPDATE', 'State update for device ' + stateUpdate.device_id + ' is obsolete').withDetails('device_id', stateUpdate.device_id);
        }
        return null;
    }
    static checkTooHighSpeed(correlationId, stateUpdate, state) {
        if (state == null)
            return null;
        if (state.last_pos_time == null)
            return null;
        if (state.last_pos == null || state.last_pos.coordinates == null)
            return null;
        if (stateUpdate.lat == null || stateUpdate.lng == null)
            return null;
        let duration = stateUpdate.time.getTime() - state.last_pos_time.getTime();
        let newPos = {
            type: 'Point',
            coordinates: [stateUpdate.lng, stateUpdate.lat]
        };
        let distance = geojson.pointDistance(state.last_pos, newPos);
        let speed = distance * 1000 / duration;
        if (speed > StateUpdatesValidator.MAX_SPEED) {
            return new pip_services3_commons_node_1.InvalidStateException(correlationId, 'SPEED_TOO_HIGH', 'Detected speed exceeds maximum limit. Speed: ' + speed).withDetails('device_id', stateUpdate.device_id);
        }
        return null;
    }
    static checkOutOfOrganization(correlationId, stateUpdate, state, organizationData) {
        if (state == null)
            return null;
        if (stateUpdate.lat == null || stateUpdate.lng == null)
            return null;
        let organization = organizationData.organization;
        if (!organization || !organization.center || !organization.center.coordinates || !organization.radius)
            return null;
        let radius = organization.radius * 1000; // meters
        let newPos = {
            type: 'Point',
            coordinates: [stateUpdate.lng, stateUpdate.lat]
        };
        let distance = geojson.pointDistance(organization.center, newPos);
        if (distance > radius * StateUpdatesValidator.OUT_OF_SITE_DELTA) {
            return new pip_services3_commons_node_1.InvalidStateException(correlationId, 'OUT_OF_SITE', 'Detected coordinates out of organization').withDetails('device_id', stateUpdate.device_id);
        }
        return null;
    }
    static validate(correlationId, stateUpdate, state, organizationData) {
        let err;
        err = this.checkOutOfOrganization(correlationId, stateUpdate, state, organizationData);
        if (err)
            return err;
        err = this.checkFutureTime(correlationId, stateUpdate, state);
        if (err)
            return err;
        err = this.checkTimeBehind(correlationId, stateUpdate, state);
        if (err)
            return err;
        err = this.checkTooHighSpeed(correlationId, stateUpdate, state);
        if (err)
            return err;
        return null;
    }
}
exports.StateUpdatesValidator = StateUpdatesValidator;
StateUpdatesValidator.MAX_SPEED = 60; // meter per seconds
StateUpdatesValidator.OUT_OF_SITE_DELTA = 1.2; // 20% out of organization 
//# sourceMappingURL=StateUpdatesValidator.js.map