import { Descriptor } from 'pip-services3-commons-node';
import { CommandableHttpService } from 'pip-services3-rpc-node';

export class StateUpdatesHttpServiceV1 extends CommandableHttpService {
    public constructor() {
        super('v1/state_updates');
        this._dependencyResolver.put('controller', new Descriptor('iqs-services-stateupdates', 'controller', 'default', '*', '1.0'));
    }
}