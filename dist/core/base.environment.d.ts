import { Environment, State, Action, StepResult, EnvironmentType, EnvironmentMetrics } from '@/types/core.types';
/**
 * Abstract base class for all healthcare environments
 * Provides common functionality and enforces the Environment interface
 */
export declare abstract class BaseEnvironment implements Environment {
    readonly id: string;
    readonly name: string;
    readonly type: EnvironmentType;
    protected currentState: State | null;
    protected episodeSteps: number;
    protected totalEpisodes: number;
    protected maxStepsPerEpisode: number;
    protected startTime: Date | null;
    protected config: EnvironmentConfig;
    constructor(name: string, type: EnvironmentType, config?: EnvironmentConfig, id?: string);
    /**
     * Get the current state of the environment
     */
    getCurrentState(): State;
    /**
     * Abstract method to get available actions - must be implemented by subclasses
     */
    abstract getAvailableActions(state?: State): Action[];
    /**
     * Abstract method to execute a step - must be implemented by subclasses
     */
    abstract step(action: Action): Promise<StepResult>;
    /**
     * Abstract method to reset environment - must be implemented by subclasses
     */
    abstract reset(): Promise<State>;
    /**
     * Check if the environment has reached a terminal state
     */
    isDone(): boolean;
    /**
     * Override in subclasses to define custom terminal conditions
     */
    protected isCustomTerminalCondition(): boolean;
    /**
     * Get environment metrics and statistics
     */
    getMetrics(): EnvironmentMetrics;
    /**
     * Calculate environment throughput (patients per hour)
     */
    protected calculateThroughput(): number;
    /**
     * Calculate average wait time - override in subclasses
     */
    protected abstract calculateAverageWaitTime(): number;
    /**
     * Calculate patient satisfaction - override in subclasses
     */
    protected abstract calculatePatientSatisfaction(): number;
    /**
     * Calculate resource utilization - override in subclasses
     */
    protected abstract calculateResourceUtilization(): Record<string, number>;
    /**
     * Calculate cost per patient - override in subclasses
     */
    protected abstract calculateCostPerPatient(): number;
    /**
     * Get safety incidents count - override in subclasses
     */
    protected abstract getSafetyIncidents(): number;
    /**
     * Start a new episode
     */
    protected startEpisode(): void;
    /**
     * End the current episode
     */
    protected endEpisode(): void;
    /**
     * Hook for subclasses to implement custom episode start logic
     */
    protected onEpisodeStart(): void;
    /**
     * Hook for subclasses to implement custom episode end logic
     */
    protected onEpisodeEnd(): void;
    /**
     * Update the current state
     */
    protected updateState(newState: State): void;
    /**
     * Get default environment configuration
     */
    protected getDefaultConfig(): EnvironmentConfig;
    /**
     * Get environment statistics
     */
    getStats(): EnvironmentStats;
    /**
     * Set maximum steps per episode
     */
    setMaxStepsPerEpisode(maxSteps: number): void;
    /**
     * Log environment activity
     */
    protected log(level: 'info' | 'warn' | 'error', message: string, data?: any): void;
    /**
     * Validate an action before execution
     */
    protected validateAction(action: Action): boolean;
    /**
     * Generate a unique state ID
     */
    protected generateStateId(): string;
    /**
     * Create a state object with common properties
     */
    protected createState(type: any, data: Record<string, unknown>, isTerminal?: boolean): State;
}
/**
 * Environment configuration interface
 */
export interface EnvironmentConfig {
    maxStepsPerEpisode?: number;
    enableMetrics?: boolean;
    enableLogging?: boolean;
    randomSeed?: number;
    [key: string]: unknown;
}
/**
 * Environment statistics interface
 */
export interface EnvironmentStats {
    readonly id: string;
    readonly name: string;
    readonly type: EnvironmentType;
    readonly totalEpisodes: number;
    readonly currentEpisodeSteps: number;
    readonly maxStepsPerEpisode: number;
    readonly isDone: boolean;
    readonly startTime: Date | null;
    readonly config: EnvironmentConfig;
}
//# sourceMappingURL=base.environment.d.ts.map