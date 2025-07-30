import {
  State,
  Action,
  Experience,
  PatientProfile,
  Agent,
  TriagePriority,
} from "@/types/core.types";

/**
 * Active Learning Core System
 * Implements uncertainty quantification, query selection, and active learning strategies
 */

export interface UncertaintyMetrics {
  epistemic: number; // Model uncertainty (what the agent doesn't know)
  aleatoric: number; // Data uncertainty (inherent randomness)
  total: number; // Combined uncertainty
  confidence: number; // Agent's confidence in decision
  informationGain: number; // Expected information gain from this sample
}

export interface ActiveQuery {
  id: string;
  type: ActiveQueryType;
  state: State;
  actions: Action[];
  uncertainty: UncertaintyMetrics;
  priority: number; // How important this query is for learning
  timestamp: Date;
  context: QueryContext;
  expectedBenefit: number; // Expected learning benefit
}

export enum ActiveQueryType {
  UNCERTAINTY_SAMPLING = "uncertainty_sampling",
  QUERY_BY_COMMITTEE = "query_by_committee",
  EXPECTED_MODEL_CHANGE = "expected_model_change",
  EXPERT_CONSULTATION = "expert_consultation",
  CURRICULUM_LEARNING = "curriculum_learning",
}

export interface QueryContext {
  patientProfile?: PatientProfile;
  queueLength: number;
  systemLoad: number;
  timeOfDay: number;
  recentPerformance: number;
  domainComplexity: "simple" | "moderate" | "complex" | "expert";
}

export interface LearningCurriculum {
  currentLevel: number;
  maxLevel: number;
  progressMetrics: CurriculumMetrics;
  adaptationStrategy: CurriculumStrategy;
}

export interface CurriculumMetrics {
  successRate: number;
  averageConfidence: number;
  learningVelocity: number;
  stabilityIndex: number;
}

export enum CurriculumStrategy {
  PROGRESSIVE = "progressive", // Gradually increase difficulty
  ADAPTIVE = "adaptive", // Adjust based on performance
  COMPETENCY_BASED = "competency", // Master each level before advancing
  EXPLORATION_FIRST = "exploration", // Focus on unexplored areas
}

export class ActiveLearningCore {
  private queryHistory: ActiveQuery[] = [];
  private uncertaintyThreshold: number = 0.7;
  private learningBudget: number = 100; // Maximum queries per episode
  private queriesUsed: number = 0;

  constructor(config: ActiveLearningConfig = {}) {
    this.uncertaintyThreshold = config.uncertaintyThreshold || 0.7;
    this.learningBudget = config.learningBudget || 100;
  }

  /**
   * Calculate uncertainty metrics for a state-action pair
   */
  public calculateUncertainty(
    agent: Agent,
    state: State,
    action: Action,
    alternatives: Action[] = []
  ): UncertaintyMetrics {
    const confidence = agent.getConfidence(state, action);

    // Epistemic uncertainty: How uncertain is the model about this decision?
    const epistemic = this.calculateEpistemicUncertainty(
      agent,
      state,
      action,
      alternatives
    );

    // Aleatoric uncertainty: How much inherent randomness is in this scenario?
    const aleatoric = this.calculateAleatoricUncertainty(state, action);

    // Information gain: How much would learning from this help?
    const informationGain = this.calculateInformationGain(agent, state, action);

    const total = Math.sqrt(epistemic * epistemic + aleatoric * aleatoric);

    return {
      epistemic,
      aleatoric,
      total,
      confidence,
      informationGain,
    };
  }

  /**
   * Select the most valuable query for active learning
   */
  public selectActiveQuery(
    candidates: Array<{ state: State; actions: Action[] }>,
    agent: Agent,
    queryType: ActiveQueryType = ActiveQueryType.UNCERTAINTY_SAMPLING
  ): ActiveQuery | null {
    if (this.queriesUsed >= this.learningBudget) {
      return null; // Budget exhausted
    }

    const queries = candidates.map((candidate) =>
      this.createQuery(candidate.state, candidate.actions, agent, queryType)
    );

    // Sort by learning value and select best
    queries.sort((a, b) => b.expectedBenefit - a.expectedBenefit);

    const selectedQuery = queries[0];
    if (
      selectedQuery &&
      selectedQuery.uncertainty.total > this.uncertaintyThreshold
    ) {
      this.queriesUsed++;
      this.queryHistory.push(selectedQuery);
      return selectedQuery;
    }

    return null;
  }

  /**
   * Implement uncertainty sampling strategy
   */
  public uncertaintySampling(
    candidates: Array<{ state: State; actions: Action[] }>,
    agent: Agent
  ): ActiveQuery | null {
    return this.selectActiveQuery(
      candidates,
      agent,
      ActiveQueryType.UNCERTAINTY_SAMPLING
    );
  }

  /**
   * Implement query by committee strategy
   */
  public queryByCommittee(
    candidates: Array<{ state: State; actions: Action[] }>,
    agents: Agent[]
  ): ActiveQuery | null {
    if (agents.length < 2) return null;

    const disagreementScores = candidates.map((candidate) => {
      const decisions = agents.map((agent) =>
        agent.selectAction(candidate.state, candidate.actions)
      );

      // Calculate disagreement between agents
      const disagreement = this.calculateAgentDisagreement(decisions);

      return {
        ...candidate,
        disagreement,
        uncertainty: this.calculateUncertainty(
          agents[0],
          candidate.state,
          candidate.actions[0]
        ),
      };
    });

    // Select candidate with highest disagreement
    disagreementScores.sort((a, b) => b.disagreement - a.disagreement);
    const best = disagreementScores[0];

    if (best && best.disagreement > 0.5) {
      return this.createQuery(
        best.state,
        best.actions,
        agents[0],
        ActiveQueryType.QUERY_BY_COMMITTEE
      );
    }

    return null;
  }

  /**
   * Create adaptive curriculum for progressive learning
   */
  public createAdaptiveCurriculum(
    agent: Agent,
    patientProfiles: PatientProfile[],
    strategy: CurriculumStrategy = CurriculumStrategy.ADAPTIVE
  ): LearningCurriculum {
    const curriculum: LearningCurriculum = {
      currentLevel: 1,
      maxLevel: 5,
      progressMetrics: {
        successRate: 0,
        averageConfidence: 0,
        learningVelocity: 0,
        stabilityIndex: 0,
      },
      adaptationStrategy: strategy,
    };

    return curriculum;
  }

  /**
   * Select patients for curriculum learning
   */
  public selectCurriculumPatients(
    availablePatients: PatientProfile[],
    curriculum: LearningCurriculum,
    count: number = 5
  ): PatientProfile[] {
    // Sort patients by complexity/difficulty
    const rankedPatients = availablePatients.map((patient) => ({
      patient,
      complexity: this.calculatePatientComplexity(patient),
    }));

    rankedPatients.sort((a, b) => a.complexity - b.complexity);

    // Select patients appropriate for current curriculum level
    const levelRange = this.getCurriculumLevelRange(
      curriculum.currentLevel,
      curriculum.maxLevel
    );
    const suitablePatients = rankedPatients.filter(
      (p) => p.complexity >= levelRange.min && p.complexity <= levelRange.max
    );

    return suitablePatients.slice(0, count).map((p) => p.patient);
  }

  /**
   * Update curriculum based on agent performance
   */
  public updateCurriculum(
    curriculum: LearningCurriculum,
    recentExperiences: Experience[]
  ): void {
    if (recentExperiences.length === 0) return;

    // Calculate performance metrics
    const successRate =
      recentExperiences.filter((e) => e.reward.value > 0).length /
      recentExperiences.length;
    const avgReward =
      recentExperiences.reduce((sum, e) => sum + e.reward.value, 0) /
      recentExperiences.length;

    curriculum.progressMetrics.successRate = successRate;
    curriculum.progressMetrics.averageConfidence = avgReward / 10; // Normalize

    // Adapt curriculum level based on performance
    if (curriculum.adaptationStrategy === CurriculumStrategy.ADAPTIVE) {
      if (successRate > 0.8 && curriculum.currentLevel < curriculum.maxLevel) {
        curriculum.currentLevel++;
      } else if (successRate < 0.5 && curriculum.currentLevel > 1) {
        curriculum.currentLevel--;
      }
    }
  }

  /**
   * Generate expert consultation request
   */
  public generateExpertConsultation(
    state: State,
    action: Action,
    uncertainty: UncertaintyMetrics,
    context: QueryContext
  ): ExpertConsultationRequest {
    return {
      id: `expert-${Date.now()}`,
      state,
      action,
      uncertainty,
      context,
      questionType: this.determineQuestionType(uncertainty, context),
      urgency: this.calculateConsultationUrgency(uncertainty, context),
      timestamp: new Date(),
    };
  }

  // Private helper methods

  private calculateEpistemicUncertainty(
    agent: Agent,
    state: State,
    action: Action,
    alternatives: Action[]
  ): number {
    const confidence = agent.getConfidence(state, action);

    // If we have alternatives, measure variance in confidence
    if (alternatives.length > 0) {
      const confidences = alternatives.map((alt) =>
        agent.getConfidence(state, alt)
      );
      const variance = this.calculateVariance(confidences);
      return Math.sqrt(variance);
    }

    // Otherwise, use confidence as proxy (lower confidence = higher uncertainty)
    return 1 - confidence;
  }

  private calculateAleatoricUncertainty(state: State, action: Action): number {
    // Estimate inherent randomness in the environment
    // This could be based on:
    // - Patient complexity
    // - System load
    // - Time pressures

    const queueLength = (state.data.queueLength as number) || 0;
    const timeOfDay = state.timestamp.getHours();

    // Higher uncertainty during busy periods and complex cases
    const timeUncertainty = timeOfDay >= 8 && timeOfDay <= 18 ? 0.3 : 0.1; // Busier during day
    const queueUncertainty = Math.min(0.5, queueLength / 20); // More uncertainty with longer queues

    return Math.min(1.0, timeUncertainty + queueUncertainty);
  }

  private calculateInformationGain(
    agent: Agent,
    state: State,
    action: Action
  ): number {
    // Estimate how much we would learn from this state-action pair
    // Higher gain for:
    // - Novel situations
    // - Boundary cases
    // - High uncertainty areas

    const confidence = agent.getConfidence(state, action);
    const novelty = this.estimateNovelty(state, action);

    // Information gain is higher when confidence is moderate (not too high, not too low)
    // and novelty is high
    const confidenceFactor = 4 * confidence * (1 - confidence); // Peaks at 0.5 confidence
    const informationGain = confidenceFactor * novelty;

    return Math.min(1.0, informationGain);
  }

  private estimateNovelty(state: State, action: Action): number {
    // Estimate how novel this state-action pair is
    // This could use techniques like:
    // - Distance to nearest neighbors in experience replay
    // - Frequency of similar states
    // - Time since last similar experience

    // Simplified: assume higher novelty for complex states
    const queueLength = (state.data.queueLength as number) || 0;
    const complexity = Math.min(1.0, queueLength / 15);

    return complexity;
  }

  private createQuery(
    state: State,
    actions: Action[],
    agent: Agent,
    type: ActiveQueryType
  ): ActiveQuery {
    const uncertainty = this.calculateUncertainty(
      agent,
      state,
      actions[0],
      actions
    );
    const context: QueryContext = {
      queueLength: (state.data.queueLength as number) || 0,
      systemLoad: (state.data.systemLoad as number) || 0.5,
      timeOfDay: state.timestamp.getHours(),
      recentPerformance: 0, // Would be calculated from experience history
      domainComplexity: this.assessDomainComplexity(state),
    };

    return {
      id: `query-${Date.now()}`,
      type,
      state,
      actions,
      uncertainty,
      priority: uncertainty.total * uncertainty.informationGain,
      timestamp: new Date(),
      context,
      expectedBenefit: this.calculateExpectedBenefit(uncertainty, context),
    };
  }

  private calculateAgentDisagreement(decisions: Promise<Action>[]): number {
    // This would need to be implemented based on how you want to measure disagreement
    // For now, return a simple proxy
    return Math.random() * 0.8; // Placeholder
  }

  private calculatePatientComplexity(patient: PatientProfile): number {
    let complexity = 0;

    // Age factor
    if (patient.demographics.age > 65 || patient.demographics.age < 18)
      complexity += 0.2;

    // Condition count
    complexity += Math.min(0.3, patient.medicalHistory.conditions.length * 0.1);

    // Acuity level
    const acuityMapping = { low: 0.1, medium: 0.3, high: 0.5, critical: 0.7 };
    complexity +=
      acuityMapping[
        patient.currentCondition.acuity as keyof typeof acuityMapping
      ] || 0.2;

    // Pain level
    if (patient.currentCondition.painLevel) {
      complexity += patient.currentCondition.painLevel / 20; // 0-0.5 range
    }

    return Math.min(1.0, complexity);
  }

  private getCurriculumLevelRange(
    currentLevel: number,
    maxLevel: number
  ): { min: number; max: number } {
    const step = 1.0 / maxLevel;
    return {
      min: (currentLevel - 1) * step,
      max: currentLevel * step,
    };
  }

  private determineQuestionType(
    uncertainty: UncertaintyMetrics,
    context: QueryContext
  ): string {
    if (uncertainty.epistemic > 0.7) return "model_uncertainty";
    if (uncertainty.aleatoric > 0.7) return "environmental_uncertainty";
    if (context.domainComplexity === "expert") return "expert_knowledge";
    return "general_guidance";
  }

  private calculateConsultationUrgency(
    uncertainty: UncertaintyMetrics,
    context: QueryContext
  ): number {
    return Math.min(1.0, uncertainty.total + context.systemLoad * 0.3);
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map((val) => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length;
  }

  private assessDomainComplexity(
    state: State
  ): "simple" | "moderate" | "complex" | "expert" {
    const queueLength = (state.data.queueLength as number) || 0;

    if (queueLength < 3) return "simple";
    if (queueLength < 8) return "moderate";
    if (queueLength < 15) return "complex";
    return "expert";
  }

  private calculateExpectedBenefit(
    uncertainty: UncertaintyMetrics,
    context: QueryContext
  ): number {
    // Combine uncertainty and information gain with contextual factors
    const baseBenefit = uncertainty.informationGain * uncertainty.total;
    const contextMultiplier = 1 + context.systemLoad * 0.5; // Higher benefit during high load

    return Math.min(1.0, baseBenefit * contextMultiplier);
  }

  // Public getters for metrics and history

  public getQueryHistory(): readonly ActiveQuery[] {
    return [...this.queryHistory];
  }

  public getQueriesUsed(): number {
    return this.queriesUsed;
  }

  public getRemainingBudget(): number {
    return this.learningBudget - this.queriesUsed;
  }

  public resetBudget(): void {
    this.queriesUsed = 0;
  }

  public getUncertaintyThreshold(): number {
    return this.uncertaintyThreshold;
  }

  public setUncertaintyThreshold(threshold: number): void {
    this.uncertaintyThreshold = Math.min(1.0, Math.max(0.0, threshold));
  }
}

// Supporting interfaces

export interface ActiveLearningConfig {
  uncertaintyThreshold?: number;
  learningBudget?: number;
  curriculumStrategy?: CurriculumStrategy;
  expertAvailable?: boolean;
}

export interface ExpertConsultationRequest {
  id: string;
  state: State;
  action: Action;
  uncertainty: UncertaintyMetrics;
  context: QueryContext;
  questionType: string;
  urgency: number;
  timestamp: Date;
}

export interface ExpertResponse {
  requestId: string;
  recommendation: Action;
  confidence: number;
  explanation: string;
  learningFeedback: string;
  timestamp: Date;
}
