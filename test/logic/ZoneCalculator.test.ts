let _ = require('lodash');
let async = require('async');
let assert = require('chai').assert;
let gju = require('geojson-utils');

import { ZonePresenceV1 } from 'iqs-clients-currobjectstates-node';
import { CurrentObjectStateV1 } from 'iqs-clients-currobjectstates-node';
import { ControlObjectV1 } from 'iqs-clients-controlobjects-node';
import { ZoneTypeV1 } from 'iqs-clients-zones-node';
import { ZoneV1 } from 'iqs-clients-zones-node';

import { StateUpdateV1 } from '../../src/data/version1/StateUpdateV1';
import { ZoneCalculator } from '../../src/logic/ZoneCalculator';
import { OrganizationData } from '../../src/logic/OrganizationData';

suite('ZoneCalculator', ()=> {    
    let n1 = 0;
    let n2 = 0.0000001;

    let d1 = gju.pointDistance(
        { type: "Point", coordinates: [n1, n1] },
        { type: "Point", coordinates: [n1, n2] }
    );
    let d2 = gju.pointDistance(
        { type: "Point", coordinates: [n1, n1] },
        { type: "Point", coordinates: [n2, n2] }
    );

    let calculator: ZoneCalculator;

    setup(() => {
        calculator = new ZoneCalculator();
    });
    
    test('Polyling distance', () => {
        let d = calculator.polylineDistance(
            { type: "Point", coordinates: [n2, n2] },
            { type: "LineString", coordinates: [ [n1, n1], [2 * n2, n1] ] }
        );
        assert.isTrue(Math.abs(d - d1) < 0.001);

        d = calculator.polylineDistance(
            { type: "Point", coordinates: [n1, n2] },
            { type: "LineString", coordinates: [ [n1, n1], [2 * n2, n1] ] }
        );
        assert.isTrue(Math.abs(d - d1) < 0.001);

        d = calculator.polylineDistance(
            { type: "Point", coordinates: [2 * n2, n2] },
            { type: "LineString", coordinates: [ [n1, n1], [2 * n2, n1] ] }
        );
        assert.isTrue(Math.abs(d - d1) < 0.001);

        d = calculator.polylineDistance(
            { type: "Point", coordinates: [-n2, n2] },
            { type: "LineString", coordinates: [ [n1, n1], [2 * n2, n1] ] }
        );
        assert.isTrue(Math.abs(d - d2) < 0.001);

        d = calculator.polylineDistance(
            { type: "Point", coordinates: [3 * n2, n2] },
            { type: "LineString", coordinates: [ [n1, n1], [2 * n2, n1] ] }
        );
        assert.isTrue(Math.abs(d - d2) < 0.001);
    });

    test('Circle zones', () => {
        let data = <OrganizationData>{
            org_id: '1',
            zones:[
                <ZoneV1>{ 
                    type: ZoneTypeV1.Circle,
                    center: { type: 'Point', coordinates: [0, 0] },
                    distance: 100
                }
            ]
        };

        let state = <CurrentObjectStateV1>{
            org_id: '1',
            device_id: '1',
            object_id: '1',
            time: new Date()
        };

        // Outside of zone
        state.pos = { type: 'Point', coordinates: [1, 1] };
        calculator.calculateZones(state, state, data);
        assert.lengthOf(state.zones, 0);

        // Inside zone
        state.pos = { type: 'Point', coordinates: [0.0000001, 0.0000001] };
        calculator.calculateZones(state, state, data);
        assert.lengthOf(state.zones, 1);
    });

    test('Line zones', () => {
        let data = <OrganizationData>{
            org_id: '1',
            zones:[
                <ZoneV1>{ 
                    type: ZoneTypeV1.Line,
                    geometry: { type: 'LineString', coordinates: [[0, 0], [0.005, 0.005]] },
                    distance: 100
                }
            ]
        };

        let state = <CurrentObjectStateV1>{
            org_id: '1',
            device_id: '1',
            object_id: '1',
            time: new Date()
        };

        // Outside of zone
        state.pos = { type: 'Point', coordinates: [1, 1] };
        calculator.calculateZones(state, state, data);
        assert.lengthOf(state.zones, 0);

        // Inside zone
        state.pos = { type: 'Point', coordinates: [0.0000001, 0.0000001] };
        calculator.calculateZones(state, state, data);
        assert.lengthOf(state.zones, 1);
    });

    test('Polygon zones', () => {
        let data = <OrganizationData>{
            org_id: '1',
            zones:[
                <ZoneV1>{ 
                    type: ZoneTypeV1.Polygon,
                    geometry: { type: 'Polygon', coordinates: [ [[0, 0], [1, 0], [0, 1]] ] }
                }
            ]
        };

        let state = <CurrentObjectStateV1>{
            org_id: '1',
            device_id: '1',
            object_id: '1',
            time: new Date()
        };

        // Outside of zone
        state.pos = { type: 'Point', coordinates: [1, 1] };
        calculator.calculateZones(state, state, data);
        assert.lengthOf(state.zones, 0);

        // Inside zone
        state.pos = { type: 'Point', coordinates: [0.0000001, 0.0000001] };
        calculator.calculateZones(state, state, data);
        assert.lengthOf(state.zones, 1);
    });

    test('Object zones', () => {
        let data = <OrganizationData>{
            org_id: '1',
            states: [
                <CurrentObjectStateV1>{
                    id: '2',
                    org_id: '1',
                    device_id: '2',
                    object_id: '2',
                    group_ids: ['2'],
                    time: new Date(),
                    online: 0,
                    freezed: 0,
                    pos: { type: 'Point', coordinates: [0, 0] }
                },
                <CurrentObjectStateV1>{
                    id: '3',
                    org_id: '1',
                    device_id: '3',
                    object_id: '3',
                    group_ids: ['3'],
                    time: new Date(),
                    online: 0,
                    freezed: 0,
                    pos: { type: 'Point', coordinates: [0, 0] }
                }
            ],
            zones:[
                <ZoneV1>{ 
                    id: '1',
                    type: ZoneTypeV1.Object,
                    include_object_ids: ['2'],
                    distance: 100
                },
                <ZoneV1>{ 
                    id: '2',
                    type: ZoneTypeV1.Object,
                    include_group_ids: ['3'],
                    distance: 100
                },
                <ZoneV1>{ 
                    id: '3',
                    type: ZoneTypeV1.Object,
                    include_object_ids: ['2'],
                    exclude_object_ids: ['3'],
                    include_group_ids: ['3'],
                    exclude_group_ids: ['2'],
                    distance: 100
                }
            ]
        };

        let state = <CurrentObjectStateV1>{
            org_id: '1',
            device_id: '1',
            object_id: '1',
            time: new Date()
        };

        // Outside of zone
        state.pos = { type: 'Point', coordinates: [1, 1] };
        calculator.calculateZones(state, state, data);
        assert.lengthOf(state.zones, 0);

        // Inside zones
        state.pos = { type: 'Point', coordinates: [0.0000001, 0.0000001] };
        calculator.calculateZones(state, state, data);
        assert.lengthOf(state.zones, 2);
    });

});
