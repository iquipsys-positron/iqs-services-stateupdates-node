import { StateUpdateDataValueV1 } from './StateUpdateDataValueV1';
export declare class StateUpdateV1 {
    org_id: string;
    device_id: string;
    freezed?: boolean;
    pressed?: boolean;
    long_pressed?: boolean;
    power?: boolean;
    time: Date;
    lat?: number;
    lng?: number;
    alt?: number;
    angle?: number;
    speed?: number;
    params?: StateUpdateDataValueV1[];
    events?: StateUpdateDataValueV1[];
    beacons?: string[];
}
