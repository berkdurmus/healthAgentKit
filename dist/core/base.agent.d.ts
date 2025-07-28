import { Agent, State, Action, Experience, AgentType, AgentStats } from "@/types/core.types";
/**
 * Abstract base class for all healthcare RL agents
 * Provides common functionality and enforces the Agent interface
 */
export declare abstract class BaseAgent implements Agent {
    readonly id: string;
    readonly name: string;
    readonly type: AgentType;
    protected experiences: Experience[];
    protected isTraining: boolean;
    protected episodeCount: number;
    protected totalSteps: number;
    constructor(name: string, type: AgentType, id?: string);
    /**
     * Abstract method for action selection - must be implemented by subclasses
     */
    abstract selectAction(state: State, availableActions: Action[]): Promise<Action>;
    /**
     * Abstract method for policy updates - must be implemented by subclasses
     */
    abstract update(experience: Experience): Promise<void>;
    /**
     * Abstract method for confidence estimation - must be implemented by subclasses
     */
    abstract getConfidence(state: State, action: Action): number;
    /**
     * Reset the agent's internal state
     */
    reset(): void;
    /**
     * Hook for subclasses to implement custom reset logic
     */
    protected onReset(): void;
    /**
     * Add an experience to the agent's memory
     */
    protected addExperience(experience: Experience): void;
    /**
     * Get the maximum memory size for experiences
     * Override in subclasses to customize
     */
    protected getMaxMemorySize(): number;
    /**
     * Get all experiences in memory
     */
    getExperiences(): readonly Experience[];
    /**
     * Get the most recent N experiences
     */
    getRecentExperiences(count: number): readonly Experience[];
    /**
     * Set training mode
     */
    setTraining(training: boolean): void;
    /**
     * Check if agent is in training mode
     */
    isInTraining(): boolean;
    /**
     * Get agent statistics
     */
    getStats(): AgentStats;
    /**
     * Start a new episode
     */
    startEpisode(): void;
    /**
     * End the current episode
     */
    endEpisode(): void;
    /**
     * Hook for subclasses to implement custom episode start logic
     */
    protected onEpisodeStart(): void;
    /**
     * Hook for subclasses to implement custom episode end logic
     */
    protected onEpisodeEnd(): void;
    /**
     * Filter available actions based on constraints and agent capabilities
     */
    protected filterValidActions(state: State, availableActions: Action[]): Action[];
    /**
     * Check if an action is valid for the current state
     */
    protected isActionValid(state: State, action: Action): boolean;
    /**
     * Check if an action satisfies a given constraint
     */
    protected satisfiesConstraint(state: State, action: Action, constraint: any): boolean;
    /**
     * Check if the agent has the required clinical role
     */
    protected hasRequiredRole(requiredRole: string): boolean;
    /**
     * Log agent activity for debugging and monitoring
     */
    protected log(level: "info" | "warn" | "error", message: string, data?: any): void;
}
//# sourceMappingURL=base.agent.d.ts.map