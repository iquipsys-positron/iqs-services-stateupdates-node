import { CommandSet } from 'pip-services3-commons-node';
import { IStateUpdatesController } from './IStateUpdatesController';
export declare class StateUpdatesCommandSet extends CommandSet {
    private _logic;
    constructor(logic: IStateUpdatesController);
    private makeBeginUpdateStateCommand;
    private makeUpdateStateCommand;
}
