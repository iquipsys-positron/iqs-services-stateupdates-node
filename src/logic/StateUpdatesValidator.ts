let _ = require('lodash');
let geojson = require('geojson-utils'); 

import { OrganizationData } from './OrganizationData';
import { InvalidStateException } from 'pip-services3-commons-node';
import { CurrentObjectStateV1 } from 'iqs-clients-currobjectstates-node';
import { StateUpdateV1 } from '../data/version1/StateUpdateV1';

export class StateUpdatesValidator {
    private static MAX_SPEED = 60; // meter per seconds
    private static OUT_OF_SITE_DELTA = 1.2; // 20% out of organization 
    
    private static checkFutureTime(correlationId: string,
        stateUpdate: StateUpdateV1, state: CurrentObjectStateV1): any {

        if (new Date().getTime() < stateUpdate.time.getTime()) {
            return new InvalidStateException(
                correlationId,
                'INVALID_UPDATE',
                'State update for device ' + stateUpdate.device_id + ' has invalid time'
            ).withDetails('device_id', stateUpdate.device_id);
        }

        return null;
    }

    private static checkTimeBehind(correlationId: string,
        stateUpdate: StateUpdateV1, state: CurrentObjectStateV1): any {
        if (state == null) return null;

        if (state.time.getTime() > stateUpdate.time.getTime()) {
            return new InvalidStateException(
                correlationId,
                'OBSOLETE_UPDATE',
                'State update for device ' + stateUpdate.device_id + ' is obsolete'
            ).withDetails('device_id', stateUpdate.device_id);
        }

        return null;
    }

    private static checkTooHighSpeed(correlationId: string,
        stateUpdate: StateUpdateV1, state: CurrentObjectStateV1): any {
        if (state == null) return null;
        if (state.last_pos_time == null) return null;
        if (state.last_pos == null || state.last_pos.coordinates == null) return null;
        if (stateUpdate.lat == null || stateUpdate.lng == null) return null;
                
        let duration = stateUpdate.time.getTime() - state.last_pos_time.getTime();
        let newPos = {
            type: 'Point',
            coordinates: [ stateUpdate.lng, stateUpdate.lat ]
        };
        let distance = geojson.pointDistance(state.last_pos, newPos);
        let speed = distance * 1000 / duration;

        if (speed > StateUpdatesValidator.MAX_SPEED) {
            return new InvalidStateException(
                correlationId,
                'SPEED_TOO_HIGH',
                'Detected speed exceeds maximum limit. Speed: ' + speed
            ).withDetails('device_id', stateUpdate.device_id);
        }

        return null;
    }
    
    private static checkOutOfOrganization(correlationId: string, stateUpdate: StateUpdateV1, 
        state: CurrentObjectStateV1, organizationData: OrganizationData): any {
        if (state == null) return null;
        if (stateUpdate.lat == null || stateUpdate.lng == null) return null;
        let organization = organizationData.organization;
        if (!organization || !organization.center || !organization.center.coordinates || !organization.radius) return null;
        
        let radius = organization.radius * 1000; // meters
        let newPos = {
            type: 'Point',
            coordinates: [stateUpdate.lng, stateUpdate.lat]
        };
        let distance = geojson.pointDistance(organization.center, newPos);

        if (distance > radius * StateUpdatesValidator.OUT_OF_SITE_DELTA) {
            return new InvalidStateException(
                correlationId,
                'OUT_OF_SITE',
                'Detected coordinates out of organization'
            ).withDetails('device_id', stateUpdate.device_id);
        }

        return null;
    }

    public static validate(correlationId: string, stateUpdate: StateUpdateV1, 
        state: CurrentObjectStateV1, organizationData: OrganizationData): any {
            let err;
        err = this.checkOutOfOrganization(correlationId, stateUpdate, state, organizationData);
        if (err) return err;

        err = this.checkFutureTime(correlationId, stateUpdate, state);
        if (err) return err;

        err = this.checkTimeBehind(correlationId, stateUpdate, state);
        if (err) return err;

        err = this.checkTooHighSpeed(correlationId, stateUpdate, state);
        if (err) return err;

        return null;
    }

}