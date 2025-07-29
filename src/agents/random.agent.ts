import { 
  State, 
  Action, 
  Experience, 
  AgentType, 
  ActionType,
  TriagePriority
} from '@/types/core.types';
import { BaseAgent } from '@/core/base.agent';

/**
 * Random Triage Agent for baseline comparison
 * Makes completely random decisions to establish performance baseline
 */
export class RandomTriageAgent extends BaseAgent {
  private seed: number;
  private actionHistory: RandomActionRecord[] = [];
  
  constructor(name: string = 'Random Baseline Agent', seed?: number, id?: string) {
    super(name, AgentType.RULE_BASED, id); // Using RULE_BASED since no RANDOM type defined
    this.seed = seed || Math.floor(Math.random() * 10000);
    this.log('info', 'Random agent initialized', { seed: this.seed });
  }

  /**
   * Select action randomly from available actions
   */
  public async selectAction(state: State, availableActions: Action[]): Promise<Action> {
    if (availableActions.length === 0) {
      throw new Error('No actions available');
    }

    // Use seeded random for reproducibility if seed provided
    const randomIndex = this.getRandomInt(0, availableActions.length - 1);
    const selectedAction = availableActions[randomIndex];
    
    // Record the decision for analysis
    this.recordRandomDecision(state, selectedAction, availableActions);
    
    this.log('info', 'Random agent selected action', {
      actionId: selectedAction.id,
      actionType: selectedAction.type,
      selectedFrom: availableActions.length,
      randomness: 'pure'
    });

    return selectedAction;
  }

  /**
   * Update method - random agent doesn't learn but records performance
   */
  public async update(experience: Experience): Promise<void> {
    this.addExperience(experience);
    
    // Track performance metrics for baseline comparison
    this.updatePerformanceMetrics(experience);
    
    this.log('info', 'Random agent received feedback', {
      reward: experience.reward.value,
      actionType: experience.action.type,
      experienceCount: this.getExperiences().length
    });
  }

  /**
   * Confidence is always 0 for random decisions (maximum uncertainty)
   */
  public getConfidence(state: State, action: Action): number {
    return 0.0; // Random decisions have no confidence
  }

  /**
   * Get random priority for triage actions
   */
  public getRandomTriagePriority(): TriagePriority {
    const priorities = [
      TriagePriority.IMMEDIATE,
      TriagePriority.URGENT, 
      TriagePriority.LESS_URGENT,
      TriagePriority.SEMI_URGENT,
      TriagePriority.NON_URGENT
    ];
    
    const randomIndex = this.getRandomInt(0, priorities.length - 1);
    return priorities[randomIndex];
  }

  /**
   * Reset agent state
   */
  public reset(): void {
    super.reset();
    this.actionHistory = [];
    this.log('info', 'Random agent reset');
  }

  /**
   * Get action selection history for analysis
   */
  public getActionHistory(): readonly RandomActionRecord[] {
    return [...this.actionHistory];
  }

  /**
   * Get distribution of actions taken
   */
  public getActionDistribution(): ActionDistribution {
    const distribution: ActionDistribution = {
      triageAssign: 0,
      wait: 0,
      other: 0,
      priorityDistribution: {
        [TriagePriority.IMMEDIATE]: 0,
        [TriagePriority.URGENT]: 0,
        [TriagePriority.LESS_URGENT]: 0,
        [TriagePriority.SEMI_URGENT]: 0,
        [TriagePriority.NON_URGENT]: 0
      }
    };

    for (const record of this.actionHistory) {
      switch (record.action.type) {
        case ActionType.TRIAGE_ASSIGN:
          distribution.triageAssign++;
          const priority = record.action.parameters.priority as TriagePriority;
          if (priority in distribution.priorityDistribution) {
            distribution.priorityDistribution[priority]++;
          }
          break;
        case ActionType.WAIT:
          distribution.wait++;
          break;
        default:
          distribution.other++;
      }
    }

    return distribution;
  }

  /**
   * Get performance summary compared to optimal baseline
   */
  public getPerformanceSummary(): RandomAgentPerformance {
    const experiences = this.getExperiences();
    
    if (experiences.length === 0) {
      return {
        totalActions: 0,
        averageReward: 0,
        rewardVariance: 0,
        actionEntropy: 0,
        experienceCount: 0
      };
    }

    const rewards = experiences.map(exp => exp.reward.value);
    const averageReward = rewards.reduce((sum, r) => sum + r, 0) / rewards.length;
    
    // Calculate variance
    const variance = rewards.reduce((sum, r) => sum + Math.pow(r - averageReward, 2), 0) / rewards.length;
    
    // Calculate action entropy (measure of randomness)
    const distribution = this.getActionDistribution();
    const total = distribution.triageAssign + distribution.wait + distribution.other;
    let entropy = 0;
    
    if (total > 0) {
      const probs = [
        distribution.triageAssign / total,
        distribution.wait / total,
        distribution.other / total
      ].filter(p => p > 0);
      
      entropy = -probs.reduce((sum, p) => sum + p * Math.log2(p), 0);
    }

    return {
      totalActions: this.actionHistory.length,
      averageReward,
      rewardVariance: variance,
      actionEntropy: entropy,
      experienceCount: experiences.length
    };
  }

  /**
   * Set seed for reproducible randomness
   */
  public setSeed(seed: number): void {
    this.seed = seed;
    this.log('info', 'Random seed updated', { seed });
  }

  /**
   * Get current seed
   */
  public getSeed(): number {
    return this.seed;
  }

  // Private methods
  private getRandomInt(min: number, max: number): number {
    // Simple linear congruential generator for reproducible randomness
    if (this.seed !== undefined) {
      this.seed = (this.seed * 9301 + 49297) % 233280;
      return min + (this.seed % (max - min + 1));
    }
    
    // Use Math.random if no seed
    return min + Math.floor(Math.random() * (max - min + 1));
  }

  private recordRandomDecision(
    state: State, 
    selectedAction: Action, 
    availableActions: Action[]
  ): void {
    this.actionHistory.push({
      state,
      action: selectedAction,
      availableActions: availableActions.length,
      timestamp: new Date(),
      randomIndex: availableActions.indexOf(selectedAction)
    });

    // Limit history size
    if (this.actionHistory.length > 1000) {
      this.actionHistory = this.actionHistory.slice(-500);
    }
  }

  private updatePerformanceMetrics(experience: Experience): void {
    // Track basic performance metrics for comparison
    const reward = experience.reward.value;
    
    if (reward > 5) {
      this.log('info', 'Random agent achieved good outcome', { reward });
    } else if (reward < -5) {
      this.log('warn', 'Random agent achieved poor outcome', { reward });
    }
  }
}

// Supporting interfaces
interface RandomActionRecord {
  state: State;
  action: Action;
  availableActions: number;
  timestamp: Date;
  randomIndex: number;
}

interface ActionDistribution {
  triageAssign: number;
  wait: number;
  other: number;
  priorityDistribution: Record<TriagePriority, number>;
}

interface RandomAgentPerformance {
  totalActions: number;
  averageReward: number;
  rewardVariance: number;
  actionEntropy: number; // Measure of decision randomness
  experienceCount: number;
} 