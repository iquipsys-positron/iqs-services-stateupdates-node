let _ = require('lodash');
let async = require('async');
let assert = require('chai').assert;

import { ZonePresenceV1 } from 'iqs-clients-currobjectstates-node';
import { CurrentObjectStateV1 } from 'iqs-clients-currobjectstates-node';
import { ControlObjectV1 } from 'iqs-clients-controlobjects-node';

import { RosterV1 } from 'iqs-clients-rosters-node';
import { RosterObjectV1 } from 'iqs-clients-rosters-node';

import { StateUpdateV1 } from '../../src/data/version1/StateUpdateV1';
import { StateManager } from '../../src/logic/StateManager';
import { OrganizationData } from '../../src/logic/OrganizationData';

suite('StateManager', ()=> {    
    let stateManager: StateManager;

    setup(() => {
        stateManager = new StateManager();
    });
    
    test('Get offline states', () => {
        let state = <CurrentObjectStateV1>{
            org_id: '1',
            device_id: '1',
            object_id: '1',
            time: new Date(),
            zones: [],
            online: 1
        };

        let data = <OrganizationData>{
            org_id: '1',
            states: [state]
        };

        let roster = <RosterV1>{
            id: null,
            org_id: '1',
            objects: [
                { object_id: '1', assign_id: '2' },
                { object_id: '3' }
            ]
        }

        let states = stateManager.getOfflineStates(roster, data);
        assert.lengthOf(states, 2);
    });

});