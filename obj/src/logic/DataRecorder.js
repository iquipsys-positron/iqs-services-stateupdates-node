"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
let _ = require('lodash');
let async = require('async');
class DataRecorder {
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
    recordData(correlationId, state, callback) {
        // When no client or object then skip
        if (this._dependencies.statesClient == null
            || state.object_id == null) {
            callback(null);
            return;
        }
        // When data is not defined then skip
        let hasData = (state.params != null && state.params.length > 0)
            || (state.events != null && state.events.length > 0)
            || (state.commands != null && state.commands.length > 0)
            || (state.states != null && state.states.length > 0);
        if (!hasData) {
            //console.log("!!!!! No data to record !!!!!!");
            callback(null);
            return;
        }
        // Save data
        this._cache.push({
            org_id: state.org_id,
            object_id: state.object_id,
            time: state.time,
            params: state.params,
            events: state.events,
            commands: state.commands,
            states: state.states
        });
        if (state.assign_id != null && state.assigner) {
            this._cache.push({
                org_id: state.org_id,
                object_id: state.assign_id,
                time: state.time,
                params: state.params,
                events: state.events,
                commands: state.commands,
                states: state.states
            });
        }
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
        let data = this._cache;
        this._cache = [];
        this._dependencies.dataClient.addDataBatch(correlationId, null, data, (err) => {
            if (err)
                this._cache.push(...data);
            callback(err);
        });
    }
}
exports.DataRecorder = DataRecorder;
//# sourceMappingURL=DataRecorder.js.map