let _ = require('lodash');
let async = require('async');

import { ConfigParams } from 'pip-services3-commons-node';
import { IConfigurable } from 'pip-services3-commons-node';

import { StateUpdateV1 } from '../data/version1/StateUpdateV1';
import { CurrentDeviceStateV1 } from 'iqs-clients-currdevicestates-node';

import { ExternalDependencies } from './ExternalDependencies';

export class DeviceStatesRecorder implements IConfigurable {
    private _dependencies: ExternalDependencies;
    private _dumpCacheInterval: number = 5;
    private _cache: CurrentDeviceStateV1[] = [];

    public setDependencies(dependencies: ExternalDependencies) {
        this._dependencies = dependencies;
    }

    public configure(config: ConfigParams): void {
        this._dumpCacheInterval = config.getAsIntegerWithDefault('options.dump_cache_interval', this._dumpCacheInterval);
    }

    public recordState(correlationId: string, state: StateUpdateV1,
        callback: (err: any) => void): void {

        // When no client or object then skip
        if (this._dependencies.deviceStatesClient == null ) {
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
        let deviceState: CurrentDeviceStateV1 = {
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
        else callback(null);
    }

    public dumpCache(correlationId: string, callback: (err: any) => void): void {
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