import { ConfigParams } from 'pip-services3-commons-node';
import { IConfigurable } from 'pip-services3-commons-node';
import { CurrentObjectStateV1 } from 'iqs-clients-currobjectstates-node';
import { ExternalDependencies } from './ExternalDependencies';
export declare class EventGenerator implements IConfigurable {
    private _dependencies;
    setDependencies(dependencies: ExternalDependencies): void;
    configure(config: ConfigParams): void;
    private toEventGenerationState;
    generateEventsForState(correlationId: string, state: CurrentObjectStateV1, callback: (err: any, activated: boolean) => void): void;
    generateEventsForStates(correlationId: string, states: CurrentObjectStateV1[], callback: (err: any) => void): void;
}
