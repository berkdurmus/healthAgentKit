import {
  State,
  Action,
  Experience,
  AgentType,
  PatientProfile,
  TriagePriority,
  ActionType,
  SeverityLevel,
  AcuityLevel,
} from "@/types/core.types";
import { BaseAgent } from "@/core/base.agent";
import {
  ActiveLearningCore,
  UncertaintyMetrics,
  ActiveQuery,
  ActiveQueryType,
  LearningCurriculum,
  CurriculumStrategy,
} from "@/core/active.learning";

/**
 * Active ML-based Triage Agent
 * Extends the basic ML agent with active reinforcement learning strategies
 * - Uncertainty-driven exploration
 * - Information gain maximization
 * - Adaptive curriculum learning
 * - Expert consultation integration
 */
export class ActiveMLTriageAgent extends BaseAgent {
  private weights: MLWeights;
  private learningRate: number = 0.01;
  private explorationRate: number = 0.1;
  private decayRate: number = 0.995;
  private trainingHistory: TrainingRecord[] = [];

  // Active Learning Components
  private activeLearning: ActiveLearningCore;
  private curriculum: LearningCurriculum | null = null;
  private uncertaintyHistory: UncertaintyRecord[] = [];
  private activeQueries: ActiveQuery[] = [];
  private expertFeedback: ExpertFeedback[] = [];

  // Active Learning Parameters
  private uncertaintyThreshold: number = 0.6;
  private informationGainThreshold: number = 0.4;
  private explorationStrategy: ExplorationStrategy =
    ExplorationStrategy.UNCERTAINTY_DRIVEN;
  private queryBudgetPerEpisode: number = 5;
  private queriesUsedThisEpisode: number = 0;

  constructor(name: string = "Active ML Triage Agent", id?: string) {
    super(name, AgentType.ML_MODEL, id);
    this.weights = this.initializeWeights();
    this.activeLearning = new ActiveLearningCore({
      uncertaintyThreshold: this.uncertaintyThreshold,
      learningBudget: this.queryBudgetPerEpisode,
    });
  }

  /**
   * Enhanced action selection with active learning
   */
  public async selectAction(
    state: State,
    availableActions: Action[]
  ): Promise<Action> {
    const triageActions = availableActions.filter(
      (a) => a.type === ActionType.TRIAGE_ASSIGN
    );

    if (triageActions.length === 0) {
      const waitAction = availableActions.find(
        (a) => a.type === ActionType.WAIT
      );
      if (waitAction) return waitAction;
      throw new Error("No valid actions available");
    }

    // Group actions by patient
    const patientActions = this.groupActionsByPatient(triageActions);

    if (patientActions.size === 0) {
      const waitAction = availableActions.find(
        (a) => a.type === ActionType.WAIT
      );
      if (waitAction) return waitAction;
      throw new Error("No patients to triage");
    }

    // Active Learning: Check if we should make an active query
    const shouldQuery = await this.shouldMakeActiveQuery(state, triageActions);

    if (shouldQuery) {
      const activeQuery = await this.generateActiveQuery(state, triageActions);
      if (activeQuery) {
        this.activeQueries.push(activeQuery);

        // Log the active query for learning
        this.log("info", "Generated active query for learning", {
          queryType: activeQuery.type,
          uncertainty: activeQuery.uncertainty.total,
          expectedBenefit: activeQuery.expectedBenefit,
        });
      }
    }

    // Select patient using active learning strategies
    const selectedPatient = await this.selectPatientWithActiveLearning(
      state,
      patientActions
    );

    if (!selectedPatient) {
      const waitAction = availableActions.find(
        (a) => a.type === ActionType.WAIT
      );
      if (waitAction) return waitAction;
      throw new Error("Could not select patient");
    }

    // Predict optimal priority with uncertainty quantification
    const predictionResult = this.predictOptimalPriorityWithUncertainty(
      selectedPatient.patientData
    );

    // Active exploration based on uncertainty
    let targetPriority = predictionResult.priority;
    let explorationReason = "";

    if (this.isTraining) {
      const explorationDecision = this.makeExplorationDecision(
        predictionResult,
        state
      );
      targetPriority = explorationDecision.priority;
      explorationReason = explorationDecision.reason;
    }

    // Find action matching target priority
    const targetAction = selectedPatient.actions.find(
      (a) => a.parameters.priority === targetPriority
    );

    if (!targetAction) {
      this.log("warn", "Target priority not available, using fallback", {
        targetPriority,
        availablePriorities: selectedPatient.actions.map(
          (a) => a.parameters.priority
        ),
      });
      return selectedPatient.actions[0];
    }

    // Record uncertainty metrics for analysis
    this.recordUncertaintyMetrics(
      state,
      targetAction,
      predictionResult.uncertainty
    );

    this.log("info", "Active ML agent selected action", {
      patientId: selectedPatient.patientId,
      priority: targetPriority,
      confidence: predictionResult.uncertainty.confidence,
      uncertainty: predictionResult.uncertainty.total,
      explorationReason,
    });

    return targetAction;
  }

  /**
   * Enhanced update with active learning feedback
   */
  public async update(experience: Experience): Promise<void> {
    this.addExperience(experience);

    if (!this.isTraining) return;

    // Standard ML update
    await this.performStandardUpdate(experience);

    // Active Learning Updates
    await this.performActiveUpdate(experience);

    // Update curriculum if available
    if (this.curriculum) {
      this.activeLearning.updateCurriculum(this.curriculum, [experience]);
    }

    this.log("info", "Active ML agent updated", {
      standardUpdate: true,
      activeUpdate: true,
      uncertainty: this.getLastUncertaintyMetrics()?.total || 0,
      curriculumLevel: this.curriculum?.currentLevel || "none",
    });
  }

  /**
   * Enhanced confidence calculation with uncertainty decomposition
   */
  public getConfidence(state: State, action: Action): number {
    if (action.type !== ActionType.TRIAGE_ASSIGN) return 0.5;

    const uncertainty = this.activeLearning.calculateUncertainty(
      this,
      state,
      action
    );
    return uncertainty.confidence;
  }

  /**
   * Initialize adaptive curriculum learning
   */
  public initializeCurriculum(
    patientProfiles: PatientProfile[],
    strategy: CurriculumStrategy = CurriculumStrategy.ADAPTIVE
  ): void {
    this.curriculum = this.activeLearning.createAdaptiveCurriculum(
      this,
      patientProfiles,
      strategy
    );

    this.log("info", "Initialized adaptive curriculum", {
      strategy,
      maxLevel: this.curriculum.maxLevel,
      initialLevel: this.curriculum.currentLevel,
    });
  }

  /**
   * Get patients for current curriculum level
   */
  public getCurriculumPatients(
    availablePatients: PatientProfile[],
    count: number = 5
  ): PatientProfile[] {
    if (!this.curriculum) {
      return availablePatients.slice(0, count);
    }

    return this.activeLearning.selectCurriculumPatients(
      availablePatients,
      this.curriculum,
      count
    );
  }

  /**
   * Request expert consultation for uncertain cases
   */
  public async requestExpertConsultation(
    state: State,
    action: Action,
    uncertainty: UncertaintyMetrics
  ): Promise<void> {
    const consultation = this.activeLearning.generateExpertConsultation(
      state,
      action,
      uncertainty,
      {
        queueLength: (state.data.queueLength as number) || 0,
        systemLoad: (state.data.systemLoad as number) || 0.5,
        timeOfDay: state.timestamp.getHours(),
        recentPerformance: 0, // Would be calculated from recent experiences
        domainComplexity: "complex",
      }
    );

    this.log("info", "Requested expert consultation", {
      consultationId: consultation.id,
      questionType: consultation.questionType,
      urgency: consultation.urgency,
    });

    // In a real system, this would send the request to a human expert
    // For now, we'll simulate expert response
    await this.simulateExpertResponse(consultation);
  }

  /**
   * Get active learning metrics and insights
   */
  public getActiveLearningMetrics(): ActiveLearningMetrics {
    return {
      uncertaintyHistory: [...this.uncertaintyHistory],
      activeQueries: [...this.activeQueries],
      expertFeedback: [...this.expertFeedback],
      curriculum: this.curriculum ? { ...this.curriculum } : null,
      explorationStrategy: this.explorationStrategy,
      queriesUsedThisEpisode: this.queriesUsedThisEpisode,
      queryBudgetPerEpisode: this.queryBudgetPerEpisode,
      averageUncertainty: this.calculateAverageUncertainty(),
      informationGainTrend: this.calculateInformationGainTrend(),
    };
  }

  // Private Methods for Active Learning

  private async shouldMakeActiveQuery(
    state: State,
    actions: Action[]
  ): Promise<boolean> {
    // Check budget
    if (this.queriesUsedThisEpisode >= this.queryBudgetPerEpisode) {
      return false;
    }

    // Check if there are high-uncertainty situations
    const uncertainties = actions.map((action) =>
      this.activeLearning.calculateUncertainty(this, state, action)
    );

    const maxUncertainty = Math.max(...uncertainties.map((u) => u.total));
    const maxInformationGain = Math.max(
      ...uncertainties.map((u) => u.informationGain)
    );

    return (
      maxUncertainty > this.uncertaintyThreshold ||
      maxInformationGain > this.informationGainThreshold
    );
  }

  private async generateActiveQuery(
    state: State,
    actions: Action[]
  ): Promise<ActiveQuery | null> {
    const candidates = [{ state, actions }];

    const query = this.activeLearning.selectActiveQuery(
      candidates,
      this,
      ActiveQueryType.UNCERTAINTY_SAMPLING
    );

    if (query) {
      this.queriesUsedThisEpisode++;
    }

    return query;
  }

  private async selectPatientWithActiveLearning(
    state: State,
    patientActions: Map<string, PatientTriageData>
  ): Promise<PatientTriageData | null> {
    const patients = Array.from(patientActions.values());

    if (patients.length === 0) return null;
    if (patients.length === 1) return patients[0];

    // Calculate urgency scores with uncertainty weighting
    const scoredPatients = patients.map((patient) => {
      const mockAction = patient.actions[0]; // Use first action for scoring
      const uncertainty = this.activeLearning.calculateUncertainty(
        this,
        state,
        mockAction
      );

      // Combine traditional urgency with learning potential
      const urgencyScore = this.calculateTraditionalUrgencyScore(
        patient,
        state
      );
      const learningScore = uncertainty.informationGain * uncertainty.total;

      // Weight: 70% urgency, 30% learning potential during training
      const combinedScore = this.isTraining
        ? urgencyScore * 0.7 + learningScore * 0.3
        : urgencyScore;

      return {
        patient,
        score: combinedScore,
        uncertainty,
        urgencyScore,
        learningScore,
      };
    });

    // Sort by combined score
    scoredPatients.sort((a, b) => b.score - a.score);

    const selected = scoredPatients[0];

    this.log("debug", "Patient selection with active learning", {
      selectedPatient: selected.patient.patientId,
      combinedScore: selected.score,
      urgencyScore: selected.urgencyScore,
      learningScore: selected.learningScore,
      uncertainty: selected.uncertainty.total,
    });

    return selected.patient;
  }

  private predictOptimalPriorityWithUncertainty(
    patientData: PatientProfile | null
  ): PredictionWithUncertainty {
    if (!patientData) {
      return {
        priority: TriagePriority.NON_URGENT,
        uncertainty: {
          epistemic: 0.9,
          aleatoric: 0.1,
          total: 0.91,
          confidence: 0.1,
          informationGain: 0.8,
        },
      };
    }

    // Get prediction from standard ML model
    const features = this.extractPatientFeatures(patientData);
    const qValues = this.forwardPass(features);

    // Calculate uncertainty metrics
    const maxQValue = Math.max(...qValues);
    const qValueVariance = this.calculateVariance(qValues);
    const confidence = this.softmax(qValues)[qValues.indexOf(maxQValue)];

    // Epistemic uncertainty based on model confidence
    const epistemic = Math.sqrt(qValueVariance) / 10; // Normalize

    // Aleatoric uncertainty based on patient complexity
    const aleatoric = this.calculatePatientComplexity(patientData) * 0.3;

    // Information gain based on prediction uncertainty
    const informationGain = 4 * confidence * (1 - confidence); // Peaks at 0.5 confidence

    const uncertainty: UncertaintyMetrics = {
      epistemic,
      aleatoric,
      total: Math.sqrt(epistemic * epistemic + aleatoric * aleatoric),
      confidence,
      informationGain,
    };

    // Select priority with highest Q-value
    const bestPriorityIndex = qValues.indexOf(maxQValue);
    const priority = (bestPriorityIndex + 1) as TriagePriority;

    return { priority, uncertainty };
  }

  private makeExplorationDecision(
    prediction: PredictionWithUncertainty,
    state: State
  ): ExplorationDecision {
    switch (this.explorationStrategy) {
      case ExplorationStrategy.UNCERTAINTY_DRIVEN:
        return this.uncertaintyDrivenExploration(prediction);

      case ExplorationStrategy.INFORMATION_GAIN:
        return this.informationGainExploration(prediction);

      case ExplorationStrategy.EPSILON_GREEDY:
        return this.epsilonGreedyExploration(prediction);

      case ExplorationStrategy.THOMPSON_SAMPLING:
        return this.thompsonSamplingExploration(prediction);

      default:
        return { priority: prediction.priority, reason: "exploitation" };
    }
  }

  private uncertaintyDrivenExploration(
    prediction: PredictionWithUncertainty
  ): ExplorationDecision {
    // Explore more when uncertainty is high
    const explorationProbability = prediction.uncertainty.total;

    if (Math.random() < explorationProbability) {
      const priorities = [1, 2, 3, 4, 5] as TriagePriority[];
      const randomPriority =
        priorities[Math.floor(Math.random() * priorities.length)];
      return {
        priority: randomPriority,
        reason: `uncertainty_exploration (uncertainty: ${prediction.uncertainty.total.toFixed(
          2
        )})`,
      };
    }

    return { priority: prediction.priority, reason: "exploitation" };
  }

  private informationGainExploration(
    prediction: PredictionWithUncertainty
  ): ExplorationDecision {
    // Explore when information gain is high
    if (
      prediction.uncertainty.informationGain > this.informationGainThreshold
    ) {
      const priorities = [1, 2, 3, 4, 5] as TriagePriority[];
      const randomPriority =
        priorities[Math.floor(Math.random() * priorities.length)];
      return {
        priority: randomPriority,
        reason: `information_gain_exploration (gain: ${prediction.uncertainty.informationGain.toFixed(
          2
        )})`,
      };
    }

    return { priority: prediction.priority, reason: "exploitation" };
  }

  private epsilonGreedyExploration(
    prediction: PredictionWithUncertainty
  ): ExplorationDecision {
    // Standard epsilon-greedy exploration
    if (Math.random() < this.explorationRate) {
      const priorities = [1, 2, 3, 4, 5] as TriagePriority[];
      const randomPriority =
        priorities[Math.floor(Math.random() * priorities.length)];
      return {
        priority: randomPriority,
        reason: `epsilon_greedy_exploration (ε: ${this.explorationRate.toFixed(
          2
        )})`,
      };
    }

    return { priority: prediction.priority, reason: "exploitation" };
  }

  private thompsonSamplingExploration(
    prediction: PredictionWithUncertainty
  ): ExplorationDecision {
    // Sample from posterior distribution
    // Simplified version: sample based on confidence
    const noise =
      (Math.random() - 0.5) * (1 - prediction.uncertainty.confidence);
    const priorities = [1, 2, 3, 4, 5] as TriagePriority[];
    let sampledIndex = Math.floor((prediction.priority - 1 + noise + 5) % 5);
    sampledIndex = Math.max(0, Math.min(4, sampledIndex));

    return {
      priority: priorities[sampledIndex],
      reason: `thompson_sampling (noise: ${noise.toFixed(2)})`,
    };
  }

  private async performStandardUpdate(experience: Experience): Promise<void> {
    // Extract features from the experience
    const features = this.extractFeatures(experience.state, experience.action);
    const actualReward = experience.reward.value;

    // Get predicted Q-value for the action taken
    const predictedValue = this.predictQValue(features, experience.action);

    // Calculate target Q-value using Bellman equation
    const nextFeatures = this.extractFeatures(
      experience.nextState,
      experience.action
    );
    const nextQValue = experience.done ? 0 : this.getMaxQValue(nextFeatures);
    const targetValue = actualReward + 0.9 * nextQValue; // 0.9 is discount factor

    // Calculate error and update weights
    const error = targetValue - predictedValue;
    this.updateWeights(features, error);

    // Record training progress
    this.trainingHistory.push({
      episode: this.getStats().episodeCount,
      reward: actualReward,
      error: Math.abs(error),
      explorationRate: this.explorationRate,
      timestamp: new Date(),
    });

    // Decay exploration rate
    this.explorationRate *= this.decayRate;
    this.explorationRate = Math.max(0.01, this.explorationRate); // Minimum exploration
  }

  private async performActiveUpdate(experience: Experience): Promise<void> {
    // Update based on any active queries that were made
    const relatedQueries = this.activeQueries.filter(
      (query) => query.timestamp.getTime() > Date.now() - 60000 // Last minute
    );

    for (const query of relatedQueries) {
      await this.updateFromActiveQuery(query, experience);
    }

    // Update uncertainty estimates based on actual outcomes
    this.updateUncertaintyEstimates(experience);
  }

  private async updateFromActiveQuery(
    query: ActiveQuery,
    experience: Experience
  ): Promise<void> {
    // This would implement specific learning from active queries
    // For now, we'll update the uncertainty threshold based on outcomes

    const actualReward = experience.reward.value;
    const expectedBenefit = query.expectedBenefit;

    // If the query led to good outcomes, lower the threshold (query more)
    // If not, raise it (be more selective)
    if (actualReward > 0 && expectedBenefit > 0.5) {
      this.uncertaintyThreshold = Math.max(
        0.3,
        this.uncertaintyThreshold - 0.01
      );
    } else if (actualReward < 0) {
      this.uncertaintyThreshold = Math.min(
        0.9,
        this.uncertaintyThreshold + 0.01
      );
    }
  }

  private updateUncertaintyEstimates(experience: Experience): void {
    // Update our understanding of when we're uncertain
    // This could involve updating uncertainty models, etc.
    // For now, we'll just record the experience for future analysis
  }

  private recordUncertaintyMetrics(
    state: State,
    action: Action,
    uncertainty: UncertaintyMetrics
  ): void {
    this.uncertaintyHistory.push({
      timestamp: new Date(),
      state: state.id,
      action: action.id,
      uncertainty,
      episodeCount: this.getStats().episodeCount,
    });

    // Keep history manageable
    if (this.uncertaintyHistory.length > 1000) {
      this.uncertaintyHistory = this.uncertaintyHistory.slice(-500);
    }
  }

  private async simulateExpertResponse(consultation: any): Promise<void> {
    // Simulate expert response (in real system, this would be human input)
    const feedback: ExpertFeedback = {
      consultationId: consultation.id,
      recommendation: consultation.action,
      confidence: Math.random() * 0.4 + 0.6, // Expert confidence 60-100%
      explanation: "Simulated expert feedback",
      timestamp: new Date(),
      learningValue: Math.random() * 0.8 + 0.2, // Learning value 20-100%
    };

    this.expertFeedback.push(feedback);
  }

  // Utility methods

  private calculateTraditionalUrgencyScore(
    patient: PatientTriageData,
    state: State
  ): number {
    // Simplified urgency calculation
    return Math.random(); // Placeholder
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

  private softmax(values: number[]): number[] {
    const maxVal = Math.max(...values);
    const expValues = values.map((v) => Math.exp(v - maxVal));
    const sumExp = expValues.reduce((sum, exp) => sum + exp, 0);
    return expValues.map((exp) => exp / sumExp);
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map((val) => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length;
  }

  private getLastUncertaintyMetrics(): UncertaintyMetrics | null {
    return this.uncertaintyHistory.length > 0
      ? this.uncertaintyHistory[this.uncertaintyHistory.length - 1].uncertainty
      : null;
  }

  private calculateAverageUncertainty(): number {
    if (this.uncertaintyHistory.length === 0) return 0;

    const sum = this.uncertaintyHistory.reduce(
      (acc, record) => acc + record.uncertainty.total,
      0
    );
    return sum / this.uncertaintyHistory.length;
  }

  private calculateInformationGainTrend(): number {
    if (this.uncertaintyHistory.length < 10) return 0;

    const recent = this.uncertaintyHistory.slice(-10);
    const older = this.uncertaintyHistory.slice(-20, -10);

    const recentAvg =
      recent.reduce((acc, r) => acc + r.uncertainty.informationGain, 0) /
      recent.length;
    const olderAvg =
      older.reduce((acc, r) => acc + r.uncertainty.informationGain, 0) /
      older.length;

    return recentAvg - olderAvg; // Positive = increasing information gain
  }

  // Override base class methods that need to access private methods

  private initializeWeights(): MLWeights {
    return {
      inputToHidden: this.randomMatrix(10, 8),
      hiddenBias: this.randomArray(8),
      hiddenToOutput: this.randomMatrix(8, 5),
      outputBias: this.randomArray(5),
    };
  }

  private extractFeatures(state: State, action: Action): number[] {
    const patientId = action.parameters.patientId as string;

    const features = [
      (state.data.queueLength as number) / 10 || 0,
      (state.data.availableResources as number) / 8 || 1,
      state.timestamp.getHours() / 24,
      Math.random(),
      Math.random(),
      Math.random(),
      Math.random(),
      Math.random(),
      Math.random(),
      Math.random(),
    ];

    return features;
  }

  private extractPatientFeatures(patient: PatientProfile): number[] {
    return [
      patient.demographics.age / 100,
      patient.currentCondition.painLevel
        ? patient.currentCondition.painLevel / 10
        : 0,
      patient.vitalSigns.heartRate ? patient.vitalSigns.heartRate / 200 : 0,
      patient.vitalSigns.bloodPressure
        ? patient.vitalSigns.bloodPressure.systolic / 250
        : 0,
      patient.vitalSigns.temperature
        ? (patient.vitalSigns.temperature - 36) / 5
        : 0,
      patient.vitalSigns.oxygenSaturation
        ? patient.vitalSigns.oxygenSaturation / 100
        : 1,
      this.encodeSeverity(patient.currentCondition.severity),
      this.encodeAcuity(patient.currentCondition.acuity),
      patient.medicalHistory.conditions.length / 10,
      Math.random(),
    ];
  }

  private predictQValue(features: number[], action: Action): number {
    const hidden = this.forwardPass(features);
    const priority = action.parameters.priority as TriagePriority;
    return hidden[priority - 1] || 0;
  }

  private getMaxQValue(features: number[]): number {
    const hidden = this.forwardPass(features);
    return Math.max(...hidden);
  }

  private forwardPass(features: number[]): number[] {
    const hidden = this.weights.hiddenBias.map((bias, i) => {
      let sum = bias;
      for (let j = 0; j < features.length; j++) {
        sum += features[j] * this.weights.inputToHidden[j][i];
      }
      return this.relu(sum);
    });

    const output = this.weights.outputBias.map((bias, i) => {
      let sum = bias;
      for (let j = 0; j < hidden.length; j++) {
        sum += hidden[j] * this.weights.hiddenToOutput[j][i];
      }
      return sum;
    });

    return output;
  }

  private updateWeights(features: number[], error: number): void {
    for (let i = 0; i < this.weights.hiddenToOutput.length; i++) {
      for (let j = 0; j < this.weights.hiddenToOutput[i].length; j++) {
        this.weights.hiddenToOutput[i][j] +=
          this.learningRate * error * features[i % features.length];
      }
    }

    for (let i = 0; i < this.weights.outputBias.length; i++) {
      this.weights.outputBias[i] += this.learningRate * error;
    }

    for (let i = 0; i < this.weights.inputToHidden.length; i++) {
      for (let j = 0; j < this.weights.inputToHidden[i].length; j++) {
        this.weights.inputToHidden[i][j] +=
          this.learningRate * error * features[i];
      }
    }
  }

  private groupActionsByPatient(
    actions: Action[]
  ): Map<string, PatientTriageData> {
    const patientMap = new Map<string, PatientTriageData>();

    for (const action of actions) {
      const patientId = action.parameters.patientId as string;

      if (!patientMap.has(patientId)) {
        patientMap.set(patientId, {
          patientId,
          actions: [],
          patientData: null,
        });
      }

      patientMap.get(patientId)!.actions.push(action);
    }

    return patientMap;
  }

  private encodeSeverity(severity: SeverityLevel): number {
    const mapping = {
      [SeverityLevel.MILD]: 0.25,
      [SeverityLevel.MODERATE]: 0.5,
      [SeverityLevel.SEVERE]: 0.75,
      [SeverityLevel.CRITICAL]: 1.0,
    };
    return mapping[severity] || 0;
  }

  private encodeAcuity(acuity: AcuityLevel): number {
    const mapping = {
      [AcuityLevel.LOW]: 0.25,
      [AcuityLevel.MEDIUM]: 0.5,
      [AcuityLevel.HIGH]: 0.75,
      [AcuityLevel.CRITICAL]: 1.0,
    };
    return mapping[acuity] || 0;
  }

  private relu(x: number): number {
    return Math.max(0, x);
  }

  private randomMatrix(rows: number, cols: number): number[][] {
    return Array(rows)
      .fill(0)
      .map(() =>
        Array(cols)
          .fill(0)
          .map(() => (Math.random() - 0.5) * 0.1)
      );
  }

  private randomArray(size: number): number[] {
    return Array(size)
      .fill(0)
      .map(() => (Math.random() - 0.5) * 0.1);
  }

  // Reset method override
  public startEpisode(): void {
    super.startEpisode();
    this.queriesUsedThisEpisode = 0;
    this.activeLearning.resetBudget();
  }
}

// Supporting interfaces and types

interface MLWeights {
  inputToHidden: number[][];
  hiddenBias: number[];
  hiddenToOutput: number[][];
  outputBias: number[];
}

interface TrainingRecord {
  episode: number;
  reward: number;
  error: number;
  explorationRate: number;
  timestamp: Date;
}

interface PatientTriageData {
  patientId: string;
  actions: Action[];
  patientData: PatientProfile | null;
}

interface PredictionWithUncertainty {
  priority: TriagePriority;
  uncertainty: UncertaintyMetrics;
}

interface ExplorationDecision {
  priority: TriagePriority;
  reason: string;
}

interface UncertaintyRecord {
  timestamp: Date;
  state: string;
  action: string;
  uncertainty: UncertaintyMetrics;
  episodeCount: number;
}

interface ExpertFeedback {
  consultationId: string;
  recommendation: Action;
  confidence: number;
  explanation: string;
  timestamp: Date;
  learningValue: number;
}

interface ActiveLearningMetrics {
  uncertaintyHistory: UncertaintyRecord[];
  activeQueries: ActiveQuery[];
  expertFeedback: ExpertFeedback[];
  curriculum: LearningCurriculum | null;
  explorationStrategy: ExplorationStrategy;
  queriesUsedThisEpisode: number;
  queryBudgetPerEpisode: number;
  averageUncertainty: number;
  informationGainTrend: number;
}

enum ExplorationStrategy {
  UNCERTAINTY_DRIVEN = "uncertainty_driven",
  INFORMATION_GAIN = "information_gain",
  EPSILON_GREEDY = "epsilon_greedy",
  THOMPSON_SAMPLING = "thompson_sampling",
}
