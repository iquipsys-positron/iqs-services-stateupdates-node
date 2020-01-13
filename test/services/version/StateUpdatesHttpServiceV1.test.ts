let _ = require('lodash');
let async = require('async');
let restify = require('restify');
let assert = require('chai').assert;

import { ConfigParams } from 'pip-services3-commons-node';
import { Descriptor } from 'pip-services3-commons-node';
import { References } from 'pip-services3-commons-node';

import { DevicesMemoryClientV1 } from 'iqs-clients-devices-node';

import { CurrentObjectStateV1 } from 'iqs-clients-currobjectstates-node';
import { CurrentObjectStatesMemoryClientV1 } from 'iqs-clients-currobjectstates-node';

import { StateUpdateV1 } from '../../../src/data/version1/StateUpdateV1';
import { StateUpdatesController } from '../../../src/logic/StateUpdatesController';
import { StateUpdatesHttpServiceV1 } from '../../../src/services/version1/StateUpdatesHttpServiceV1';
import { TestDependencies } from '../../logic/TestDependencies';

let httpConfig = ConfigParams.fromTuples(
    "connection.protocol", "http",
    "connection.host", "localhost",
    "connection.port", 3000
);

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

suite('StateUpdatesHttpServiceV1', ()=> {    
    let dependencies = new TestDependencies();
    let service: StateUpdatesHttpServiceV1;
    let rest: any;

    suiteSetup((done) => {
        let controller = new StateUpdatesController();

        dependencies.organizationsClient.createOrganization(null, { id: '1', name: 'Test organization', create_time: new Date(), creator_id: null, active: true }, () => {});
        dependencies.devicesClient.createDevice(null, { id: '1', org_id: '1', object_id: '1',  udi: '111', type: 'smartphone', status: 'active' }, () => {});
        dependencies.devicesClient.createDevice(null, { id: '2', org_id: '1', object_id: '2', udi: '222', type: 'smartphone', status: 'active' }, () => {});

        service = new StateUpdatesHttpServiceV1();
        service.configure(httpConfig);

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
            new Descriptor('iqs-services-eventgeneration', 'client', 'null', 'default', '1.0'), dependencies.eventGenerationClient,
            new Descriptor('pip-services-routeanalysis', 'client', 'null', 'default', '1.0'), dependencies.routesAnalysisClient,
            new Descriptor('pip-services-statistics', 'client', 'null', 'default', '1.0'), dependencies.statisticsClient,
            new Descriptor('iqs-services-stateupdates', 'controller', 'default', 'default', '1.0'), controller,
            new Descriptor('iqs-services-stateupdates', 'service', 'http', 'default', '1.0'), service
        );
        controller.setReferences(references);
        service.setReferences(references);

        service.open(null, done);
    });
    
    suiteTeardown((done) => {
        service.close(null, done);
    });

    setup(() => {
        let url = 'http://localhost:3000';
        rest = restify.createJsonClient({ url: url, version: '*' });
    });
    
    
    test('CRUD Operations', (done) => {
        let state1, state2: StateUpdateV1;

        async.series([
        // Create one state
            (callback) => {
                rest.post('/v1/state_updates/update_state',
                    {
                        state_update: STATE1
                    },
                    (err, req, res, state) => {
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
                rest.post('/v1/state_updates/update_state', 
                    {
                        state_update: STATE2
                    },
                    (err, req, res, state) => {
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

                rest.post('/v1/state_updates/update_state',
                    { 
                        state_update: stateUpdate
                    },
                    (err, req, res, state) => {
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
});