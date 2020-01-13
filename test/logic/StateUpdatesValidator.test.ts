let _ = require('lodash');
let async = require('async');
let restify = require('restify');
let assert = require('chai').assert;

import { ConfigParams } from 'pip-services3-commons-node';
import { Descriptor } from 'pip-services3-commons-node';
import { References } from 'pip-services3-commons-node';
import { OrganizationData } from '../../src/logic/OrganizationData';
import { CurrentObjectStateV1 } from 'iqs-clients-currobjectstates-node';
import { OrganizationV1 } from 'pip-clients-organizations-node';
import { RosterV1 } from 'iqs-clients-rosters-node';

import { TestDependencies } from './TestDependencies';
import { StateUpdateV1 } from '../../src/data/version1/StateUpdateV1';
import { StateUpdatesValidator } from '../../src/logic/StateUpdatesValidator';

let NOW = new Date();
let STATE: CurrentObjectStateV1 = {
    id: null,
    org_id: '1',
    object_id: '1',
    device_id: '1',
    time: new Date(NOW.getTime() - 10000),
    pos: {
        type: 'Point',
        coordinates: [-110, 32]
    },
    last_pos_time: new Date(NOW.getTime() - 10000),
    last_pos: {
        type: 'Point',
        coordinates: [-110, 32]
    },
    online: 100
};

let UPDATE: StateUpdateV1 = {
    org_id: '1',
    device_id: '1',
    time: NOW,
    lat: 32,
    lng: -110,
    alt: 750,
    angle: 0,
    speed: 1,
    freezed: false
};

let DATA = <OrganizationData>{
    org_id: '1',
    organization: <OrganizationV1>{
        id: '1',
        center: {
            type: 'Point',
            coordinates: [-110, 32]
        },
        radius: 10,
        code: '111',
        name: 'Organization #1',
        description: 'Test organization #1',
        create_time: new Date(),
        creator_id: '123',
        active: true
    }
};

suite('StateUpdatesValidator', () => {

    test('Check normal state', () => {
        let err = StateUpdatesValidator.validate(null, UPDATE, STATE, DATA);
        assert.isNull(err);
    });

    test('Check future time', () => {
        let state = _.clone(STATE);
        let update = _.clone(UPDATE);
        update.time = new Date(NOW.getTime() + 100000);

        let err = StateUpdatesValidator.validate(null, update, state, DATA);
        assert.isNotNull(err);
        assert.equal('INVALID_UPDATE', err.code);
    });

    test('Check time behind', () => {
        let state = _.clone(STATE);
        let update = _.clone(UPDATE);
        update.time = new Date(state.time.getTime() - 1000);

        let err = StateUpdatesValidator.validate(null, update, state, DATA);
        assert.isNotNull(err);
        assert.equal('OBSOLETE_UPDATE', err.code);
    });

    test('Check speed too high', () => {
        let state = _.clone(STATE);
        let update = _.clone(UPDATE);
        update.lat = 31.9;
        update.lng = update.lng;

        let err = StateUpdatesValidator.validate(null, update, state, DATA);
        assert.isNotNull(err);
        assert.equal('SPEED_TOO_HIGH', err.code);
    });

    test('Check speed too high by last time', () => {
        let state = _.clone(STATE);
        let update = _.clone(UPDATE);
        state.last_pos = _.cloneDeep(state.pos);
        state.last_pos_time = state.time;
        state.pos = null;
        
        update.lat = 31.9;
        update.lng = update.lng;

        let err = StateUpdatesValidator.validate(null, update, state, DATA);
        assert.isNotNull(err);
        assert.equal('SPEED_TOO_HIGH', err.code);
    });

    test('Check out of organization', () => {
        let state = _.clone(STATE);
        let update = _.clone(UPDATE);
        update.lat = 31.5;
        update.lng = update.lng;

        let err = StateUpdatesValidator.validate(null, update, state, DATA);
        assert.isNotNull(err);
        assert.equal('OUT_OF_SITE', err.code);
    });
});