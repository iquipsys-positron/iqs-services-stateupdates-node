let _ = require('lodash');
let async = require('async');
let assert = require('chai').assert;

import { Descriptor } from 'pip-services3-commons-node';
import { ConfigParams } from 'pip-services3-commons-node';
import { References } from 'pip-services3-commons-node';
import { ConsoleLogger } from 'pip-services3-components-node';

import { IOrganizationsClientV1 } from 'pip-clients-organizations-node';
import { IDevicesClientV1 } from 'iqs-clients-devices-node';

import { CurrentObjectStateV1 } from 'iqs-clients-currobjectstates-node';
import { ICurrentObjectStatesClientV1 } from 'iqs-clients-currobjectstates-node';

import { StateUpdateV1 } from '../../src/data/version1/StateUpdateV1';
import { StateUpdatesController } from '../../src/logic/StateUpdatesController';
import { StateUpdatesLambdaFunction } from '../../src/container/StateUpdatesLambdaFunction';
import { TestDependencies } from '../logic/TestDependencies';

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


suite('StateUpdatesLambdaFunction', ()=> {
    let organizationsClient: IOrganizationsClientV1;
    let devicesClient: IDevicesClientV1;
    let currentStatesClient: ICurrentObjectStatesClientV1;
    let lambda: StateUpdatesLambdaFunction;

    suiteSetup((done) => {
        let config = ConfigParams.fromTuples(
            'logger.descriptor', 'pip-services:logger:console:default:1.0',
            'organizations.descriptor', 'pip-services-organizations:client:memory:default:1.0',
            'data-profiles.descriptor', 'iqs-services-dataprofiles:client:memory:default:1.0',
            'devices.descriptor', 'iqs-services-devices:client:memory:default:1.0',
            'device-profiles.descriptor', 'iqs-services-deviceprofiles:client:memory:default:1.0',
            'control-objects.descriptor', 'iqs-services-controlobjects:client:memory:default:1.0',
            'current-object-states.descriptor', 'iqs-services-currobjectstates:client:memory:default:1.0',
            'current-device-states.descriptor', 'iqs-services-currdevicestates:client:null:default:1.0',
            'zones.descriptor', 'iqs-services-zones:client:memory:default:1.0',
            'object-states.descriptor', 'iqs-services-objectstates:client:null:default:1.0',
            'object-positions.descriptor', 'pip-services-positions:client:null:default:1.0',
            'object-data.descriptor', 'pip-services-transducerdata:client:null:default:1.0',
            'attendance.descriptor', 'iqs-services-attendance:client:null:default:1.0',
            'rosters.descriptor', 'iqs-services-rosters:client:memory:default:1.0',
            'event-generation.descriptor', 'iqs-services-eventgeneration:client:null:default:1.0',
            'route-analysis.descriptor', 'pip-services-routeanalysis:client:null:default:1.0',
            'statistics.descriptor', 'pip-services-statistics:client:null:default:1.0',
            'controller.descriptor', 'iqs-services-stateupdates:controller:default:default:1.0'
        );

        lambda = new StateUpdatesLambdaFunction();
        lambda.configure(config);
        lambda.open(null, (err) => {
            if (err) {
                done(err);
                return;
            }

            organizationsClient = lambda.getReferences().getOneRequired<IOrganizationsClientV1>(new Descriptor('pip-services-organizations', 'client', '*', '*', '1.0'));
            organizationsClient.createOrganization(null, { id: '1', name: 'Test organization', create_time: new Date(), creator_id: null, active: true }, () => {});

            devicesClient = lambda.getReferences().getOneRequired<IDevicesClientV1>(new Descriptor('iqs-services-devices', 'client', '*', '*', '1.0'));
            devicesClient.createDevice(null, { id: '1', org_id: '1', object_id: '1', udi: '111', type: 'smartphone', status: 'active' }, () => {});
            devicesClient.createDevice(null, { id: '2', org_id: '1', object_id: '2', udi: '222', type: 'smartphone', status: 'active' }, () => {});

            currentStatesClient = lambda.getReferences().getOneRequired<ICurrentObjectStatesClientV1>(new Descriptor('iqs-services-currobjectstates', 'client', '*', '*', '1.0'));

            done(err);
        });
    });
    
    suiteTeardown((done) => {
        lambda.close(null, done);
    });
    
    test('CRUD Operations', (done) => {
        let state1, state2: StateUpdateV1;

        async.series([
        // Create one state
            (callback) => {
                lambda.act(
                    {
                        role: 'state_updates',
                        cmd: 'update_state',
                        state_update: STATE1
                    },
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
                lambda.act(
                    {
                        role: 'state_updates',
                        cmd: 'update_state',
                        state_update: STATE2
                    },
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
                currentStatesClient.getStates(
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

                lambda.act(
                    {
                        role: 'state_updates',
                        cmd: 'update_state',
                        state_update: stateUpdate
                    },
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
});