import { Factory } from 'pip-services3-components-node';
import { Descriptor } from 'pip-services3-commons-node';

import { StateUpdatesController } from '../logic/StateUpdatesController';
import { StateUpdatesHttpServiceV1 } from '../services/version1/StateUpdatesHttpServiceV1';

export class StateUpdatesServiceFactory extends Factory {
	public static Descriptor = new Descriptor("iqs-services-stateupdates", "factory", "default", "default", "1.0");
	public static ControllerDescriptor = new Descriptor("iqs-services-stateupdates", "controller", "default", "*", "1.0");
	public static HttpServiceDescriptor = new Descriptor("iqs-services-stateupdates", "service", "http", "*", "1.0");
	
	constructor() {
		super();
		this.registerAsType(StateUpdatesServiceFactory.ControllerDescriptor, StateUpdatesController);
		this.registerAsType(StateUpdatesServiceFactory.HttpServiceDescriptor, StateUpdatesHttpServiceV1);
	}
	
}
