let _ = require('lodash');
let async = require('async');

import { ConfigParams } from 'pip-services3-commons-node';
import { IConfigurable } from 'pip-services3-commons-node';

import { CurrentObjectStateV1 } from 'iqs-clients-currobjectstates-node';
import { ObjectDataV1 } from 'pip-clients-transducerdata-node';

import { ExternalDependencies } from './ExternalDependencies';

export class DataRecorder implements IConfigurable {
    private _dependencies: ExternalDependencies;
    private _dumpCacheInterval: number = 5;
    private _cache: ObjectDataV1[] = [];

    public setDependencies(dependencies: ExternalDependencies) {
        this._dependencies = dependencies;
    }

    public configure(config: ConfigParams): void {
        this._dumpCacheInterval = config.getAsIntegerWithDefault('options.dump_cache_interval', this._dumpCacheInterval);
    }

    public recordData(correlationId: string, state: CurrentObjectStateV1,
        callback: (err: any) => void): void {
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
        this._cache.push(<ObjectDataV1>{ 
            org_id: state.org_id,
            object_id: state.object_id,
            time: state.time,
            params: state.params,
            events: state.events,
            commands: state.commands,
            states: state.states
        });

        if (state.assign_id != null && state.assigner) {
            this._cache.push(<ObjectDataV1>{ 
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
        else callback(null);
    }

    public dumpCache(correlationId: string, callback: (err: any) => void): void {
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