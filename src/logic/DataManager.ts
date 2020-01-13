let _ = require('lodash');
let async = require('async');

import { ConfigParams } from 'pip-services3-commons-node';
import { IConfigurable } from 'pip-services3-commons-node';
import { FilterParams } from 'pip-services3-commons-node';

import { DeviceV1 } from 'iqs-clients-devices-node';
import { ObjectStateV1 } from 'iqs-clients-objectstates-node';
import { CurrentObjectStateV1 } from 'iqs-clients-currobjectstates-node';
import { RosterV1 } from 'iqs-clients-rosters-node';

import { StateUpdateV1 } from '../data/version1/StateUpdateV1';
import { OrganizationData } from './OrganizationData';
import { ExternalDependencies } from './ExternalDependencies';

export class DataManager implements IConfigurable {
    private _dependencies: ExternalDependencies;
    private _shortCacheTimeout: number = 60; // 1 min
    private _longCacheTimeout: number = 300; // 5 min
    private _cache: { [orgId: string]: OrganizationData } = {};

    public setDependencies(dependencies: ExternalDependencies) {
        this._dependencies = dependencies;
    }

    public configure(config: ConfigParams): void {
        this._shortCacheTimeout = config.getAsIntegerWithDefault('options.short_cache_timeout', this._shortCacheTimeout);
        this._longCacheTimeout = config.getAsIntegerWithDefault('options.long_cache_timeout', this._longCacheTimeout);
    }

    private getCachedData(orgId: string): OrganizationData {
        // Get data from cache
        let data = this._cache[orgId];

        // Create a new data item if its not in cache
        if (data == null) {
            data = new OrganizationData();
            data.org_id = orgId;
            data.lng_update_time = new Date(0);
            data.short_update_time = new Date(0);

            this._cache[orgId] = data;
        }

        return data;
    }

    private loadLongLivingData(correlationId: string, data: OrganizationData,
        callback: (err: any) => void): void {

        let filter = FilterParams.fromTuples(
            'org_id', data.org_id,
            //'active', true,
            'deleted', false
        );

        async.parallel([
            (callback) => {
                this._dependencies.organizationsClient.getOrganizationById(
                    correlationId, data.org_id,
                        (err, organization) => {
                            data.organization = organization;
                            callback(err);
                        }
                );
            },
            (callback) => {
                this._dependencies.dataProfilesClient.getProfile(
                    correlationId, data.org_id,
                        (err, profile) => {
                            data.data_profile = profile;
                            callback(err);
                        }
                );
            },
            (callback) => {
                this._dependencies.devicesClient.getDevices(
                    correlationId, filter, null,
                        (err, page) => {
                            if (page)
                                data.devices = page.data;
                            callback(err);
                        }
                );
            },
            (callback) => {
                this._dependencies.deviceProfilesClient.getBaseProfiles(
                    correlationId,
                        (err, profiles) => {
                            data.base_device_profiles = profiles;
                            callback(err);
                        }
                );
            },
            (callback) => {
                this._dependencies.deviceProfilesClient.getProfiles(
                    correlationId, filter, null,
                        (err, page) => {
                            if (page)
                                data.device_profiles = page.data;
                            callback(err);
                        }
                );
            },
            (callback) => {
                this._dependencies.objectsClient.getObjects(
                    correlationId, filter, null,
                        (err, page) => {
                            if (page)
                                data.objects = page.data;
                            callback(err);
                        }
                );
            },
            (callback) => {
                this._dependencies.zonesClient.getZones(
                    correlationId, filter, null,
                        (err, page) => {
                            if (page)
                                data.zones = page.data;
                            callback(err);
                        }
                );
            },
            (callback) => {
                let fromTime = new Date(new Date().getTime() - 24 * 60 * 60000); // 1 day
                let toTime = new Date(new Date().getTime() + 24 * 60 * 60000); // 1 day
                let filter = FilterParams.fromTuples(
                    'org_id', data.org_id,
                    'from_time', fromTime,
                    'to_time', toTime,
                );

                this._dependencies.rostersClient.getRosters(
                    correlationId, data.org_id, filter, null, 
                    (err, page) => {
                        if (page)
                            data.rosters = page.data;
                        callback(err);
                    }
                );
            }
        ], (err) => {
            if (err == null)
                data.lng_update_time = new Date();
            callback(err);
        });
    }

    private loadShortLivingData(correlationId: string, data: OrganizationData,
        callback: (err: any) => void): void {
        
        async.parallel([
            (callback) => {
                let fromTime = data.states && data.states.length > 0
                    ? new Date(new Date().getTime() - 15 * 60000) : null; // 15 min
                let filter = FilterParams.fromTuples(
                    'org_id', data.org_id,
                    'from_time', fromTime
                );

                this._dependencies.currentStatesClient.getStates(
                    correlationId, data.org_id, filter, null, 
                    (err, page) => {
                        if (page) {
                            data.states = _.filter(data.states, (s) => {
                                let item = _.find(page.data, s1 => s1.id == s.id);
                                return item == null;
                            });
                            data.states = data.states.concat(page.data);
                        }
                        callback(err);
                    }
                );
            }
        ], (err) => {
            if (err == null)
                data.short_update_time = new Date();
            callback(err);
        });
    }

    public loadData(correlationId: string, orgId: string,
        callback: (err: any, data: OrganizationData) => void): void {
        
        let data = this.getCachedData(orgId);

        async.parallel([
            (callback) => {
                // If cache isn't expired then skip loading
                let elapsed = (new Date().getTime() - data.lng_update_time.getTime()) / 1000;
                if (elapsed >= this._longCacheTimeout) {
                    this.loadLongLivingData(correlationId, data, callback);
                } else {
                    callback();
                }
            },
            (callback) => {
                // If cache isn't expired then skip loading
                let elapsed = (new Date().getTime() - data.short_update_time.getTime()) / 1000;
                if (elapsed >= this._shortCacheTimeout) {
                    this.loadShortLivingData(correlationId, data, callback);
                } else {
                    callback();
                }
            }
        ], (err) => {
            callback(err, data);
        })
    }

    public forceLoadData(correlationId: string, orgId: string, deviceId: string,
        callback: (err: any, data: OrganizationData) => void): void {
        
        let data = this.getCachedData(orgId);

        async.parallel([
            (callback) => {
                this.loadLongLivingData(correlationId, data, callback);
            },
            (callback) => {
                this.loadShortLivingData(correlationId, data, callback);
            }
        ], (err) => {
            callback(err, data);
        })
    }
    
    private setAndCacheState(correlationId: string, state: CurrentObjectStateV1,
        callback: (err: any) => void): void {

        // Update state inside cache
        let organizationData = this.getCachedData(state.org_id);
        if (organizationData != null) {
            organizationData.states = _.filter(organizationData.states, s => s.device_id != state.device_id);
            organizationData.states.push(state);
        }

        this._dependencies.currentStatesClient.setState(
            correlationId, state.org_id, state, callback
        );
    }

    public saveState(correlationId: string, state: CurrentObjectStateV1,
        callback: (err: any) => void): void {

        let states = [state];

        // Update state of assigned object
        if (state.assign_id != null && state.assigner) {
            state = _.clone(state);
            state.id = state.assign_id;
            state.assign_id = state.object_id;
            state.object_id = state.id;
            state.assigner = false;
            state.assignee = true;

            states.push(state);
        }

        this.saveStates(correlationId, states, callback);
    }

    public saveStates(correlationId: string, states: CurrentObjectStateV1[],
        callback: (err: any) => void): void {
        
        async.each(states, (state, callback) => {
            this.setAndCacheState(correlationId, state, callback);
        }, callback);
    }
    
    public clearStaleData(): void {
        for (let prop in this._cache) {
            let data = this._cache[prop];

            let elapsed = (new Date().getTime() - data.lng_update_time.getTime()) / 1000;
            if (elapsed < this._longCacheTimeout)
                delete this._cache[prop];
        }
    }

    public clear(): void {
        this._cache = {};
    }

}