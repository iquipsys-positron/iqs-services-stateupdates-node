let _ = require('lodash');
let async = require('async');

import { ConfigParams } from 'pip-services3-commons-node';
import { IConfigurable } from 'pip-services3-commons-node';

import { CurrentObjectStateV1 } from 'iqs-clients-currobjectstates-node';
import { EventGenerationStateV1 } from 'iqs-clients-eventgeneration-node';

import { ExternalDependencies } from './ExternalDependencies';

export class EventGenerator implements IConfigurable {
    private _dependencies: ExternalDependencies;

    public setDependencies(dependencies: ExternalDependencies) {
        this._dependencies = dependencies;
    }

    public configure(config: ConfigParams): void {
    }

    private toEventGenerationState(state: CurrentObjectStateV1): EventGenerationStateV1 {
        let result: EventGenerationStateV1 = {
            org_id: state.org_id,
            object_id: state.object_id,
            assign_id: state.assigner ? state.assign_id : null,
            device_id: state.device_id,
            group_ids: state.group_ids,
            time: state.time,

            alt: state.alt,
            angle: state.angle,
            speed: state.speed,

            expected: state.expected,
            connected: state.connected,
            online: state.online,
            offline: state.offline,
            freezed: state.freezed,
            immobile: state.immobile,
            pressed: state.pressed,
            long_pressed: state.long_pressed,
            power_changed: state.power_changed,

            zones: state.zones
        };

        if (state.pos && state.pos.coordinates) {
            result.lng = state.pos.coordinates[0];
            result.lat = state.pos.coordinates[1];
        }

        return result;
    }

    public generateEventsForState(correlationId: string, state: CurrentObjectStateV1,
        callback: (err: any, activated: boolean) => void): void {
        if (this._dependencies.eventGenerationClient == null || state.object_id == null) {
            callback(null, false);
            return;
        }

        let eventGenerationState = this.toEventGenerationState(state);

        this._dependencies.eventGenerationClient.generateEventsForState(
            correlationId, state.org_id, eventGenerationState, (err, activations) => {
                let activated = activations && activations.length > 0;
                callback(err, activated);
            }
        );
    }

    public generateEventsForStates(correlationId: string, states: CurrentObjectStateV1[],
        callback: (err: any) => void): void {

        states = _.filter(states, s => s.object_id != 0);

        if (this._dependencies.eventGenerationClient == null || states.length == 0) {
            callback(null);
            return;
        }

        let eventGenerationStates = _.map(states, s => this.toEventGenerationState(s));

        this._dependencies.eventGenerationClient.generateEventsForStates(
            correlationId, null, eventGenerationStates, callback
        );
    }
    
}