let _ = require('lodash');
let async = require('async');

import { ConfigParams } from 'pip-services3-commons-node';
import { IConfigurable } from 'pip-services3-commons-node';
import { UnauthorizedException } from 'pip-services3-commons-node';
import { NotFoundException } from 'pip-services3-commons-node';

import { DeviceTypeV1 } from 'iqs-clients-devices-node';
import { DeviceProfileV1 } from 'iqs-clients-deviceprofiles-node';
import { SensorParameterV1 } from 'iqs-clients-deviceprofiles-node';
import { SensorEventV1 } from 'iqs-clients-deviceprofiles-node';
import { DeviceStatusV1 } from 'iqs-clients-devices-node';
import { ObjectStateV1 } from 'iqs-clients-objectstates-node';
import { ObjectStateDataValueV1 } from 'iqs-clients-objectstates-node';
import { CurrentObjectStateV1 } from 'iqs-clients-currobjectstates-node';

import { StateUpdateV1 } from '../data/version1/StateUpdateV1';
import { OrganizationData } from './OrganizationData';
import { ExternalDependencies } from './ExternalDependencies';

export class SensorDataManager implements IConfigurable {
    private _dependencies: ExternalDependencies;
    private _config: ConfigParams;

    public setDependencies(dependencies: ExternalDependencies) {
        this._dependencies = dependencies;
    }

    public configure(config: ConfigParams): void {
        this._config = config;
    }

    private getDeviceProfile(correlationId: string, deviceId: string, organizationData: OrganizationData): DeviceProfileV1 {
        // Search for device        
        let device = _.find(organizationData.devices, d => d.id == deviceId);
        if (device == null) return null;

        // Define profile id
        let profileId = device.profile_id;
        if (profileId == null) {
            // Backward compatible profiles
            if (device.type == DeviceTypeV1.Smartphone)
                profileId = 'smartphone';
            else if (device.type == DeviceTypeV1.Simulated)
                profileId = 'iqx';
            else if (device.type == DeviceTypeV1.IoTDevice)
                profileId = 'iqx';
            else if (device.type == DeviceTypeV1.TeltonikaFmb)
                profileId = 'teltonika_fmbx';
        }

        // Search in base profiles
        let profile = _.find(organizationData.base_device_profiles, p => p.id == profileId);
        if (profile) return profile;

        // Search in regular profiles
        profile = _.find(organizationData.device_profiles, p => p.id == profileId);
        return profile;
    }
    
    private calculateParameters(profile: DeviceProfileV1, stateUpdate: StateUpdateV1): ObjectStateDataValueV1[] {
        if (stateUpdate.params == null || stateUpdate.params.length == 0) return null;

        let newValues: ObjectStateDataValueV1[] = [];

        for (let value of stateUpdate.params) {
            // Create a raw value
            let newValue: ObjectStateDataValueV1 = {
                id: value.id,
                typ: null,
                val: value.val
            };

            // Perform conversion
            if (profile != null) {
                let param: SensorParameterV1 = _.find(profile.params, p => p.id == newValue.id);
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

    private calculateEvents(profile: DeviceProfileV1, stateUpdate: StateUpdateV1): ObjectStateDataValueV1[] {
        if (stateUpdate.events == null || stateUpdate.events.length == 0) return null;

        let newValues: ObjectStateDataValueV1[] = [];

        for (let value of stateUpdate.events) {
            // Create a raw value
            let newValue: ObjectStateDataValueV1 = {
                id: value.id,
                typ: null,
                val: value.val
            };

            // Perform conversion
            if (profile != null) {
                let event: SensorEventV1 = _.find(profile.events, p => p.id == newValue.id);
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

    public calculateSensorData(correlationId: string, newState: CurrentObjectStateV1,
        stateUpdate: StateUpdateV1, organizationData: OrganizationData): void {

        // Find device profile
        let profile = this.getDeviceProfile(correlationId, newState.device_id, organizationData);

        // Calculate values
        newState.params = this.calculateParameters(profile, stateUpdate);
        newState.events = this.calculateEvents(profile, stateUpdate);
        newState.commands = null;

        // Todo: Calculate states
    }

}