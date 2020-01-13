"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
let _ = require('lodash');
let async = require('async');
const iqs_clients_devices_node_1 = require("iqs-clients-devices-node");
class SensorDataManager {
    setDependencies(dependencies) {
        this._dependencies = dependencies;
    }
    configure(config) {
        this._config = config;
    }
    getDeviceProfile(correlationId, deviceId, organizationData) {
        // Search for device        
        let device = _.find(organizationData.devices, d => d.id == deviceId);
        if (device == null)
            return null;
        // Define profile id
        let profileId = device.profile_id;
        if (profileId == null) {
            // Backward compatible profiles
            if (device.type == iqs_clients_devices_node_1.DeviceTypeV1.Smartphone)
                profileId = 'smartphone';
            else if (device.type == iqs_clients_devices_node_1.DeviceTypeV1.Simulated)
                profileId = 'iqx';
            else if (device.type == iqs_clients_devices_node_1.DeviceTypeV1.IoTDevice)
                profileId = 'iqx';
            else if (device.type == iqs_clients_devices_node_1.DeviceTypeV1.TeltonikaFmb)
                profileId = 'teltonika_fmbx';
        }
        // Search in base profiles
        let profile = _.find(organizationData.base_device_profiles, p => p.id == profileId);
        if (profile)
            return profile;
        // Search in regular profiles
        profile = _.find(organizationData.device_profiles, p => p.id == profileId);
        return profile;
    }
    calculateParameters(profile, stateUpdate) {
        if (stateUpdate.params == null || stateUpdate.params.length == 0)
            return null;
        let newValues = [];
        for (let value of stateUpdate.params) {
            // Create a raw value
            let newValue = {
                id: value.id,
                typ: null,
                val: value.val
            };
            // Perform conversion
            if (profile != null) {
                let param = _.find(profile.params, p => p.id == newValue.id);
                if (param != null) {
                    newValue.typ = param.type;
                    if (param.scale != null && param.scale != 0)
                        newValue.val = newValue.val * param.scale;
                    if (param.offset != null && param.offset != 0)
                        newValue.val = newValue.val + param.offset;
                }
            }
            newValues.push(newValue);
        }
        return newValues;
    }
    calculateEvents(profile, stateUpdate) {
        if (stateUpdate.events == null || stateUpdate.events.length == 0)
            return null;
        let newValues = [];
        for (let value of stateUpdate.events) {
            // Create a raw value
            let newValue = {
                id: value.id,
                typ: null,
                val: value.val
            };
            // Perform conversion
            if (profile != null) {
                let event = _.find(profile.events, p => p.id == newValue.id);
                if (event != null) {
                    newValue.typ = event.type;
                    if (event.scale != null && event.scale != 0)
                        newValue.val = newValue.val * event.scale;
                    if (event.offset != null && event.offset != 0)
                        newValue.val = newValue.val + event.offset;
                }
            }
            newValues.push(newValue);
        }
        return newValues;
    }
    calculateSensorData(correlationId, newState, stateUpdate, organizationData) {
        // Find device profile
        let profile = this.getDeviceProfile(correlationId, newState.device_id, organizationData);
        // Calculate values
        newState.params = this.calculateParameters(profile, stateUpdate);
        newState.events = this.calculateEvents(profile, stateUpdate);
        newState.commands = null;
        // Todo: Calculate states
    }
}
exports.SensorDataManager = SensorDataManager;
//# sourceMappingURL=SensorDataManager.js.map