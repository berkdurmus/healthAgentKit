import { Observable } from 'rxjs';
import { Agent, Environment, State, Action, Reward } from '@/types/core.types';
/**
 * Healthcare Agent Simulation Engine
 * Orchestrates agent-environment interactions, tracks episodes, and collects comprehensive metrics
 */
export declare class SimulationEngine {
    private agent;
    private environment;
    private config;
    private currentEpisode;
    private totalSteps;
    private isRunning;
    private isPaused;
    private episodeHistory;
    private metrics;
    private stepSubject;
    private episodeSubject;
    private metricsSubject;
    readonly step$: Observable<StepEvent>;
    readonly episode$: Observable<EpisodeEvent>;
    readonly metrics$: Observable<SimulationMetrics>;
    constructor(agent: Agent, environment: Environment, config?: SimulationConfig);
    /**
     * Run a single episode (patient encounter to resolution)
     */
    runEpisode(): Promise<EpisodeResult>;
    /**
     * Run multiple episodes
     */
    runMultipleEpisodes(numEpisodes: number): Promise<EpisodeResult[]>;
    /**
     * Pause the simulation
     */
    pause(): void;
    /**
     * Resume the simulation
     */
    resume(): void;
    /**
     * Stop the simulation
     */
    stop(): void;
    /**
     * Get current simulation metrics
     */
    getMetrics(): SimulationMetrics;
    /**
     * Get episode history
     */
    getEpisodeHistory(): readonly EpisodeResult[];
    /**
     * Get performance summary
     */
    getPerformanceSummary(): PerformanceSummary;
    /**
     * Export simulation data for analysis
     */
    exportData(): SimulationExport;
    private getDefaultConfig;
    private initializeMetrics;
    private updateSimulationMetrics;
    private shouldTerminateEpisode;
    private isEpisodeSuccessful;
    private waitForResume;
    private delay;
    private log;
}
export interface SimulationConfig {
    maxStepsPerEpisode?: number;
    maxEpisodeHistory?: number;
    episodeDelay?: number;
    enableLogging?: boolean;
    enableMetrics?: boolean;
    performanceWindowSize?: number;
    successThreshold?: number;
}
interface EpisodeData {
    episodeNumber: number;
    steps: StepData[];
    totalReward: number;
    startTime: Date;
    endTime: Date;
    success: boolean;
    reason: string;
}
export interface EpisodeResult extends EpisodeData {
    duration: number;
    averageReward: number;
    environmentMetrics: any;
    agentStats: any;
}
export interface StepData {
    stepNumber: number;
    state: State;
    action: Action;
    reward: Reward;
    nextState: State;
    done: boolean;
    info: Record<string, unknown>;
    agentConfidence: number;
    timestamp: Date;
}
export interface SimulationMetrics {
    totalEpisodes: number;
    totalSteps: number;
    totalReward: number;
    averageReward: number;
    successRate: number;
    averageStepsPerEpisode: number;
    averageEpisodeDuration: number;
    startTime: Date;
    lastUpdateTime: Date;
}
export interface PerformanceSummary {
    totalEpisodes: number;
    successRate: number;
    averageReward: number;
    averageSteps: number;
    averageDuration: number;
    rewardTrend: number[];
    stepsTrend: number[];
}
export interface StepEvent {
    type: 'step_completed';
    episode: number;
    step: number;
    stepData: StepData;
    cumulativeReward: number;
}
export interface EpisodeEvent {
    type: 'episode_completed';
    episode: number;
    result: EpisodeResult;
    totalEpisodes: number;
}
export interface SimulationExport {
    config: SimulationConfig;
    metrics: SimulationMetrics;
    episodeHistory: EpisodeResult[];
    agentStats: any;
    environmentStats: any;
    exportTimestamp: Date;
}
export {};
//# sourceMappingURL=simulation.engine.d.ts.map