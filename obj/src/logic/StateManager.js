"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
let _ = require('lodash');
let async = require('async');
let geojson = require('geojson-utils');
const pip_services3_commons_node_1 = require("pip-services3-commons-node");
const pip_services3_commons_node_2 = require("pip-services3-commons-node");
const iqs_clients_devices_node_1 = require("iqs-clients-devices-node");
const RosterManager_1 = require("./RosterManager");
const DateTimeConverter_1 = require("pip-services3-commons-node/obj/src/convert/DateTimeConverter");
class StateManager {
    constructor() {
        // private _offlineTimeout: number = 300; // 5 min
        // todo: 15min ?
        this._offlineTimeout = 900; // 15 min
        this._immobileThreshold = 10; // 10 meters
        this._immobileTimeout = 300; // 5 min
    }
    setDependencies(dependencies) {
        this._dependencies = dependencies;
    }
    configure(config) {
        this._config = config;
        this._offlineTimeout = config.getAsIntegerWithDefault('options.offline_timeout', this._offlineTimeout);
        this._immobileThreshold = config.getAsIntegerWithDefault('options.immobile_threshold', this._immobileThreshold);
        this._immobileTimeout = config.getAsIntegerWithDefault('options.immobile_timeout', this._immobileTimeout);
    }
    createInitialState(device, time) {
        return {
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
    getDevice(correlationId, deviceId, organizationData, callback) {
        let device = _.find(organizationData.devices, d => d.id == deviceId);
        let err = null;
        // Enforce device to be found
        if (err == null && device == null) {
            err = new pip_services3_commons_node_2.NotFoundException(correlationId, 'DEVICE_NOT_FOUND', 'Device ' + deviceId + ' was not found').withDetails('device_id', deviceId);
        }
        callback(err, device);
    }
    getActiveDevice(correlationId, deviceId, organizationData, callback) {
        this.getDevice(correlationId, deviceId, organizationData, (err, device) => {
            // Check if device is not active
            if (err == null && device && device.status != iqs_clients_devices_node_1.DeviceStatusV1.Active) {
                err = new pip_services3_commons_node_1.UnauthorizedException(correlationId, 'DEVICE_INACTIVE', 'Device ' + deviceId + ' is not active').withDetails('device_id', deviceId);
            }
            callback(err, err == null ? device : null);
        });
    }
    getOldState(correlationId, stateUpdate, organizationData, callback) {
        let device;
        let oldState;
        async.series([
            // Get a device
            (callback) => {
                this.getDevice(correlationId, stateUpdate.device_id, organizationData, (err, data) => {
                    device = data;
                    callback(err);
                });
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
    calculateAssignedObject(newState, organizationData) {
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
        }
        else {
            newState.assigner = true;
        }
        // Update assigned object information
        let assign = _.find(organizationData.objects, o => o.id == newState.assign_id);
        if (newState.assigner && assign != null) {
            newState.group_ids = newState.group_ids || [];
            newState.group_ids = newState.group_ids.concat(assign.group_ids || []);
        }
        else {
            newState.assign_id = null;
            newState.assigner = false;
            // assign_time = null
        }
        return newState;
    }
    calculateNewState(device, oldState, stateUpdate, organizationData) {
        let newState = _.clone(oldState);
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
        }
        else {
            newState.group_ids = [];
        }
        // Init assigned objects
        newState.assign_id = null;
        newState.assign_time = null;
        newState.assigner = false;
        newState.assignee = false;
        // Find and set assigned object
        let rosterManager = new RosterManager_1.RosterManager();
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
        }
        else {
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
        }
        else {
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
        else
            newState.freezed = 0;
        // Update immobile duration
        if (newState.pos != null) {
            if (newState.im_pos != null && newState.im_time != null && newState.connected == false) {
                let distance = geojson.pointDistance(newState.pos, newState.im_pos);
                let timeout = (newState.time.getTime() - newState.im_time.getTime()) / 1000;
                if (distance <= this._immobileThreshold) {
                    if (timeout >= this._immobileTimeout) {
                        newState.immobile = newState.immobile > 0 ? newState.immobile + duration : 1;
                    }
                }
                else {
                    newState.immobile = 0;
                    newState.im_pos = newState.pos;
                    newState.im_time = newState.time;
                }
            }
            else {
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
    getNewState(correlationId, oldState, stateUpdate, organizationData, callback) {
        let device;
        let newState;
        async.series([
            // Get a device
            (callback) => {
                this.getActiveDevice(correlationId, stateUpdate.device_id, organizationData, (err, data) => {
                    device = data;
                    callback(err);
                });
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
    getRosterObjectIds(roster) {
        let objectIds = [];
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
    getOfflineStates(roster, organizationData) {
        if (roster == null)
            return [];
        let states = [];
        let objectIds = this.getRosterObjectIds(roster);
        // Define offline cutoff time
        let organization = organizationData.organization || {};
        let now = new Date();
        // todo: take timeout from propery this._offlineTimeout
        // let offlineTimeout = (organization.offline_timeout || 900) * 1000;
        let offlineTimeout = (organization.offline_timeout || this._offlineTimeout) * 1000;
        let offlineTime = now.getTime() - offlineTimeout;
        for (let objectId of objectIds) {
            let onlineState = null;
            let offlineState = null;
            for (let state of organizationData.states) {
                if (state.object_id != objectId && state.assign_id != objectId)
                    continue;
                let stateTime = DateTimeConverter_1.DateTimeConverter.toDateTime(state.time).getTime();
                // If state wasn't updated a lot time
                if (stateTime > offlineTime)
                    onlineState = state;
                else
                    offlineState = state;
            }
            // If this object is online then skip
            if (onlineState)
                continue;
            // Create a fake offline state
            if (offlineState == null) {
                offlineState = {
                    id: objectId,
                    org_id: organizationData.org_id,
                    device_id: null,
                    object_id: objectId,
                    time: now,
                    online: 0,
                    offline: offlineTimeout / 1000
                };
            }
            else {
                let duration = (now.getTime() - DateTimeConverter_1.DateTimeConverter.toDateTime(offlineState.time).getTime()) / 1000;
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
exports.StateManager = StateManager;
//# sourceMappingURL=StateManager.js.map