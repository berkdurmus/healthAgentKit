import { v4 as uuidv4 } from "uuid";
import {
  Agent,
  State,
  Action,
  Experience,
  AgentType,
  AgentStats,
} from "@/types/core.types";

/**
 * Abstract base class for all healthcare RL agents
 * Provides common functionality and enforces the Agent interface
 */
export abstract class BaseAgent implements Agent {
  public readonly id: string;
  public readonly name: string;
  public readonly type: AgentType;

  protected experiences: Experience[] = [];
  protected isTraining: boolean = true;
  protected episodeCount: number = 0;
  protected totalSteps: number = 0;

  constructor(name: string, type: AgentType, id?: string) {
    this.id = id ?? uuidv4();
    this.name = name;
    this.type = type;
  }

  /**
   * Abstract method for action selection - must be implemented by subclasses
   */
  public abstract selectAction(
    state: State,
    availableActions: Action[]
  ): Promise<Action>;

  /**
   * Abstract method for policy updates - must be implemented by subclasses
   */
  public abstract update(experience: Experience): Promise<void>;

  /**
   * Abstract method for confidence estimation - must be implemented by subclasses
   */
  public abstract getConfidence(state: State, action: Action): number;

  /**
   * Reset the agent's internal state
   */
  public reset(): void {
    this.experiences = [];
    this.episodeCount = 0;
    this.totalSteps = 0;
    this.onReset();
  }

  /**
   * Hook for subclasses to implement custom reset logic
   */
  protected onReset(): void {
    // Override in subclasses if needed
  }

  /**
   * Add an experience to the agent's memory
   */
  protected addExperience(experience: Experience): void {
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
  protected getMaxMemorySize(): number {
    return 10000;
  }

  /**
   * Get all experiences in memory
   */
  public getExperiences(): readonly Experience[] {
    return [...this.experiences];
  }

  /**
   * Get the most recent N experiences
   */
  public getRecentExperiences(count: number): readonly Experience[] {
    return this.experiences.slice(-count);
  }

  /**
   * Set training mode
   */
  public setTraining(training: boolean): void {
    this.isTraining = training;
  }

  /**
   * Check if agent is in training mode
   */
  public isInTraining(): boolean {
    return this.isTraining;
  }

  /**
   * Get agent statistics
   */
  public getStats(): AgentStats {
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
  public startEpisode(): void {
    this.episodeCount++;
    this.onEpisodeStart();
  }

  /**
   * End the current episode
   */
  public endEpisode(): void {
    this.onEpisodeEnd();
  }

  /**
   * Hook for subclasses to implement custom episode start logic
   */
  protected onEpisodeStart(): void {
    // Override in subclasses if needed
  }

  /**
   * Hook for subclasses to implement custom episode end logic
   */
  protected onEpisodeEnd(): void {
    // Override in subclasses if needed
  }

  /**
   * Filter available actions based on constraints and agent capabilities
   */
  protected filterValidActions(
    state: State,
    availableActions: Action[]
  ): Action[] {
    return availableActions.filter((action) =>
      this.isActionValid(state, action)
    );
  }

  /**
   * Check if an action is valid for the current state
   */
  protected isActionValid(state: State, action: Action): boolean {
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
  protected satisfiesConstraint(
    state: State,
    action: Action,
    constraint: any
  ): boolean {
    // Basic implementation - override in subclasses for specific constraint logic
    return true;
  }

  /**
   * Check if the agent has the required clinical role
   */
  protected hasRequiredRole(requiredRole: string): boolean {
    // Base implementation assumes no role restrictions
    // Override in subclasses that implement role-based agents
    return true;
  }

  /**
   * Log agent activity for debugging and monitoring
   */
  protected log(
    level: "info" | "warn" | "error",
    message: string,
    data?: any
  ): void {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      agent: this.name,
      level,
      message,
      data,
    };

    // In production, this would use a proper logging framework
    console.log(
      `[${timestamp}] ${level.toUpperCase()} [${this.name}]: ${message}`,
      data || ""
    );
  }
}


