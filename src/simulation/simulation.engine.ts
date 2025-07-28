import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { 
  Agent, 
  Environment, 
  State, 
  Action, 
  StepResult, 
  Experience, 
  Reward 
} from '@/types/core.types';

/**
 * Healthcare Agent Simulation Engine
 * Orchestrates agent-environment interactions, tracks episodes, and collects comprehensive metrics
 */
export class SimulationEngine {
  private agent: Agent;
  private environment: Environment;
  private config: SimulationConfig;
  
  // State management
  private currentEpisode: number = 0;
  private totalSteps: number = 0;
  private isRunning: boolean = false;
  private isPaused: boolean = false;
  
  // Data collection
  private episodeHistory: EpisodeResult[] = [];
  private metrics: SimulationMetrics;
  
  // Event streams for real-time monitoring
  private stepSubject = new Subject<StepEvent>();
  private episodeSubject = new Subject<EpisodeEvent>();
  private metricsSubject = new BehaviorSubject<SimulationMetrics>(this.initializeMetrics());
  
  public readonly step$ = this.stepSubject.asObservable();
  public readonly episode$ = this.episodeSubject.asObservable();
  public readonly metrics$ = this.metricsSubject.asObservable();

  constructor(agent: Agent, environment: Environment, config: SimulationConfig = {}) {
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
  public async runEpisode(): Promise<EpisodeResult> {
    this.currentEpisode++;
    const episodeStartTime = Date.now();
    
    this.log('info', `Starting episode ${this.currentEpisode}`);
    
    // Reset environment and agent for new episode
    const initialState = await this.environment.reset();
    this.agent.startEpisode();
    
    const episodeData: EpisodeData = {
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
        const experience: Experience = {
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
        const stepData: StepData = {
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
      } else if (done) {
        episodeData.reason = 'environment_terminal';
      }

    } catch (error) {
      this.log('error', 'Error during episode execution', { error, episode: this.currentEpisode, step });
      episodeData.reason = 'error';
      episodeData.success = false;
    } finally {
      this.agent.endEpisode();
    }

    // Create episode result
    const episodeResult: EpisodeResult = {
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
  public async runMultipleEpisodes(numEpisodes: number): Promise<EpisodeResult[]> {
    const results: EpisodeResult[] = [];
    
    this.isRunning = true;
    
    for (let i = 0; i < numEpisodes && this.isRunning; i++) {
      try {
        const result = await this.runEpisode();
        results.push(result);
        
                 // Optional delay between episodes
         if (this.config.episodeDelay && this.config.episodeDelay > 0) {
           await this.delay(this.config.episodeDelay);
         }
        
      } catch (error) {
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
  public pause(): void {
    this.isPaused = true;
    this.log('info', 'Simulation paused');
  }

  /**
   * Resume the simulation
   */
  public resume(): void {
    this.isPaused = false;
    this.log('info', 'Simulation resumed');
  }

  /**
   * Stop the simulation
   */
  public stop(): void {
    this.isRunning = false;
    this.isPaused = false;
    this.log('info', 'Simulation stopped');
  }

  /**
   * Get current simulation metrics
   */
  public getMetrics(): SimulationMetrics {
    return { ...this.metrics };
  }

  /**
   * Get episode history
   */
  public getEpisodeHistory(): readonly EpisodeResult[] {
    return [...this.episodeHistory];
  }

  /**
   * Get performance summary
   */
  public getPerformanceSummary(): PerformanceSummary {
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
  public exportData(): SimulationExport {
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
  private getDefaultConfig(): SimulationConfig {
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

  private initializeMetrics(): SimulationMetrics {
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

  private updateSimulationMetrics(episodeResult: EpisodeResult): void {
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

  private shouldTerminateEpisode(episodeData: EpisodeData, stepResult: StepResult): boolean {
    // Custom termination logic can be added here
    return false;
  }

  private isEpisodeSuccessful(episodeData: EpisodeData): boolean {
    // Define success criteria - can be customized based on scenario
    const avgReward = episodeData.totalReward / Math.max(1, episodeData.steps.length);
         return avgReward > (this.config.successThreshold || 0.8);
  }

  private async waitForResume(): Promise<void> {
    return new Promise(resolve => {
      const checkPause = () => {
        if (!this.isPaused) {
          resolve();
        } else {
          setTimeout(checkPause, 100);
        }
      };
      checkPause();
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private log(level: 'info' | 'warn' | 'error', message: string, data?: any): void {
    if (!this.config.enableLogging) return;
    
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${level.toUpperCase()} [SimulationEngine]: ${message}`, data || '');
  }
}

// Supporting interfaces
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