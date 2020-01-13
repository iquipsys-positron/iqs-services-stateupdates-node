let _ = require('lodash');
let async = require('async');
let restify = require('restify');
let assert = require('chai').assert;

import { ConfigParams } from 'pip-services3-commons-node';
import { Descriptor } from 'pip-services3-commons-node';
import { References } from 'pip-services3-commons-node';

import { CurrentObjectStateV1 } from 'iqs-clients-currobjectstates-node';
import { OrganizationV1 } from 'pip-clients-organizations-node';
import { RosterV1 } from 'iqs-clients-rosters-node';

import { TestDependencies } from './TestDependencies';
import { StateUpdateV1 } from '../../src/data/version1/StateUpdateV1';
import { StateUpdatesController } from '../../src/logic/StateUpdatesController';

let STATE1: StateUpdateV1 = {
    org_id: '1',
    device_id: '1',
    time: new Date(new Date().getTime() - 10000),
    lat: 32,
    lng: -110,
    alt: 750,
    angle: 0,
    speed: 1,
    freezed: false
};
let STATE2: StateUpdateV1 = {
    org_id: '1',
    device_id: '2',
    time: new Date(new Date().getTime() - 10000),
    lat: 33,
    lng: -111,
    alt: 750,
    angle: 0,
    speed: 1,
    freezed: false
};
let STATE3: StateUpdateV1 = {
    org_id: '1',
    device_id: '3',
    time: new Date(new Date().getTime() - 10000),
    lat: 33,
    lng: -111,
    alt: 750,
    angle: 0,
    speed: 1,
    freezed: false
};
let STATE4: StateUpdateV1 = {
    org_id: '1',
    device_id: '4',
    time: new Date(new Date().getTime() - 10000),
    lat: 33,
    lng: -111,
    alt: 750,
    angle: 0,
    speed: 1,
    params: [ { id: 1, val: 1 }, { id: 2, val: 1 } ],
    events: [ { id: 1, val: 1 } ]
};

suite('StateUpdatesController', ()=> {    
    let dependencies = new TestDependencies();
    let controller: StateUpdatesController;

    setup(() => {
        dependencies.organizationsClient.createOrganization(
            null, 
            { id: '1', name: 'Test organization', create_time: new Date(), creator_id: null, active: true },
            () => {}
        );

        dependencies.devicesClient.createDevice(
            null, 
            { id: '1', org_id: '1', object_id: '1', udi: '111', type: 'smartphone', status: 'active' }, 
            () => {}
        );
        dependencies.devicesClient.createDevice(
            null, 
            { id: '2', org_id: '1', object_id: '2', udi: '222', type: 'smartphone', status: 'active' }, 
            () => {}
        );
        dependencies.devicesClient.createDevice(
            null, 
            { id: '3', org_id: '1', udi: '333', type: 'unknown', status: 'active' }, 
            () => {}
        );
        dependencies.devicesClient.createDevice(
            null, 
            { id: '4', org_id: '1', object_id: '3', udi: '444', type: 'iot device', profile_id: 'iqx', status: 'active' }, 
            () => {}
        );

        controller = new StateUpdatesController();

        let references: References = References.fromTuples(
            new Descriptor('pip-services-organizations', 'client', 'memory', 'default', '1.0'), dependencies.organizationsClient,
            new Descriptor('iqs-services-dataprofiles', 'client', 'memory', 'default', '1.0'), dependencies.dataProfilesClient,
            new Descriptor('iqs-services-devices', 'client', 'memory', 'default', '1.0'), dependencies.devicesClient,
            new Descriptor('iqs-services-deviceprofiles', 'client', 'memory', 'default', '1.0'), dependencies.deviceProfilesClient,
            new Descriptor('iqs-services-controlobjects', 'client', 'memory', 'default', '1.0'), dependencies.objectsClient,
            new Descriptor('iqs-services-currobjectstates', 'client', 'memory', 'default', '1.0'), dependencies.currentStatesClient,
            new Descriptor('iqs-services-currdevicestates', 'client', 'memory', 'default', '1.0'), dependencies.deviceStatesClient,
            new Descriptor('iqs-services-zones', 'client', 'memory', 'default', '1.0'), dependencies.zonesClient,
            new Descriptor('iqs-services-objectstates', 'client', 'null', 'default', '1.0'), dependencies.statesClient,
            new Descriptor('pip-services-positions', 'client', 'null', 'default', '1.0'), dependencies.positionsClient,
            new Descriptor('pip-services-transducerdata', 'client', 'null', 'default', '1.0'), dependencies.dataClient,
            new Descriptor('iqs-services-attendance', 'client', 'null', 'default', '1.0'), dependencies.attendanceClient,
            new Descriptor('iqs-services-rosters', 'client', 'memory', 'default', '1.0'), dependencies.rostersClient,
            new Descriptor('pip-services-statistics', 'client', 'null', 'default', '1.0'), dependencies.statisticsClient,
            new Descriptor('iqs-services-eventgeneration', 'client', 'null', 'default', '1.0'), dependencies.eventGenerationClient,
            new Descriptor('pip-services-routeanalysis', 'client', 'null', 'default', '1.0'), dependencies.routesAnalysisClient,
            new Descriptor('iqs-services-stateupdates', 'controller', 'default', 'default', '1.0'), controller
        );
        controller.setReferences(references);
    });
    
    test('Update states', (done) => {
        let state1, state2: CurrentObjectStateV1;

        async.series([
        // Create one state
            (callback) => {
                controller.updateState(
                    null, STATE1,
                    (err, state) => {
                        assert.isNull(err);

                        assert.isObject(state);
                        assert.equal(state.org_id, STATE1.org_id);
                        assert.equal(state.online, 1);
                        assert.equal(state.freezed, 0);

                        state1 = state;

                        callback();
                    }
                );
            },
        // Create another state
            (callback) => {
                controller.updateState(
                    null, STATE2,
                    (err, state) => {
                        assert.isNull(err);

                        assert.isObject(state);
                        assert.equal(state.org_id, STATE2.org_id);
                        assert.equal(state.online, 1);
                        assert.equal(state.freezed, 0);

                        state2 = state;

                        callback();
                    }
                );
            },
        // Get all states
            (callback) => {
                dependencies.currentStatesClient.getStates(
                    null, null, null, null,
                    (err, page) => {
                        assert.isNull(err);

                        assert.isObject(page);
                        assert.lengthOf(page.data, 2);

                        callback();
                    }
                );
            },
        // Update the state
            (callback) => {
                let stateUpdate = <StateUpdateV1>{
                    org_id: '1',
                    device_id: '1',
                    time: new Date(),
                    freezed: true
                };

                controller.updateState(
                    null, stateUpdate,
                    (err, state) => {
                        assert.isNull(err);

                        assert.isObject(state);
                        assert.equal(state.org_id, stateUpdate.org_id);
                        assert.isNull(state.pos);
                        assert.isTrue(state.online >= 10);
                        assert.equal(1, state.freezed);

                        state1 = state;

                        callback();
                    }
                );
            }
        ], done);
    });

    test('Begin update states', (done) => {
        let state1, state2: CurrentObjectStateV1;

        async.series([
        // Create one state
            (callback) => {
                controller.beginUpdateState(
                    null, STATE1,
                    (err) => {
                        assert.isNull(err);

                        callback();
                    }
                );
            },
        // Create another state
            (callback) => {
                controller.beginUpdateState(
                    null, STATE2,
                    (err) => {
                        assert.isNull(err);

                        callback();
                    }
                );
            },
        // Wait for a second
            (callback) => {
                setTimeout(callback, 1000);
            },
        // Get all states
            (callback) => {
                dependencies.currentStatesClient.getStates(
                    null, null, null, null,
                    (err, page) => {
                        assert.isNull(err);

                        assert.isObject(page);
                        assert.lengthOf(page.data, 2);

                        callback();
                    }
                );
            }
        ], done);
    });

    test('Update state for unassigned device', (done) => {
        controller.updateState(
            null, STATE3,
            (err, state) => {
                assert.isNull(err);

                assert.isNull(state || null);

                done();
            }
        );
    });

    test('Update offline objects', (done) => {
        let roster = <RosterV1>{ id: '1', org_id: '1', name: 'Test', objects: [{ object_id: '1', assign_id: '2' }] };

        controller.updateOfflineStates(
            null, roster,
            (err) => {
                assert.isNull(err);

                done();
            }
        );
    });

    test('Calculate and send sensor data', (done) => {
        async.series([
            (callback) => {
                controller.updateState(
                    null, STATE4,
                    (err, state) => {
                        assert.isNull(err);
        
                        assert.isObject(state);
                        assert.lengthOf(state.params, 2);
                        assert.lengthOf(state.events, 1);
        
                        callback();
                    }
                );        
            },
            (callback) => {
                controller.dumpCache((err) => {
                    assert.isNull(err);

                    callback();
                });
            }
        ], done);
    });

    test('Check offline objects', (done) => {
        controller.offlineCheck(done);
    });
    
});