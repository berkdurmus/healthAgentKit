import { v4 as uuidv4 } from 'uuid';
import { 
  Environment, 
  State, 
  Action, 
  StepResult, 
  EnvironmentType, 
  EnvironmentMetrics,
  PatientProfile 
} from '@/types/core.types';

/**
 * Abstract base class for all healthcare environments
 * Provides common functionality and enforces the Environment interface
 */
export abstract class BaseEnvironment implements Environment {
  public readonly id: string;
  public readonly name: string;
  public readonly type: EnvironmentType;
  
  protected currentState: State | null = null;
  protected episodeSteps: number = 0;
  protected totalEpisodes: number = 0;
  protected maxStepsPerEpisode: number = 1000;
  protected startTime: Date | null = null;
  
  // Environment configuration
  protected config: EnvironmentConfig;
  
  constructor(name: string, type: EnvironmentType, config: EnvironmentConfig = {}, id?: string) {
    this.id = id ?? uuidv4();
    this.name = name;
    this.type = type;
    this.config = { ...this.getDefaultConfig(), ...config };
  }

  /**
   * Get the current state of the environment
   */
  public getCurrentState(): State {
    if (!this.currentState) {
      throw new Error('Environment not initialized. Call reset() first.');
    }
    return this.currentState;
  }

  /**
   * Abstract method to get available actions - must be implemented by subclasses
   */
  public abstract getAvailableActions(state?: State): Action[];

  /**
   * Abstract method to execute a step - must be implemented by subclasses
   */
  public abstract step(action: Action): Promise<StepResult>;

  /**
   * Abstract method to reset environment - must be implemented by subclasses
   */
  public abstract reset(): Promise<State>;

  /**
   * Check if the environment has reached a terminal state
   */
  public isDone(): boolean {
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
  protected isCustomTerminalCondition(): boolean {
    return false;
  }

  /**
   * Get environment metrics and statistics
   */
  public getMetrics(): EnvironmentMetrics {
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
  protected calculateThroughput(): number {
    if (!this.startTime || this.totalEpisodes === 0) {
      return 0;
    }
    
    const hoursElapsed = (Date.now() - this.startTime.getTime()) / (1000 * 60 * 60);
    return this.totalEpisodes / hoursElapsed;
  }

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
  protected startEpisode(): void {
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
  protected endEpisode(): void {
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
   * Update the current state
   */
  protected updateState(newState: State): void {
    this.currentState = newState;
    this.episodeSteps++;
  }

  /**
   * Get default environment configuration
   */
  protected getDefaultConfig(): EnvironmentConfig {
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
  public getStats(): EnvironmentStats {
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
  public setMaxStepsPerEpisode(maxSteps: number): void {
    this.maxStepsPerEpisode = maxSteps;
  }

  /**
   * Log environment activity
   */
  protected log(level: 'info' | 'warn' | 'error', message: string, data?: any): void {
    if (!this.config.enableLogging) {
      return;
    }
    
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${level.toUpperCase()} [${this.name}]: ${message}`, data || '');
  }

  /**
   * Validate an action before execution
   */
  protected validateAction(action: Action): boolean {
    const availableActions = this.getAvailableActions();
    return availableActions.some(a => a.id === action.id);
  }

  /**
   * Generate a unique state ID
   */
  protected generateStateId(): string {
    return uuidv4();
  }

  /**
   * Create a state object with common properties
   */
  protected createState(
    type: any, 
    data: Record<string, unknown>, 
    isTerminal: boolean = false
  ): State {
    return {
      id: this.generateStateId(),
      timestamp: new Date(),
      type,
      data,
      isTerminal
    };
  }
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