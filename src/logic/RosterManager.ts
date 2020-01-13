let _ = require('lodash');
let async = require('async');
let moment = require('moment-timezone');

import { ConfigParams } from 'pip-services3-commons-node';
import { IConfigurable } from 'pip-services3-commons-node';

import { CurrentObjectStateV1 } from 'iqs-clients-currobjectstates-node';
import { RosterV1 } from 'iqs-clients-rosters-node';
import { RosterObjectV1 } from 'iqs-clients-rosters-node';
import { OrganizationV1 } from 'pip-clients-organizations-node';

import { StateUpdateV1 } from '../data/version1/StateUpdateV1';
import { OrganizationData } from './OrganizationData';
import { ExternalDependencies } from './ExternalDependencies';
import { FilterParams } from 'pip-services3-commons-node';
import { PagingParams } from 'pip-services3-commons-node';

export class RosterManager implements IConfigurable {
    private _dependencies: ExternalDependencies;

    public setDependencies(dependencies: ExternalDependencies) {
        this._dependencies = dependencies;
    }

    public configure(config: ConfigParams): void {
    }

    public getShiftRoster(time: Date, organizationData: OrganizationData): RosterV1 {
        let roster: RosterV1 = _.find(
            organizationData.rosters, 
            (r: RosterV1) => 
                r.start_time.getTime() <= time.getTime()
                && r.end_time.getTime() > time.getTime()
                && r.shift_id != null
        );
        return roster;
    }

    public getAllDayRoster(time: Date, organizationData: OrganizationData): RosterV1 {
        // Get existing roster
        let roster: RosterV1 = _.find(
            organizationData.rosters, 
            (r: RosterV1) => 
                r.start_time.getTime() <= time.getTime()
                && r.end_time.getTime() > time.getTime()
                && r.shift_id == null
        );
        return roster;
    }

    public defineAssignedObject(newState: CurrentObjectStateV1, organizationData: OrganizationData): void {
        // Find assigned object in shift roster
        let roster = this.getShiftRoster(newState.time, organizationData);
        let assign: RosterObjectV1 = roster != null
            ? _.find(roster.objects, o => o.assign_id == newState.object_id) : null;
        
        // Find assigned object in all day roster
        if (assign == null) {
            roster = this.getAllDayRoster(newState.time, organizationData);
            assign = roster != null
            ? _.find(roster.objects, o => o.assign_id == newState.object_id) : null;
        }

        // Update assigned object
        newState.assign_id = assign ? assign.object_id : null;
        newState.assign_time = roster ? roster.start_time : null;
    }

    public defineExpected(newState: CurrentObjectStateV1, organizationData: OrganizationData): void {
        // Find object in the shift roster
        let roster = this.getShiftRoster(newState.time, organizationData);
        let object = roster != null
            ? _.find(roster.objects, o => o.object_id == newState.object_id || o.assign_id == newState.object_id) : null;

        // Find object in the all day roster
        if (object == null) {
            roster = this.getAllDayRoster(newState.time, organizationData);
            object = roster != null
                ? _.find(roster.objects, o => o.object_id == newState.object_id || o.assign_id == newState.object_id) : null;    
        }

        // Set expected
        newState.expected = object != null;
    }

    public getCurrentShiftRosters(correlationId: string, skip: number, take: number,
        callback: (err: any, rosters: RosterV1[]) =>void): void{
        if (this._dependencies.rostersClient == null) {
            callback(null, []);
        }

        let filterParams = FilterParams.fromTuples(
            'time', new Date(),
            'shift', true
        );

        let pagingParams = new PagingParams(skip, take, false);

        return this._dependencies.rostersClient.getRosters(
            correlationId, null, filterParams, pagingParams, (err, page) => {
                callback(err, page ? page.data : null)
            }
        )
    }

    public getRosterObjectIds(roster: RosterV1): string[] {
        let objectIds: string[] = [];
        for (let object of roster.objects) {
            if (object.object_id)
                objectIds.push(object.object_id);
            if (object.assign_id)
                objectIds.push(object.assign_id);
        }
        objectIds = _.uniq(objectIds);
        return objectIds;
    }

}