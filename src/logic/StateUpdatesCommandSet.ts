import { CommandSet } from 'pip-services3-commons-node';
import { ICommand } from 'pip-services3-commons-node';
import { Command } from 'pip-services3-commons-node';
import { Schema } from 'pip-services3-commons-node';
import { Parameters } from 'pip-services3-commons-node';
import { FilterParams } from 'pip-services3-commons-node';
import { PagingParams } from 'pip-services3-commons-node';
import { ObjectSchema } from 'pip-services3-commons-node';
import { TypeCode } from 'pip-services3-commons-node';
import { FilterParamsSchema } from 'pip-services3-commons-node';
import { PagingParamsSchema } from 'pip-services3-commons-node';
import { DateTimeConverter } from 'pip-services3-commons-node';

import { StateUpdateV1Schema } from '../data/version1/StateUpdateV1Schema';
import { IStateUpdatesController } from './IStateUpdatesController';

export class StateUpdatesCommandSet extends CommandSet {
    private _logic: IStateUpdatesController;

    constructor(logic: IStateUpdatesController) {
        super();

        this._logic = logic;

        // Register commands to the database
		this.addCommand(this.makeBeginUpdateStateCommand());
		this.addCommand(this.makeUpdateStateCommand());
    }

	private makeBeginUpdateStateCommand(): ICommand {
		return new Command(
			"begin_update_state",
			new ObjectSchema(true)
				.withRequiredProperty('state_update', new StateUpdateV1Schema()),
            (correlationId: string, args: Parameters, callback: (err: any, result: any) => void) => {
                let stateUpdate = args.get("state_update");
				stateUpdate.time = DateTimeConverter.toNullableDateTime(stateUpdate.time);
                this._logic.beginUpdateState(correlationId, stateUpdate, (err) => {
                    callback(err, null);
                });
            }
		);
	}

    private makeUpdateStateCommand(): ICommand {
		return new Command(
			"update_state",
			new ObjectSchema(true)
				.withRequiredProperty('state_update', new StateUpdateV1Schema()),
            (correlationId: string, args: Parameters, callback: (err: any, result: any) => void) => {
                let stateUpdate = args.get("state_update");
				stateUpdate.time = DateTimeConverter.toNullableDateTime(stateUpdate.time);
                this._logic.updateState(correlationId, stateUpdate, callback);
            }
		);
	}
    
}