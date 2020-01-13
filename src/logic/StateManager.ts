let _ = require('lodash');
let async = require('async');
let geojson = require('geojson-utils');

import { ConfigParams } from 'pip-services3-commons-node';
import { IConfigurable } from 'pip-services3-commons-node';
import { UnauthorizedException } from 'pip-services3-commons-node';
import { NotFoundException } from 'pip-services3-commons-node';

import { DeviceV1 } from 'iqs-clients-devices-node';
import { DeviceStatusV1 } from 'iqs-clients-devices-node';
import { ObjectStateV1 } from 'iqs-clients-objectstates-node';
import { CurrentObjectStateV1 } from 'iqs-clients-currobjectstates-node';

import { RosterV1 } from 'iqs-clients-rosters-node';
import { RosterObjectV1 } from 'iqs-clients-rosters-node';

import { StateUpdateV1 } from '../data/version1/StateUpdateV1';
import { OrganizationData } from './OrganizationData';
import { ExternalDependencies } from './ExternalDependencies';
import { RosterManager } from './RosterManager';
import { DateTimeConverter } from 'pip-services3-commons-node/obj/src/convert/DateTimeConverter';

export class StateManager implements IConfigurable {
    private _dependencies: ExternalDependencies;
    private _config: ConfigParams;
    // private _offlineTimeout: number = 300; // 5 min
    // todo: 15min ?
    private _offlineTimeout: number = 900; // 15 min
    private _immobileThreshold: number = 10; // 10 meters
    private _immobileTimeout: number = 300; // 5 min

    public setDependencies(dependencies: ExternalDependencies) {
        this._dependencies = dependencies;
    }

    public configure(config: ConfigParams): void {
        this._config = config;
        this._offlineTimeout = config.getAsIntegerWithDefault('options.offline_timeout', this._offlineTimeout);
        this._immobileThreshold = config.getAsIntegerWithDefault('options.immobile_threshold', this._immobileThreshold);
        this._immobileTimeout = config.getAsIntegerWithDefault('options.immobile_timeout', this._immobileTimeout);
    }

    private createInitialState(device: DeviceV1, time: Date): CurrentObjectStateV1 {
        return <CurrentObjectStateV1> {
            id: device.object_id,
            org_id: device.org_id,
            device_id: device.id,
            object_id: device.object_id,
            time: time || new Date(),
            online: 0,
            offline: 0,
            freezed: 0
        };
    }

    private getDevice(correlationId: string, deviceId: string, organizationData: OrganizationData,
        callback: (err: any, device: DeviceV1) => void): void {
        let device = _.find(organizationData.devices, d => d.id == deviceId);
        let err = null;

        // Enforce device to be found
        if (err == null && device == null) {
            err = new NotFoundException(
                correlationId, 
                'DEVICE_NOT_FOUND', 
                'Device ' + deviceId + ' was not found'
            ).withDetails('device_id', deviceId);
        }
        
        callback(err, device);
    }

    private getActiveDevice(correlationId: string, deviceId: string, organizationData: OrganizationData,
        callback: (err: any, device: DeviceV1) => void): void {

        this.getDevice(correlationId, deviceId, organizationData, (err, device) => {
            // Check if device is not active
            if (err == null && device && device.status != DeviceStatusV1.Active) {
                err = new UnauthorizedException(
                    correlationId, 
                    'DEVICE_INACTIVE',
                    'Device ' + deviceId + ' is not active'
                ).withDetails('device_id', deviceId);
            }
            
            callback(err, err == null ? device : null);
        });
    }
    
    public getOldState(correlationId: string, stateUpdate: StateUpdateV1, organizationData: OrganizationData,
        callback: (err: any, state: CurrentObjectStateV1) => void): void {

        let device: DeviceV1;
        let oldState: CurrentObjectStateV1;

        async.series([
            // Get a device
            (callback) => {
                this.getDevice(correlationId, stateUpdate.device_id, organizationData,
                    (err, data) => {
                        device = data;
                        callback(err);
                    }
                );
            },
            // Retrieve previous object state and define a new state
            (callback) => {
                if (device.object_id != null) {
                    oldState = _.find(organizationData.states, s => s.id == device.object_id);
                    if (oldState == null)
                        oldState = this.createInitialState(device, stateUpdate.time);
                }
                callback();
            }
        ], (err) => {
            callback(err, err == null ? oldState : null);
        });
    }

    private calculateAssignedObject(newState: CurrentObjectStateV1, organizationData: OrganizationData): CurrentObjectStateV1 {
        if (newState.assign_id == null)
            return newState;

        // Find and process state for the assigned object
        let assignState = _.find(organizationData.states, s => s.object_id == newState.assign_id);
        if (assignState) {
            let organization = organizationData.organization;
            let offline_timeout = organization && organization.params
                ? organization.params['offline_timeout'] || this._offlineTimeout : this._offlineTimeout;
            let timeout = (newState.time.getTime() - assignState.time.getTime()) / 1000;
            let device = _.find(organizationData.devices, d => d.object_id == newState.assign_id);
            // If assigned object has own active state then do not process
            newState.assigner = timeout >= offline_timeout || device == null;
        } else {
            newState.assigner = true;
        }

        // Update assigned object information
        let assign = _.find(organizationData.objects, o => o.id == newState.assign_id);
        if (newState.assigner && assign != null) {
            newState.group_ids = newState.group_ids || [];
            newState.group_ids = newState.group_ids.concat(assign.group_ids || []);
        } else {
            newState.assign_id = null;
            newState.assigner = false;
            // assign_time = null
        }
        
        return newState;
    }
    
    private calculateNewState(device: DeviceV1, oldState: CurrentObjectStateV1,
        stateUpdate: StateUpdateV1, organizationData: OrganizationData): CurrentObjectStateV1 {
        
        let newState: CurrentObjectStateV1 = _.clone(oldState);

        // Calculate duration since last time
        let duration = (stateUpdate.time.getTime() - oldState.time.getTime()) / 1000;

        // Update time and device
        newState.time = stateUpdate.time;
        newState.device_id = device.id;

        // Store state update for references
        newState.extra = stateUpdate;

        // Update object information
        let object = _.find(organizationData.objects, o => o.id == newState.object_id);
        if (object != null) {
            newState.group_ids = object.group_ids || [];
        } else {
            newState.group_ids = [];
        }

        // Init assigned objects
        newState.assign_id = null;
        newState.assign_time = null;
        newState.assigner = false;
        newState.assignee = false;
        
        // Find and set assigned object
        let rosterManager = new RosterManager();
        rosterManager.setDependencies(this._dependencies);
        rosterManager.configure(this._config);
        rosterManager.defineAssignedObject(newState, organizationData);
        rosterManager.defineExpected(newState, organizationData);
        
        // Update position
        if (stateUpdate.lat != null && stateUpdate.lng != null
            && stateUpdate.lat != NaN && stateUpdate.lng != NaN) {
            newState.pos = { type: 'Point', coordinates: [stateUpdate.lng, stateUpdate.lat] };
            newState.alt = stateUpdate.alt != null ? stateUpdate.alt : null;
            newState.angle = stateUpdate.angle != null ? stateUpdate.angle : null;
            newState.speed = stateUpdate.speed != null ? stateUpdate.speed : null;

            // save last position
            newState.last_pos = newState.pos;
            newState.last_pos_time = newState.time;
        } else {
            newState.pos = null;
            newState.alt = null;
            newState.angle = null;
            newState.speed = null;
        }

        // For device coming back online drop durations
        let offlineTimeout = organizationData.organization.params 
            ? organizationData.organization.params['offline_timeout'] || this._offlineTimeout
            : this._offlineTimeout;
        if (duration >= offlineTimeout) {
            newState.connected = true;
            newState.online = 0;
            newState.freezed = 0;
            newState.immobile = 0;
        } else {
            newState.connected = false;
        }

        // Save presses
        newState.pressed = stateUpdate.pressed || null;
        newState.long_pressed = stateUpdate.long_pressed || null;
        newState.beacons = stateUpdate.beacons;

        // Calculate power change
        oldState.power = oldState.power != null ? oldState.power : null;
        stateUpdate.power = stateUpdate.power != null ? stateUpdate.power : true;
        newState.power = stateUpdate.power;
        newState.power_changed = oldState.power != null && stateUpdate.power != null
            && oldState.power != stateUpdate.power;

        // Update online duration
        newState.online = newState.online > 0 ? newState.online + duration : 1;
        newState.offline = 0;

        // Update freezed duration
        if (stateUpdate.freezed)
            newState.freezed = newState.freezed > 0 ? newState.freezed + duration : 1;
        else newState.freezed = 0;

        // Update immobile duration
        if (newState.pos != null) {
            if (newState.im_pos != null && newState.im_time != null && newState.connected == false) {
                let distance = geojson.pointDistance(newState.pos, newState.im_pos);
                let timeout = (newState.time.getTime() - newState.im_time.getTime()) / 1000;
                if (distance <= this._immobileThreshold) {
                    if (timeout >= this._immobileTimeout) {
                        newState.immobile = newState.immobile > 0 ? newState.immobile + duration : 1;
                    }
                } else {
                    newState.immobile = 0;
                    newState.im_pos = newState.pos;
                    newState.im_time = newState.time;
                }
            } else {
                newState.immobile = 0;
                newState.im_pos = newState.pos;
                newState.im_time = newState.time;
            }
        }

        return newState;
    }

    // public checkStateChanged(oldState: CurrentObjectStateV1, newState: CurrentObjectStateV1) {
    //     // Connected state changed
    //     if (oldState.connected != newState.connected)
    //         return true;

    //     // Disconnected
    //     if (oldState.online > 0 && newState.online == 0)
    //         return true;

    //     // Become freezed
    //     if (oldState.freezed == 0 && newState.freezed > 0)
    //         return true;

    //     // Started actions
    //     if (oldState.freezed > 0 && newState.freezed == 0)
    //         return true;

    //     // Pressed buttons
    //     if (newState.pressed || newState.long_pressed)
    //         return true;

    //     // Power changed
    //     if (oldState.power != newState.power)
    //         return true;
    
    //     return false;
    // }

    public getNewState(correlationId: string, oldState: CurrentObjectStateV1, stateUpdate: StateUpdateV1, organizationData: OrganizationData,
        callback: (err: any, state: CurrentObjectStateV1) => void): void {

        let device: DeviceV1;
        let newState: CurrentObjectStateV1;

        async.series([
            // Get a device
            (callback) => {
                this.getActiveDevice(correlationId, stateUpdate.device_id, organizationData,
                    (err, data) => {
                        device = data;
                        callback(err);
                    }
                );
            },
            // Retrieve previous object state and define a new state
            (callback) => {
                newState = this.calculateNewState(device, oldState, stateUpdate, organizationData);
                newState = this.calculateAssignedObject(newState, organizationData);
                callback();
            }
        ], (err) => {
            callback(err, err == null ? newState : null);
        });
    }

    private getRosterObjectIds(roster: RosterV1): string[] {
        let objectIds: string[] = [];
        
        // Define ids of objects that shall be present
        for (let object of roster.objects) {
            if (object.object_id)
                objectIds.push(object.object_id);
            if (object.assign_id)
                objectIds.push(object.assign_id);
        }
        objectIds = _.uniq(objectIds);

        return objectIds;
    }

    public getOfflineStates(roster: RosterV1, organizationData: OrganizationData): CurrentObjectStateV1[] {
        if (roster == null) return [];

        let states: CurrentObjectStateV1[] = [];
        let objectIds: string[] = this.getRosterObjectIds(roster);

        // Define offline cutoff time
        let organization: any = organizationData.organization || {};
        let now = new Date();

        // todo: take timeout from propery this._offlineTimeout
        // let offlineTimeout = (organization.offline_timeout || 900) * 1000;
        let offlineTimeout = (organization.offline_timeout || this._offlineTimeout) * 1000;
        let offlineTime = now.getTime() - offlineTimeout;
        
        for (let objectId of objectIds) {
            let onlineState: CurrentObjectStateV1 = null;
            let offlineState: CurrentObjectStateV1 = null;

            for (let state of organizationData.states) {
                if (state.object_id != objectId && state.assign_id != objectId)
                    continue;
                
                let stateTime = DateTimeConverter.toDateTime(state.time).getTime();
                // If state wasn't updated a lot time
                if (stateTime > offlineTime)
                    onlineState = state;
                else
                    offlineState = state;
            }

            // If this object is online then skip
            if (onlineState) continue;

            // Create a fake offline state
            if (offlineState == null) {
                offlineState = {
                    id: objectId,
                    org_id: organizationData.org_id,
                    device_id: null, // todo: current attached device?
                    object_id: objectId,
                    time: now,
                    online: 0,
                    offline: offlineTimeout / 1000
                };
            } else {
                let duration = (now.getTime() - DateTimeConverter.toDateTime(offlineState.time).getTime()) / 1000;
                offlineState.offline = duration;
            }

            offlineState.time = now;
            offlineState.connected = false;
            offlineState.expected = true;
            offlineState.online = 0;
            offlineState.freezed = 0;
            offlineState.pressed = false;
            offlineState.long_pressed = false;
            offlineState.power = null;
            offlineState.power_changed = false;
            offlineState.assign_id = null;
            offlineState.assign_time = null;
            offlineState.assigner = false;
            offlineState.assignee = false;
   
            states.push(offlineState);
        }

        return states;
    }

}