let _ = require('lodash');
let async = require('async');
let geojson = require('geojson-utils'); 

import { ConfigParams } from 'pip-services3-commons-node';
import { IConfigurable } from 'pip-services3-commons-node';

import { ZoneV1 } from 'iqs-clients-zones-node';
import { ZoneTypeV1 } from 'iqs-clients-zones-node';
import { ControlObjectV1 } from 'iqs-clients-controlobjects-node';
import { ZonePresenceV1 } from 'iqs-clients-currobjectstates-node';
import { CurrentObjectStateV1 } from 'iqs-clients-currobjectstates-node';

import { StateUpdateV1 } from '../data/version1/StateUpdateV1';
import { OrganizationData } from './OrganizationData';
import { ExternalDependencies } from './ExternalDependencies';

export class ZoneCalculator implements IConfigurable {
    private _dependencies: ExternalDependencies;

    public setDependencies(dependencies: ExternalDependencies) {
        this._dependencies = dependencies;
    }

    public configure(config: ConfigParams): void {
    }

    private checkInCircleZone(state: CurrentObjectStateV1, zone: ZoneV1): boolean {
        if (state.pos == null || zone.center == null) return false;
        return geojson.pointDistance(state.pos, zone.center) <= zone.distance;
    }

    private checkInPolygonZone(state: CurrentObjectStateV1, zone: ZoneV1): boolean {
        if (state.pos == null || zone.geometry == null) return false;
        return geojson.pointInPolygon(state.pos, zone.geometry);
    }

    public polylineDistance(point: any, polyline: any): number {
        let distance = null;

        // Calculate first point
        let p1 = { type: "Point", coordinates: polyline.coordinates[0] };
        let d1 = geojson.pointDistance(p1, point);
        let ds1 = d1 * d1;

        for (let index = 1; index < polyline.coordinates.length; index++) {
            // Calculate next point
            let p2 = { type: "Point", coordinates: polyline.coordinates[index] };
            let d2 = geojson.pointDistance(p2, point);
            let ds2 = d2 * d2;

            // Calculate between points
            let d3 = geojson.pointDistance(p1, p2);
            let ds3 = d3 * d3;

            // 1/2 of perimeter
            let p = (d1 + d2 + d3) / 2;
            // Area according to Heron formula
            let as = p * (p - d1) * (p - d2) * (p - d3);
            let a = as > 0 ? Math.sqrt(as) : 0;
            // Distance to line
            let d = d3 != 0 && a != 0 ? 2 * a / d3 : Math.min(d1, d2);

            // Distance outside of triangle
            if (ds1 > (ds3 + ds2))
                d = d2;
            else if (ds2 > (ds3 + ds1))
                d = d1;

            distance = distance && distance < d ? distance : d; 

            // Transition to the next point
            p1 = p2;
            d1 = d2;
            ds1 = ds2;
        };

        return distance;
    }

    private checkInLineZone(state: CurrentObjectStateV1, zone: ZoneV1): boolean {
        if (state.pos == null || zone.geometry == null) return false;
        return this.polylineDistance(state.pos, zone.geometry) <= zone.distance;
    }

    private contains(values1: string[], values2: string[]): boolean {
        return _.find(values2, v => _.indexOf(values1, v) >= 0) != null;
    }

    private checkObjectMatch(state: CurrentObjectStateV1, zone: ZoneV1): boolean {
        if (state.pos == null) return false;
        if (state.object_id == null) return false;

        if (_.indexOf(zone.exclude_object_ids, state.object_id) >= 0) return false;
        if (this.contains(zone.exclude_group_ids, state.group_ids)) return false;

        if (_.indexOf(zone.include_object_ids, state.object_id) >= 0) return true;
        if (this.contains(zone.include_group_ids, state.group_ids)) return true;

        // Todo: add all_objects flag?
        return (zone.include_object_ids || []).length == 0
            && (zone.include_group_ids || []).length == 0;
    }

    private checkInObjectZone(state: CurrentObjectStateV1, zone: ZoneV1, organizationData: OrganizationData): boolean {
        let foundState = _.find(organizationData.states, s => {
            if (state.pos == null || s.pos == null)
                return false;

            if (this.checkObjectMatch(s, zone)) {
                let distance = geojson.pointDistance(state.pos, s.pos);
                return distance <= zone.distance;
            }
            
            return false;
        });
        return foundState != null;
    }
    
    private checkInZone(state: CurrentObjectStateV1, zone: ZoneV1, organizationData: OrganizationData): boolean {
        switch (zone.type) {
            case ZoneTypeV1.Circle:
                return this.checkInCircleZone(state, zone);
            case ZoneTypeV1.Polygon:
                return this.checkInPolygonZone(state, zone);
            case ZoneTypeV1.Line:
                return this.checkInLineZone(state, zone);
            case ZoneTypeV1.Object:
                return this.checkInObjectZone(state, zone, organizationData);
            default:
                return false;
        }
    }

    private calculateCurrentZones(oldState: CurrentObjectStateV1,
        newState: CurrentObjectStateV1, organizationData: OrganizationData): void {

        // If there is no point then skip
        if (newState.pos == null) return;

        let duration = (newState.time.getTime() - oldState.time.getTime()) / 1000;
        
        // Calculate current zone presence
        organizationData.zones = organizationData.zones || [];
        for (let zone of organizationData.zones) {
            if (this.checkInZone(newState, zone, organizationData)) {
                let oldPresence: ZonePresenceV1 = _.find(oldState.zones, z => z.zone_id == zone.id && !z.exited);

                // If object wasn't in this zone before then start counting at 0 sec
                let zoneDuration = oldPresence != null ? oldPresence.duration + duration : 1;

                let newPresence: ZonePresenceV1 = {
                    zone_id: zone.id,
                    duration: zoneDuration,
                    entered: oldPresence == null,
                    exited: false
                };

                newState.zones.push(newPresence);
            }
        }
    }

    private calculateExitedZones(oldState: CurrentObjectStateV1,
        newState: CurrentObjectStateV1, organizationData: OrganizationData): void {

        oldState.zones = oldState.zones || [];
        for (let oldPresence of oldState.zones) {
            if (oldPresence.exited) continue;

            // Find current presences
            let newPresence: ZonePresenceV1 = _.find(newState.zones, z => z.zone_id == oldPresence.zone_id);

            // If zone is not currently present then add it as exited
            if (newPresence == null) {
                newPresence = {
                    zone_id: oldPresence.zone_id,
                    duration: oldPresence.duration,
                    entered: false,
                    exited: true
                };

                newState.zones.push(newPresence);
            }
        }
    }

    public calculateZones(oldState: CurrentObjectStateV1,
        newState: CurrentObjectStateV1, organizationData: OrganizationData): void {
        newState.zones = [];
        this.calculateCurrentZones(oldState, newState, organizationData);
        this.calculateExitedZones(oldState, newState, organizationData);
    }
}