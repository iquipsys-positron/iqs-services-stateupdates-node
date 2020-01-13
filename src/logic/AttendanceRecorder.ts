let _ = require('lodash');
let async = require('async');
let moment = require('moment-timezone');

import { ConfigParams } from 'pip-services3-commons-node';
import { IConfigurable } from 'pip-services3-commons-node';

import { CurrentObjectStateV1 } from 'iqs-clients-currobjectstates-node';
import { AttendanceV1 } from 'iqs-clients-attendance-node';

import { ExternalDependencies } from './ExternalDependencies';

export class AttendanceRecorder implements IConfigurable {
    private _dependencies: ExternalDependencies;
    private _attendanceInterval: number = 60; // 1 min
    private _dumpCacheInterval: number = 5;
    private _cache: AttendanceV1[] = [];

    public setDependencies(dependencies: ExternalDependencies) {
        this._dependencies = dependencies;
    }

    public configure(config: ConfigParams): void {
        this._attendanceInterval = config.getAsIntegerWithDefault('options.attend_interval', this._attendanceInterval);
        this._dumpCacheInterval = config.getAsIntegerWithDefault('options.dump_cache_interval', this._dumpCacheInterval);
    }

    public recordAttendance(correlationId: string, state: CurrentObjectStateV1,
        callback: (err: any) => void): void {
        // When no client or object then skip
        if (this._dependencies.attendanceClient == null 
            || state.object_id == null) {
            callback(null);
            return;
        }

        // Calculate duration since last state write
        let oldTime = state.attend_time != null ? state.attend_time.getTime() : 0;
        let newTime = state.time.getTime();
        let elapsed = (newTime - oldTime) / 1000;

        // Maintain interval to save
        if (elapsed < this._attendanceInterval) {
            callback(null);
            return;
        }

        // Update attendance recorded time
        state.attend_time = state.time;
        state.attend_start = state.attend_start || state.time;

        let startDay = moment(state.time).utc().startOf('day').toDate();
        // For comming from offline in new day reset start time
        if (startDay.getTime() > state.attend_start.getTime() && state.online == 0)
            state.attend_start = state.attend_time;
        // For more then 24+1 hours start from start day
        if (elapsed > 25 * 3600)
            state.attend_start = startDay;

        // Save attendance
        this._cache.push(<AttendanceV1>{ 
            org_id: state.org_id,
            object_id: state.object_id,
            start_time: state.attend_start,
            end_time: state.attend_time
        });

        if (state.assign_id != null && !state.assigner) {
            // Calculate start time for the assign object
            let startTime = state.assign_time != null
                && state.assign_time.getTime() > state.attend_start.getTime()
                ? state.assign_time : state.attend_start;

            this._cache.push(<AttendanceV1>{ 
                org_id: state.org_id,
                object_id: state.assign_id,
                start_time: startTime,
                end_time: state.attend_time
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

        let attendances = this._cache;
        this._cache = [];

        this._dependencies.attendanceClient.addAttendances(correlationId, null, attendances, (err) => {
            if (err)
                this._cache.push(...attendances);
            callback(err);
        });
    }
    
}