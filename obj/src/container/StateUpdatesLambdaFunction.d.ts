import { IReferences } from 'pip-services3-commons-node';
import { CommandableLambdaFunction } from 'pip-services3-aws-node';
export declare class StateUpdatesLambdaFunction extends CommandableLambdaFunction {
    constructor();
    getReferences(): IReferences;
}
export declare const handler: (event: any, context: any) => void;
