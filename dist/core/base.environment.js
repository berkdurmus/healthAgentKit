"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseEnvironment = void 0;
const uuid_1 = require("uuid");
/**
 * Abstract base class for all healthcare environments
 * Provides common functionality and enforces the Environment interface
 */
class BaseEnvironment {
    id;
    name;
    type;
    currentState = null;
    episodeSteps = 0;
    totalEpisodes = 0;
    maxStepsPerEpisode = 1000;
    startTime = null;
    // Environment configuration
    config;
    constructor(name, type, config = {}, id) {
        this.id = id ?? (0, uuid_1.v4)();
        this.name = name;
        this.type = type;
        this.config = { ...this.getDefaultConfig(), ...config };
    }
    /**
     * Get the current state of the environment
     */
    getCurrentState() {
        if (!this.currentState) {
            throw new Error('Environment not initialized. Call reset() first.');
        }
        return this.currentState;
    }
    /**
     * Check if the environment has reached a terminal state
     */
    isDone() {
        if (!this.currentState) {
            return false;
        }
        return this.currentState.isTerminal ||
            this.episodeSteps >= this.maxStepsPerEpisode ||
            this.isCustomTerminalCondition();
    }
    /**
     * Override in subclasses to define custom terminal conditions
     */
    isCustomTerminalCondition() {
        return false;
    }
    /**
     * Get environment metrics and statistics
     */
    getMetrics() {
        return {
            throughput: this.calculateThroughput(),
            averageWaitTime: this.calculateAverageWaitTime(),
            patientSatisfaction: this.calculatePatientSatisfaction(),
            resourceUtilization: this.calculateResourceUtilization(),
            costPerPatient: this.calculateCostPerPatient(),
            safetyIncidents: this.getSafetyIncidents()
        };
    }
    /**
     * Calculate environment throughput (patients per hour)
     */
    calculateThroughput() {
        if (!this.startTime || this.totalEpisodes === 0) {
            return 0;
        }
        const hoursElapsed = (Date.now() - this.startTime.getTime()) / (1000 * 60 * 60);
        return this.totalEpisodes / hoursElapsed;
    }
    /**
     * Start a new episode
     */
    startEpisode() {
        this.episodeSteps = 0;
        this.totalEpisodes++;
        if (!this.startTime) {
            this.startTime = new Date();
        }
        this.onEpisodeStart();
    }
    /**
     * End the current episode
     */
    endEpisode() {
        this.onEpisodeEnd();
    }
    /**
     * Hook for subclasses to implement custom episode start logic
     */
    onEpisodeStart() {
        // Override in subclasses if needed
    }
    /**
     * Hook for subclasses to implement custom episode end logic
     */
    onEpisodeEnd() {
        // Override in subclasses if needed
    }
    /**
     * Update the current state
     */
    updateState(newState) {
        this.currentState = newState;
        this.episodeSteps++;
    }
    /**
     * Get default environment configuration
     */
    getDefaultConfig() {
        return {
            maxStepsPerEpisode: 1000,
            enableMetrics: true,
            enableLogging: true,
            randomSeed: undefined
        };
    }
    /**
     * Get environment statistics
     */
    getStats() {
        return {
            id: this.id,
            name: this.name,
            type: this.type,
            totalEpisodes: this.totalEpisodes,
            currentEpisodeSteps: this.episodeSteps,
            maxStepsPerEpisode: this.maxStepsPerEpisode,
            isDone: this.isDone(),
            startTime: this.startTime,
            config: this.config
        };
    }
    /**
     * Set maximum steps per episode
     */
    setMaxStepsPerEpisode(maxSteps) {
        this.maxStepsPerEpisode = maxSteps;
    }
    /**
     * Log environment activity
     */
    log(level, message, data) {
        if (!this.config.enableLogging) {
            return;
        }
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] ${level.toUpperCase()} [${this.name}]: ${message}`, data || '');
    }
    /**
     * Validate an action before execution
     */
    validateAction(action) {
        const availableActions = this.getAvailableActions();
        return availableActions.some(a => a.id === action.id);
    }
    /**
     * Generate a unique state ID
     */
    generateStateId() {
        return (0, uuid_1.v4)();
    }
    /**
     * Create a state object with common properties
     */
    createState(type, data, isTerminal = false) {
        return {
            id: this.generateStateId(),
            timestamp: new Date(),
            type,
            data,
            isTerminal
        };
    }
}
exports.BaseEnvironment = BaseEnvironment;
//# sourceMappingURL=base.environment.js.map