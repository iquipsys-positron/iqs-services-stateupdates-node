import { ConfigParams } from 'pip-services3-commons-node';
import { IConfigurable } from 'pip-services3-commons-node';
import { CurrentObjectStateV1 } from 'iqs-clients-currobjectstates-node';
import { ExternalDependencies } from './ExternalDependencies';
export declare class AttendanceRecorder implements IConfigurable {
    private _dependencies;
    private _attendanceInterval;
    private _dumpCacheInterval;
    private _cache;
    setDependencies(dependencies: ExternalDependencies): void;
    configure(config: ConfigParams): void;
    recordAttendance(correlationId: string, state: CurrentObjectStateV1, callback: (err: any) => void): void;
    dumpCache(correlationId: string, callback: (err: any) => void): void;
}
