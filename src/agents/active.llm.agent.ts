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
  ExpertConsultationRequest,
  ExpertResponse,
} from "@/core/active.learning";

/**
 * Active LLM-based Triage Agent
 * Extends the basic LLM agent with active reinforcement learning strategies
 * - Confidence-driven expert consultation
 * - Reasoning quality assessment
 * - Knowledge gap identification
 * - Adaptive learning from expert feedback
 */
export class ActiveLLMTriageAgent extends BaseAgent {
  private contextWindow: LLMContext[] = [];
  private reasoningHistory: TriageReasoning[] = [];
  private clinicalKnowledge: ClinicalKnowledgeBase;
  private confidenceThreshold: number = 0.7;

  // Active Learning Components
  private activeLearning: ActiveLearningCore;
  private expertConsultations: ExpertConsultationRequest[] = [];
  private expertResponses: ExpertResponse[] = [];
  private knowledgeGaps: KnowledgeGap[] = [];
  private reasoningQualityHistory: ReasoningQuality[] = [];

  // Active Learning Parameters
  private consultationThreshold: number = 0.6;
  private knowledgeGapThreshold: number = 0.8;
  private maxConsultationsPerEpisode: number = 3;
  private consultationsUsedThisEpisode: number = 0;
  private adaptiveLearningRate: number = 0.15;

  constructor(name: string = "Active LLM Clinical Agent", id?: string) {
    super(name, AgentType.LLM_AGENT, id);
    this.clinicalKnowledge = this.initializeClinicalKnowledge();
    this.activeLearning = new ActiveLearningCore({
      uncertaintyThreshold: this.consultationThreshold,
      learningBudget: this.maxConsultationsPerEpisode,
      expertAvailable: true,
    });
  }

  /**
   * Enhanced action selection with active expert consultation
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

    // Extract clinical context from state and actions
    const clinicalContext = this.extractClinicalContext(state, triageActions);

    // Perform multi-step reasoning with active learning enhancements
    const reasoning = await this.performEnhancedClinicalReasoning(
      clinicalContext
    );

    // Assess reasoning quality and identify potential knowledge gaps
    const reasoningQuality = this.assessReasoningQuality(
      reasoning,
      clinicalContext
    );
    this.reasoningQualityHistory.push(reasoningQuality);

    // Check if expert consultation is needed
    if (
      await this.shouldConsultExpert(
        reasoning,
        reasoningQuality,
        clinicalContext
      )
    ) {
      await this.requestExpertConsultation(reasoning, state, triageActions);
    }

    // Select action based on reasoning (potentially modified by expert input)
    const selectedAction = this.selectActionFromReasoning(
      reasoning,
      triageActions
    );

    // Store reasoning for learning and explanation
    this.storeReasoning(reasoning, selectedAction, clinicalContext);

    // Identify and record knowledge gaps
    await this.identifyKnowledgeGaps(reasoning, clinicalContext);

    this.log("info", "Active LLM agent completed clinical reasoning", {
      patientCount: clinicalContext.patients.length,
      selectedPriority: selectedAction.parameters.priority,
      confidence: reasoning.confidence,
      reasoningSteps: reasoning.steps.length,
      reasoningQuality: reasoningQuality.overallScore,
      expertConsulted: reasoning.expertConsulted || false,
    });

    return selectedAction;
  }

  /**
   * Enhanced update with expert feedback integration
   */
  public async update(experience: Experience): Promise<void> {
    this.addExperience(experience);

    if (!this.isTraining) return;

    // Find the reasoning that led to this action
    const relatedReasoning = this.findReasoningForAction(experience.action);

    if (relatedReasoning) {
      // Update reasoning based on outcome
      this.updateReasoningFromOutcome(relatedReasoning, experience);

      // Update clinical knowledge base with outcome
      this.updateClinicalKnowledge(experience, relatedReasoning);

      // Learn from expert feedback if available
      await this.learnFromExpertFeedback(relatedReasoning, experience);
    }

    // Update knowledge gap understanding
    await this.updateKnowledgeGapLearning(experience);

    // Adapt learning parameters based on performance
    this.adaptLearningParameters(experience);

    this.log("info", "Active LLM agent updated from experience", {
      reward: experience.reward.value,
      reasoningUpdated: !!relatedReasoning,
      knowledgeBaseSize: Object.keys(this.clinicalKnowledge.patterns).length,
      expertResponsesLearned: this.getRecentExpertResponses().length,
      knowledgeGapsIdentified: this.knowledgeGaps.length,
    });
  }

  /**
   * Enhanced confidence with reasoning quality assessment
   */
  public getConfidence(state: State, action: Action): number {
    if (action.type !== ActionType.TRIAGE_ASSIGN) return 0.5;

    const clinicalContext = this.extractClinicalContext(state, [action]);
    const patient = clinicalContext.patients[0];

    if (!patient) return 0.3;

    // Get base confidence factors
    const factors = this.calculateConfidenceFactors(patient, action);

    // Enhance with reasoning quality and knowledge gap assessment
    const knowledgeGapPenalty = this.calculateKnowledgeGapPenalty(patient);
    const reasoningQualityBonus = this.calculateReasoningQualityBonus();

    // Weighted combination with active learning enhancements
    const confidence =
      factors.clinicalCertainty * 0.3 +
      factors.knowledgeMatch * 0.25 +
      factors.contextClarity * 0.2 +
      factors.precedentMatch * 0.1 +
      reasoningQualityBonus * 0.1 +
      (1 - knowledgeGapPenalty) * 0.05;

    return Math.min(0.95, Math.max(0.1, confidence));
  }

  /**
   * Request expert consultation for uncertain cases
   */
  public async requestExpertConsultation(
    reasoning: TriageReasoning,
    state: State,
    actions: Action[]
  ): Promise<void> {
    if (this.consultationsUsedThisEpisode >= this.maxConsultationsPerEpisode) {
      this.log("warn", "Expert consultation budget exhausted for this episode");
      return;
    }

    const uncertainty = this.calculateReasoningUncertainty(reasoning);
    const context = this.createQueryContext(state, reasoning);

    const consultation = this.activeLearning.generateExpertConsultation(
      state,
      actions[0], // Use first action as representative
      uncertainty,
      context
    );

    // Enhance consultation with LLM-specific context
    const enhancedConsultation: EnhancedExpertConsultation = {
      ...consultation,
      reasoning: reasoning,
      specificQuestion: this.generateSpecificQuestion(reasoning, uncertainty),
      clinicalContext: reasoning.context,
      uncertaintyBreakdown: this.analyzeUncertaintyBreakdown(reasoning),
      suggestedFocusAreas: this.identifyFocusAreas(reasoning),
    };

    this.expertConsultations.push(enhancedConsultation);
    this.consultationsUsedThisEpisode++;

    this.log("info", "Requested expert consultation", {
      consultationId: consultation.id,
      questionType: consultation.questionType,
      urgency: consultation.urgency,
      specificQuestion: enhancedConsultation.specificQuestion,
      uncertaintyTotal: uncertainty.total,
    });

    // Simulate expert response (in real system, this would be human input)
    await this.simulateExpertResponse(enhancedConsultation);
  }

  /**
   * Get active learning insights and metrics
   */
  public getActiveLearningInsights(): ActiveLLMInsights {
    return {
      expertConsultations: this.expertConsultations.length,
      consultationsThisEpisode: this.consultationsUsedThisEpisode,
      knowledgeGaps: [...this.knowledgeGaps],
      reasoningQualityTrend: this.calculateReasoningQualityTrend(),
      expertAgreementRate: this.calculateExpertAgreementRate(),
      learningVelocity: this.calculateLearningVelocity(),
      knowledgeGrowth: this.calculateKnowledgeGrowth(),
      uncertaintyReduction: this.calculateUncertaintyReduction(),
      topKnowledgeGaps: this.getTopKnowledgeGaps(5),
      reasoningQualityDistribution: this.getReasoningQualityDistribution(),
    };
  }

  // Private Methods for Active Learning

  private async performEnhancedClinicalReasoning(
    context: ClinicalContext
  ): Promise<TriageReasoning> {
    const reasoning: TriageReasoning = {
      id: `reasoning-${Date.now()}`,
      timestamp: new Date(),
      context,
      steps: [],
      confidence: 0,
      selectedPriority: TriagePriority.NON_URGENT,
      explanation: "",
      expertConsulted: false,
      knowledgeGapsIdentified: [],
      uncertaintyFactors: [],
    };

    // Step 1: Assess immediate threats to life with uncertainty tracking
    const lifeThreatStep = this.assessLifeThreatsWithUncertainty(
      context.patients[0]
    );
    reasoning.steps.push(lifeThreatStep);
    reasoning.uncertaintyFactors.push(
      ...(lifeThreatStep.uncertaintyFactors || [])
    );

    if (lifeThreatStep.conclusion.includes("immediate")) {
      reasoning.selectedPriority = TriagePriority.IMMEDIATE;
      reasoning.confidence = Math.min(0.95, lifeThreatStep.confidence + 0.1); // High confidence bonus for life threats
      reasoning.explanation =
        "Life-threatening condition requiring immediate intervention";
      return reasoning;
    }

    // Step 2: Evaluate symptom severity with knowledge gap detection
    const severityStep = this.evaluateSymptomSeverityWithGapDetection(
      context.patients[0]
    );
    reasoning.steps.push(severityStep);
    reasoning.uncertaintyFactors.push(
      ...(severityStep.uncertaintyFactors || [])
    );

    // Step 3: Consider differential diagnosis with confidence assessment
    const differentialStep = this.considerDifferentialWithConfidence(
      context.patients[0]
    );
    reasoning.steps.push(differentialStep);
    reasoning.uncertaintyFactors.push(
      ...(differentialStep.uncertaintyFactors || [])
    );

    // Step 4: Assess resource requirements with system context
    const resourceStep = this.assessResourceNeedsWithContext(
      context.patients[0],
      context
    );
    reasoning.steps.push(resourceStep);

    // Step 5: Apply clinical guidelines with precedent matching
    const guidelineStep = this.applyGuidelinesWithPrecedents(
      context.patients[0]
    );
    reasoning.steps.push(guidelineStep);

    // Step 6: Synthesize with active learning considerations
    const finalDecision = this.synthesizeDecisionWithActiveLearning(
      reasoning.steps,
      context
    );
    reasoning.selectedPriority = finalDecision.priority;
    reasoning.confidence = finalDecision.confidence;
    reasoning.explanation = finalDecision.explanation;
    reasoning.knowledgeGapsIdentified = finalDecision.knowledgeGaps;

    return reasoning;
  }

  private assessLifeThreatsWithUncertainty(
    patient: PatientProfile | undefined
  ): EnhancedReasoningStep {
    if (!patient) {
      return {
        type: "life_threat_assessment",
        input: "No patient data",
        reasoning: "Cannot assess without patient information",
        conclusion: "Unable to determine life threat status",
        confidence: 0.1,
        uncertaintyFactors: ["missing_patient_data"],
        knowledgeGapsDetected: [],
      };
    }

    const vitalSigns = patient.vitalSigns;
    const threats = [];
    const uncertaintyFactors = [];
    const knowledgeGaps = [];

    // Enhanced vital signs assessment with uncertainty tracking
    if (vitalSigns.heartRate) {
      if (vitalSigns.heartRate > 150 || vitalSigns.heartRate < 50) {
        threats.push("Critical heart rate abnormality");
      }
    } else {
      uncertaintyFactors.push("missing_heart_rate");
    }

    if (vitalSigns.bloodPressure) {
      if (
        vitalSigns.bloodPressure.systolic < 90 ||
        vitalSigns.bloodPressure.systolic > 200
      ) {
        threats.push("Critical blood pressure");
      }
    } else {
      uncertaintyFactors.push("missing_blood_pressure");
    }

    if (vitalSigns.oxygenSaturation) {
      if (vitalSigns.oxygenSaturation < 90) {
        threats.push("Critical hypoxemia");
      }
    } else {
      uncertaintyFactors.push("missing_oxygen_saturation");
    }

    // Check for knowledge gaps in assessment
    const complaint = patient.currentCondition.chiefComplaint.toLowerCase();
    if (this.isUnfamiliarComplaint(complaint)) {
      knowledgeGaps.push("unfamiliar_chief_complaint");
      uncertaintyFactors.push("knowledge_gap_complaint");
    }

    const hasLifeThreats = threats.length > 0;
    const confidenceReduction = uncertaintyFactors.length * 0.1;

    return {
      type: "life_threat_assessment",
      input: `Vitals: HR ${vitalSigns.heartRate || "N/A"}, BP ${
        vitalSigns.bloodPressure
          ? `${vitalSigns.bloodPressure.systolic}/${vitalSigns.bloodPressure.diastolic}`
          : "N/A"
      }, O2 ${vitalSigns.oxygenSaturation || "N/A"}%`,
      reasoning: hasLifeThreats
        ? `Identified potential life threats: ${threats.join(", ")}`
        : "No immediate life-threatening signs detected based on available vital signs",
      conclusion: hasLifeThreats
        ? "immediate intervention required"
        : "no immediate life threats",
      confidence: Math.max(
        0.1,
        (hasLifeThreats ? 0.9 : 0.8) - confidenceReduction
      ),
      uncertaintyFactors,
      knowledgeGapsDetected: knowledgeGaps,
    };
  }

  private evaluateSymptomSeverityWithGapDetection(
    patient: PatientProfile | undefined
  ): EnhancedReasoningStep {
    if (!patient) {
      return {
        type: "symptom_severity",
        input: "No patient data",
        reasoning: "Cannot evaluate symptoms without patient information",
        conclusion: "Unable to determine severity",
        confidence: 0.1,
        uncertaintyFactors: ["missing_patient_data"],
        knowledgeGapsDetected: [],
      };
    }

    const painLevel = patient.currentCondition.painLevel;
    const acuity = patient.currentCondition.acuity;
    const severity = patient.currentCondition.severity;
    const uncertaintyFactors = [];
    const knowledgeGaps = [];

    let severityScore = 0;
    let reasoning = [];

    // Pain assessment with uncertainty tracking
    if (painLevel !== undefined) {
      if (painLevel >= 8) {
        severityScore += 3;
        reasoning.push(
          `High pain level (${painLevel}/10) indicates significant distress`
        );
      } else if (painLevel >= 5) {
        severityScore += 2;
        reasoning.push(
          `Moderate pain level (${painLevel}/10) requires attention`
        );
      } else if (painLevel > 0) {
        severityScore += 1;
        reasoning.push(`Low pain level (${painLevel}/10) manageable`);
      }
    } else {
      uncertaintyFactors.push("missing_pain_assessment");
    }

    // Acuity assessment with knowledge gap detection
    if (acuity) {
      if (acuity === AcuityLevel.CRITICAL) {
        severityScore += 4;
        reasoning.push("Critical acuity level");
      } else if (acuity === AcuityLevel.HIGH) {
        severityScore += 3;
        reasoning.push("High acuity level");
      } else if (acuity === AcuityLevel.MEDIUM) {
        severityScore += 2;
        reasoning.push("Medium acuity level");
      }
    } else {
      uncertaintyFactors.push("missing_acuity_assessment");
    }

    // Check for complex symptom combinations that might require expertise
    if (this.isComplexSymptomCombination(patient)) {
      knowledgeGaps.push("complex_symptom_pattern");
      uncertaintyFactors.push("complex_presentation");
    }

    // Determine overall severity
    let conclusion = "";
    if (severityScore >= 6) {
      conclusion = "high severity requiring urgent attention";
    } else if (severityScore >= 4) {
      conclusion = "moderate severity requiring timely care";
    } else if (severityScore >= 2) {
      conclusion = "mild to moderate severity";
    } else {
      conclusion = "low severity, stable condition";
    }

    const confidenceReduction =
      uncertaintyFactors.length * 0.05 + knowledgeGaps.length * 0.1;

    return {
      type: "symptom_severity",
      input: `Pain: ${
        painLevel || "N/A"
      }/10, Acuity: ${acuity}, Severity: ${severity}`,
      reasoning: reasoning.join("; "),
      conclusion,
      confidence: Math.max(0.1, 0.85 - confidenceReduction),
      uncertaintyFactors,
      knowledgeGapsDetected: knowledgeGaps,
    };
  }

  private considerDifferentialWithConfidence(
    patient: PatientProfile | undefined
  ): EnhancedReasoningStep {
    if (!patient) {
      return {
        type: "differential_diagnosis",
        input: "No patient data",
        reasoning: "Cannot consider diagnosis without patient information",
        conclusion: "Unable to determine differential",
        confidence: 0.1,
        uncertaintyFactors: ["missing_patient_data"],
        knowledgeGapsDetected: [],
      };
    }

    const complaint = patient.currentCondition.chiefComplaint;
    const age = patient.demographics.age;
    const conditions = patient.medicalHistory.conditions;
    const uncertaintyFactors = [];
    const knowledgeGaps = [];

    // Enhanced differential generation with confidence tracking
    const differentials = this.generateDifferentialDiagnosis(
      complaint,
      age,
      conditions
    );
    const urgentDifferentials = differentials.filter(
      (d) => d.urgency === "high"
    );

    // Check for knowledge gaps in differential reasoning
    if (this.hasInsufficientDifferentialKnowledge(complaint, age)) {
      knowledgeGaps.push("insufficient_differential_knowledge");
      uncertaintyFactors.push("limited_diagnostic_knowledge");
    }

    if (this.hasRareConditionIndicators(patient)) {
      knowledgeGaps.push("potential_rare_condition");
      uncertaintyFactors.push("rare_presentation");
    }

    const confidenceReduction =
      uncertaintyFactors.length * 0.05 + knowledgeGaps.length * 0.15;

    return {
      type: "differential_diagnosis",
      input: `Chief complaint: ${complaint}, Age: ${age}, PMH: ${conditions
        .map((c) => c.name)
        .join(", ")}`,
      reasoning: `Considering differentials: ${differentials
        .map((d) => d.condition)
        .join(", ")}. Urgent considerations: ${urgentDifferentials
        .map((d) => d.condition)
        .join(", ")}`,
      conclusion:
        urgentDifferentials.length > 0
          ? "urgent differential diagnoses require expedited evaluation"
          : "differential diagnoses suggest routine evaluation appropriate",
      confidence: Math.max(0.1, 0.75 - confidenceReduction),
      uncertaintyFactors,
      knowledgeGapsDetected: knowledgeGaps,
    };
  }

  private assessResourceNeedsWithContext(
    patient: PatientProfile | undefined,
    context: ClinicalContext
  ): EnhancedReasoningStep {
    if (!patient) {
      return {
        type: "resource_assessment",
        input: `Queue length: ${context.queueLength}`,
        reasoning: "Cannot assess resource needs without patient information",
        conclusion: "Unable to determine resource requirements",
        confidence: 0.1,
        uncertaintyFactors: ["missing_patient_data"],
        knowledgeGapsDetected: [],
      };
    }

    const complaint = patient.currentCondition.chiefComplaint;
    const acuity = patient.currentCondition.acuity;
    const uncertaintyFactors = [];
    const knowledgeGaps = [];

    let resourceLevel = "standard";
    let reasoning = "";

    // Enhanced resource assessment with system context
    if (complaint.includes("trauma") || complaint.includes("accident")) {
      resourceLevel = "trauma bay";
      reasoning = "Trauma presentation requires specialized trauma resources";
    } else if (acuity === AcuityLevel.CRITICAL) {
      resourceLevel = "critical care";
      reasoning =
        "Critical acuity requires advanced monitoring and intervention capabilities";
    } else if (
      complaint.includes("chest pain") ||
      complaint.includes("shortness of breath")
    ) {
      resourceLevel = "monitored bed";
      reasoning = "Cardiopulmonary symptoms require continuous monitoring";
    }

    // Consider system load and queue context
    if (context.queueLength > 10) {
      reasoning += `. High queue volume (${context.queueLength} patients) increases urgency for resource allocation`;
      uncertaintyFactors.push("high_system_load");
    }

    // Consider time-of-day effects
    if (context.timeOfDay >= 22 || context.timeOfDay <= 6) {
      reasoning += ". Night shift considerations for resource availability";
      uncertaintyFactors.push("night_shift_constraints");
    }

    // Check for resource allocation knowledge gaps
    if (this.hasResourceAllocationUncertainty(patient, context)) {
      knowledgeGaps.push("resource_allocation_complexity");
    }

    const confidenceReduction =
      uncertaintyFactors.length * 0.05 + knowledgeGaps.length * 0.1;

    return {
      type: "resource_assessment",
      input: `Complaint: ${complaint}, Acuity: ${acuity}, Queue: ${context.queueLength}, Time: ${context.timeOfDay}:00`,
      reasoning,
      conclusion: `requires ${resourceLevel} resources`,
      confidence: Math.max(0.1, 0.8 - confidenceReduction),
      uncertaintyFactors,
      knowledgeGapsDetected: knowledgeGaps,
    };
  }

  private applyGuidelinesWithPrecedents(
    patient: PatientProfile | undefined
  ): EnhancedReasoningStep {
    if (!patient) {
      return {
        type: "clinical_guidelines",
        input: "No patient data",
        reasoning: "Cannot apply guidelines without patient information",
        conclusion: "Unable to apply clinical guidelines",
        confidence: 0.1,
        uncertaintyFactors: ["missing_patient_data"],
        knowledgeGapsDetected: [],
      };
    }

    const complaint = patient.currentCondition.chiefComplaint;
    const age = patient.demographics.age;
    const uncertaintyFactors = [];
    const knowledgeGaps = [];

    // Enhanced guideline application with precedent matching
    let esiLevel = 5;
    let guideline = "";
    let precedentMatch = false;

    // Check for similar cases in reasoning history
    const similarCases = this.findSimilarCases(patient);
    if (similarCases.length > 0) {
      precedentMatch = true;
      guideline += `Similar cases found: ${similarCases.length} precedents. `;
    } else {
      uncertaintyFactors.push("no_similar_precedents");
    }

    // Apply enhanced ESI guidelines
    if (complaint.includes("chest pain") && age > 35) {
      esiLevel = 2;
      guideline +=
        "ACS protocol: Chest pain in adults >35 requires immediate evaluation per AHA guidelines";
    } else if (complaint.includes("shortness of breath")) {
      esiLevel = 3;
      guideline +=
        "Respiratory distress protocol: Requires timely assessment and intervention";
    } else if (complaint.includes("trauma") || complaint.includes("accident")) {
      esiLevel = 2;
      guideline +=
        "Trauma protocol: Mechanism-based triage requires rapid assessment";
    } else if (
      patient.currentCondition.painLevel &&
      patient.currentCondition.painLevel >= 8
    ) {
      esiLevel = 3;
      guideline +=
        "Pain management protocol: Severe pain requires timely intervention";
    } else {
      esiLevel = 4;
      guideline += "Standard triage: Routine evaluation appropriate";
    }

    // Check for guideline application uncertainties
    if (this.hasGuidelineApplicationUncertainty(patient)) {
      knowledgeGaps.push("guideline_interpretation_complexity");
      uncertaintyFactors.push("complex_guideline_application");
    }

    const confidenceBonus = precedentMatch ? 0.1 : 0;
    const confidenceReduction =
      uncertaintyFactors.length * 0.05 + knowledgeGaps.length * 0.1;

    return {
      type: "clinical_guidelines",
      input: `Complaint: ${complaint}, Age: ${age}, Pain: ${patient.currentCondition.painLevel}, Precedents: ${similarCases.length}`,
      reasoning: guideline,
      conclusion: `ESI Level ${esiLevel} equivalent`,
      confidence: Math.max(
        0.1,
        Math.min(0.95, 0.9 + confidenceBonus - confidenceReduction)
      ),
      uncertaintyFactors,
      knowledgeGapsDetected: knowledgeGaps,
    };
  }

  private synthesizeDecisionWithActiveLearning(
    steps: EnhancedReasoningStep[],
    context: ClinicalContext
  ): EnhancedDecision {
    const weights = {
      life_threat_assessment: 0.4,
      symptom_severity: 0.2,
      differential_diagnosis: 0.15,
      resource_assessment: 0.15,
      clinical_guidelines: 0.1,
    };

    let urgencyScore = 0;
    let weightedConfidence = 0;
    let totalWeight = 0;
    const allKnowledgeGaps: string[] = [];
    const allUncertaintyFactors: string[] = [];

    for (const step of steps) {
      const weight = weights[step.type as keyof typeof weights] || 0.1;

      // Convert conclusions to urgency scores
      let stepUrgency = 0;
      if (step.conclusion.includes("immediate")) stepUrgency = 5;
      else if (
        step.conclusion.includes("urgent") ||
        step.conclusion.includes("high")
      )
        stepUrgency = 4;
      else if (step.conclusion.includes("moderate")) stepUrgency = 3;
      else if (step.conclusion.includes("timely")) stepUrgency = 2;
      else stepUrgency = 1;

      urgencyScore += stepUrgency * weight;
      weightedConfidence += step.confidence * weight;
      totalWeight += weight;

      // Collect knowledge gaps and uncertainty factors
      if (step.knowledgeGapsDetected) {
        allKnowledgeGaps.push(...step.knowledgeGapsDetected);
      }
      if (step.uncertaintyFactors) {
        allUncertaintyFactors.push(...step.uncertaintyFactors);
      }
    }

    urgencyScore /= totalWeight;
    weightedConfidence /= totalWeight;

    // Adjust confidence based on overall uncertainty
    const uncertaintyPenalty = allUncertaintyFactors.length * 0.02;
    const knowledgeGapPenalty = allKnowledgeGaps.length * 0.05;
    const finalConfidence = Math.max(
      0.1,
      weightedConfidence - uncertaintyPenalty - knowledgeGapPenalty
    );

    // Map urgency score to triage priority
    let priority: TriagePriority;
    if (urgencyScore >= 4.5) priority = TriagePriority.IMMEDIATE;
    else if (urgencyScore >= 3.5) priority = TriagePriority.URGENT;
    else if (urgencyScore >= 2.5) priority = TriagePriority.SEMI_URGENT;
    else if (urgencyScore >= 1.5) priority = TriagePriority.LESS_URGENT;
    else priority = TriagePriority.NON_URGENT;

    const explanation = `Synthesized ${steps.length} reasoning steps with ${
      allUncertaintyFactors.length
    } uncertainty factors and ${
      allKnowledgeGaps.length
    } knowledge gaps. Overall urgency score: ${urgencyScore.toFixed(2)}`;

    return {
      priority,
      confidence: finalConfidence,
      explanation,
      knowledgeGaps: [...new Set(allKnowledgeGaps)], // Remove duplicates
      uncertaintyFactors: [...new Set(allUncertaintyFactors)],
    };
  }

  private async shouldConsultExpert(
    reasoning: TriageReasoning,
    reasoningQuality: ReasoningQuality,
    context: ClinicalContext
  ): Promise<boolean> {
    // Don't consult if budget exhausted
    if (this.consultationsUsedThisEpisode >= this.maxConsultationsPerEpisode) {
      return false;
    }

    // Consult if confidence is below threshold
    if (reasoning.confidence < this.consultationThreshold) {
      return true;
    }

    // Consult if reasoning quality is poor
    if (reasoningQuality.overallScore < 0.6) {
      return true;
    }

    // Consult if significant knowledge gaps identified
    if (
      reasoning.knowledgeGapsIdentified &&
      reasoning.knowledgeGapsIdentified.length > 2
    ) {
      return true;
    }

    // Consult for critical patients with any uncertainty
    if (
      context.patients[0]?.currentCondition.acuity === AcuityLevel.CRITICAL &&
      reasoning.confidence < 0.9
    ) {
      return true;
    }

    return false;
  }

  private assessReasoningQuality(
    reasoning: TriageReasoning,
    context: ClinicalContext
  ): ReasoningQuality {
    let totalScore = 0;
    const metrics = {
      completeness: 0,
      consistency: 0,
      clinicalRelevance: 0,
      logicalFlow: 0,
      uncertaintyAwareness: 0,
    };

    // Assess completeness (are all important steps present?)
    const expectedSteps = [
      "life_threat_assessment",
      "symptom_severity",
      "differential_diagnosis",
      "clinical_guidelines",
    ];
    const presentSteps = reasoning.steps.map((s) => s.type);
    metrics.completeness =
      expectedSteps.filter((step) => presentSteps.includes(step)).length /
      expectedSteps.length;

    // Assess consistency (do conclusions align with evidence?)
    metrics.consistency = this.assessReasoningConsistency(reasoning);

    // Assess clinical relevance (are the reasoning steps medically sound?)
    metrics.clinicalRelevance = this.assessClinicalRelevance(
      reasoning,
      context
    );

    // Assess logical flow (does reasoning build logically?)
    metrics.logicalFlow = this.assessLogicalFlow(reasoning);

    // Assess uncertainty awareness (does reasoning acknowledge uncertainties?)
    metrics.uncertaintyAwareness = reasoning.uncertaintyFactors
      ? Math.min(1.0, reasoning.uncertaintyFactors.length * 0.2)
      : 0;

    // Calculate overall score
    totalScore =
      Object.values(metrics).reduce((sum, score) => sum + score, 0) /
      Object.keys(metrics).length;

    return {
      timestamp: new Date(),
      reasoning: reasoning.id,
      overallScore: totalScore,
      metrics,
      improvement_suggestions: this.generateImprovementSuggestions(metrics),
    };
  }

  private async identifyKnowledgeGaps(
    reasoning: TriageReasoning,
    context: ClinicalContext
  ): Promise<void> {
    const gapsFromReasoning = reasoning.knowledgeGapsIdentified || [];

    for (const gapType of gapsFromReasoning) {
      const existingGap = this.knowledgeGaps.find(
        (gap) =>
          gap.type === gapType &&
          gap.patientProfile ===
            context.patients[0]?.currentCondition.chiefComplaint
      );

      if (existingGap) {
        existingGap.frequency++;
        existingGap.lastSeen = new Date();
      } else {
        this.knowledgeGaps.push({
          id: `gap-${Date.now()}-${Math.random()}`,
          type: gapType,
          patientProfile:
            context.patients[0]?.currentCondition.chiefComplaint || "unknown",
          severity: this.assessGapSeverity(gapType, reasoning.confidence),
          frequency: 1,
          firstSeen: new Date(),
          lastSeen: new Date(),
          addressed: false,
        });
      }
    }

    // Keep knowledge gaps list manageable
    if (this.knowledgeGaps.length > 50) {
      this.knowledgeGaps.sort((a, b) => b.frequency - a.frequency);
      this.knowledgeGaps = this.knowledgeGaps.slice(0, 25);
    }
  }

  private async learnFromExpertFeedback(
    reasoning: TriageReasoning,
    experience: Experience
  ): Promise<void> {
    const relatedResponses = this.expertResponses.filter(
      (response) =>
        response.timestamp.getTime() > reasoning.timestamp.getTime() - 300000 // 5 minutes
    );

    for (const response of relatedResponses) {
      // Update clinical knowledge based on expert feedback
      await this.incorporateExpertKnowledge(response, experience);

      // Adjust confidence calibration
      this.calibrateConfidence(response, reasoning);

      // Update knowledge gap status
      this.updateKnowledgeGapFromExpert(response);
    }
  }

  private async simulateExpertResponse(
    consultation: EnhancedExpertConsultation
  ): Promise<void> {
    // Simulate expert response (in real system, this would be human input)
    const response: ExpertResponse = {
      requestId: consultation.id,
      recommendation:
        consultation.reasoning.steps[0]?.type === "life_threat_assessment"
          ? (consultation.state.data.recommendedAction as Action) ||
            consultation.action
          : consultation.action,
      confidence: Math.random() * 0.3 + 0.7, // Expert confidence 70-100%
      explanation: this.generateExpertExplanation(consultation),
      learningFeedback: this.generateLearningFeedback(consultation),
      timestamp: new Date(),
    };

    this.expertResponses.push(response);

    this.log("info", "Received expert response", {
      consultationId: consultation.id,
      expertConfidence: response.confidence,
      feedbackLength: response.learningFeedback.length,
    });
  }

  // Utility methods

  private calculateReasoningUncertainty(
    reasoning: TriageReasoning
  ): UncertaintyMetrics {
    const avgConfidence =
      reasoning.steps.reduce((sum, step) => sum + step.confidence, 0) /
      reasoning.steps.length;
    const uncertaintyFactorCount = reasoning.uncertaintyFactors?.length || 0;
    const knowledgeGapCount = reasoning.knowledgeGapsIdentified?.length || 0;

    const epistemic = 1 - avgConfidence;
    const aleatoric = (uncertaintyFactorCount + knowledgeGapCount) * 0.1;
    const total = Math.sqrt(epistemic * epistemic + aleatoric * aleatoric);
    const informationGain = 4 * avgConfidence * (1 - avgConfidence);

    return {
      epistemic,
      aleatoric,
      total,
      confidence: avgConfidence,
      informationGain,
    };
  }

  private createQueryContext(state: State, reasoning: TriageReasoning): any {
    return {
      queueLength: (state.data.queueLength as number) || 0,
      systemLoad: (state.data.systemLoad as number) || 0.5,
      timeOfDay: state.timestamp.getHours(),
      recentPerformance: 0, // Would be calculated from recent experiences
      domainComplexity:
        reasoning.knowledgeGapsIdentified &&
        reasoning.knowledgeGapsIdentified.length > 2
          ? "expert"
          : "moderate",
    };
  }

  private generateSpecificQuestion(
    reasoning: TriageReasoning,
    uncertainty: UncertaintyMetrics
  ): string {
    if (uncertainty.epistemic > 0.7) {
      return "I'm uncertain about my clinical assessment. Could you review my reasoning and provide guidance?";
    }
    if (
      reasoning.knowledgeGapsIdentified &&
      reasoning.knowledgeGapsIdentified.length > 0
    ) {
      return `I've identified potential knowledge gaps in: ${reasoning.knowledgeGapsIdentified.join(
        ", "
      )}. What should I focus on?`;
    }
    return "Could you validate my triage decision and provide feedback on my reasoning process?";
  }

  private analyzeUncertaintyBreakdown(reasoning: TriageReasoning): any {
    return {
      stepUncertainties: reasoning.steps.map((step) => ({
        type: step.type,
        confidence: step.confidence,
        uncertaintyFactors:
          (step as EnhancedReasoningStep).uncertaintyFactors || [],
      })),
      overallConfidence: reasoning.confidence,
      majorUncertaintyFactors: reasoning.uncertaintyFactors || [],
    };
  }

  private identifyFocusAreas(reasoning: TriageReasoning): string[] {
    const focusAreas = [];

    if (reasoning.confidence < 0.5) focusAreas.push("overall_confidence");
    if (
      reasoning.knowledgeGapsIdentified &&
      reasoning.knowledgeGapsIdentified.length > 0
    ) {
      focusAreas.push(...reasoning.knowledgeGapsIdentified);
    }

    const lowConfidenceSteps = reasoning.steps.filter(
      (step) => step.confidence < 0.6
    );
    focusAreas.push(...lowConfidenceSteps.map((step) => step.type));

    return [...new Set(focusAreas)];
  }

  // Helper methods for knowledge gap detection

  private isUnfamiliarComplaint(complaint: string): boolean {
    const familiarComplaints = [
      "chest pain",
      "shortness of breath",
      "abdominal pain",
      "headache",
      "fever",
    ];
    return !familiarComplaints.some((familiar) => complaint.includes(familiar));
  }

  private isComplexSymptomCombination(patient: PatientProfile): boolean {
    return (
      patient.medicalHistory.conditions.length > 3 ||
      (patient.currentCondition.painLevel &&
        patient.currentCondition.painLevel > 7 &&
        patient.demographics.age > 75)
    );
  }

  private hasInsufficientDifferentialKnowledge(
    complaint: string,
    age: number
  ): boolean {
    // Simplified logic - in practice, this would be more sophisticated
    return (
      age > 80 || complaint.includes("rare") || complaint.includes("unusual")
    );
  }

  private hasRareConditionIndicators(patient: PatientProfile): boolean {
    return (
      patient.currentCondition.chiefComplaint.includes("rare") ||
      patient.medicalHistory.conditions.some((c) => c.name.includes("syndrome"))
    );
  }

  private hasResourceAllocationUncertainty(
    patient: PatientProfile,
    context: ClinicalContext
  ): boolean {
    return (
      context.queueLength > 15 &&
      patient.currentCondition.acuity === AcuityLevel.MEDIUM
    );
  }

  private hasGuidelineApplicationUncertainty(patient: PatientProfile): boolean {
    return patient.demographics.age < 18 || patient.demographics.age > 85;
  }

  private findSimilarCases(patient: PatientProfile): TriageReasoning[] {
    return this.reasoningHistory
      .filter(
        (reasoning) =>
          reasoning.context.patients[0]?.currentCondition.chiefComplaint ===
          patient.currentCondition.chiefComplaint
      )
      .slice(-5); // Last 5 similar cases
  }

  // Assessment methods

  private assessReasoningConsistency(reasoning: TriageReasoning): number {
    // Check if high urgency steps lead to high priority decision
    const highUrgencySteps = reasoning.steps.filter(
      (step) =>
        step.conclusion.includes("urgent") ||
        step.conclusion.includes("immediate")
    ).length;

    const priorityUrgency = reasoning.selectedPriority <= 2 ? 1 : 0;
    return highUrgencySteps > 0 ? priorityUrgency : 0.8;
  }

  private assessClinicalRelevance(
    reasoning: TriageReasoning,
    context: ClinicalContext
  ): number {
    // Simplified assessment - would be more sophisticated in practice
    const relevantSteps = reasoning.steps.filter(
      (step) => step.confidence > 0.5 && step.reasoning.length > 20
    ).length;

    return Math.min(1.0, relevantSteps / reasoning.steps.length);
  }

  private assessLogicalFlow(reasoning: TriageReasoning): number {
    // Check if reasoning builds logically (life threats → severity → diagnosis → guidelines)
    const expectedOrder = [
      "life_threat_assessment",
      "symptom_severity",
      "differential_diagnosis",
      "clinical_guidelines",
    ];
    const actualOrder = reasoning.steps.map((s) => s.type);

    let orderScore = 0;
    for (
      let i = 0;
      i < Math.min(expectedOrder.length, actualOrder.length);
      i++
    ) {
      if (expectedOrder[i] === actualOrder[i]) orderScore++;
    }

    return orderScore / expectedOrder.length;
  }

  private generateImprovementSuggestions(metrics: any): string[] {
    const suggestions = [];

    if (metrics.completeness < 0.8)
      suggestions.push("Include all critical assessment steps");
    if (metrics.consistency < 0.7)
      suggestions.push("Ensure conclusions align with evidence");
    if (metrics.clinicalRelevance < 0.6)
      suggestions.push("Focus on clinically relevant factors");
    if (metrics.logicalFlow < 0.7)
      suggestions.push("Follow logical reasoning sequence");
    if (metrics.uncertaintyAwareness < 0.3)
      suggestions.push("Acknowledge uncertainties and limitations");

    return suggestions;
  }

  private assessGapSeverity(
    gapType: string,
    confidence: number
  ): "low" | "medium" | "high" | "critical" {
    if (confidence < 0.3) return "critical";
    if (confidence < 0.5) return "high";
    if (confidence < 0.7) return "medium";
    return "low";
  }

  // Learning and adaptation methods

  private async incorporateExpertKnowledge(
    response: ExpertResponse,
    experience: Experience
  ): Promise<void> {
    // Update clinical knowledge patterns based on expert feedback
    const feedback = response.learningFeedback;

    // Simplified learning - in practice, this would be more sophisticated
    if (response.confidence > 0.8 && experience.reward.value > 0) {
      this.adaptiveLearningRate = Math.min(
        0.3,
        this.adaptiveLearningRate + 0.01
      );
    }
  }

  private calibrateConfidence(
    response: ExpertResponse,
    reasoning: TriageReasoning
  ): void {
    // Adjust confidence calibration based on expert agreement
    const agreement = this.calculateExpertAgreement(response, reasoning);

    if (agreement > 0.8) {
      this.confidenceThreshold = Math.max(0.5, this.confidenceThreshold - 0.01);
    } else if (agreement < 0.4) {
      this.confidenceThreshold = Math.min(0.9, this.confidenceThreshold + 0.02);
    }
  }

  private updateKnowledgeGapFromExpert(response: ExpertResponse): void {
    // Mark knowledge gaps as addressed if expert provided relevant feedback
    const relevantGaps = this.knowledgeGaps.filter((gap) =>
      response.learningFeedback.toLowerCase().includes(gap.type.toLowerCase())
    );

    relevantGaps.forEach((gap) => {
      gap.addressed = true;
      gap.lastSeen = response.timestamp;
    });
  }

  private adaptLearningParameters(experience: Experience): void {
    // Adapt learning parameters based on recent performance
    const recentReward = experience.reward.value;

    if (recentReward > 5) {
      // Good performance - can be more selective about consultations
      this.consultationThreshold = Math.max(
        0.4,
        this.consultationThreshold - 0.01
      );
    } else if (recentReward < -5) {
      // Poor performance - should consult more often
      this.consultationThreshold = Math.min(
        0.8,
        this.consultationThreshold + 0.02
      );
    }
  }

  // Metrics and analysis methods

  private calculateExpertAgreement(
    response: ExpertResponse,
    reasoning: TriageReasoning
  ): number {
    // Simplified agreement calculation
    return Math.random() * 0.6 + 0.2; // 20-80% agreement
  }

  private calculateReasoningQualityTrend(): number {
    if (this.reasoningQualityHistory.length < 10) return 0;

    const recent = this.reasoningQualityHistory.slice(-5);
    const older = this.reasoningQualityHistory.slice(-10, -5);

    const recentAvg =
      recent.reduce((sum, q) => sum + q.overallScore, 0) / recent.length;
    const olderAvg =
      older.reduce((sum, q) => sum + q.overallScore, 0) / older.length;

    return recentAvg - olderAvg;
  }

  private calculateExpertAgreementRate(): number {
    if (this.expertResponses.length === 0) return 0;

    const agreements = this.expertResponses.filter(
      (response) => response.confidence > 0.7 // Assume agreement if expert is confident
    ).length;

    return agreements / this.expertResponses.length;
  }

  private calculateLearningVelocity(): number {
    return this.adaptiveLearningRate;
  }

  private calculateKnowledgeGrowth(): number {
    return this.clinicalKnowledge
      ? Object.keys(this.clinicalKnowledge.patterns).length
      : 0;
  }

  private calculateUncertaintyReduction(): number {
    if (this.reasoningQualityHistory.length < 10) return 0;

    const recent = this.reasoningQualityHistory.slice(-5);
    const older = this.reasoningQualityHistory.slice(-10, -5);

    const recentUncertainty =
      1 - recent.reduce((sum, q) => sum + q.overallScore, 0) / recent.length;
    const olderUncertainty =
      1 - older.reduce((sum, q) => sum + q.overallScore, 0) / older.length;

    return olderUncertainty - recentUncertainty; // Positive = uncertainty reduced
  }

  private getTopKnowledgeGaps(count: number): KnowledgeGap[] {
    return this.knowledgeGaps
      .filter((gap) => !gap.addressed)
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, count);
  }

  private getReasoningQualityDistribution(): any {
    if (this.reasoningQualityHistory.length === 0) return {};

    const ranges = { excellent: 0, good: 0, fair: 0, poor: 0 };

    this.reasoningQualityHistory.forEach((quality) => {
      if (quality.overallScore >= 0.8) ranges.excellent++;
      else if (quality.overallScore >= 0.6) ranges.good++;
      else if (quality.overallScore >= 0.4) ranges.fair++;
      else ranges.poor++;
    });

    return ranges;
  }

  private getRecentExpertResponses(hours: number = 1): ExpertResponse[] {
    const cutoff = Date.now() - hours * 60 * 60 * 1000;
    return this.expertResponses.filter(
      (response) => response.timestamp.getTime() > cutoff
    );
  }

  private generateExpertExplanation(
    consultation: EnhancedExpertConsultation
  ): string {
    return `Expert assessment for ${consultation.specificQuestion}. Based on clinical presentation and uncertainty factors.`;
  }

  private generateLearningFeedback(
    consultation: EnhancedExpertConsultation
  ): string {
    const gaps = consultation.reasoning.knowledgeGapsIdentified || [];
    return `Focus areas for improvement: ${gaps.join(
      ", "
    )}. Continue developing clinical reasoning skills.`;
  }

  private calculateKnowledgeGapPenalty(patient: PatientProfile): number {
    const relevantGaps = this.knowledgeGaps.filter(
      (gap) => gap.patientProfile === patient.currentCondition.chiefComplaint
    );

    return Math.min(0.5, relevantGaps.length * 0.1);
  }

  private calculateReasoningQualityBonus(): number {
    if (this.reasoningQualityHistory.length === 0) return 0;

    const recentQuality =
      this.reasoningQualityHistory[this.reasoningQualityHistory.length - 1];
    return Math.max(0, (recentQuality.overallScore - 0.7) * 0.5); // Bonus for high quality
  }

  private async updateKnowledgeGapLearning(
    experience: Experience
  ): Promise<void> {
    // Update knowledge gap understanding based on outcomes
    const reward = experience.reward.value;

    if (reward > 0) {
      // Good outcome - recent reasoning was likely appropriate
      this.knowledgeGaps.forEach((gap) => {
        if (!gap.addressed && gap.lastSeen.getTime() > Date.now() - 300000) {
          // 5 minutes
          gap.frequency = Math.max(1, gap.frequency - 1); // Reduce frequency
        }
      });
    }
  }

  // Override base class methods

  public startEpisode(): void {
    super.startEpisode();
    this.consultationsUsedThisEpisode = 0;
    this.activeLearning.resetBudget();
  }

  // Base implementation methods (copied from original LLM agent)

  private initializeClinicalKnowledge(): ClinicalKnowledgeBase {
    return {
      patterns: {},
      guidelines: {},
      precedents: [],
      learningRate: this.adaptiveLearningRate,
    };
  }

  private extractClinicalContext(
    state: State,
    actions: Action[]
  ): ClinicalContext {
    const patients: PatientProfile[] = [];
    const patientIds = new Set(
      actions.map((a) => a.parameters.patientId as string)
    );

    for (const patientId of patientIds) {
      const mockPatient = this.createMockPatientFromAction(patientId, actions);
      if (mockPatient) patients.push(mockPatient);
    }

    return {
      patients,
      queueLength: (state.data.queueLength as number) || 0,
      availableResources: (state.data.availableResources as number) || 8,
      timeOfDay: state.timestamp.getHours(),
      urgencyLevels: this.categorizePatientsByUrgency(patients),
    };
  }

  private createMockPatientFromAction(
    patientId: string,
    actions: Action[]
  ): PatientProfile | null {
    return null; // Would normally extract from state
  }

  private categorizePatientsByUrgency(patients: PatientProfile[]): {
    [key: string]: number;
  } {
    return patients.reduce((acc, p) => {
      const level = p.currentCondition.acuity.toString();
      acc[level] = (acc[level] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });
  }

  private generateDifferentialDiagnosis(
    complaint: string,
    age: number,
    conditions: any[]
  ): any[] {
    if (complaint.includes("chest pain")) {
      return [
        { condition: "Acute MI", urgency: "high" },
        { condition: "Angina", urgency: "medium" },
        { condition: "Musculoskeletal", urgency: "low" },
      ];
    }
    return [{ condition: "General symptoms", urgency: "medium" }];
  }

  private selectActionFromReasoning(
    reasoning: TriageReasoning,
    actions: Action[]
  ): Action {
    const targetAction = actions.find(
      (a) => a.parameters.priority === reasoning.selectedPriority
    );

    return targetAction || actions[0];
  }

  private storeReasoning(
    reasoning: TriageReasoning,
    action: Action,
    context: ClinicalContext
  ): void {
    this.reasoningHistory.push(reasoning);

    if (this.reasoningHistory.length > 100) {
      this.reasoningHistory = this.reasoningHistory.slice(-50);
    }
  }

  private findReasoningForAction(action: Action): TriageReasoning | null {
    return this.reasoningHistory[this.reasoningHistory.length - 1] || null;
  }

  private updateReasoningFromOutcome(
    reasoning: TriageReasoning,
    experience: Experience
  ): void {
    const reward = experience.reward.value;
    if (reward > 5) {
      reasoning.confidence = Math.min(0.95, reasoning.confidence + 0.05);
    } else if (reward < -5) {
      reasoning.confidence = Math.max(0.1, reasoning.confidence - 0.1);
    }
  }

  private updateClinicalKnowledge(
    experience: Experience,
    reasoning: TriageReasoning
  ): void {
    const patternKey = `${reasoning.context.patients[0]?.currentCondition.chiefComplaint}_${reasoning.selectedPriority}`;

    if (!this.clinicalKnowledge.patterns[patternKey]) {
      this.clinicalKnowledge.patterns[patternKey] = { success: 0, total: 0 };
    }

    this.clinicalKnowledge.patterns[patternKey].total++;
    if (experience.reward.value > 0) {
      this.clinicalKnowledge.patterns[patternKey].success++;
    }
  }

  private calculateConfidenceFactors(
    patient: PatientProfile,
    action: Action
  ): any {
    return {
      clinicalCertainty: 0.8,
      knowledgeMatch: 0.7,
      contextClarity: 0.9,
      precedentMatch: 0.6,
    };
  }
}

// Supporting interfaces and types

interface LLMContext {
  type: string;
  content: string;
  timestamp: Date;
}

interface TriageReasoning {
  id: string;
  timestamp: Date;
  context: ClinicalContext;
  steps: ReasoningStep[];
  confidence: number;
  selectedPriority: TriagePriority;
  explanation: string;
  expertConsulted?: boolean;
  knowledgeGapsIdentified?: string[];
  uncertaintyFactors?: string[];
}

interface ReasoningStep {
  type: string;
  input: string;
  reasoning: string;
  conclusion: string;
  confidence: number;
}

interface EnhancedReasoningStep extends ReasoningStep {
  uncertaintyFactors?: string[];
  knowledgeGapsDetected?: string[];
}

interface ClinicalContext {
  patients: PatientProfile[];
  queueLength: number;
  availableResources: number;
  timeOfDay: number;
  urgencyLevels: { [key: string]: number };
}

interface ClinicalKnowledgeBase {
  patterns: { [key: string]: { success: number; total: number } };
  guidelines: { [key: string]: any };
  precedents: any[];
  learningRate: number;
}

interface KnowledgeGap {
  id: string;
  type: string;
  patientProfile: string;
  severity: "low" | "medium" | "high" | "critical";
  frequency: number;
  firstSeen: Date;
  lastSeen: Date;
  addressed: boolean;
}

interface ReasoningQuality {
  timestamp: Date;
  reasoning: string;
  overallScore: number;
  metrics: {
    completeness: number;
    consistency: number;
    clinicalRelevance: number;
    logicalFlow: number;
    uncertaintyAwareness: number;
  };
  improvement_suggestions: string[];
}

interface EnhancedExpertConsultation extends ExpertConsultationRequest {
  reasoning: TriageReasoning;
  specificQuestion: string;
  clinicalContext: ClinicalContext;
  uncertaintyBreakdown: any;
  suggestedFocusAreas: string[];
}

interface EnhancedDecision {
  priority: TriagePriority;
  confidence: number;
  explanation: string;
  knowledgeGaps: string[];
  uncertaintyFactors: string[];
}

interface ActiveLLMInsights {
  expertConsultations: number;
  consultationsThisEpisode: number;
  knowledgeGaps: KnowledgeGap[];
  reasoningQualityTrend: number;
  expertAgreementRate: number;
  learningVelocity: number;
  knowledgeGrowth: number;
  uncertaintyReduction: number;
  topKnowledgeGaps: KnowledgeGap[];
  reasoningQualityDistribution: any;
}
