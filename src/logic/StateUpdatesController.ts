let _ = require('lodash');
let async = require('async');

import { ConfigParams } from 'pip-services3-commons-node';
import { IConfigurable } from 'pip-services3-commons-node';
import { IReferences } from 'pip-services3-commons-node';
import { Descriptor } from 'pip-services3-commons-node';
import { IReferenceable } from 'pip-services3-commons-node';
import { FilterParams } from 'pip-services3-commons-node';
import { PagingParams } from 'pip-services3-commons-node';
import { DataPage } from 'pip-services3-commons-node';
import { ICommandable } from 'pip-services3-commons-node';
import { CommandSet } from 'pip-services3-commons-node';
import { DateTimeConverter } from 'pip-services3-commons-node';
import { UnauthorizedException } from 'pip-services3-commons-node';
import { NotFoundException } from 'pip-services3-commons-node';
import { InvalidStateException } from 'pip-services3-commons-node';
import { CompositeLogger } from 'pip-services3-components-node';
import { LogCounters } from 'pip-services3-components-node';
import { IOpenable } from 'pip-services3-commons-node';
import { FixedRateTimer } from 'pip-services3-commons-node';

import { ExternalDependenciesResolver } from './ExternalDependenciesResolver';
import { ExternalDependencies } from './ExternalDependencies';

import { DeviceV1 } from 'iqs-clients-devices-node';
import { ObjectStateV1 } from 'iqs-clients-objectstates-node';
import { CurrentObjectStateV1 } from 'iqs-clients-currobjectstates-node';
import { OrganizationV1 } from 'pip-clients-organizations-node';
import { RosterV1 } from 'iqs-clients-rosters-node';

import { StateUpdateV1 } from '../data/version1/StateUpdateV1';
import { IStateUpdatesController } from './IStateUpdatesController';
import { StateUpdatesCommandSet } from './StateUpdatesCommandSet';

import { StateManager } from './StateManager';
import { OrganizationData } from './OrganizationData';
import { DataManager } from './DataManager';
import { SensorDataManager } from './SensorDataManager';
import { ZoneCalculator } from './ZoneCalculator';
import { PositionsRecorder } from './PositionsRecorder';
import { DataRecorder } from './DataRecorder';
import { HistoricalStatesRecorder } from './HistoricalStatesRecorder';
import { DeviceStatesRecorder } from './DeviceStatesRecorder';
import { StatisticsRecorder } from './StatisticsRecorder';
import { AttendanceRecorder } from './AttendanceRecorder';
import { RosterManager } from './RosterManager';
import { EventGenerator } from './EventGenerator';
import { StateUpdatesValidator } from './StateUpdatesValidator';

export class StateUpdatesController implements IStateUpdatesController,
    IConfigurable, IReferenceable, ICommandable, IOpenable {
    
    private _logger: CompositeLogger = new CompositeLogger();
    private _counters: LogCounters = new LogCounters();
    private _dependencyResolver = new ExternalDependenciesResolver();
    private _dependencies: ExternalDependencies;
    private _commandSet: StateUpdatesCommandSet;
    private _offlineCheckTimer: any;
    private _dumpCacheTimer: any;

    private _jobQueue = async.queue(
        (task, callback) => this.executeUpdateState(task, callback), 10
    );

    private _offlineCheckInterval: number = 300; // 5 min
    private _dumpCacheInterval: number = 5; // 5 sec
    private _offlineProcessing = false;
    private _maxQueueJobs = 100;
    private _maxSpeed = 200;

    private _stateManager = new StateManager();
    private _dataManager = new DataManager();
    private _sensorDataManager = new SensorDataManager();
    private _zoneCalculator = new ZoneCalculator();
    private _deviceStatesRecorder = new DeviceStatesRecorder();
    private _positionsRecorder = new PositionsRecorder();
    private _dataRecorder = new DataRecorder();
    private _historicalStatesRecorder = new HistoricalStatesRecorder();
    private _statisticsRecorder = new StatisticsRecorder();
    private _attendanceRecorder = new AttendanceRecorder();
    private _rosterManager = new RosterManager();
    private _eventGenerator = new EventGenerator();

    public configure(config: ConfigParams): void {
        this._offlineCheckInterval = config.getAsIntegerWithDefault('options.offline_check_interval', this._offlineCheckInterval);
        this._dumpCacheInterval = config.getAsIntegerWithDefault('options.dump_cache_interval', this._dumpCacheInterval);
        this._maxQueueJobs = config.getAsIntegerWithDefault('options.max_queue_jobs', this._maxQueueJobs);
        this._maxQueueJobs = config.getAsIntegerWithDefault('options.max_speed', this._maxSpeed);
        
        this._logger.configure(config);
        this._dependencyResolver.configure(config);

        this._stateManager.configure(config);
        this._dataManager.configure(config);
        this._sensorDataManager.configure(config);
        this._zoneCalculator.configure(config);
        this._deviceStatesRecorder.configure(config);
        this._positionsRecorder.configure(config);
        this._dataRecorder.configure(config);
        this._historicalStatesRecorder.configure(config);
        this._statisticsRecorder.configure(config);
        this._attendanceRecorder.configure(config);
        this._rosterManager.configure(config);
        this._eventGenerator.configure(config);
    }

    public setReferences(references: IReferences): void {
        this._logger.setReferences(references);
        this._counters.setReferences(references);
        this._dependencyResolver.setReferences(references);
        this._dependencies = this._dependencyResolver.resolve();
        this._dependencies.logger = this._logger;
        this._dependencies.counters = this._counters;

        this._stateManager.setDependencies(this._dependencies);
        this._dataManager.setDependencies(this._dependencies);
        this._sensorDataManager.setDependencies(this._dependencies);
        this._zoneCalculator.setDependencies(this._dependencies);
        this._deviceStatesRecorder.setDependencies(this._dependencies);
        this._positionsRecorder.setDependencies(this._dependencies);
        this._dataRecorder.setDependencies(this._dependencies);
        this._historicalStatesRecorder.setDependencies(this._dependencies);
        this._statisticsRecorder.setDependencies(this._dependencies);
        this._attendanceRecorder.setDependencies(this._dependencies);
        this._rosterManager.setDependencies(this._dependencies);
        this._eventGenerator.setDependencies(this._dependencies);
    }

    public getCommandSet(): CommandSet {
        if (this._commandSet == null)
            this._commandSet = new StateUpdatesCommandSet(this);
        return this._commandSet;
    }
    
    public isOpen(): boolean {
        return this._offlineCheckTimer != null;
    }

    public open(correlationId: string, callback: (err: any) => void): void {
        if (this._offlineCheckTimer == null) {
            this._offlineCheckTimer = setInterval(() => {
                this.offlineCheck();
            }, this._offlineCheckInterval * 1000);
        }

        if (this._dumpCacheTimer == null) {
            this._dumpCacheTimer = setInterval(() => {
                this.dumpCache();
                this._counters.dump();
            }, this._dumpCacheInterval * 1000);
        }
        
        if (callback) callback(null);
    }

    public close(correlationId: string, callback: (err: any) => void): void {
        if (this._offlineCheckTimer) {
            clearInterval(this._offlineCheckTimer);
            this._offlineCheckTimer = null;
        }

        if (this._dumpCacheTimer) {
            clearInterval(this._dumpCacheTimer);
            this._dumpCacheTimer = null;
        }

        this.dumpCache(callback);
    }

    private fixStateUpdate(stateUpdate: StateUpdateV1): void {
        stateUpdate.time = DateTimeConverter.toNullableDateTime(stateUpdate.time);
        stateUpdate.time = stateUpdate.time || new Date();
        if (stateUpdate.speed) {
            stateUpdate.speed = Math.max(0, stateUpdate.speed);
            stateUpdate.speed = Math.min(this._maxSpeed, stateUpdate.speed);
        }
    }    
    
    private handleAsyncCallback(correlationId: string, stateUpdate: StateUpdateV1,
        message: string) {
        return (err: any, result?: any) => {
            if (err) {
                if (stateUpdate)
                    message = message + ' for ' + stateUpdate.device_id;
                this._logger.error(correlationId, err, message);
            }
        }
    }

    private executeUpdateState(task: any, callback: (err: any) => void): void {
        this.updateState(task.correlationId, task.stateUpdate, (err) => {
            if (err) {
                this._logger.error(
                    task.correlationId, err, 'Failed to update state for ' + task.stateUpdate.device_id
                );
            }
            this._counters.incrementOne("STATE_UPDATES_SUCCESSFULLY_PROCESSED"); 
            callback(err);
        });
    }

    public beginUpdateState(correlationId: string, stateUpdate: StateUpdateV1, 
        callback: (err: any) => void): void {

        this._logger.info(correlationId, 'Begin updating state for ' + stateUpdate.device_id
            + ' at ' + stateUpdate.time);

        if (this._jobQueue.length > this._maxQueueJobs) {
            this._counters.incrementOne("STATE_UPDATES_QUEUE_FULL"); 
            this._counters.dump(); 

            let err = new InvalidStateException(
                correlationId,
                'JOB_QUEUE_FULL',
                'Job queue size was exceeded. Reduce update rate or increase system performance'
            );
            callback(err);
        } else {
            this._jobQueue.push({
                correlationId: correlationId,
                stateUpdate: stateUpdate
            });
            this._counters.incrementOne("STATE_UPDATE_ADDED_TO_QUEUE"); 
            callback(null);
        }

        // this.updateState(correlationId, stateUpdate, (err) => {
        //     this._logger.error(correlationId, err, "Failed to update state for " + stateUpdate.device_id
        //         + " at " + stateUpdate.time);
        // });

        // callback(null);
    }
    
    public updateState(correlationId: string, stateUpdate: StateUpdateV1, 
        callback: (err: any, state: CurrentObjectStateV1) => void): void {
        let organizationData: OrganizationData;
        let oldState: CurrentObjectStateV1;
        let newState: CurrentObjectStateV1;

        this.fixStateUpdate(stateUpdate);

        this._logger.info(correlationId, 'Updating state for ' + stateUpdate.device_id
            + ' at ' + stateUpdate.time);

        async.series([
            // Get organization data
            (callback) => {
                this._dataManager.loadData(
                    correlationId, stateUpdate.org_id,
                    (err, data) => {
                        organizationData = data;
                        callback(err);
                    }
                );
            },
            // Get old state
            (callback) => {
                this._stateManager.getOldState(
                    correlationId, stateUpdate, organizationData,
                    (err, data) => {
                        oldState = data;
                        callback(err);
                    }
                );
            },
            // If no object is attached update device state and exit
            (callback) => {
                if (oldState == null) {
                    this._deviceStatesRecorder.recordState(
                        correlationId, stateUpdate, (err) => {
                            err = err || 'abort';
                            callback(err);
                        }
                    )
                } else {
                    callback(null);
                }
            },
            // Validate state update
            (callback) => {
                let err = StateUpdatesValidator.validate(
                    correlationId, stateUpdate, oldState, organizationData);
                callback(err);
            },
            // Get current state
            (callback) => {
                this._stateManager.getNewState(
                    correlationId, oldState, stateUpdate, organizationData,
                    (err, data) => {
                        newState = data;
                        callback(err);
                    }
                );
            },
            // Calculate sensor data
            (callback) => {
                this._sensorDataManager.calculateSensorData(
                    correlationId, newState, stateUpdate, organizationData);
                callback();
            },
            // Calculate zones and rules
            (callback) => {
                this._zoneCalculator.calculateZones(oldState, newState, organizationData);
                callback();
            },
            // Update current object state
            (callback) => {
                this._dataManager.saveState(correlationId, newState, callback);
            },
            // Record results
            (callback) => {
                async.parallel([
                    // Record historical positions
                    (callback) => {
                        this._positionsRecorder.recordPositions(
                            correlationId, newState,
                            this.handleAsyncCallback(correlationId, stateUpdate, 'Failed to record historical positions')
                        );
                        callback();
                    },
                    // Record historical states
                    (callback) => {
                        this._historicalStatesRecorder.recordState(
                            correlationId, newState, false,
                            this.handleAsyncCallback(correlationId, stateUpdate, 'Failed to record historical states')
                        );
                        callback();
                    },
                    // Record sensor data
                    (callback) => {
                        this._dataRecorder.recordData(
                            correlationId, newState,
                            this.handleAsyncCallback(correlationId, stateUpdate, 'Failed to record sensor data')
                        );
                        callback();
                    },
                    // Record statistics
                    (callback) => {
                        this._statisticsRecorder.recordStatistics(
                            correlationId, oldState, newState, organizationData,
                            this.handleAsyncCallback(correlationId, stateUpdate, 'Failed to record statistics')
                        );
                        callback();
                    },
                    // Record attendances
                    (callback) => {
                        this._attendanceRecorder.recordAttendance(
                            correlationId, newState,
                            this.handleAsyncCallback(correlationId, stateUpdate, 'Failed to record attendances')
                        );
                        callback();
                    },
                    // Actyivate rules
                    (callback) => {
                        this._eventGenerator.generateEventsForState(
                            correlationId, newState, (err, activated) => {
                                // Save states unconditionally is rules activated
                                if (activated && !this._historicalStatesRecorder.recordDue(newState)) {
                                    this._historicalStatesRecorder.recordState(
                                        correlationId, newState, true,
                                        this.handleAsyncCallback(correlationId, stateUpdate, 'Failed to record historical states')
                                    );
                                }
                                
                                this.handleAsyncCallback(correlationId, stateUpdate, 'Failed to activate rules')(err);
                            }
                        );
                        callback();
                    }
                ], callback);
            }
        ], (err) => {
            if (err == 'abort') err = null;

            if (err) {
                this._statisticsRecorder.recordErrorStats(
                    correlationId, organizationData ? organizationData.organization : null, stateUpdate,
                    this.handleAsyncCallback(correlationId, stateUpdate, 'Failed to record error stats')
                )
            }
            
            setTimeout(() => {
                callback(err, err == null ? newState : null);
            }, 10);
        });
    }

    public updateOfflineStates(correlationId: string, roster: RosterV1,
        callback: (err: any) => void): void {
        
        let organizationData: OrganizationData;
        let state: CurrentObjectStateV1;

        async.series([
            // Get organization data
            (callback) => {
                this._dataManager.loadData(
                    correlationId, roster.org_id,
                    (err, data) => {
                        organizationData = data;
                        callback(err);
                    }
                );
            },
            // Calculate disappear rules
            (callback) => {
                let states = this._stateManager.getOfflineStates(roster, organizationData);
                if (states.length == 0) {
                    callback();
                    return;
                }

                this._logger.info(correlationId, 'Updating ' + states.length + ' offline states for organization ' + roster.org_id);
                
                // Activate disappear rules
                this._eventGenerator.generateEventsForStates(
                    correlationId, states,
                    this.handleAsyncCallback(correlationId, null, 'Failed to activate rules for offline devices')
                );
        
                // Save historical states
                this._historicalStatesRecorder.recordStates(
                    correlationId, states, true,
                    this.handleAsyncCallback(correlationId, null, 'Failed to save historical states')
                );

                // Save offline states
                this._dataManager.saveStates(correlationId, states, callback);
            }
        ], (err) => {
            callback(err);
        });
    }

    public offlineCheck(callback?: (err) => void): void {
        // Enable check if background process if already running
        if (this._offlineProcessing) return;
        this._offlineProcessing = true;

        this._logger.debug('state-offline', 'Processing offline objects...');
        
        let skip = 0, take = 10;

        async.whilst(
            () => { 
                return this._offlineProcessing;
            },
            (callback) => {
                this._rosterManager.getCurrentShiftRosters(
                    'state-offline', skip, take,
                    (err, rosters) => {
                        if (err) {
                            callback(err);
                            return;
                        }

                        this._offlineProcessing = rosters && rosters.length > 0;
                        skip += take;

                        async.each(rosters, (roster, callback) => {
                            this.updateOfflineStates('state-offline', roster, callback);
                        }, callback);
                    }
                )
            },
            (err) => {
                this._offlineProcessing = false;
                if (err) {
                    this._logger.error('state-offline', err, 'Failed to process offline objects');
                }
                if (callback) callback(err);
            }
        );
    }

    public dumpCache(callback?: (err) => void): void {
        this._logger.debug('state-cache', 'Dumping cache...');

        async.parallel([
            (callback) => {
                this._positionsRecorder.dumpCache('state-cache', callback);
            },
            (callback) => {
                this._dataRecorder.dumpCache('state-cache', callback);
            },
            (callback) => {
                this._historicalStatesRecorder.dumpCache('state-cache', callback);
            },
            (callback) => {
                this._statisticsRecorder.dumpCache('state-cache', callback);
            },
            (callback) => {
                this._attendanceRecorder.dumpCache('state-cache', callback);
            },
            (callback) => {
                this._deviceStatesRecorder.dumpCache('state-cache', callback);
            }
        ], callback);
    }
        
}
