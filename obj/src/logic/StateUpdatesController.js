"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
let _ = require('lodash');
let async = require('async');
const pip_services3_commons_node_1 = require("pip-services3-commons-node");
const pip_services3_commons_node_2 = require("pip-services3-commons-node");
const pip_services3_components_node_1 = require("pip-services3-components-node");
const pip_services3_components_node_2 = require("pip-services3-components-node");
const ExternalDependenciesResolver_1 = require("./ExternalDependenciesResolver");
const StateUpdatesCommandSet_1 = require("./StateUpdatesCommandSet");
const StateManager_1 = require("./StateManager");
const DataManager_1 = require("./DataManager");
const SensorDataManager_1 = require("./SensorDataManager");
const ZoneCalculator_1 = require("./ZoneCalculator");
const PositionsRecorder_1 = require("./PositionsRecorder");
const DataRecorder_1 = require("./DataRecorder");
const HistoricalStatesRecorder_1 = require("./HistoricalStatesRecorder");
const DeviceStatesRecorder_1 = require("./DeviceStatesRecorder");
const StatisticsRecorder_1 = require("./StatisticsRecorder");
const AttendanceRecorder_1 = require("./AttendanceRecorder");
const RosterManager_1 = require("./RosterManager");
const EventGenerator_1 = require("./EventGenerator");
const StateUpdatesValidator_1 = require("./StateUpdatesValidator");
class StateUpdatesController {
    constructor() {
        this._logger = new pip_services3_components_node_1.CompositeLogger();
        this._counters = new pip_services3_components_node_2.LogCounters();
        this._dependencyResolver = new ExternalDependenciesResolver_1.ExternalDependenciesResolver();
        this._jobQueue = async.queue((task, callback) => this.executeUpdateState(task, callback), 10);
        this._offlineCheckInterval = 300; // 5 min
        this._dumpCacheInterval = 5; // 5 sec
        this._offlineProcessing = false;
        this._maxQueueJobs = 100;
        this._maxSpeed = 200;
        this._stateManager = new StateManager_1.StateManager();
        this._dataManager = new DataManager_1.DataManager();
        this._sensorDataManager = new SensorDataManager_1.SensorDataManager();
        this._zoneCalculator = new ZoneCalculator_1.ZoneCalculator();
        this._deviceStatesRecorder = new DeviceStatesRecorder_1.DeviceStatesRecorder();
        this._positionsRecorder = new PositionsRecorder_1.PositionsRecorder();
        this._dataRecorder = new DataRecorder_1.DataRecorder();
        this._historicalStatesRecorder = new HistoricalStatesRecorder_1.HistoricalStatesRecorder();
        this._statisticsRecorder = new StatisticsRecorder_1.StatisticsRecorder();
        this._attendanceRecorder = new AttendanceRecorder_1.AttendanceRecorder();
        this._rosterManager = new RosterManager_1.RosterManager();
        this._eventGenerator = new EventGenerator_1.EventGenerator();
    }
    configure(config) {
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
    setReferences(references) {
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
    getCommandSet() {
        if (this._commandSet == null)
            this._commandSet = new StateUpdatesCommandSet_1.StateUpdatesCommandSet(this);
        return this._commandSet;
    }
    isOpen() {
        return this._offlineCheckTimer != null;
    }
    open(correlationId, callback) {
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
        if (callback)
            callback(null);
    }
    close(correlationId, callback) {
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
    fixStateUpdate(stateUpdate) {
        stateUpdate.time = pip_services3_commons_node_1.DateTimeConverter.toNullableDateTime(stateUpdate.time);
        stateUpdate.time = stateUpdate.time || new Date();
        if (stateUpdate.speed) {
            stateUpdate.speed = Math.max(0, stateUpdate.speed);
            stateUpdate.speed = Math.min(this._maxSpeed, stateUpdate.speed);
        }
    }
    handleAsyncCallback(correlationId, stateUpdate, message) {
        return (err, result) => {
            if (err) {
                if (stateUpdate)
                    message = message + ' for ' + stateUpdate.device_id;
                this._logger.error(correlationId, err, message);
            }
        };
    }
    executeUpdateState(task, callback) {
        this.updateState(task.correlationId, task.stateUpdate, (err) => {
            if (err) {
                this._logger.error(task.correlationId, err, 'Failed to update state for ' + task.stateUpdate.device_id);
            }
            this._counters.incrementOne("STATE_UPDATES_SUCCESSFULLY_PROCESSED");
            callback(err);
        });
    }
    beginUpdateState(correlationId, stateUpdate, callback) {
        this._logger.info(correlationId, 'Begin updating state for ' + stateUpdate.device_id
            + ' at ' + stateUpdate.time);
        if (this._jobQueue.length > this._maxQueueJobs) {
            this._counters.incrementOne("STATE_UPDATES_QUEUE_FULL");
            this._counters.dump();
            let err = new pip_services3_commons_node_2.InvalidStateException(correlationId, 'JOB_QUEUE_FULL', 'Job queue size was exceeded. Reduce update rate or increase system performance');
            callback(err);
        }
        else {
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
    updateState(correlationId, stateUpdate, callback) {
        let organizationData;
        let oldState;
        let newState;
        this.fixStateUpdate(stateUpdate);
        this._logger.info(correlationId, 'Updating state for ' + stateUpdate.device_id
            + ' at ' + stateUpdate.time);
        async.series([
            // Get organization data
            (callback) => {
                this._dataManager.loadData(correlationId, stateUpdate.org_id, (err, data) => {
                    organizationData = data;
                    callback(err);
                });
            },
            // Get old state
            (callback) => {
                this._stateManager.getOldState(correlationId, stateUpdate, organizationData, (err, data) => {
                    oldState = data;
                    callback(err);
                });
            },
            // If no object is attached update device state and exit
            (callback) => {
                if (oldState == null) {
                    this._deviceStatesRecorder.recordState(correlationId, stateUpdate, (err) => {
                        err = err || 'abort';
                        callback(err);
                    });
                }
                else {
                    callback(null);
                }
            },
            // Validate state update
            (callback) => {
                let err = StateUpdatesValidator_1.StateUpdatesValidator.validate(correlationId, stateUpdate, oldState, organizationData);
                callback(err);
            },
            // Get current state
            (callback) => {
                this._stateManager.getNewState(correlationId, oldState, stateUpdate, organizationData, (err, data) => {
                    newState = data;
                    callback(err);
                });
            },
            // Calculate sensor data
            (callback) => {
                this._sensorDataManager.calculateSensorData(correlationId, newState, stateUpdate, organizationData);
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
                        this._positionsRecorder.recordPositions(correlationId, newState, this.handleAsyncCallback(correlationId, stateUpdate, 'Failed to record historical positions'));
                        callback();
                    },
                    // Record historical states
                    (callback) => {
                        this._historicalStatesRecorder.recordState(correlationId, newState, false, this.handleAsyncCallback(correlationId, stateUpdate, 'Failed to record historical states'));
                        callback();
                    },
                    // Record sensor data
                    (callback) => {
                        this._dataRecorder.recordData(correlationId, newState, this.handleAsyncCallback(correlationId, stateUpdate, 'Failed to record sensor data'));
                        callback();
                    },
                    // Record statistics
                    (callback) => {
                        this._statisticsRecorder.recordStatistics(correlationId, oldState, newState, organizationData, this.handleAsyncCallback(correlationId, stateUpdate, 'Failed to record statistics'));
                        callback();
                    },
                    // Record attendances
                    (callback) => {
                        this._attendanceRecorder.recordAttendance(correlationId, newState, this.handleAsyncCallback(correlationId, stateUpdate, 'Failed to record attendances'));
                        callback();
                    },
                    // Actyivate rules
                    (callback) => {
                        this._eventGenerator.generateEventsForState(correlationId, newState, (err, activated) => {
                            // Save states unconditionally is rules activated
                            if (activated && !this._historicalStatesRecorder.recordDue(newState)) {
                                this._historicalStatesRecorder.recordState(correlationId, newState, true, this.handleAsyncCallback(correlationId, stateUpdate, 'Failed to record historical states'));
                            }
                            this.handleAsyncCallback(correlationId, stateUpdate, 'Failed to activate rules')(err);
                        });
                        callback();
                    }
                ], callback);
            }
        ], (err) => {
            if (err == 'abort')
                err = null;
            if (err) {
                this._statisticsRecorder.recordErrorStats(correlationId, organizationData ? organizationData.organization : null, stateUpdate, this.handleAsyncCallback(correlationId, stateUpdate, 'Failed to record error stats'));
            }
            setTimeout(() => {
                callback(err, err == null ? newState : null);
            }, 10);
        });
    }
    updateOfflineStates(correlationId, roster, callback) {
        let organizationData;
        let state;
        async.series([
            // Get organization data
            (callback) => {
                this._dataManager.loadData(correlationId, roster.org_id, (err, data) => {
                    organizationData = data;
                    callback(err);
                });
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
                this._eventGenerator.generateEventsForStates(correlationId, states, this.handleAsyncCallback(correlationId, null, 'Failed to activate rules for offline devices'));
                // Save historical states
                this._historicalStatesRecorder.recordStates(correlationId, states, true, this.handleAsyncCallback(correlationId, null, 'Failed to save historical states'));
                // Save offline states
                this._dataManager.saveStates(correlationId, states, callback);
            }
        ], (err) => {
            callback(err);
        });
    }
    offlineCheck(callback) {
        // Enable check if background process if already running
        if (this._offlineProcessing)
            return;
        this._offlineProcessing = true;
        this._logger.debug('state-offline', 'Processing offline objects...');
        let skip = 0, take = 10;
        async.whilst(() => {
            return this._offlineProcessing;
        }, (callback) => {
            this._rosterManager.getCurrentShiftRosters('state-offline', skip, take, (err, rosters) => {
                if (err) {
                    callback(err);
                    return;
                }
                this._offlineProcessing = rosters && rosters.length > 0;
                skip += take;
                async.each(rosters, (roster, callback) => {
                    this.updateOfflineStates('state-offline', roster, callback);
                }, callback);
            });
        }, (err) => {
            this._offlineProcessing = false;
            if (err) {
                this._logger.error('state-offline', err, 'Failed to process offline objects');
            }
            if (callback)
                callback(err);
        });
    }
    dumpCache(callback) {
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
exports.StateUpdatesController = StateUpdatesController;
//# sourceMappingURL=StateUpdatesController.js.map