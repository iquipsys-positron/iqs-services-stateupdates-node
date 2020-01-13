let _ = require('lodash');
let async = require('async');
let geojson = require('geojson-utils');

import { ConfigParams } from 'pip-services3-commons-node';
import { IConfigurable } from 'pip-services3-commons-node';
import { IdGenerator } from 'pip-services3-commons-node';

import { OrganizationV1 } from 'pip-clients-organizations-node';
import { ZonePresenceV1 } from 'iqs-clients-currobjectstates-node';
import { CurrentObjectStateV1 } from 'iqs-clients-currobjectstates-node';

import { StatCounterIncrementV1 } from 'pip-clients-statistics-node';

import { StateUpdateV1 } from '../data/version1/StateUpdateV1';
import { OrganizationData } from './OrganizationData';
import { ExternalDependencies } from './ExternalDependencies';

export class StatisticsRecorder implements IConfigurable {
    private _dependencies: ExternalDependencies;
    private _dumpCacheInterval: number = 5;
    private _cache: StatCounterIncrementV1[] = [];

    public setDependencies(dependencies: ExternalDependencies) {
        this._dependencies = dependencies;
    }

    public configure(config: ConfigParams): void {
        this._dumpCacheInterval = config.getAsIntegerWithDefault('options.dump_cache_interval', this._dumpCacheInterval);
    }

    public generateUsageIncrements(organization: OrganizationV1,
        oldState: CurrentObjectStateV1, newState: CurrentObjectStateV1): StatCounterIncrementV1[] {
        let increments: StatCounterIncrementV1[] = [];
        let time = newState.time;

        increments.push(<StatCounterIncrementV1>{
            group: newState.org_id, name: 'state_updates.all',
            time: time, timezone: organization.timezone, value: 1
        });
        increments.push(<StatCounterIncrementV1>{
            group: newState.org_id, name: 'state_updates.' + newState.device_id,
            time: time, timezone: organization.timezone, value: 1
        });

        return increments;
    }

    public generateErrorIncrements(organization: OrganizationV1, stateUpdate: StateUpdateV1): StatCounterIncrementV1[] {
        let increments: StatCounterIncrementV1[] = [];
        let time = new Date();
        let orgId = organization ? organization.id : 'unknown_organization';
        let timezone = organization ? organization.timezone : 'UTC';

        increments.push(<StatCounterIncrementV1>{
            group: orgId, name: 'state_errors.all',
            time: time, timezone: timezone, value: 1
        });
        increments.push(<StatCounterIncrementV1>{
            group: orgId, name: 'state_errors.' + stateUpdate.device_id,
            time: time, timezone: timezone, value: 1
        });

        return increments;
    }
    
    public generateParamIncrements(organization: OrganizationV1,
        oldState: CurrentObjectStateV1, newState: CurrentObjectStateV1): StatCounterIncrementV1[] {
        let increments: StatCounterIncrementV1[] = [];

        // Calculate object parametes
        let time = newState.time;
        let distance = oldState.pos != null && newState.pos != null ?
            geojson.pointDistance(oldState.pos, newState.pos) : 0;
        let online = Math.max(0, newState.online - oldState.online);
        let freezed = Math.max(0, newState.freezed - oldState.freezed);
        let immobile = Math.max(0, newState.immobile - oldState.immobile);
        let speed = newState.speed * online;

        // Define all zone ids
        let zoneIds = _.map(newState.zones, z => z.zone_id);
        zoneIds = ['all'].concat(zoneIds);

        // Define all object and group ids
        let objectIds = ['all', newState.object_id].concat(newState.group_ids || []);
        if (newState.assign_id != null && newState.assigner)
            objectIds.push(newState.assign_id);

        // Generate parameters for object, groups and zones
        for (let objectId of objectIds) {
            for (let zoneId of zoneIds) {
                if (distance > 0) {
                    increments.push(<StatCounterIncrementV1>{
                        group: newState.org_id, name: 'params.' + objectId + '.' + zoneId + '.distance',
                        time: time, timezone: organization.timezone, value: distance
                    });
                }
                if (online > 0) {
                    increments.push(<StatCounterIncrementV1>{
                        group: newState.org_id, name: 'params.' + objectId + '.' + zoneId + '.online',
                        time: time, timezone: organization.timezone, value: online
                    });
                }
                if (freezed > 0) {
                    increments.push(<StatCounterIncrementV1>{
                        group: newState.org_id, name: 'params.' + objectId + '.' + zoneId + '.freezed',
                        time: time, timezone: organization.timezone, value: freezed
                    });
                }
                if (immobile > 0) {
                    increments.push(<StatCounterIncrementV1>{
                        group: newState.org_id, name: 'params.' + objectId + '.' + zoneId + '.immobile',
                        time: time, timezone: organization.timezone, value: immobile
                    });
                }
                if (speed > 0) {
                    increments.push(<StatCounterIncrementV1>{
                        group: newState.org_id, name: 'params.' + objectId + '.' + zoneId + '.speed',
                        time: time, timezone: organization.timezone, value: speed
                    });
                }
            }
        }

        return increments;
    }

    public generatePresenceIncrements(organization: OrganizationV1,
        oldState: CurrentObjectStateV1, newState: CurrentObjectStateV1): StatCounterIncrementV1[] {
        let increments: StatCounterIncrementV1[] = [];

        // Define all object, group and zone ids
        let ids = ['all', newState.object_id].concat(newState.group_ids || []);
        if (newState.assign_id != null && newState.assigner)
            ids.push(newState.assign_id);
        let time = newState.time;
        
        // Generate specific events for object, groups and zones
        for (let id of ids) {
            let total = 0;

            for (let newZone of newState.zones) {
                let duration = newZone.duration;
                let oldZone = _.find(oldState.zones, z => z.zone_id == newZone.zone_id);
                if (oldZone)
                    duration = duration - oldZone.duration;
                total += duration;
                
                if (duration > 0) {
                    increments.push(<StatCounterIncrementV1>{
                        group: newState.org_id, name: 'presence.' + id + '.' + newZone.zone_id,
                        time: time, timezone: organization.timezone, value: duration
                    });
                }
            }

            if (total > 0) {
                increments.push(<StatCounterIncrementV1>{
                    group: newState.org_id, name: 'presence.' + id + '.all',
                    time: time, timezone: organization.timezone, value: total
                });
            }
        }

        return increments;
    }

    public generateIncrements(organization: OrganizationV1,
        oldState: CurrentObjectStateV1, newState: CurrentObjectStateV1): StatCounterIncrementV1[] {
        let increments: StatCounterIncrementV1[] = [];

        let usageIncrements = this.generateUsageIncrements(organization, oldState, newState);
        let paramIncrements = this.generateParamIncrements(organization, oldState, newState);
        let presenceIncrements = this.generatePresenceIncrements(organization, oldState, newState);
        
        increments = increments.concat(usageIncrements, paramIncrements, presenceIncrements);

        return increments;
    }

    public recordStatistics(correlationId: string, oldState: CurrentObjectStateV1, newState: CurrentObjectStateV1,
        organizationData: OrganizationData, callback: (err: any) => void): void {
        // If object is not defined then skip
        if (newState.object_id == null) {
            callback(null);
            return;
        }

        // Generate increments
        let increments = this.generateIncrements(organizationData.organization, oldState, newState);

        // Skip if nothing to record
        if (increments.length == 0) {
            callback(null);
            return;
        }

        this._cache.push(...increments);

        if (this._dumpCacheInterval == 0 || this._cache.length > 100)
            this.dumpCache(correlationId, callback);
        else callback(null);
    }

    public recordErrorStats(correlationId: string, organization: OrganizationV1, stateUpdate: StateUpdateV1,
        callback: (err: any) => void): void {
        // If object is not defined then skip
        if (stateUpdate == null) {
            callback(null);
            return;
        }

        // Generate increments
        let increments = this.generateErrorIncrements(organization, stateUpdate);

        // Skip if nothing to record
        if (increments.length == 0) {
            callback(null);
            return;
        }

        this._cache.push(...increments);

        if (this._dumpCacheInterval == 0)
            this.dumpCache(correlationId, callback);
        else callback(null);
    }

    public dumpCache(correlationId: string, callback: (err: any) => void): void {
        if (this._cache.length == 0) {
            callback(null);
            return;
        }

        let increments = this._cache;
        this._cache = [];

        this._dependencies.statisticsClient.incrementCounters(
            correlationId, increments, (err) => {
                if (err)
                    this._cache.push(...increments);
                callback(err);
            }
        );
    }
    
}