"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseAgent = void 0;
const uuid_1 = require("uuid");
/**
 * Abstract base class for all healthcare RL agents
 * Provides common functionality and enforces the Agent interface
 */
class BaseAgent {
    id;
    name;
    type;
    experiences = [];
    isTraining = true;
    episodeCount = 0;
    totalSteps = 0;
    constructor(name, type, id) {
        this.id = id ?? (0, uuid_1.v4)();
        this.name = name;
        this.type = type;
    }
    /**
     * Reset the agent's internal state
     */
    reset() {
        this.experiences = [];
        this.episodeCount = 0;
        this.totalSteps = 0;
        this.onReset();
    }
    /**
     * Hook for subclasses to implement custom reset logic
     */
    onReset() {
        // Override in subclasses if needed
    }
    /**
     * Add an experience to the agent's memory
     */
    addExperience(experience) {
        this.experiences.push(experience);
        this.totalSteps++;
        // Limit memory size to prevent unbounded growth
        const maxMemorySize = this.getMaxMemorySize();
        if (this.experiences.length > maxMemorySize) {
            this.experiences = this.experiences.slice(-maxMemorySize);
        }
    }
    /**
     * Get the maximum memory size for experiences
     * Override in subclasses to customize
     */
    getMaxMemorySize() {
        return 10000;
    }
    /**
     * Get all experiences in memory
     */
    getExperiences() {
        return [...this.experiences];
    }
    /**
     * Get the most recent N experiences
     */
    getRecentExperiences(count) {
        return this.experiences.slice(-count);
    }
    /**
     * Set training mode
     */
    setTraining(training) {
        this.isTraining = training;
    }
    /**
     * Check if agent is in training mode
     */
    isInTraining() {
        return this.isTraining;
    }
    /**
     * Get agent statistics
     */
    getStats() {
        return {
            id: this.id,
            name: this.name,
            type: this.type,
            episodeCount: this.episodeCount,
            totalSteps: this.totalSteps,
            experienceCount: this.experiences.length,
            isTraining: this.isTraining,
        };
    }
    /**
     * Start a new episode
     */
    startEpisode() {
        this.episodeCount++;
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
     * Filter available actions based on constraints and agent capabilities
     */
    filterValidActions(state, availableActions) {
        return availableActions.filter((action) => this.isActionValid(state, action));
    }
    /**
     * Check if an action is valid for the current state
     */
    isActionValid(state, action) {
        // Check basic constraints
        if (action.constraints) {
            for (const constraint of action.constraints) {
                if (!this.satisfiesConstraint(state, action, constraint)) {
                    return false;
                }
            }
        }
        // Check role requirements
        if (action.requiredRole && !this.hasRequiredRole(action.requiredRole)) {
            return false;
        }
        return true;
    }
    /**
     * Check if an action satisfies a given constraint
     */
    satisfiesConstraint(state, action, constraint) {
        // Basic implementation - override in subclasses for specific constraint logic
        return true;
    }
    /**
     * Check if the agent has the required clinical role
     */
    hasRequiredRole(requiredRole) {
        // Base implementation assumes no role restrictions
        // Override in subclasses that implement role-based agents
        return true;
    }
    /**
     * Log agent activity for debugging and monitoring
     */
    log(level, message, data) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            agent: this.name,
            level,
            message,
            data,
        };
        // In production, this would use a proper logging framework
        console.log(`[${timestamp}] ${level.toUpperCase()} [${this.name}]: ${message}`, data || "");
    }
}
exports.BaseAgent = BaseAgent;
//# sourceMappingURL=base.agent.js.map