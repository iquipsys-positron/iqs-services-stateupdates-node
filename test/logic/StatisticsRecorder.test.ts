let _ = require('lodash');
let async = require('async');
let assert = require('chai').assert;

import { OrganizationV1 } from 'pip-clients-organizations-node';
import { ZonePresenceV1 } from 'iqs-clients-currobjectstates-node';
import { CurrentObjectStateV1 } from 'iqs-clients-currobjectstates-node';

import { StateUpdateV1 } from '../../src/data/version1/StateUpdateV1';
import { StatisticsRecorder } from '../../src/logic/StatisticsRecorder';
import { OrganizationData } from '../../src/logic/OrganizationData';

suite('StatisticsRecorder', ()=> {    
    let recorder: StatisticsRecorder;

    setup(() => {
        recorder = new StatisticsRecorder();
    });
    
    test('Empty statistics', () => {
        let organization = <OrganizationV1>{
            id: '1',
            name: 'Test Organization 1',
            timezone: 'UTC'
        };

        let state = <CurrentObjectStateV1>{
            org_id: '1',
            device_id: '1',
            object_id: '1',
            time: new Date(),
            online: 100,
            freezed: 100,
            speed: 50,
            zones: [<ZonePresenceV1>{ zone_id: '1', duration: 1 }],
            pos: { type: 'Point', coordinates: [0, 0] }
        };

        let increments = recorder.generateIncrements(organization, state, state);
        assert.lengthOf(increments, 2);
    });

    test('Usage statistics', () => {
        let organization = <OrganizationV1>{
            id: '1',
            name: 'Test Organization 1',
            timezone: 'UTC'
        };

        let state = <CurrentObjectStateV1>{
            org_id: '1',
            device_id: '1',
            object_id: '1',
            time: new Date(),
            online: 100,
            freezed: 100,
            speed: 50,
            zones: [<ZonePresenceV1>{ zone_id: '1', duration: 1 }],
            pos: { type: 'Point', coordinates: [0, 0] }
        };

        let increments = recorder.generateUsageIncrements(organization, state, state);
        assert.lengthOf(increments, 2);

        let increment = _.find(increments, i => i.name == 'state_updates.all');
        assert.equal(increment.value, 1);

        increment = _.find(increments, i => i.name == 'state_updates.1');
        assert.equal(increment.value, 1);
    });
    
    test('Parameter statistics', () => {
        let organization = <OrganizationV1>{
            id: '1',
            name: 'Test Organization 1',
            timezone: 'UTC'
        };

        let oldState = <CurrentObjectStateV1>{
            org_id: '1',
            device_id: '1',
            object_id: '1',
            group_ids: ['2'],
            time: new Date(0),
            online: 100,
            freezed: 100,
            speed: 50,
            pos: { type: 'Point', coordinates: [0, 0] }
        };
        let newState = <CurrentObjectStateV1>{
            org_id: '1',
            device_id: '1',
            object_id: '1',
            group_ids: ['2'],
            time: new Date(100),
            online: 200,
            freezed: 150,
            speed: 50,
            pos: { type: 'Point', coordinates: [1, 1] },
            zones: [<ZonePresenceV1>{ zone_id: '3', duration: 1 }],
        };

        let increments = recorder.generateParamIncrements(organization, oldState, newState);
        assert.lengthOf(increments, 6 * 4);

        let increment = _.find(increments, i => i.name == 'params.all.all.distance');
        assert.isTrue(increment.value > 0);

        increment = _.find(increments, i => i.name == 'params.1.all.online');
        assert.equal(increment.value, 100);

        increment = _.find(increments, i => i.name == 'params.2.all.freezed');
        assert.equal(increment.value, 50);

        increment = _.find(increments, i => i.name == 'params.1.3.speed');
        assert.equal(increment.value, 100 * 50);
    });

    test('Presence statistics', () => {
        let organization = <OrganizationV1>{
            id: '1',
            name: 'Test Organization 1',
            timezone: 'UTC'
        };

        let oldState = <CurrentObjectStateV1>{
            org_id: '1',
            device_id: '1',
            object_id: '1',
            group_ids: ['2'],
            time: new Date(0),
            online: 100,
            freezed: 100,
            speed: 50,
            pos: { type: 'Point', coordinates: [0, 0] },
            zones: [
                <ZonePresenceV1>{ zone_id: '3', duration: 100 },
                <ZonePresenceV1>{ zone_id: '5', duration: 100 }
            ]
        };
        let newState = <CurrentObjectStateV1>{
            org_id: '1',
            device_id: '1',
            object_id: '1',
            group_ids: ['2'],
            time: new Date(100),
            online: 200,
            freezed: 150,
            speed: 50,
            pos: { type: 'Point', coordinates: [1, 1] },
            zones: [
                <ZonePresenceV1>{ zone_id: '3', duration: 200 },
                <ZonePresenceV1>{ zone_id: '4', duration: 50 }
            ]
        };

        let increments = recorder.generatePresenceIncrements(organization, oldState, newState);
        assert.lengthOf(increments, 3 * 3);

        let increment = _.find(increments, i => i.name == 'presence.all.3');
        assert.equal(increment.value, 100);

        increment = _.find(increments, i => i.name == 'presence.1.3');
        assert.equal(increment.value, 100);

        increment = _.find(increments, i => i.name == 'presence.2.4');
        assert.equal(increment.value, 50);

        increment = _.find(increments, i => i.name == 'presence.1.all');
        assert.equal(increment.value, 150);

        increment = _.find(increments, i => i.name == 'presence.all.all');
        assert.equal(increment.value, 150);
    });

});