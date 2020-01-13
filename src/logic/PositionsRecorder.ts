let _ = require('lodash');
let async = require('async');

import { ConfigParams } from 'pip-services3-commons-node';
import { IConfigurable } from 'pip-services3-commons-node';

import { CurrentObjectStateV1 } from 'iqs-clients-currobjectstates-node';
import { ObjectPositionsV1 } from 'pip-clients-positions-node';
import { ObjectPositionV1 } from 'pip-clients-positions-node';

import { ExternalDependencies } from './ExternalDependencies';

export class PositionsRecorder implements IConfigurable {
    private _dependencies: ExternalDependencies;
    private _positionsInterval: number = 5; //60; // 1 min
    private _dumpCacheInterval: number = 5;
    private _cache: ObjectPositionV1[] = [];

    public setDependencies(dependencies: ExternalDependencies) {
        this._dependencies = dependencies;
    }

    public configure(config: ConfigParams): void {
        this._positionsInterval = config.getAsIntegerWithDefault('options.pos_interval', this._positionsInterval);
        this._dumpCacheInterval = config.getAsIntegerWithDefault('options.dump_cache_interval', this._dumpCacheInterval);
    }

    public recordPositions(correlationId: string, state: CurrentObjectStateV1,
        callback: (err: any) => void): void {
        // When no client or object then skip
        if (this._dependencies.statesClient == null 
            || state.object_id == null) {
            callback(null);
            return;
        }

        // When position is not defined then skip
        if (state.pos == null || state.pos.coordinates.length == 0) {
            callback(null);
            return;
        }

        // Calculate duration since last state write
        let oldTime = state.pos_time != null ? state.pos_time.getTime() : 0;
        let newTime = state.time.getTime();
        let elapsed = (newTime - oldTime) / 1000;

        // Maintain interval to save
        if (elapsed < this._positionsInterval) {
            callback(null);
            return;
        }

        // Update positions recorded time
        state.pos_time = state.time;

        // Save position
        this._cache.push(<ObjectPositionV1>{ 
            org_id: state.org_id,
            object_id: state.object_id,
            time: state.time,
            lat: state.pos.coordinates[1],
            lng: state.pos.coordinates[0],
            alt: state.alt,
            speed: state.speed,
            angle: state.angle
        });

        if (state.assign_id != null && state.assigner) {
            this._cache.push(<ObjectPositionV1>{ 
                org_id: state.org_id,
                object_id: state.assign_id,
                time: state.time,
                lat: state.pos.coordinates[1],
                lng: state.pos.coordinates[0],
                alt: state.alt,
                speed: state.speed,
                angle: state.angle
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

        let positions = this._cache;
        this._cache = [];

        async.parallel([
            // Save historical positions
            (callback) => {
                this._dependencies.positionsClient.addPositions(correlationId, null, positions, callback);
            },
            // Trigger route analysis
            (callback) => {
                let pos = _.map(positions, d => {
                    delete d.start_time;
                    delete d.end_time;
                    return d;
                });
                this._dependencies.routesAnalysisClient.addPositions(correlationId, null, pos, callback);
            }
        ], (err) => {
            if (err)
                this._cache.push(...positions);
            callback(err);        
        });
    }
    
}