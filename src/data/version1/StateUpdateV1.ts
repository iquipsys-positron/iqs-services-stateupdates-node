import { StateUpdateDataValueV1 } from './StateUpdateDataValueV1';

export class StateUpdateV1 {
    public org_id: string;
    public device_id: string;
 
    public freezed?: boolean;
    public pressed?: boolean;
    public long_pressed?: boolean;
    public power?: boolean;

    public time: Date;
    public lat?: number;
    public lng?: number;
    public alt?: number;
    public angle?: number;
    public speed?: number;

    public params?: StateUpdateDataValueV1[];
    public events?: StateUpdateDataValueV1[];
        
    public beacons?: string[];
}