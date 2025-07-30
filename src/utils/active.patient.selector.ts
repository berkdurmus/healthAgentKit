import {
  PatientProfile,
  Agent,
  State,
  AcuityLevel,
  SeverityLevel,
} from "@/types/core.types";
import { PatientGenerator } from "@/utils/patient.generator";
import {
  ActiveLearningCore,
  LearningCurriculum,
  CurriculumStrategy,
} from "@/core/active.learning";

/**
 * Active Patient Selection System
 * Implements strategic patient selection and generation for active reinforcement learning
 * - Curriculum-based patient progression
 * - Difficulty-aware patient selection
 * - Learning-driven patient generation
 * - Performance-adaptive selection strategies
 */

export interface PatientSelectionStrategy {
  type: SelectionStrategyType;
  parameters: SelectionParameters;
  adaptationRate: number;
  performanceThreshold: number;
}

export enum SelectionStrategyType {
  CURRICULUM_PROGRESSIVE = "curriculum_progressive",
  UNCERTAINTY_FOCUSED = "uncertainty_focused",
  DIVERSITY_MAXIMIZING = "diversity_maximizing",
  COMPETENCY_BASED = "competency_based",
  ADAPTIVE_HYBRID = "adaptive_hybrid",
}

export interface SelectionParameters {
  difficultyRange: [number, number];
  diversityWeight: number;
  uncertaintyWeight: number;
  performanceWeight: number;
  noveltyBonus: number;
}

export interface PatientComplexityProfile {
  medicalComplexity: number;
  diagnosticDifficulty: number;
  resourceRequirements: number;
  timeUrgency: number;
  overallComplexity: number;
  complexityFactors: ComplexityFactor[];
}

export interface ComplexityFactor {
  factor: string;
  contribution: number;
  description: string;
}

export interface PatientSelectionResult {
  selectedPatients: PatientProfile[];
  selectionRationale: string;
  expectedLearningBenefit: number;
  difficultyDistribution: DifficultyDistribution;
  curriculumAdvancement: boolean;
  adaptationMade: boolean;
}

export interface DifficultyDistribution {
  simple: number;
  moderate: number;
  complex: number;
  expert: number;
  average: number;
}

export interface LearningProgress {
  currentLevel: number;
  competencyScores: { [skill: string]: number };
  learningVelocity: number;
  stabilityIndex: number;
  readinessForAdvancement: boolean;
  strugglingAreas: string[];
  strengthAreas: string[];
}

export class ActivePatientSelector {
  private patientGenerator: PatientGenerator;
  private activeLearning: ActiveLearningCore;
  private selectionHistory: PatientSelectionHistory[] = [];
  private complexityCache: Map<string, PatientComplexityProfile> = new Map();

  // Selection strategy configuration
  private currentStrategy: PatientSelectionStrategy;
  private strategyHistory: StrategyPerformance[] = [];
  private adaptationFrequency: number = 10; // Adapt every N selections
  private selectionCount: number = 0;

  // Curriculum and learning tracking
  private curriculum: LearningCurriculum | null = null;
  private learningProgress: LearningProgress;
  private performanceHistory: PerformanceRecord[] = [];

  constructor(
    patientGenerator: PatientGenerator,
    activeLearning: ActiveLearningCore,
    initialStrategy: PatientSelectionStrategy = this.getDefaultStrategy()
  ) {
    this.patientGenerator = patientGenerator;
    this.activeLearning = activeLearning;
    this.currentStrategy = initialStrategy;
    this.learningProgress = this.initializeLearningProgress();
  }

  /**
   * Select patients strategically for agent training
   */
  public async selectPatientsForTraining(
    agent: Agent,
    targetCount: number,
    currentState?: State
  ): Promise<PatientSelectionResult> {
    this.selectionCount++;

    // Generate a larger pool of candidate patients
    const candidatePoolSize = Math.max(targetCount * 3, 15);
    const candidatePatients = this.generateCandidatePool(candidatePoolSize);

    // Calculate complexity profiles for all candidates
    const profiledCandidates = candidatePatients.map((patient) => ({
      patient,
      complexity: this.calculatePatientComplexity(patient),
    }));

    // Apply current selection strategy
    const selectionResult = await this.applySelectionStrategy(
      profiledCandidates,
      agent,
      targetCount,
      currentState
    );

    // Record selection for analysis
    this.recordSelection(selectionResult, agent);

    // Check if strategy adaptation is needed
    if (this.selectionCount % this.adaptationFrequency === 0) {
      await this.adaptSelectionStrategy(agent);
    }

    // Update curriculum if available
    if (this.curriculum) {
      this.updateCurriculumProgress(selectionResult, agent);
    }

    return selectionResult;
  }

  /**
   * Initialize curriculum learning for an agent
   */
  public initializeCurriculum(
    agent: Agent,
    strategy: CurriculumStrategy = CurriculumStrategy.ADAPTIVE,
    levels: number = 5
  ): LearningCurriculum {
    // Generate representative patients for complexity analysis
    const samplePatients = this.generateCandidatePool(50);

    this.curriculum = this.activeLearning.createAdaptiveCurriculum(
      agent,
      samplePatients,
      strategy
    );

    this.curriculum.maxLevel = levels;

    console.log(
      `📚 Initialized curriculum learning with ${levels} levels using ${strategy} strategy`
    );

    return this.curriculum;
  }

  /**
   * Get patients for current curriculum level
   */
  public getCurriculumPatients(count: number): PatientProfile[] {
    if (!this.curriculum) {
      return this.generateCandidatePool(count);
    }

    const allCandidates = this.generateCandidatePool(count * 3);
    const selectedPatients = this.activeLearning.selectCurriculumPatients(
      allCandidates,
      this.curriculum,
      count
    );

    return selectedPatients;
  }

  /**
   * Adapt selection strategy based on agent performance
   */
  public async adaptSelectionStrategy(agent: Agent): Promise<void> {
    const recentPerformance = this.getRecentPerformanceMetrics();

    // Analyze current strategy effectiveness
    const strategyEffectiveness = this.analyzeStrategyEffectiveness();

    // Determine if adaptation is needed
    if (strategyEffectiveness.shouldAdapt) {
      const newStrategy = await this.selectOptimalStrategy(
        recentPerformance,
        agent
      );

      if (newStrategy.type !== this.currentStrategy.type) {
        console.log(
          `🔄 Adapting patient selection strategy from ${this.currentStrategy.type} to ${newStrategy.type}`
        );

        this.currentStrategy = newStrategy;
        this.recordStrategyChange(strategyEffectiveness, newStrategy);
      }
    }
  }

  /**
   * Get insights into patient selection and learning progress
   */
  public getSelectionInsights(): PatientSelectionInsights {
    return {
      currentStrategy: this.currentStrategy,
      curriculum: this.curriculum,
      learningProgress: this.learningProgress,
      selectionHistory: this.selectionHistory.slice(-20), // Last 20 selections
      strategyPerformance: this.strategyHistory,
      complexityDistribution: this.calculateComplexityDistribution(),
      adaptationFrequency: this.adaptationFrequency,
      totalSelections: this.selectionCount,
      curriculumAdvancement: this.calculateCurriculumAdvancement(),
      learningEfficiency: this.calculateLearningEfficiency(),
    };
  }

  // Private Methods

  private async applySelectionStrategy(
    profiledCandidates: ProfiledCandidate[],
    agent: Agent,
    targetCount: number,
    currentState?: State
  ): Promise<PatientSelectionResult> {
    switch (this.currentStrategy.type) {
      case SelectionStrategyType.CURRICULUM_PROGRESSIVE:
        return this.curriculumProgressiveSelection(
          profiledCandidates,
          agent,
          targetCount
        );

      case SelectionStrategyType.UNCERTAINTY_FOCUSED:
        return this.uncertaintyFocusedSelection(
          profiledCandidates,
          agent,
          targetCount
        );

      case SelectionStrategyType.DIVERSITY_MAXIMIZING:
        return this.diversityMaximizingSelection(
          profiledCandidates,
          agent,
          targetCount
        );

      case SelectionStrategyType.COMPETENCY_BASED:
        return this.competencyBasedSelection(
          profiledCandidates,
          agent,
          targetCount
        );

      case SelectionStrategyType.ADAPTIVE_HYBRID:
        return this.adaptiveHybridSelection(
          profiledCandidates,
          agent,
          targetCount
        );

      default:
        return this.curriculumProgressiveSelection(
          profiledCandidates,
          agent,
          targetCount
        );
    }
  }

  private curriculumProgressiveSelection(
    candidates: ProfiledCandidate[],
    agent: Agent,
    targetCount: number
  ): PatientSelectionResult {
    if (!this.curriculum) {
      // Fallback to simple progressive selection
      candidates.sort(
        (a, b) =>
          a.complexity.overallComplexity - b.complexity.overallComplexity
      );
      const selected = candidates.slice(0, targetCount).map((c) => c.patient);

      return {
        selectedPatients: selected,
        selectionRationale: "Progressive difficulty without formal curriculum",
        expectedLearningBenefit: 0.6,
        difficultyDistribution: this.calculateDifficultyDistribution(selected),
        curriculumAdvancement: false,
        adaptationMade: false,
      };
    }

    // Get complexity range for current curriculum level
    const targetComplexity = this.getCurriculumComplexityRange();

    // Filter candidates within target complexity range
    const appropriateCandidates = candidates.filter(
      (candidate) =>
        candidate.complexity.overallComplexity >= targetComplexity.min &&
        candidate.complexity.overallComplexity <= targetComplexity.max
    );

    // If not enough appropriate candidates, expand range slightly
    if (appropriateCandidates.length < targetCount) {
      const expandedRange = {
        min: Math.max(0, targetComplexity.min - 0.1),
        max: Math.min(1, targetComplexity.max + 0.1),
      };

      appropriateCandidates.push(
        ...candidates.filter(
          (candidate) =>
            candidate.complexity.overallComplexity >= expandedRange.min &&
            candidate.complexity.overallComplexity <= expandedRange.max &&
            !appropriateCandidates.includes(candidate)
        )
      );
    }

    // Select diverse patients within appropriate complexity
    const selected = this.selectDiversePatients(
      appropriateCandidates,
      targetCount
    );

    // Check if agent is ready for curriculum advancement
    const curriculumAdvancement = this.checkCurriculumAdvancement(agent);

    return {
      selectedPatients: selected.map((c) => c.patient),
      selectionRationale: `Curriculum level ${
        this.curriculum.currentLevel
      }: complexity range ${targetComplexity.min.toFixed(
        2
      )}-${targetComplexity.max.toFixed(2)}`,
      expectedLearningBenefit: 0.8,
      difficultyDistribution: this.calculateDifficultyDistribution(
        selected.map((c) => c.patient)
      ),
      curriculumAdvancement,
      adaptationMade: false,
    };
  }

  private uncertaintyFocusedSelection(
    candidates: ProfiledCandidate[],
    agent: Agent,
    targetCount: number
  ): PatientSelectionResult {
    // Score candidates based on expected uncertainty/learning potential
    const scoredCandidates = candidates.map((candidate) => ({
      ...candidate,
      uncertaintyScore: this.estimatePatientUncertainty(
        candidate.patient,
        agent
      ),
    }));

    // Sort by uncertainty score (highest first)
    scoredCandidates.sort((a, b) => b.uncertaintyScore - a.uncertaintyScore);

    // Select top candidates with some diversity
    const selected = this.selectWithDiversity(
      scoredCandidates,
      targetCount,
      0.7
    );

    return {
      selectedPatients: selected.map((c) => c.patient),
      selectionRationale: `Uncertainty-focused: targeting high-uncertainty cases for maximum learning`,
      expectedLearningBenefit: 0.9,
      difficultyDistribution: this.calculateDifficultyDistribution(
        selected.map((c) => c.patient)
      ),
      curriculumAdvancement: false,
      adaptationMade: false,
    };
  }

  private diversityMaximizingSelection(
    candidates: ProfiledCandidate[],
    agent: Agent,
    targetCount: number
  ): PatientSelectionResult {
    // Use diversity-based selection to ensure broad exposure
    const selected = this.selectMaximallyDiversePatients(
      candidates,
      targetCount
    );

    return {
      selectedPatients: selected.map((c) => c.patient),
      selectionRationale:
        "Diversity-maximizing: ensuring broad exposure to different patient types",
      expectedLearningBenefit: 0.7,
      difficultyDistribution: this.calculateDifficultyDistribution(
        selected.map((c) => c.patient)
      ),
      curriculumAdvancement: false,
      adaptationMade: false,
    };
  }

  private competencyBasedSelection(
    candidates: ProfiledCandidate[],
    agent: Agent,
    targetCount: number
  ): PatientSelectionResult {
    // Focus on areas where agent needs improvement
    const strugglingAreas = this.learningProgress.strugglingAreas;

    // Score candidates based on their relevance to struggling areas
    const scoredCandidates = candidates.map((candidate) => ({
      ...candidate,
      competencyRelevance: this.calculateCompetencyRelevance(
        candidate.patient,
        strugglingAreas
      ),
    }));

    // Select candidates that target struggling areas
    scoredCandidates.sort(
      (a, b) => b.competencyRelevance - a.competencyRelevance
    );
    const selected = scoredCandidates.slice(0, targetCount);

    return {
      selectedPatients: selected.map((c) => c.patient),
      selectionRationale: `Competency-based: targeting struggling areas [${strugglingAreas.join(
        ", "
      )}]`,
      expectedLearningBenefit: 0.85,
      difficultyDistribution: this.calculateDifficultyDistribution(
        selected.map((c) => c.patient)
      ),
      curriculumAdvancement: false,
      adaptationMade: false,
    };
  }

  private adaptiveHybridSelection(
    candidates: ProfiledCandidate[],
    agent: Agent,
    targetCount: number
  ): PatientSelectionResult {
    // Combine multiple strategies based on current learning state
    const recentPerformance = this.getRecentPerformanceMetrics();

    let primaryStrategy: SelectionStrategyType;
    let blendRatio = { primary: 0.7, secondary: 0.3 };

    // Adapt strategy mix based on performance
    if (recentPerformance.successRate < 0.6) {
      // Struggling - focus on curriculum/easier cases
      primaryStrategy = SelectionStrategyType.CURRICULUM_PROGRESSIVE;
    } else if (recentPerformance.successRate > 0.8) {
      // Doing well - challenge with uncertainty/diversity
      primaryStrategy = SelectionStrategyType.UNCERTAINTY_FOCUSED;
      blendRatio = { primary: 0.6, secondary: 0.4 };
    } else {
      // Moderate performance - balanced approach
      primaryStrategy = SelectionStrategyType.COMPETENCY_BASED;
    }

    // Select patients using hybrid approach
    const primaryCount = Math.floor(targetCount * blendRatio.primary);
    const secondaryCount = targetCount - primaryCount;

    // Get primary selection
    const primaryResult = await this.applySpecificStrategy(
      candidates,
      agent,
      primaryCount,
      primaryStrategy
    );

    // Get secondary selection (diversity)
    const remainingCandidates = candidates.filter(
      (c) => !primaryResult.selectedPatients.includes(c.patient)
    );
    const secondarySelected = this.selectMaximallyDiversePatients(
      remainingCandidates,
      secondaryCount
    );

    const allSelected = [
      ...primaryResult.selectedPatients,
      ...secondarySelected.map((c) => c.patient),
    ];

    return {
      selectedPatients: allSelected,
      selectionRationale: `Adaptive hybrid: ${primaryStrategy} (${Math.round(
        blendRatio.primary * 100
      )}%) + diversity (${Math.round(blendRatio.secondary * 100)}%)`,
      expectedLearningBenefit: 0.85,
      difficultyDistribution: this.calculateDifficultyDistribution(allSelected),
      curriculumAdvancement: primaryResult.curriculumAdvancement,
      adaptationMade: true,
    };
  }

  private async applySpecificStrategy(
    candidates: ProfiledCandidate[],
    agent: Agent,
    targetCount: number,
    strategy: SelectionStrategyType
  ): Promise<PatientSelectionResult> {
    const originalStrategy = this.currentStrategy.type;
    this.currentStrategy.type = strategy;

    const result = await this.applySelectionStrategy(
      candidates,
      agent,
      targetCount
    );

    this.currentStrategy.type = originalStrategy;
    return result;
  }

  // Complexity and Analysis Methods

  private calculatePatientComplexity(
    patient: PatientProfile
  ): PatientComplexityProfile {
    // Check cache first
    const cacheKey = this.getPatientComplexityKey(patient);
    if (this.complexityCache.has(cacheKey)) {
      return this.complexityCache.get(cacheKey)!;
    }

    const factors: ComplexityFactor[] = [];
    let medicalComplexity = 0;
    let diagnosticDifficulty = 0;
    let resourceRequirements = 0;
    let timeUrgency = 0;

    // Medical complexity factors
    const comorbidityCount = patient.medicalHistory.conditions.length;
    if (comorbidityCount > 0) {
      const comorbidityComplexity = Math.min(0.4, comorbidityCount * 0.1);
      medicalComplexity += comorbidityComplexity;
      factors.push({
        factor: "comorbidities",
        contribution: comorbidityComplexity,
        description: `${comorbidityCount} comorbid conditions`,
      });
    }

    // Age complexity
    if (patient.demographics.age < 18 || patient.demographics.age > 75) {
      const ageComplexity = 0.2;
      medicalComplexity += ageComplexity;
      factors.push({
        factor: "age_extremes",
        contribution: ageComplexity,
        description: `Age ${patient.demographics.age} requires special consideration`,
      });
    }

    // Diagnostic difficulty
    const complaint = patient.currentCondition.chiefComplaint.toLowerCase();
    if (this.isComplexComplaint(complaint)) {
      const diagnosticComplexity = 0.3;
      diagnosticDifficulty += diagnosticComplexity;
      factors.push({
        factor: "complex_chief_complaint",
        contribution: diagnosticComplexity,
        description: `Chief complaint "${complaint}" is diagnostically challenging`,
      });
    }

    // Acuity-based complexity
    const acuityComplexity = this.getAcuityComplexity(
      patient.currentCondition.acuity
    );
    diagnosticDifficulty += acuityComplexity.value;
    factors.push(acuityComplexity.factor);

    // Resource requirements
    if (
      complaint.includes("trauma") ||
      patient.currentCondition.acuity === AcuityLevel.CRITICAL
    ) {
      const resourceComplexity = 0.4;
      resourceRequirements += resourceComplexity;
      factors.push({
        factor: "high_resource_needs",
        contribution: resourceComplexity,
        description: "Requires intensive resource allocation",
      });
    }

    // Time urgency
    if (
      patient.currentCondition.acuity === AcuityLevel.CRITICAL ||
      patient.currentCondition.acuity === AcuityLevel.HIGH
    ) {
      const urgencyComplexity = 0.3;
      timeUrgency += urgencyComplexity;
      factors.push({
        factor: "time_critical",
        contribution: urgencyComplexity,
        description: "Time-sensitive decision making required",
      });
    }

    // Pain complexity
    if (
      patient.currentCondition.painLevel &&
      patient.currentCondition.painLevel >= 8
    ) {
      const painComplexity = 0.2;
      medicalComplexity += painComplexity;
      factors.push({
        factor: "severe_pain",
        contribution: painComplexity,
        description: `Severe pain level (${patient.currentCondition.painLevel}/10)`,
      });
    }

    // Calculate overall complexity
    const overallComplexity = Math.min(
      1.0,
      medicalComplexity * 0.3 +
        diagnosticDifficulty * 0.3 +
        resourceRequirements * 0.2 +
        timeUrgency * 0.2
    );

    const profile: PatientComplexityProfile = {
      medicalComplexity: Math.min(1.0, medicalComplexity),
      diagnosticDifficulty: Math.min(1.0, diagnosticDifficulty),
      resourceRequirements: Math.min(1.0, resourceRequirements),
      timeUrgency: Math.min(1.0, timeUrgency),
      overallComplexity,
      complexityFactors: factors,
    };

    // Cache the result
    this.complexityCache.set(cacheKey, profile);

    return profile;
  }

  private isComplexComplaint(complaint: string): boolean {
    const complexComplaints = [
      "syncope",
      "altered mental status",
      "weakness",
      "fatigue",
      "multiple complaints",
      "vague symptoms",
      "psychiatric",
      "substance abuse",
      "chronic pain",
    ];

    return complexComplaints.some((complex) => complaint.includes(complex));
  }

  private getAcuityComplexity(acuity: AcuityLevel): {
    value: number;
    factor: ComplexityFactor;
  } {
    const mapping = {
      [AcuityLevel.LOW]: {
        value: 0.1,
        description: "Low acuity - routine assessment",
      },
      [AcuityLevel.MEDIUM]: {
        value: 0.3,
        description: "Medium acuity - careful evaluation needed",
      },
      [AcuityLevel.HIGH]: {
        value: 0.5,
        description: "High acuity - urgent assessment required",
      },
      [AcuityLevel.CRITICAL]: {
        value: 0.7,
        description: "Critical acuity - immediate intervention needed",
      },
    };

    const complexity = mapping[acuity];
    return {
      value: complexity.value,
      factor: {
        factor: "acuity_level",
        contribution: complexity.value,
        description: complexity.description,
      },
    };
  }

  private generateCandidatePool(size: number): PatientProfile[] {
    const patients = [];

    for (let i = 0; i < size; i++) {
      // Generate with some variety in time and season for diversity
      const options = {
        timeOfDay: Math.floor(Math.random() * 24),
        season: Math.floor(Math.random() * 4),
      };

      const patient = this.patientGenerator.generatePatient(options);
      patients.push(patient);
    }

    return patients;
  }

  private selectDiversePatients(
    candidates: ProfiledCandidate[],
    targetCount: number
  ): ProfiledCandidate[] {
    if (candidates.length <= targetCount) {
      return candidates;
    }

    const selected: ProfiledCandidate[] = [];
    const remaining = [...candidates];

    // First, select one from each complexity quartile if possible
    const sortedBySeverity = [...candidates].sort(
      (a, b) => a.complexity.overallComplexity - b.complexity.overallComplexity
    );
    const quartileSize = Math.floor(sortedBySeverity.length / 4);

    for (let i = 0; i < 4 && selected.length < targetCount; i++) {
      const quartileStart = i * quartileSize;
      const quartileEnd =
        i === 3 ? sortedBySeverity.length : (i + 1) * quartileSize;
      const quartile = sortedBySeverity.slice(quartileStart, quartileEnd);

      if (quartile.length > 0) {
        const randomIndex = Math.floor(Math.random() * quartile.length);
        const selectedCandidate = quartile[randomIndex];
        selected.push(selectedCandidate);

        const remainingIndex = remaining.findIndex(
          (c) => c.patient.id === selectedCandidate.patient.id
        );
        if (remainingIndex !== -1) {
          remaining.splice(remainingIndex, 1);
        }
      }
    }

    // Fill remaining spots randomly
    while (selected.length < targetCount && remaining.length > 0) {
      const randomIndex = Math.floor(Math.random() * remaining.length);
      selected.push(remaining.splice(randomIndex, 1)[0]);
    }

    return selected;
  }

  private selectMaximallyDiversePatients(
    candidates: ProfiledCandidate[],
    targetCount: number
  ): ProfiledCandidate[] {
    if (candidates.length <= targetCount) {
      return candidates;
    }

    const selected: ProfiledCandidate[] = [];
    const remaining = [...candidates];

    // Use diversity metrics to select patients
    const diversityFeatures = [
      "age",
      "acuity",
      "chiefComplaint",
      "comorbidityCount",
    ];
    const selectedFeatures: { [key: string]: Set<any> } = {};

    diversityFeatures.forEach((feature) => {
      selectedFeatures[feature] = new Set();
    });

    while (selected.length < targetCount && remaining.length > 0) {
      let bestCandidate = remaining[0];
      let maxDiversityScore = -1;

      for (const candidate of remaining) {
        const diversityScore = this.calculateDiversityScore(
          candidate,
          selectedFeatures
        );
        if (diversityScore > maxDiversityScore) {
          maxDiversityScore = diversityScore;
          bestCandidate = candidate;
        }
      }

      selected.push(bestCandidate);
      this.updateSelectedFeatures(bestCandidate, selectedFeatures);

      const remainingIndex = remaining.findIndex(
        (c) => c.patient.id === bestCandidate.patient.id
      );
      if (remainingIndex !== -1) {
        remaining.splice(remainingIndex, 1);
      }
    }

    return selected;
  }

  private calculateDiversityScore(
    candidate: ProfiledCandidate,
    selectedFeatures: { [key: string]: Set<any> }
  ): number {
    let diversityScore = 0;
    const patient = candidate.patient;

    // Age diversity
    const ageGroup = Math.floor(patient.demographics.age / 20) * 20;
    if (!selectedFeatures.age.has(ageGroup)) {
      diversityScore += 1;
    }

    // Acuity diversity
    if (!selectedFeatures.acuity.has(patient.currentCondition.acuity)) {
      diversityScore += 1;
    }

    // Chief complaint diversity (simplified)
    const complaintCategory = this.categorizeComplaint(
      patient.currentCondition.chiefComplaint
    );
    if (!selectedFeatures.chiefComplaint.has(complaintCategory)) {
      diversityScore += 1;
    }

    // Comorbidity count diversity
    const comorbidityGroup =
      patient.medicalHistory.conditions.length > 2 ? "high" : "low";
    if (!selectedFeatures.comorbidityCount.has(comorbidityGroup)) {
      diversityScore += 1;
    }

    return diversityScore;
  }

  private updateSelectedFeatures(
    candidate: ProfiledCandidate,
    selectedFeatures: { [key: string]: Set<any> }
  ): void {
    const patient = candidate.patient;

    selectedFeatures.age.add(Math.floor(patient.demographics.age / 20) * 20);
    selectedFeatures.acuity.add(patient.currentCondition.acuity);
    selectedFeatures.chiefComplaint.add(
      this.categorizeComplaint(patient.currentCondition.chiefComplaint)
    );
    selectedFeatures.comorbidityCount.add(
      patient.medicalHistory.conditions.length > 2 ? "high" : "low"
    );
  }

  private categorizeComplaint(complaint: string): string {
    const complaint_lower = complaint.toLowerCase();

    if (complaint_lower.includes("chest") || complaint_lower.includes("heart"))
      return "cardiac";
    if (complaint_lower.includes("breath") || complaint_lower.includes("lung"))
      return "respiratory";
    if (
      complaint_lower.includes("abdominal") ||
      complaint_lower.includes("stomach")
    )
      return "gastrointestinal";
    if (complaint_lower.includes("head") || complaint_lower.includes("neuro"))
      return "neurological";
    if (
      complaint_lower.includes("trauma") ||
      complaint_lower.includes("injury")
    )
      return "trauma";

    return "other";
  }

  // Selection Strategy Analysis and Adaptation

  private getRecentPerformanceMetrics(): PerformanceMetrics {
    const recentRecords = this.performanceHistory.slice(-10); // Last 10 episodes

    if (recentRecords.length === 0) {
      return {
        successRate: 0.5,
        averageReward: 0,
        learningVelocity: 0,
        consistencyScore: 0.5,
      };
    }

    const successRate =
      recentRecords.filter((r) => r.success).length / recentRecords.length;
    const averageReward =
      recentRecords.reduce((sum, r) => sum + r.reward, 0) /
      recentRecords.length;
    const learningVelocity = this.calculateLearningVelocity(recentRecords);
    const consistencyScore = this.calculateConsistencyScore(recentRecords);

    return {
      successRate,
      averageReward,
      learningVelocity,
      consistencyScore,
    };
  }

  private analyzeStrategyEffectiveness(): StrategyEffectiveness {
    const recentSelections = this.selectionHistory.slice(-5);

    if (recentSelections.length < 3) {
      return {
        shouldAdapt: false,
        effectiveness: 0.5,
        issues: [],
        recommendations: [],
      };
    }

    const avgLearningBenefit =
      recentSelections.reduce((sum, s) => sum + s.expectedLearningBenefit, 0) /
      recentSelections.length;
    const adaptationCount = recentSelections.filter(
      (s) => s.adaptationMade
    ).length;

    const issues = [];
    const recommendations = [];

    if (avgLearningBenefit < 0.6) {
      issues.push("Low expected learning benefit");
      recommendations.push(
        "Consider more challenging or diverse patient selection"
      );
    }

    if (adaptationCount > recentSelections.length * 0.8) {
      issues.push("Too frequent adaptations");
      recommendations.push("Allow more time for strategy to stabilize");
    }

    const shouldAdapt = issues.length > 1 || avgLearningBenefit < 0.5;

    return {
      shouldAdapt,
      effectiveness: avgLearningBenefit,
      issues,
      recommendations,
    };
  }

  private async selectOptimalStrategy(
    performance: PerformanceMetrics,
    agent: Agent
  ): Promise<PatientSelectionStrategy> {
    // Decision logic for strategy selection based on performance
    if (performance.successRate < 0.4) {
      // Agent struggling - use curriculum approach
      return {
        type: SelectionStrategyType.CURRICULUM_PROGRESSIVE,
        parameters: this.getDefaultParameters(),
        adaptationRate: 0.1,
        performanceThreshold: 0.6,
      };
    }

    if (performance.successRate > 0.85) {
      // Agent doing very well - challenge with uncertainty
      return {
        type: SelectionStrategyType.UNCERTAINTY_FOCUSED,
        parameters: {
          ...this.getDefaultParameters(),
          uncertaintyWeight: 0.8,
        },
        adaptationRate: 0.05,
        performanceThreshold: 0.8,
      };
    }

    if (performance.consistencyScore < 0.5) {
      // Inconsistent performance - focus on competency gaps
      return {
        type: SelectionStrategyType.COMPETENCY_BASED,
        parameters: this.getDefaultParameters(),
        adaptationRate: 0.15,
        performanceThreshold: 0.7,
      };
    }

    // Default to adaptive hybrid for balanced performance
    return {
      type: SelectionStrategyType.ADAPTIVE_HYBRID,
      parameters: this.getDefaultParameters(),
      adaptationRate: 0.1,
      performanceThreshold: 0.75,
    };
  }

  // Utility and Helper Methods

  private getDefaultStrategy(): PatientSelectionStrategy {
    return {
      type: SelectionStrategyType.CURRICULUM_PROGRESSIVE,
      parameters: this.getDefaultParameters(),
      adaptationRate: 0.1,
      performanceThreshold: 0.7,
    };
  }

  private getDefaultParameters(): SelectionParameters {
    return {
      difficultyRange: [0.3, 0.7],
      diversityWeight: 0.3,
      uncertaintyWeight: 0.4,
      performanceWeight: 0.2,
      noveltyBonus: 0.1,
    };
  }

  private initializeLearningProgress(): LearningProgress {
    return {
      currentLevel: 1,
      competencyScores: {
        life_threat_assessment: 0.5,
        symptom_evaluation: 0.5,
        resource_allocation: 0.5,
        time_management: 0.5,
      },
      learningVelocity: 0,
      stabilityIndex: 0.5,
      readinessForAdvancement: false,
      strugglingAreas: [],
      strengthAreas: [],
    };
  }

  private getCurriculumComplexityRange(): { min: number; max: number } {
    if (!this.curriculum) {
      return { min: 0, max: 1 };
    }

    const levelProgress =
      this.curriculum.currentLevel / this.curriculum.maxLevel;
    const rangeWidth = 0.4; // 40% of complexity space per level

    return {
      min: Math.max(0, levelProgress - rangeWidth / 2),
      max: Math.min(1, levelProgress + rangeWidth / 2),
    };
  }

  private estimatePatientUncertainty(
    patient: PatientProfile,
    agent: Agent
  ): number {
    // Estimate how uncertain an agent would be with this patient
    const complexity = this.calculatePatientComplexity(patient);

    // Higher complexity generally means higher uncertainty
    let uncertaintyScore = complexity.overallComplexity;

    // Adjust based on agent's known strengths/weaknesses
    const complainCategory = this.categorizeComplaint(
      patient.currentCondition.chiefComplaint
    );
    const competencyScore =
      this.learningProgress.competencyScores[complainCategory] || 0.5;

    // Higher uncertainty for areas where agent has lower competency
    uncertaintyScore += (1 - competencyScore) * 0.3;

    return Math.min(1.0, uncertaintyScore);
  }

  private calculateCompetencyRelevance(
    patient: PatientProfile,
    strugglingAreas: string[]
  ): number {
    let relevance = 0;

    const patientFeatures = [
      this.categorizeComplaint(patient.currentCondition.chiefComplaint),
      patient.currentCondition.acuity === AcuityLevel.CRITICAL
        ? "time_management"
        : "",
      patient.medicalHistory.conditions.length > 2 ? "complex_cases" : "",
    ].filter((f) => f.length > 0);

    for (const area of strugglingAreas) {
      if (patientFeatures.includes(area)) {
        relevance += 1;
      }
    }

    return relevance / Math.max(1, strugglingAreas.length);
  }

  private selectWithDiversity(
    scoredCandidates: any[],
    targetCount: number,
    diversityWeight: number
  ): any[] {
    const selected: any[] = [];
    const remaining = [...scoredCandidates];

    // Balance between high scores and diversity
    while (selected.length < targetCount && remaining.length > 0) {
      let bestCandidate = remaining[0];
      let maxCombinedScore = -1;

      for (const candidate of remaining) {
        const diversityBonus = this.calculateDiversityBonus(
          candidate,
          selected
        );
        const combinedScore =
          (1 - diversityWeight) * candidate.uncertaintyScore +
          diversityWeight * diversityBonus;

        if (combinedScore > maxCombinedScore) {
          maxCombinedScore = combinedScore;
          bestCandidate = candidate;
        }
      }

      selected.push(bestCandidate);
      const remainingIndex = remaining.findIndex(
        (c) => c.patient.id === bestCandidate.patient.id
      );
      if (remainingIndex !== -1) {
        remaining.splice(remainingIndex, 1);
      }
    }

    return selected;
  }

  private calculateDiversityBonus(candidate: any, selected: any[]): number {
    if (selected.length === 0) return 1;

    // Simple diversity bonus based on complaint category
    const candidateCategory = this.categorizeComplaint(
      candidate.patient.currentCondition.chiefComplaint
    );
    const selectedCategories = new Set(
      selected.map((s) =>
        this.categorizeComplaint(s.patient.currentCondition.chiefComplaint)
      )
    );

    return selectedCategories.has(candidateCategory) ? 0.3 : 1.0;
  }

  private checkCurriculumAdvancement(agent: Agent): boolean {
    if (!this.curriculum) return false;

    // Check if agent is ready to advance to next level
    const recentPerformance = this.getRecentPerformanceMetrics();

    return (
      recentPerformance.successRate > 0.8 &&
      recentPerformance.consistencyScore > 0.7 &&
      this.curriculum.currentLevel < this.curriculum.maxLevel
    );
  }

  private recordSelection(result: PatientSelectionResult, agent: Agent): void {
    this.selectionHistory.push({
      timestamp: new Date(),
      strategy: this.currentStrategy.type,
      patientCount: result.selectedPatients.length,
      expectedLearningBenefit: result.expectedLearningBenefit,
      difficultyDistribution: result.difficultyDistribution,
      curriculumLevel: this.curriculum?.currentLevel || 0,
      adaptationMade: result.adaptationMade,
    });

    // Keep history manageable
    if (this.selectionHistory.length > 100) {
      this.selectionHistory = this.selectionHistory.slice(-50);
    }
  }

  private updateCurriculumProgress(
    result: PatientSelectionResult,
    agent: Agent
  ): void {
    if (!this.curriculum) return;

    // Update curriculum based on selection and expected performance
    if (result.curriculumAdvancement) {
      this.curriculum.currentLevel = Math.min(
        this.curriculum.maxLevel,
        this.curriculum.currentLevel + 1
      );

      console.log(
        `📈 Curriculum advanced to level ${this.curriculum.currentLevel}`
      );
    }
  }

  private recordStrategyChange(
    effectiveness: StrategyEffectiveness,
    newStrategy: PatientSelectionStrategy
  ): void {
    this.strategyHistory.push({
      timestamp: new Date(),
      fromStrategy: this.currentStrategy.type,
      toStrategy: newStrategy.type,
      reason: effectiveness.issues.join("; "),
      previousEffectiveness: effectiveness.effectiveness,
    });
  }

  private calculateDifficultyDistribution(
    patients: PatientProfile[]
  ): DifficultyDistribution {
    const complexities = patients.map(
      (p) => this.calculatePatientComplexity(p).overallComplexity
    );

    const simple = complexities.filter((c) => c < 0.3).length;
    const moderate = complexities.filter((c) => c >= 0.3 && c < 0.6).length;
    const complex = complexities.filter((c) => c >= 0.6 && c < 0.8).length;
    const expert = complexities.filter((c) => c >= 0.8).length;
    const average =
      complexities.reduce((sum, c) => sum + c, 0) / complexities.length;

    return { simple, moderate, complex, expert, average };
  }

  private calculateComplexityDistribution(): any {
    const recentSelections = this.selectionHistory.slice(-10);
    if (recentSelections.length === 0) return {};

    const avgDistribution = {
      simple: 0,
      moderate: 0,
      complex: 0,
      expert: 0,
      average: 0,
    };

    for (const selection of recentSelections) {
      avgDistribution.simple += selection.difficultyDistribution.simple;
      avgDistribution.moderate += selection.difficultyDistribution.moderate;
      avgDistribution.complex += selection.difficultyDistribution.complex;
      avgDistribution.expert += selection.difficultyDistribution.expert;
      avgDistribution.average += selection.difficultyDistribution.average;
    }

    const count = recentSelections.length;
    return {
      simple: avgDistribution.simple / count,
      moderate: avgDistribution.moderate / count,
      complex: avgDistribution.complex / count,
      expert: avgDistribution.expert / count,
      average: avgDistribution.average / count,
    };
  }

  private calculateCurriculumAdvancement(): number {
    return this.curriculum
      ? this.curriculum.currentLevel / this.curriculum.maxLevel
      : 0;
  }

  private calculateLearningEfficiency(): number {
    if (this.selectionHistory.length < 5) return 0.5;

    const recentBenefits = this.selectionHistory
      .slice(-5)
      .map((s) => s.expectedLearningBenefit);
    return (
      recentBenefits.reduce((sum, b) => sum + b, 0) / recentBenefits.length
    );
  }

  private calculateLearningVelocity(records: PerformanceRecord[]): number {
    if (records.length < 2) return 0;

    // Simple approximation of learning velocity
    const firstHalf = records.slice(0, Math.floor(records.length / 2));
    const secondHalf = records.slice(Math.floor(records.length / 2));

    const firstAvg =
      firstHalf.reduce((sum, r) => sum + r.reward, 0) / firstHalf.length;
    const secondAvg =
      secondHalf.reduce((sum, r) => sum + r.reward, 0) / secondHalf.length;

    return secondAvg - firstAvg;
  }

  private calculateConsistencyScore(records: PerformanceRecord[]): number {
    if (records.length < 2) return 0.5;

    const rewards = records.map((r) => r.reward);
    const mean = rewards.reduce((sum, r) => sum + r, 0) / rewards.length;
    const variance =
      rewards.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) /
      rewards.length;
    const stdDev = Math.sqrt(variance);

    // Lower standard deviation = higher consistency
    return Math.max(0, 1 - stdDev / 10); // Normalize assuming rewards range roughly -10 to +10
  }

  private getPatientComplexityKey(patient: PatientProfile): string {
    return `${patient.demographics.age}_${patient.currentCondition.acuity}_${patient.currentCondition.chiefComplaint}_${patient.medicalHistory.conditions.length}`;
  }

  // Public utility methods

  public recordPerformance(success: boolean, reward: number): void {
    this.performanceHistory.push({
      timestamp: new Date(),
      success,
      reward,
      curriculumLevel: this.curriculum?.currentLevel || 0,
    });

    // Update learning progress
    this.updateLearningProgress(success, reward);

    // Keep history manageable
    if (this.performanceHistory.length > 200) {
      this.performanceHistory = this.performanceHistory.slice(-100);
    }
  }

  private updateLearningProgress(success: boolean, reward: number): void {
    // Update competency scores based on performance
    const recentPerformance = this.getRecentPerformanceMetrics();

    this.learningProgress.learningVelocity = recentPerformance.learningVelocity;
    this.learningProgress.stabilityIndex = recentPerformance.consistencyScore;

    // Update struggling and strength areas
    this.learningProgress.strugglingAreas = Object.entries(
      this.learningProgress.competencyScores
    )
      .filter(([_, score]) => score < 0.6)
      .map(([area, _]) => area);

    this.learningProgress.strengthAreas = Object.entries(
      this.learningProgress.competencyScores
    )
      .filter(([_, score]) => score > 0.8)
      .map(([area, _]) => area);

    this.learningProgress.readinessForAdvancement =
      recentPerformance.successRate > 0.8;
  }
}

// Supporting interfaces and types

interface ProfiledCandidate {
  patient: PatientProfile;
  complexity: PatientComplexityProfile;
}

interface PerformanceMetrics {
  successRate: number;
  averageReward: number;
  learningVelocity: number;
  consistencyScore: number;
}

interface StrategyEffectiveness {
  shouldAdapt: boolean;
  effectiveness: number;
  issues: string[];
  recommendations: string[];
}

interface PatientSelectionHistory {
  timestamp: Date;
  strategy: SelectionStrategyType;
  patientCount: number;
  expectedLearningBenefit: number;
  difficultyDistribution: DifficultyDistribution;
  curriculumLevel: number;
  adaptationMade: boolean;
}

interface StrategyPerformance {
  timestamp: Date;
  fromStrategy: SelectionStrategyType;
  toStrategy: SelectionStrategyType;
  reason: string;
  previousEffectiveness: number;
}

interface PerformanceRecord {
  timestamp: Date;
  success: boolean;
  reward: number;
  curriculumLevel: number;
}

interface PatientSelectionInsights {
  currentStrategy: PatientSelectionStrategy;
  curriculum: LearningCurriculum | null;
  learningProgress: LearningProgress;
  selectionHistory: PatientSelectionHistory[];
  strategyPerformance: StrategyPerformance[];
  complexityDistribution: any;
  adaptationFrequency: number;
  totalSelections: number;
  curriculumAdvancement: number;
  learningEfficiency: number;
}
