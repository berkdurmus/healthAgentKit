import { Observable, Subject, BehaviorSubject } from "rxjs";
import {
  Agent,
  Environment,
  State,
  Action,
  StepResult,
  Experience,
  Reward,
  PatientProfile,
} from "@/types/core.types";
import {
  ActiveLearningCore,
  LearningCurriculum,
  CurriculumStrategy,
  ActiveQuery,
  UncertaintyMetrics,
} from "@/core/active.learning";
import {
  ActivePatientSelector,
  PatientSelectionStrategy,
  SelectionStrategyType,
} from "@/utils/active.patient.selector";
import {
  ExpertFeedbackSystem,
  ExpertProfile,
  EnhancedExpertResponse,
} from "@/core/expert.feedback";
import { PatientGenerator } from "@/utils/patient.generator";

/**
 * Active Simulation Engine
 * Orchestrates active reinforcement learning across all components
 * - Adaptive curriculum learning
 * - Strategic patient selection
 * - Expert consultation integration
 * - Uncertainty-driven exploration
 * - Learning-optimized episode management
 */

export interface ActiveSimulationConfig {
  // Basic simulation settings
  maxStepsPerEpisode?: number;
  enableLogging?: boolean;
  enableMetrics?: boolean;
  successThreshold?: number;

  // Active learning settings
  enableActiveLearning?: boolean;
  enableCurriculum?: boolean;
  enableExpertConsultation?: boolean;
  enablePatientSelection?: boolean;

  // Curriculum configuration
  curriculumStrategy?: CurriculumStrategy;
  curriculumLevels?: number;
  adaptationFrequency?: number;

  // Patient selection configuration
  patientSelectionStrategy?: PatientSelectionStrategy;
  patientsPerEpisode?: number;

  // Expert system configuration
  expertConsultationBudget?: number;
  expertResponseTimeout?: number;

  // Learning optimization
  uncertaintyThreshold?: number;
  informationGainThreshold?: number;
  learningAccelerationMode?: LearningAccelerationMode;
}

export enum LearningAccelerationMode {
  CONSERVATIVE = "conservative", // Focus on stability and gradual improvement
  MODERATE = "moderate", // Balanced exploration and exploitation
  AGGRESSIVE = "aggressive", // Maximum learning speed, higher risk
  ADAPTIVE = "adaptive", // Dynamically adjust based on performance
}

export interface ActiveEpisodeResult {
  // Standard episode data
  episodeNumber: number;
  steps: ActiveStepData[];
  totalReward: number;
  startTime: Date;
  endTime: Date;
  success: boolean;
  reason: string;

  // Active learning metrics
  activeLearningMetrics: ActiveLearningEpisodeMetrics;
  curriculumProgress: CurriculumProgressData;
  expertConsultations: ExpertConsultationSummary[];
  patientSelectionInsights: PatientSelectionInsights;
  uncertaintyAnalysis: UncertaintyAnalysis;
  learningVelocity: number;
  adaptationsMade: AdaptationRecord[];
}

export interface ActiveStepData {
  stepNumber: number;
  state: State;
  action: Action;
  reward: Reward;
  nextState: State;
  done: boolean;
  info: Record<string, unknown>;

  // Active learning data
  agentConfidence: number;
  uncertaintyMetrics: UncertaintyMetrics;
  activeQuery?: ActiveQuery;
  expertConsultation?: string; // consultation ID
  patientComplexity: number;
  learningOpportunity: number;
  timestamp: Date;
}

export interface ActiveLearningEpisodeMetrics {
  totalActiveQueries: number;
  uncertaintyReduction: number;
  informationGainAchieved: number;
  expertConsultationsUsed: number;
  curriculumAdvancement: boolean;
  learningEfficiency: number;
  explorationExploitationRatio: number;
  knowledgeGapsIdentified: number;
  confidenceImprovement: number;
}

export interface CurriculumProgressData {
  currentLevel: number;
  progressInLevel: number;
  readyForAdvancement: boolean;
  strugglingAreas: string[];
  masteredAreas: string[];
  recommendedFocus: string[];
}

export interface ExpertConsultationSummary {
  consultationId: string;
  timestamp: Date;
  questionType: string;
  expertResponse?: EnhancedExpertResponse;
  learningImpact: number;
  timeToResponse: number;
}

export interface PatientSelectionInsights {
  strategy: SelectionStrategyType;
  patientsSelected: number;
  complexityDistribution: any;
  diversityScore: number;
  learningPotential: number;
  curriculumAlignment: number;
}

export interface UncertaintyAnalysis {
  averageUncertainty: number;
  uncertaintyReduction: number;
  epistemicUncertainty: number;
  aleatoricUncertainty: number;
  highUncertaintyMoments: number;
  uncertaintyResolutionRate: number;
}

export interface AdaptationRecord {
  timestamp: Date;
  type: AdaptationType;
  trigger: string;
  description: string;
  impact: number;
}

export enum AdaptationType {
  CURRICULUM_ADVANCEMENT = "curriculum_advancement",
  STRATEGY_CHANGE = "strategy_change",
  THRESHOLD_ADJUSTMENT = "threshold_adjustment",
  EXPERT_CONSULTATION = "expert_consultation",
  PATIENT_SELECTION_ADAPTATION = "patient_selection_adaptation",
}

export interface ActiveSimulationMetrics {
  // Learning progress metrics
  totalEpisodes: number;
  averageLearningVelocity: number;
  cumulativeKnowledgeGain: number;
  expertConsultationEfficiency: number;
  curriculumCompletionRate: number;

  // Performance metrics
  averageReward: number;
  successRate: number;
  confidenceCalibration: number;
  uncertaintyManagement: number;

  // Efficiency metrics
  learningEfficiency: number;
  adaptationRate: number;
  explorationEffectiveness: number;
  expertUtilization: number;

  // System metrics
  totalActiveQueries: number;
  totalExpertConsultations: number;
  averageEpisodeDuration: number;
  systemAdaptations: number;
}

export class ActiveSimulationEngine {
  // Core components
  private agent: Agent;
  private environment: Environment;
  private config: ActiveSimulationConfig;

  // Active learning systems
  private activeLearning: ActiveLearningCore;
  private patientSelector: ActivePatientSelector;
  private expertSystem: ExpertFeedbackSystem;
  private patientGenerator: PatientGenerator;

  // State management
  private currentEpisode: number = 0;
  private totalSteps: number = 0;
  private isRunning: boolean = false;
  private isPaused: boolean = false;

  // Data collection
  private episodeHistory: ActiveEpisodeResult[] = [];
  private metrics: ActiveSimulationMetrics;
  private curriculum: LearningCurriculum | null = null;

  // Event streams for real-time monitoring
  private stepSubject = new Subject<ActiveStepEvent>();
  private episodeSubject = new Subject<ActiveEpisodeEvent>();
  private metricsSubject = new BehaviorSubject<ActiveSimulationMetrics>(
    this.initializeMetrics()
  );
  private learningSubject = new Subject<LearningEvent>();

  public readonly step$ = this.stepSubject.asObservable();
  public readonly episode$ = this.episodeSubject.asObservable();
  public readonly metrics$ = this.metricsSubject.asObservable();
  public readonly learning$ = this.learningSubject.asObservable();

  constructor(
    agent: Agent,
    environment: Environment,
    config: ActiveSimulationConfig = {}
  ) {
    this.agent = agent;
    this.environment = environment;
    this.config = { ...this.getDefaultConfig(), ...config };
    this.metrics = this.initializeMetrics();

    // Initialize active learning components
    this.activeLearning = new ActiveLearningCore({
      uncertaintyThreshold: this.config.uncertaintyThreshold || 0.7,
      learningBudget: 100,
    });

    this.patientGenerator = new PatientGenerator();

    this.patientSelector = new ActivePatientSelector(
      this.patientGenerator,
      this.activeLearning,
      this.config.patientSelectionStrategy
    );

    this.expertSystem = new ExpertFeedbackSystem({
      maxConcurrentSessions: 3,
      qualityThreshold: 0.7,
    });

    // Initialize curriculum if enabled
    if (this.config.enableCurriculum) {
      this.initializeCurriculum();
    }

    console.log(
      "🤖 Active Simulation Engine initialized with comprehensive active learning capabilities"
    );
  }

  /**
   * Run a single episode with active learning orchestration
   */
  public async runActiveEpisode(): Promise<ActiveEpisodeResult> {
    this.currentEpisode++;
    const episodeStartTime = Date.now();

    console.log(`🎯 Starting active learning episode ${this.currentEpisode}`);

    // Select patients strategically for this episode
    let selectedPatients: PatientProfile[] = [];
    if (this.config.enablePatientSelection) {
      const patientResult =
        await this.patientSelector.selectPatientsForTraining(
          this.agent,
          this.config.patientsPerEpisode || 5
        );
      selectedPatients = patientResult.selectedPatients;
    }

    // Reset environment and agent for new episode
    const initialState = await this.environment.reset();
    this.agent.startEpisode();

    const episodeData: ActiveEpisodeResult = {
      episodeNumber: this.currentEpisode,
      steps: [],
      totalReward: 0,
      startTime: new Date(episodeStartTime),
      endTime: new Date(),
      success: false,
      reason: "incomplete",
      activeLearningMetrics: this.initializeEpisodeMetrics(),
      curriculumProgress: this.getCurrentCurriculumProgress(),
      expertConsultations: [],
      patientSelectionInsights: this.getPatientSelectionInsights(),
      uncertaintyAnalysis: this.initializeUncertaintyAnalysis(),
      learningVelocity: 0,
      adaptationsMade: [],
    };

    let currentState = initialState;
    let step = 0;
    let done = false;

    try {
      // Run episode with active learning enhancements
      while (!done && step < (this.config.maxStepsPerEpisode || 1000)) {
        if (this.isPaused) {
          await this.waitForResume();
        }

        // Get available actions from environment
        const availableActions =
          this.environment.getAvailableActions(currentState);

        if (availableActions.length === 0) {
          console.warn("⚠️ No available actions in current state", {
            step,
            state: currentState.type,
          });
          break;
        }

        // Calculate uncertainty metrics before action selection
        const preActionUncertainty = this.calculateStateUncertainty(
          currentState,
          availableActions
        );

        // Agent selects action (potentially enhanced with active learning)
        const selectedAction = await this.agent.selectAction(
          currentState,
          availableActions
        );

        // Check if active query should be made
        let activeQuery: ActiveQuery | undefined;
        if (this.config.enableActiveLearning) {
          activeQuery = await this.considerActiveQuery(
            currentState,
            availableActions,
            preActionUncertainty
          );
        }

        // Check if expert consultation is needed
        let expertConsultationId: string | undefined;
        if (
          this.config.enableExpertConsultation &&
          this.shouldConsultExpert(preActionUncertainty)
        ) {
          expertConsultationId = await this.requestExpertConsultation(
            currentState,
            selectedAction,
            preActionUncertainty
          );
        }

        // Execute action in environment
        const stepResult = await this.environment.step(selectedAction);

        // Create experience for agent learning
        const experience: Experience = {
          state: currentState,
          action: selectedAction,
          reward: stepResult.reward,
          nextState: stepResult.state,
          done: stepResult.done,
          timestamp: new Date(),
        };

        // Update agent with experience (enhanced with active learning)
        await this.updateAgentWithActiveLearning(
          experience,
          activeQuery,
          expertConsultationId
        );

        // Record active step data
        const activeStepData: ActiveStepData = {
          stepNumber: step,
          state: currentState,
          action: selectedAction,
          reward: stepResult.reward,
          nextState: stepResult.state,
          done: stepResult.done,
          info: stepResult.info,
          agentConfidence: this.agent.getConfidence(
            currentState,
            selectedAction
          ),
          uncertaintyMetrics: preActionUncertainty,
          activeQuery,
          expertConsultation: expertConsultationId,
          patientComplexity: this.estimatePatientComplexity(currentState),
          learningOpportunity: this.assessLearningOpportunity(
            currentState,
            selectedAction,
            preActionUncertainty
          ),
          timestamp: new Date(),
        };

        episodeData.steps.push(activeStepData);
        episodeData.totalReward += stepResult.reward.value;

        // Update active learning metrics
        this.updateEpisodeMetrics(episodeData, activeStepData);

        // Emit step event for real-time monitoring
        this.stepSubject.next({
          type: "active_step_completed",
          episode: this.currentEpisode,
          step: step,
          stepData: activeStepData,
          cumulativeReward: episodeData.totalReward,
          learningMetrics: episodeData.activeLearningMetrics,
        });

        // Check for adaptive changes needed
        await this.checkForAdaptations(episodeData, activeStepData);

        // Update state and counters
        currentState = stepResult.state;
        step++;
        this.totalSteps++;
        done = stepResult.done;

        // Check for custom termination conditions
        if (this.shouldTerminateEpisode(episodeData, stepResult)) {
          done = true;
          episodeData.reason = "active_learning_termination";
        }
      }

      // End episode processing
      episodeData.endTime = new Date();
      episodeData.success = this.isEpisodeSuccessful(episodeData);
      episodeData.learningVelocity =
        this.calculateEpisodeLearningVelocity(episodeData);

      if (step >= (this.config.maxStepsPerEpisode || 1000)) {
        episodeData.reason = "max_steps_reached";
      } else if (done) {
        episodeData.reason = "environment_terminal";
      }

      // Process end-of-episode learning
      await this.processEndOfEpisodeLearning(episodeData);
    } catch (error) {
      console.error("❌ Error during active episode execution", {
        error,
        episode: this.currentEpisode,
        step,
      });
      episodeData.reason = "error";
      episodeData.success = false;
    } finally {
      this.agent.endEpisode();
    }

    // Finalize episode data
    this.finalizeEpisodeData(episodeData);

    // Store episode result
    this.episodeHistory.push(episodeData);

    // Update global metrics
    this.updateGlobalMetrics(episodeData);

    // Emit episode completion event
    this.episodeSubject.next({
      type: "active_episode_completed",
      episode: this.currentEpisode,
      result: episodeData,
      metrics: this.metrics,
    });

    // Record performance for patient selector
    this.patientSelector.recordPerformance(
      episodeData.success,
      episodeData.totalReward
    );

    console.log(
      `✅ Active episode ${this.currentEpisode} completed: ${
        episodeData.reason
      } (Reward: ${episodeData.totalReward.toFixed(2)})`
    );

    return episodeData;
  }

  /**
   * Run multiple episodes with active learning optimization
   */
  public async runMultipleActiveEpisodes(
    episodeCount: number
  ): Promise<ActiveEpisodeResult[]> {
    const results: ActiveEpisodeResult[] = [];

    console.log(`🚀 Starting ${episodeCount} active learning episodes`);

    for (let i = 0; i < episodeCount; i++) {
      if (!this.isRunning) break;

      const result = await this.runActiveEpisode();
      results.push(result);

      // Adaptive pause between episodes if needed
      if (
        this.config.learningAccelerationMode ===
        LearningAccelerationMode.CONSERVATIVE
      ) {
        await this.sleep(100); // Brief pause for conservative learning
      }

      // Check for major adaptations needed
      if (i % 5 === 0 && i > 0) {
        await this.performPeriodicOptimization();
      }
    }

    console.log(`🎉 Completed ${results.length} active learning episodes`);

    return results;
  }

  /**
   * Initialize curriculum learning
   */
  public initializeCurriculum(
    strategy?: CurriculumStrategy,
    levels?: number
  ): void {
    this.curriculum = this.patientSelector.initializeCurriculum(
      this.agent,
      strategy || this.config.curriculumStrategy || CurriculumStrategy.ADAPTIVE,
      levels || this.config.curriculumLevels || 5
    );

    this.learningSubject.next({
      type: "curriculum_initialized",
      timestamp: new Date(),
      data: {
        strategy: this.curriculum.adaptationStrategy,
        levels: this.curriculum.maxLevel,
        currentLevel: this.curriculum.currentLevel,
      },
    });
  }

  /**
   * Get comprehensive active learning insights
   */
  public getActiveLearningInsights(): ActiveLearningInsights {
    return {
      simulationMetrics: this.metrics,
      curriculumProgress: this.curriculum,
      patientSelectionInsights: this.patientSelector.getSelectionInsights(),
      expertSystemMetrics: this.expertSystem.getSystemMetrics(),
      recentEpisodes: this.episodeHistory.slice(-10),
      learningTrends: this.calculateLearningTrends(),
      optimizationRecommendations: this.generateOptimizationRecommendations(),
      systemHealth: this.assessSystemHealth(),
    };
  }

  // Private Methods

  private async considerActiveQuery(
    state: State,
    actions: Action[],
    uncertainty: UncertaintyMetrics
  ): Promise<ActiveQuery | undefined> {
    if (uncertainty.total < this.config.uncertaintyThreshold!) {
      return undefined; // Not uncertain enough for active query
    }

    const candidates = [{ state, actions }];
    const query = this.activeLearning.selectActiveQuery(candidates, this.agent);

    if (query) {
      this.learningSubject.next({
        type: "active_query_generated",
        timestamp: new Date(),
        data: {
          queryId: query.id,
          queryType: query.type,
          uncertainty: query.uncertainty.total,
          expectedBenefit: query.expectedBenefit,
        },
      });
    }

    return query;
  }

  private shouldConsultExpert(uncertainty: UncertaintyMetrics): boolean {
    return uncertainty.total > 0.8 || uncertainty.informationGain > 0.7;
  }

  private async requestExpertConsultation(
    state: State,
    action: Action,
    uncertainty: UncertaintyMetrics
  ): Promise<string | undefined> {
    try {
      const consultation = this.activeLearning.generateExpertConsultation(
        state,
        action,
        uncertainty,
        {
          queueLength: (state.data.queueLength as number) || 0,
          systemLoad: 0.5,
          timeOfDay: state.timestamp.getHours(),
          recentPerformance: 0.7,
          domainComplexity: "moderate",
        }
      );

      const consultationId = await this.expertSystem.submitConsultation(
        consultation,
        this.agent
      );

      this.learningSubject.next({
        type: "expert_consultation_requested",
        timestamp: new Date(),
        data: {
          consultationId,
          uncertainty: uncertainty.total,
          questionType: consultation.questionType,
        },
      });

      return consultationId;
    } catch (error) {
      console.error("❌ Failed to request expert consultation:", error);
      return undefined;
    }
  }

  private async updateAgentWithActiveLearning(
    experience: Experience,
    activeQuery?: ActiveQuery,
    consultationId?: string
  ): Promise<void> {
    // Standard agent update
    await this.agent.update(experience);

    // Process expert feedback if consultation was made
    if (consultationId) {
      const expertResponse = await this.expertSystem.getExpertResponse(
        consultationId
      );
      if (expertResponse) {
        await this.expertSystem.integrateFeedback(
          this.agent,
          expertResponse,
          experience
        );
      }
    }

    // Process active query results
    if (activeQuery) {
      await this.processActiveQueryResults(activeQuery, experience);
    }
  }

  private async processActiveQueryResults(
    query: ActiveQuery,
    experience: Experience
  ): Promise<void> {
    // Analyze how the active query contributed to learning
    const learningContribution = this.assessQueryLearningContribution(
      query,
      experience
    );

    this.learningSubject.next({
      type: "active_query_processed",
      timestamp: new Date(),
      data: {
        queryId: query.id,
        learningContribution,
        reward: experience.reward.value,
      },
    });
  }

  private calculateStateUncertainty(
    state: State,
    actions: Action[]
  ): UncertaintyMetrics {
    if (actions.length === 0) {
      return {
        epistemic: 1.0,
        aleatoric: 0.5,
        total: 1.1,
        confidence: 0.0,
        informationGain: 1.0,
      };
    }

    return this.activeLearning.calculateUncertainty(
      this.agent,
      state,
      actions[0],
      actions
    );
  }

  private estimatePatientComplexity(state: State): number {
    // Simplified complexity estimation
    const queueLength = (state.data.queueLength as number) || 0;
    return Math.min(1.0, queueLength / 15);
  }

  private assessLearningOpportunity(
    state: State,
    action: Action,
    uncertainty: UncertaintyMetrics
  ): number {
    return uncertainty.informationGain * 0.7 + uncertainty.total * 0.3;
  }

  private async checkForAdaptations(
    episodeData: ActiveEpisodeResult,
    stepData: ActiveStepData
  ): Promise<void> {
    // Check if curriculum advancement is needed
    if (this.curriculum && stepData.stepNumber % 10 === 0) {
      const shouldAdvance = this.shouldAdvanceCurriculum(episodeData);
      if (shouldAdvance) {
        await this.advanceCurriculum(episodeData);
      }
    }

    // Check if patient selection strategy should be adapted
    if (stepData.stepNumber % (this.config.adaptationFrequency || 20) === 0) {
      await this.patientSelector.adaptSelectionStrategy(this.agent);
    }
  }

  private shouldAdvanceCurriculum(episodeData: ActiveEpisodeResult): boolean {
    if (!this.curriculum) return false;

    const recentSteps = episodeData.steps.slice(-10);
    const avgConfidence =
      recentSteps.reduce((sum, step) => sum + step.agentConfidence, 0) /
      recentSteps.length;
    const avgReward =
      recentSteps.reduce((sum, step) => sum + step.reward.value, 0) /
      recentSteps.length;

    return avgConfidence > 0.8 && avgReward > 3;
  }

  private async advanceCurriculum(
    episodeData: ActiveEpisodeResult
  ): Promise<void> {
    if (!this.curriculum) return;

    const oldLevel = this.curriculum.currentLevel;
    this.curriculum.currentLevel = Math.min(
      this.curriculum.maxLevel,
      this.curriculum.currentLevel + 1
    );

    if (this.curriculum.currentLevel > oldLevel) {
      episodeData.adaptationsMade.push({
        timestamp: new Date(),
        type: AdaptationType.CURRICULUM_ADVANCEMENT,
        trigger: "high_performance",
        description: `Advanced from level ${oldLevel} to ${this.curriculum.currentLevel}`,
        impact: 0.8,
      });

      this.learningSubject.next({
        type: "curriculum_advanced",
        timestamp: new Date(),
        data: {
          fromLevel: oldLevel,
          toLevel: this.curriculum.currentLevel,
          maxLevel: this.curriculum.maxLevel,
        },
      });

      console.log(
        `📈 Curriculum advanced to level ${this.curriculum.currentLevel}`
      );
    }
  }

  private async processEndOfEpisodeLearning(
    episodeData: ActiveEpisodeResult
  ): Promise<void> {
    // Analyze episode for learning insights
    const episodeInsights = this.analyzeEpisodeForLearning(episodeData);

    // Update curriculum based on episode performance
    if (this.curriculum) {
      this.activeLearning.updateCurriculum(
        this.curriculum,
        episodeData.steps.map((step) => ({
          state: step.state,
          action: step.action,
          reward: step.reward,
          nextState: step.nextState,
          done: step.done,
          timestamp: step.timestamp,
        }))
      );
    }

    // Emit learning insights
    this.learningSubject.next({
      type: "episode_learning_processed",
      timestamp: new Date(),
      data: episodeInsights,
    });
  }

  private analyzeEpisodeForLearning(episodeData: ActiveEpisodeResult): any {
    return {
      averageUncertainty:
        episodeData.steps.reduce(
          (sum, step) => sum + step.uncertaintyMetrics.total,
          0
        ) / episodeData.steps.length,
      uncertaintyReduction: this.calculateUncertaintyReduction(
        episodeData.steps
      ),
      learningOpportunities: episodeData.steps.filter(
        (step) => step.learningOpportunity > 0.7
      ).length,
      expertConsultationsEffective: episodeData.expertConsultations.filter(
        (c) => c.learningImpact > 0.6
      ).length,
    };
  }

  private calculateUncertaintyReduction(steps: ActiveStepData[]): number {
    if (steps.length < 2) return 0;

    const firstHalf = steps.slice(0, Math.floor(steps.length / 2));
    const secondHalf = steps.slice(Math.floor(steps.length / 2));

    const firstAvgUncertainty =
      firstHalf.reduce((sum, step) => sum + step.uncertaintyMetrics.total, 0) /
      firstHalf.length;
    const secondAvgUncertainty =
      secondHalf.reduce((sum, step) => sum + step.uncertaintyMetrics.total, 0) /
      secondHalf.length;

    return firstAvgUncertainty - secondAvgUncertainty;
  }

  private updateEpisodeMetrics(
    episodeData: ActiveEpisodeResult,
    stepData: ActiveStepData
  ): void {
    const metrics = episodeData.activeLearningMetrics;

    if (stepData.activeQuery) {
      metrics.totalActiveQueries++;
    }

    if (stepData.expertConsultation) {
      metrics.expertConsultationsUsed++;
    }

    metrics.informationGainAchieved +=
      stepData.uncertaintyMetrics.informationGain;

    if (stepData.agentConfidence > 0.8) {
      metrics.confidenceImprovement++;
    }
  }

  private calculateEpisodeLearningVelocity(
    episodeData: ActiveEpisodeResult
  ): number {
    const steps = episodeData.steps;
    if (steps.length < 2) return 0;

    const confidenceImprovement =
      steps[steps.length - 1].agentConfidence - steps[0].agentConfidence;
    const uncertaintyReduction = this.calculateUncertaintyReduction(steps);

    return (confidenceImprovement + uncertaintyReduction) / 2;
  }

  private finalizeEpisodeData(episodeData: ActiveEpisodeResult): void {
    // Calculate final metrics
    episodeData.activeLearningMetrics.learningEfficiency =
      episodeData.activeLearningMetrics.informationGainAchieved /
      Math.max(1, episodeData.steps.length);

    episodeData.activeLearningMetrics.explorationExploitationRatio =
      episodeData.activeLearningMetrics.totalActiveQueries /
      Math.max(1, episodeData.steps.length);

    episodeData.uncertaintyAnalysis = this.calculateFinalUncertaintyAnalysis(
      episodeData.steps
    );
  }

  private calculateFinalUncertaintyAnalysis(
    steps: ActiveStepData[]
  ): UncertaintyAnalysis {
    const uncertainties = steps.map((step) => step.uncertaintyMetrics);

    return {
      averageUncertainty:
        uncertainties.reduce((sum, u) => sum + u.total, 0) /
        uncertainties.length,
      uncertaintyReduction: this.calculateUncertaintyReduction(steps),
      epistemicUncertainty:
        uncertainties.reduce((sum, u) => sum + u.epistemic, 0) /
        uncertainties.length,
      aleatoricUncertainty:
        uncertainties.reduce((sum, u) => sum + u.aleatoric, 0) /
        uncertainties.length,
      highUncertaintyMoments: uncertainties.filter((u) => u.total > 0.8).length,
      uncertaintyResolutionRate:
        uncertainties.filter(
          (u, i) => i > 0 && u.total < uncertainties[i - 1].total
        ).length / Math.max(1, uncertainties.length - 1),
    };
  }

  private async performPeriodicOptimization(): Promise<void> {
    console.log("🔧 Performing periodic optimization...");

    // Optimize patient selection strategy
    await this.patientSelector.adaptSelectionStrategy(this.agent);

    // Process expert consultation queue
    await this.expertSystem.processConsultationQueue();

    // Emit optimization event
    this.learningSubject.next({
      type: "periodic_optimization",
      timestamp: new Date(),
      data: { episode: this.currentEpisode },
    });
  }

  // Utility and helper methods

  private getDefaultConfig(): ActiveSimulationConfig {
    return {
      maxStepsPerEpisode: 100,
      enableLogging: true,
      enableMetrics: true,
      successThreshold: 3.0,
      enableActiveLearning: true,
      enableCurriculum: true,
      enableExpertConsultation: true,
      enablePatientSelection: true,
      curriculumStrategy: CurriculumStrategy.ADAPTIVE,
      curriculumLevels: 5,
      adaptationFrequency: 20,
      patientsPerEpisode: 5,
      expertConsultationBudget: 3,
      expertResponseTimeout: 300000, // 5 minutes
      uncertaintyThreshold: 0.7,
      informationGainThreshold: 0.5,
      learningAccelerationMode: LearningAccelerationMode.MODERATE,
    };
  }

  private initializeMetrics(): ActiveSimulationMetrics {
    return {
      totalEpisodes: 0,
      averageLearningVelocity: 0,
      cumulativeKnowledgeGain: 0,
      expertConsultationEfficiency: 0,
      curriculumCompletionRate: 0,
      averageReward: 0,
      successRate: 0,
      confidenceCalibration: 0.5,
      uncertaintyManagement: 0.5,
      learningEfficiency: 0,
      adaptationRate: 0,
      explorationEffectiveness: 0,
      expertUtilization: 0,
      totalActiveQueries: 0,
      totalExpertConsultations: 0,
      averageEpisodeDuration: 0,
      systemAdaptations: 0,
    };
  }

  private initializeEpisodeMetrics(): ActiveLearningEpisodeMetrics {
    return {
      totalActiveQueries: 0,
      uncertaintyReduction: 0,
      informationGainAchieved: 0,
      expertConsultationsUsed: 0,
      curriculumAdvancement: false,
      learningEfficiency: 0,
      explorationExploitationRatio: 0,
      knowledgeGapsIdentified: 0,
      confidenceImprovement: 0,
    };
  }

  private getCurrentCurriculumProgress(): CurriculumProgressData {
    if (!this.curriculum) {
      return {
        currentLevel: 0,
        progressInLevel: 0,
        readyForAdvancement: false,
        strugglingAreas: [],
        masteredAreas: [],
        recommendedFocus: [],
      };
    }

    return {
      currentLevel: this.curriculum.currentLevel,
      progressInLevel: this.curriculum.progressMetrics.successRate,
      readyForAdvancement: this.curriculum.progressMetrics.successRate > 0.8,
      strugglingAreas: [], // Would be populated from analysis
      masteredAreas: [], // Would be populated from analysis
      recommendedFocus: [], // Would be populated from analysis
    };
  }

  private getPatientSelectionInsights(): PatientSelectionInsights {
    const insights = this.patientSelector.getSelectionInsights();

    return {
      strategy: insights.currentStrategy.type,
      patientsSelected: this.config.patientsPerEpisode || 5,
      complexityDistribution: insights.complexityDistribution,
      diversityScore: 0.7, // Would be calculated
      learningPotential: 0.8, // Would be calculated
      curriculumAlignment: insights.curriculumAdvancement,
    };
  }

  private initializeUncertaintyAnalysis(): UncertaintyAnalysis {
    return {
      averageUncertainty: 0,
      uncertaintyReduction: 0,
      epistemicUncertainty: 0,
      aleatoricUncertainty: 0,
      highUncertaintyMoments: 0,
      uncertaintyResolutionRate: 0,
    };
  }

  private updateGlobalMetrics(episodeData: ActiveEpisodeResult): void {
    this.metrics.totalEpisodes++;
    this.metrics.averageReward = this.calculateRunningAverage(
      this.metrics.averageReward,
      episodeData.totalReward,
      this.metrics.totalEpisodes
    );

    this.metrics.successRate = this.calculateRunningAverage(
      this.metrics.successRate,
      episodeData.success ? 1 : 0,
      this.metrics.totalEpisodes
    );

    this.metrics.averageLearningVelocity = this.calculateRunningAverage(
      this.metrics.averageLearningVelocity,
      episodeData.learningVelocity,
      this.metrics.totalEpisodes
    );

    this.metrics.totalActiveQueries +=
      episodeData.activeLearningMetrics.totalActiveQueries;
    this.metrics.totalExpertConsultations +=
      episodeData.activeLearningMetrics.expertConsultationsUsed;
    this.metrics.systemAdaptations += episodeData.adaptationsMade.length;

    // Emit updated metrics
    this.metricsSubject.next(this.metrics);
  }

  private calculateRunningAverage(
    currentAvg: number,
    newValue: number,
    count: number
  ): number {
    return (currentAvg * (count - 1) + newValue) / count;
  }

  private shouldTerminateEpisode(
    episodeData: ActiveEpisodeResult,
    stepResult: StepResult
  ): boolean {
    // Custom termination logic for active learning
    const recentSteps = episodeData.steps.slice(-5);

    // Terminate if learning has plateaued
    if (recentSteps.length >= 5) {
      const avgLearningOpp =
        recentSteps.reduce((sum, step) => sum + step.learningOpportunity, 0) /
        recentSteps.length;

      if (avgLearningOpp < 0.2) {
        return true; // Low learning opportunity
      }
    }

    return false;
  }

  private isEpisodeSuccessful(episodeData: ActiveEpisodeResult): boolean {
    return episodeData.totalReward >= (this.config.successThreshold || 3.0);
  }

  private assessQueryLearningContribution(
    query: ActiveQuery,
    experience: Experience
  ): number {
    // Simplified assessment of how much the query contributed to learning
    return query.expectedBenefit * (experience.reward.value > 0 ? 1.0 : 0.3);
  }

  private calculateLearningTrends(): any {
    const recentEpisodes = this.episodeHistory.slice(-10);
    if (recentEpisodes.length === 0) return {};

    return {
      learningVelocityTrend: this.calculateTrend(
        recentEpisodes.map((e) => e.learningVelocity)
      ),
      uncertaintyReductionTrend: this.calculateTrend(
        recentEpisodes.map((e) => e.uncertaintyAnalysis.uncertaintyReduction)
      ),
      expertConsultationTrend: this.calculateTrend(
        recentEpisodes.map((e) => e.expertConsultations.length)
      ),
    };
  }

  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;

    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));

    const firstAvg =
      firstHalf.reduce((sum, v) => sum + v, 0) / firstHalf.length;
    const secondAvg =
      secondHalf.reduce((sum, v) => sum + v, 0) / secondHalf.length;

    return secondAvg - firstAvg;
  }

  private generateOptimizationRecommendations(): string[] {
    const recommendations = [];

    if (this.metrics.expertUtilization < 0.3) {
      recommendations.push(
        "Consider increasing expert consultation frequency for better learning"
      );
    }

    if (this.metrics.learningEfficiency < 0.5) {
      recommendations.push(
        "Optimize patient selection strategy for better learning outcomes"
      );
    }

    if (this.metrics.uncertaintyManagement < 0.6) {
      recommendations.push(
        "Improve uncertainty quantification and handling mechanisms"
      );
    }

    return recommendations;
  }

  private assessSystemHealth(): any {
    return {
      activeLearningHealth:
        this.metrics.learningEfficiency > 0.6 ? "good" : "needs_attention",
      curriculumHealth: this.curriculum ? "active" : "inactive",
      expertSystemHealth:
        this.metrics.expertUtilization > 0.2 ? "active" : "underutilized",
      overallHealth:
        this.metrics.averageReward > 2.0 ? "healthy" : "needs_improvement",
    };
  }

  private async waitForResume(): Promise<void> {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (!this.isPaused) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
    });
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Public control methods

  public start(): void {
    this.isRunning = true;
    console.log("▶️ Active simulation engine started");
  }

  public stop(): void {
    this.isRunning = false;
    console.log("⏹️ Active simulation engine stopped");
  }

  public pause(): void {
    this.isPaused = true;
    console.log("⏸️ Active simulation engine paused");
  }

  public resume(): void {
    this.isPaused = false;
    console.log("▶️ Active simulation engine resumed");
  }

  public reset(): void {
    this.currentEpisode = 0;
    this.totalSteps = 0;
    this.episodeHistory = [];
    this.metrics = this.initializeMetrics();
    console.log("🔄 Active simulation engine reset");
  }
}

// Supporting interfaces and types

interface ActiveStepEvent {
  type: "active_step_completed";
  episode: number;
  step: number;
  stepData: ActiveStepData;
  cumulativeReward: number;
  learningMetrics: ActiveLearningEpisodeMetrics;
}

interface ActiveEpisodeEvent {
  type: "active_episode_completed";
  episode: number;
  result: ActiveEpisodeResult;
  metrics: ActiveSimulationMetrics;
}

interface LearningEvent {
  type:
    | "curriculum_initialized"
    | "curriculum_advanced"
    | "active_query_generated"
    | "active_query_processed"
    | "expert_consultation_requested"
    | "episode_learning_processed"
    | "periodic_optimization";
  timestamp: Date;
  data: any;
}

interface ActiveLearningInsights {
  simulationMetrics: ActiveSimulationMetrics;
  curriculumProgress: LearningCurriculum | null;
  patientSelectionInsights: any;
  expertSystemMetrics: any;
  recentEpisodes: ActiveEpisodeResult[];
  learningTrends: any;
  optimizationRecommendations: string[];
  systemHealth: any;
}
