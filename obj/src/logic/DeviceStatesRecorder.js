"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
let _ = require('lodash');
let async = require('async');
class DeviceStatesRecorder {
    constructor() {
        this._dumpCacheInterval = 5;
        this._cache = [];
    }
    setDependencies(dependencies) {
        this._dependencies = dependencies;
    }
    configure(config) {
        this._dumpCacheInterval = config.getAsIntegerWithDefault('options.dump_cache_interval', this._dumpCacheInterval);
    }
    recordState(correlationId, state, callback) {
        // When no client or object then skip
        if (this._dependencies.deviceStatesClient == null) {
            callback(null);
            return;
        }
        let pos = null;
        if (state.lat != null && state.lng != null) {
            pos = {
                type: 'Point',
                coordinates: [state.lng, state.lat]
            };
        }
        // Create device state
        let deviceState = {
            id: state.device_id,
            org_id: state.org_id,
            time: state.time,
            pos: pos,
            alt: state.alt,
            speed: state.speed,
            angle: state.angle
        };
        // Save object state
        this._cache = _.filter(this._cache, c => c.id != deviceState.id);
        this._cache.push(deviceState);
        if (this._dumpCacheInterval == 0 || this._cache.length > 100)
            this.dumpCache(correlationId, callback);
        else
            callback(null);
    }
    dumpCache(correlationId, callback) {
        if (this._cache.length == 0) {
            callback(null);
            return;
        }
        let states = this._cache;
        this._cache = [];
        // For local clients stateId is not required
        this._dependencies.deviceStatesClient.setStates(correlationId, null, states, (err) => {
            if (err)
                this._cache.push(...states);
            callback(err);
        });
    }
}
exports.DeviceStatesRecorder = DeviceStatesRecorder;
//# sourceMappingURL=DeviceStatesRecorder.js.map