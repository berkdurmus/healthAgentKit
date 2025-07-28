"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimulationEngine = void 0;
const rxjs_1 = require("rxjs");
/**
 * Healthcare Agent Simulation Engine
 * Orchestrates agent-environment interactions, tracks episodes, and collects comprehensive metrics
 */
class SimulationEngine {
    agent;
    environment;
    config;
    // State management
    currentEpisode = 0;
    totalSteps = 0;
    isRunning = false;
    isPaused = false;
    // Data collection
    episodeHistory = [];
    metrics;
    // Event streams for real-time monitoring
    stepSubject = new rxjs_1.Subject();
    episodeSubject = new rxjs_1.Subject();
    metricsSubject = new rxjs_1.BehaviorSubject(this.initializeMetrics());
    step$ = this.stepSubject.asObservable();
    episode$ = this.episodeSubject.asObservable();
    metrics$ = this.metricsSubject.asObservable();
    constructor(agent, environment, config = {}) {
        this.agent = agent;
        this.environment = environment;
        this.config = { ...this.getDefaultConfig(), ...config };
        this.metrics = this.initializeMetrics();
        this.log('info', 'Simulation engine initialized', {
            agent: agent.name,
            environment: environment.name,
            config: this.config
        });
    }
    /**
     * Run a single episode (patient encounter to resolution)
     */
    async runEpisode() {
        this.currentEpisode++;
        const episodeStartTime = Date.now();
        this.log('info', `Starting episode ${this.currentEpisode}`);
        // Reset environment and agent for new episode
        const initialState = await this.environment.reset();
        this.agent.startEpisode();
        const episodeData = {
            episodeNumber: this.currentEpisode,
            steps: [],
            totalReward: 0,
            startTime: new Date(episodeStartTime),
            endTime: new Date(),
            success: false,
            reason: 'incomplete'
        };
        let currentState = initialState;
        let step = 0;
        let done = false;
        try {
            while (!done && step < (this.config.maxStepsPerEpisode || 1000)) {
                if (this.isPaused) {
                    await this.waitForResume();
                }
                // Get available actions from environment
                const availableActions = this.environment.getAvailableActions(currentState);
                if (availableActions.length === 0) {
                    this.log('warn', 'No available actions in current state', { step, state: currentState.type });
                    break;
                }
                // Agent selects action
                const selectedAction = await this.agent.selectAction(currentState, availableActions);
                // Execute action in environment
                const stepResult = await this.environment.step(selectedAction);
                // Create experience for agent learning
                const experience = {
                    state: currentState,
                    action: selectedAction,
                    reward: stepResult.reward,
                    nextState: stepResult.state,
                    done: stepResult.done,
                    timestamp: new Date()
                };
                // Update agent with experience
                await this.agent.update(experience);
                // Record step data
                const stepData = {
                    stepNumber: step,
                    state: currentState,
                    action: selectedAction,
                    reward: stepResult.reward,
                    nextState: stepResult.state,
                    done: stepResult.done,
                    info: stepResult.info,
                    agentConfidence: this.agent.getConfidence(currentState, selectedAction),
                    timestamp: new Date()
                };
                episodeData.steps.push(stepData);
                episodeData.totalReward += stepResult.reward.value;
                // Emit step event for real-time monitoring
                this.stepSubject.next({
                    type: 'step_completed',
                    episode: this.currentEpisode,
                    step: step,
                    stepData,
                    cumulativeReward: episodeData.totalReward
                });
                // Update state and counters
                currentState = stepResult.state;
                step++;
                this.totalSteps++;
                done = stepResult.done;
                // Check for custom termination conditions
                if (this.shouldTerminateEpisode(episodeData, stepResult)) {
                    done = true;
                    episodeData.reason = 'custom_termination';
                }
            }
            // End episode
            episodeData.endTime = new Date();
            episodeData.success = this.isEpisodeSuccessful(episodeData);
            if (step >= (this.config.maxStepsPerEpisode || 1000)) {
                episodeData.reason = 'max_steps_reached';
            }
            else if (done) {
                episodeData.reason = 'environment_terminal';
            }
        }
        catch (error) {
            this.log('error', 'Error during episode execution', { error, episode: this.currentEpisode, step });
            episodeData.reason = 'error';
            episodeData.success = false;
        }
        finally {
            this.agent.endEpisode();
        }
        // Create episode result
        const episodeResult = {
            ...episodeData,
            duration: episodeData.endTime.getTime() - episodeData.startTime.getTime(),
            averageReward: episodeData.totalReward / Math.max(1, episodeData.steps.length),
            environmentMetrics: this.environment.getMetrics(),
            agentStats: this.agent.getStats()
        };
        // Update simulation metrics
        this.updateSimulationMetrics(episodeResult);
        // Store episode history
        this.episodeHistory.push(episodeResult);
        // Limit history size to prevent memory issues
        if (this.episodeHistory.length > (this.config.maxEpisodeHistory || 1000)) {
            this.episodeHistory = this.episodeHistory.slice(-(this.config.maxEpisodeHistory || 1000));
        }
        // Emit episode completion event
        this.episodeSubject.next({
            type: 'episode_completed',
            episode: this.currentEpisode,
            result: episodeResult,
            totalEpisodes: this.currentEpisode
        });
        this.log('info', `Episode ${this.currentEpisode} completed`, {
            success: episodeResult.success,
            steps: episodeResult.steps.length,
            totalReward: episodeResult.totalReward.toFixed(2),
            duration: episodeResult.duration
        });
        return episodeResult;
    }
    /**
     * Run multiple episodes
     */
    async runMultipleEpisodes(numEpisodes) {
        const results = [];
        this.isRunning = true;
        for (let i = 0; i < numEpisodes && this.isRunning; i++) {
            try {
                const result = await this.runEpisode();
                results.push(result);
                // Optional delay between episodes
                if (this.config.episodeDelay && this.config.episodeDelay > 0) {
                    await this.delay(this.config.episodeDelay);
                }
            }
            catch (error) {
                this.log('error', 'Failed to complete episode', { episode: i + 1, error });
                break;
            }
        }
        this.isRunning = false;
        this.log('info', `Completed ${results.length}/${numEpisodes} episodes`);
        return results;
    }
    /**
     * Pause the simulation
     */
    pause() {
        this.isPaused = true;
        this.log('info', 'Simulation paused');
    }
    /**
     * Resume the simulation
     */
    resume() {
        this.isPaused = false;
        this.log('info', 'Simulation resumed');
    }
    /**
     * Stop the simulation
     */
    stop() {
        this.isRunning = false;
        this.isPaused = false;
        this.log('info', 'Simulation stopped');
    }
    /**
     * Get current simulation metrics
     */
    getMetrics() {
        return { ...this.metrics };
    }
    /**
     * Get episode history
     */
    getEpisodeHistory() {
        return [...this.episodeHistory];
    }
    /**
     * Get performance summary
     */
    getPerformanceSummary() {
        if (this.episodeHistory.length === 0) {
            return {
                totalEpisodes: 0,
                successRate: 0,
                averageReward: 0,
                averageSteps: 0,
                averageDuration: 0,
                rewardTrend: [],
                stepsTrend: []
            };
        }
        const recentEpisodes = this.episodeHistory.slice(-(this.config.performanceWindowSize || 100));
        return {
            totalEpisodes: this.episodeHistory.length,
            successRate: recentEpisodes.filter(e => e.success).length / recentEpisodes.length,
            averageReward: recentEpisodes.reduce((sum, e) => sum + e.totalReward, 0) / recentEpisodes.length,
            averageSteps: recentEpisodes.reduce((sum, e) => sum + e.steps.length, 0) / recentEpisodes.length,
            averageDuration: recentEpisodes.reduce((sum, e) => sum + e.duration, 0) / recentEpisodes.length,
            rewardTrend: recentEpisodes.map(e => e.totalReward),
            stepsTrend: recentEpisodes.map(e => e.steps.length)
        };
    }
    /**
     * Export simulation data for analysis
     */
    exportData() {
        return {
            config: this.config,
            metrics: this.metrics,
            episodeHistory: this.episodeHistory,
            agentStats: this.agent.getStats(),
            environmentStats: this.environment.getStats(),
            exportTimestamp: new Date()
        };
    }
    // Private helper methods
    getDefaultConfig() {
        return {
            maxStepsPerEpisode: 1000,
            maxEpisodeHistory: 1000,
            episodeDelay: 0,
            enableLogging: true,
            enableMetrics: true,
            performanceWindowSize: 100,
            successThreshold: 0.8
        };
    }
    initializeMetrics() {
        return {
            totalEpisodes: 0,
            totalSteps: 0,
            totalReward: 0,
            averageReward: 0,
            successRate: 0,
            averageStepsPerEpisode: 0,
            averageEpisodeDuration: 0,
            startTime: new Date(),
            lastUpdateTime: new Date()
        };
    }
    updateSimulationMetrics(episodeResult) {
        this.metrics.totalEpisodes++;
        this.metrics.totalSteps += episodeResult.steps.length;
        this.metrics.totalReward += episodeResult.totalReward;
        this.metrics.averageReward = this.metrics.totalReward / this.metrics.totalEpisodes;
        const recentEpisodes = this.episodeHistory.slice(-(this.config.performanceWindowSize || 100));
        this.metrics.successRate = recentEpisodes.filter(e => e.success).length / Math.max(1, recentEpisodes.length);
        this.metrics.averageStepsPerEpisode = this.metrics.totalSteps / this.metrics.totalEpisodes;
        const totalDuration = this.episodeHistory.reduce((sum, e) => sum + e.duration, 0) + episodeResult.duration;
        this.metrics.averageEpisodeDuration = totalDuration / this.metrics.totalEpisodes;
        this.metrics.lastUpdateTime = new Date();
        // Emit updated metrics
        this.metricsSubject.next({ ...this.metrics });
    }
    shouldTerminateEpisode(episodeData, stepResult) {
        // Custom termination logic can be added here
        return false;
    }
    isEpisodeSuccessful(episodeData) {
        // Define success criteria - can be customized based on scenario
        const avgReward = episodeData.totalReward / Math.max(1, episodeData.steps.length);
        return avgReward > (this.config.successThreshold || 0.8);
    }
    async waitForResume() {
        return new Promise(resolve => {
            const checkPause = () => {
                if (!this.isPaused) {
                    resolve();
                }
                else {
                    setTimeout(checkPause, 100);
                }
            };
            checkPause();
        });
    }
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    log(level, message, data) {
        if (!this.config.enableLogging)
            return;
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] ${level.toUpperCase()} [SimulationEngine]: ${message}`, data || '');
    }
}
exports.SimulationEngine = SimulationEngine;
//# sourceMappingURL=simulation.engine.js.map