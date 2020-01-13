let _ = require('lodash');
let async = require('async');
let assert = require('chai').assert;

import { StateUpdateV1 } from '../../src/data/version1/StateUpdateV1';
import { DataManager } from '../../src/logic/DataManager';
import { OrganizationData } from '../../src/logic/OrganizationData';

import { TestDependencies } from './TestDependencies';

suite('DataManager', ()=> {    
    let manager: DataManager;

    setup(() => {
        let dependencies = new TestDependencies();

        manager = new DataManager();
        manager.setDependencies(dependencies);
    });
    
    test('Load data', (done) => {
        manager.loadData(null, '1', (err, data) => {
            assert.isNull(err);

            assert.isObject(data);
            assert.equal(data.org_id, '1');

            done();
        });
    });

});
