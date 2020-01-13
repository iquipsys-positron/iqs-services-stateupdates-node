"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
let _ = require('lodash');
let async = require('async');
let moment = require('moment-timezone');
const pip_services3_commons_node_1 = require("pip-services3-commons-node");
const pip_services3_commons_node_2 = require("pip-services3-commons-node");
class RosterManager {
    setDependencies(dependencies) {
        this._dependencies = dependencies;
    }
    configure(config) {
    }
    getShiftRoster(time, organizationData) {
        let roster = _.find(organizationData.rosters, (r) => r.start_time.getTime() <= time.getTime()
            && r.end_time.getTime() > time.getTime()
            && r.shift_id != null);
        return roster;
    }
    getAllDayRoster(time, organizationData) {
        // Get existing roster
        let roster = _.find(organizationData.rosters, (r) => r.start_time.getTime() <= time.getTime()
            && r.end_time.getTime() > time.getTime()
            && r.shift_id == null);
        return roster;
    }
    defineAssignedObject(newState, organizationData) {
        // Find assigned object in shift roster
        let roster = this.getShiftRoster(newState.time, organizationData);
        let assign = roster != null
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
    defineExpected(newState, organizationData) {
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
    getCurrentShiftRosters(correlationId, skip, take, callback) {
        if (this._dependencies.rostersClient == null) {
            callback(null, []);
        }
        let filterParams = pip_services3_commons_node_1.FilterParams.fromTuples('time', new Date(), 'shift', true);
        let pagingParams = new pip_services3_commons_node_2.PagingParams(skip, take, false);
        return this._dependencies.rostersClient.getRosters(correlationId, null, filterParams, pagingParams, (err, page) => {
            callback(err, page ? page.data : null);
        });
    }
    getRosterObjectIds(roster) {
        let objectIds = [];
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
exports.RosterManager = RosterManager;
//# sourceMappingURL=RosterManager.js.map