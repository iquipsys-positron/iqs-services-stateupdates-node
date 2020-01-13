import { CurrentObjectStateV1 } from 'iqs-clients-currobjectstates-node';
import { StateUpdateV1 } from '../data/version1/StateUpdateV1';
export interface IStateUpdatesController {
    beginUpdateState(correlationId: string, stateUpdate: StateUpdateV1, callback: (err: any) => void): void;
    updateState(correlationId: string, stateUpdate: StateUpdateV1, callback: (err: any, state: CurrentObjectStateV1) => void): void;
}
