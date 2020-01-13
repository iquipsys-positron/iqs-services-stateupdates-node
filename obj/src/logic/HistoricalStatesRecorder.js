"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
let _ = require('lodash');
let async = require('async');
class HistoricalStatesRecorder {
    constructor() {
        this._stateInterval = 60; // 1 min
        this._dumpCacheInterval = 5;
        this._cache = [];
    }
    setDependencies(dependencies) {
        this._dependencies = dependencies;
    }
    configure(config) {
        this._stateInterval = config.getAsIntegerWithDefault('options.state_interval', this._stateInterval);
        this._dumpCacheInterval = config.getAsIntegerWithDefault('options.dump_cache_interval', this._dumpCacheInterval);
    }
    recordDue(state) {
        // Calculate duration since last position write
        let oldTime = state.state_time != null ? state.state_time.getTime() : 0;
        let newTime = state.time.getTime();
        let elapsed = (newTime - oldTime) / 1000;
        return elapsed >= this._stateInterval;
    }
    recordState(correlationId, state, force, callback) {
        // When no client or object then skip
        if (this._dependencies.statesClient == null
            || state.object_id == null) {
            callback(null);
            return;
        }
        // Maintain interval to save
        if (!force && !this.recordDue(state)) {
            callback(null);
            return;
        }
        // Update state recorded time
        state.state_time = state.time;
        // Create historical state
        let zoneIds = _.map(state.zones, z => z.zone_id);
        let historicalState = {
            org_id: state.org_id,
            time: state.time,
            device_id: state.device_id,
            object_id: state.object_id,
            assign_id: state.assign_id,
            pos: state.pos,
            alt: state.alt,
            speed: state.speed,
            angle: state.angle,
            online: state.online,
            freezed: state.freezed,
            immobile: state.immobile,
            pressed: state.pressed,
            long_pressed: state.long_pressed,
            power: state.power,
            group_ids: state.group_ids,
            zone_ids: zoneIds,
            params: state.params,
            events: state.events,
            commands: state.commands,
            states: state.states,
            extra: state.extra
        };
        // Save object state
        this._cache.push(historicalState);
        if (state.assign_id != null && state.assigner) {
            // Alter historical state for assigned object
            historicalState = _.clone(historicalState);
            historicalState.assign_id = state.object_id;
            historicalState.object_id = state.assign_id;
            this._cache.push(historicalState);
        }
        if (this._dumpCacheInterval == 0 || this._cache.length > 100)
            this.dumpCache(correlationId, callback);
        else
            callback(null);
    }
    recordStates(correlationId, states, force, callback) {
        if (states == null || states.length == 0) {
            callback(null);
            return;
        }
        async.each(states, (state, callback) => {
            this.recordState(correlationId, state, force, callback);
        }, callback);
    }
    dumpCache(correlationId, callback) {
        if (this._cache.length == 0) {
            callback(null);
            return;
        }
        let states = this._cache;
        this._cache = [];
        this._dependencies.statesClient.addStates(correlationId, null, states, (err) => {
            if (err)
                this._cache.push(...states);
            callback(err);
        });
    }
}
exports.HistoricalStatesRecorder = HistoricalStatesRecorder;
//# sourceMappingURL=HistoricalStatesRecorder.js.map