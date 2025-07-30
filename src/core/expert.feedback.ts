import {
  State,
  Action,
  Experience,
  Agent,
  PatientProfile,
  TriagePriority,
} from "@/types/core.types";
import {
  ExpertConsultationRequest,
  ExpertResponse,
  UncertaintyMetrics,
} from "@/core/active.learning";

/**
 * Expert Feedback Integration System
 * Manages human-in-the-loop learning for active reinforcement learning
 * - Expert consultation management
 * - Feedback quality assessment
 * - Knowledge transfer optimization
 * - Learning acceleration through expert guidance
 */

export interface ExpertProfile {
  id: string;
  name: string;
  specialties: MedicalSpecialty[];
  experience_years: number;
  confidence_level: number;
  availability_schedule: AvailabilityWindow[];
  feedback_quality_score: number;
  response_time_avg: number; // in minutes
  agreement_rate_with_outcomes: number;
}

export enum MedicalSpecialty {
  EMERGENCY_MEDICINE = "emergency_medicine",
  INTERNAL_MEDICINE = "internal_medicine",
  CARDIOLOGY = "cardiology",
  PULMONOLOGY = "pulmonology",
  NEUROLOGY = "neurology",
  PEDIATRICS = "pediatrics",
  GERIATRICS = "geriatrics",
  TRAUMA = "trauma",
  CRITICAL_CARE = "critical_care",
}

export interface AvailabilityWindow {
  day_of_week: number; // 0-6, Sunday = 0
  start_hour: number; // 0-23
  end_hour: number; // 0-23
  timezone: string;
}

export interface EnhancedExpertResponse extends ExpertResponse {
  expert_profile: ExpertProfile;
  response_quality: FeedbackQuality;
  learning_impact: LearningImpact;
  follow_up_needed: boolean;
  alternative_approaches: AlternativeApproach[];
}

export interface FeedbackQuality {
  completeness: number; // 0-1, how complete is the feedback
  specificity: number; // 0-1, how specific/detailed
  actionability: number; // 0-1, how actionable for learning
  clinical_relevance: number; // 0-1, clinical relevance
  overall_score: number; // 0-1, weighted combination
}

export interface LearningImpact {
  knowledge_transfer: number; // How much new knowledge was gained
  confidence_improvement: number; // How much confidence improved
  error_correction: number; // How many errors were corrected
  skill_development: number; // Skill development contribution
  long_term_benefit: number; // Expected long-term learning benefit
}

export interface AlternativeApproach {
  approach: string;
  rationale: string;
  confidence: number;
  when_to_use: string;
}

export interface ExpertConsultationSession {
  session_id: string;
  consultation_request: ExpertConsultationRequest;
  expert_assigned: ExpertProfile;
  start_time: Date;
  end_time?: Date;
  interactions: ExpertInteraction[];
  final_response: EnhancedExpertResponse;
  session_rating: number;
  learning_outcomes: LearningOutcome[];
}

export interface ExpertInteraction {
  timestamp: Date;
  type: InteractionType;
  from: "agent" | "expert";
  content: string;
  attachments?: InteractionAttachment[];
}

export enum InteractionType {
  QUESTION = "question",
  ANSWER = "answer",
  CLARIFICATION = "clarification",
  FOLLOW_UP = "follow_up",
  FEEDBACK = "feedback",
  RECOMMENDATION = "recommendation",
}

export interface InteractionAttachment {
  type:
    | "patient_data"
    | "reasoning_trace"
    | "clinical_guideline"
    | "literature_reference";
  content: any;
  relevance_score: number;
}

export interface LearningOutcome {
  category: LearningCategory;
  description: string;
  confidence_change: number;
  skill_improvement: number;
  knowledge_gained: string[];
  application_context: string;
}

export enum LearningCategory {
  CLINICAL_REASONING = "clinical_reasoning",
  DIAGNOSTIC_SKILLS = "diagnostic_skills",
  TREATMENT_PLANNING = "treatment_planning",
  RISK_ASSESSMENT = "risk_assessment",
  COMMUNICATION = "communication",
  RESOURCE_MANAGEMENT = "resource_management",
}

export interface ExpertFeedbackMetrics {
  total_consultations: number;
  avg_response_time: number;
  feedback_quality_trend: number;
  learning_velocity_improvement: number;
  expert_agent_agreement: number;
  consultation_success_rate: number;
  knowledge_retention_rate: number;
  cost_effectiveness: number;
}

export class ExpertFeedbackSystem {
  private experts: Map<string, ExpertProfile> = new Map();
  private consultationQueue: ExpertConsultationRequest[] = [];
  private activeSessions: Map<string, ExpertConsultationSession> = new Map();
  private sessionHistory: ExpertConsultationSession[] = [];
  private feedbackMetrics: ExpertFeedbackMetrics;

  // Configuration
  private maxConcurrentSessions: number = 3;
  private expertSelectionStrategy: ExpertSelectionStrategy =
    ExpertSelectionStrategy.BEST_MATCH;
  private feedbackIntegrationMode: FeedbackIntegrationMode =
    FeedbackIntegrationMode.IMMEDIATE;
  private qualityThreshold: number = 0.7;

  constructor(config: ExpertFeedbackConfig = {}) {
    this.maxConcurrentSessions = config.maxConcurrentSessions || 3;
    this.expertSelectionStrategy =
      config.expertSelectionStrategy || ExpertSelectionStrategy.BEST_MATCH;
    this.feedbackIntegrationMode =
      config.feedbackIntegrationMode || FeedbackIntegrationMode.IMMEDIATE;
    this.qualityThreshold = config.qualityThreshold || 0.7;

    this.feedbackMetrics = this.initializeMetrics();
    this.initializeDefaultExperts();
  }

  /**
   * Submit a consultation request to the expert system
   */
  public async submitConsultation(
    request: ExpertConsultationRequest,
    agent: Agent,
    priority: ConsultationPriority = ConsultationPriority.NORMAL
  ): Promise<string> {
    // Enhance request with agent context
    const enhancedRequest = await this.enhanceConsultationRequest(
      request,
      agent
    );

    // Add to queue with priority
    enhancedRequest.priority = priority;
    enhancedRequest.submitted_time = new Date();

    this.consultationQueue.push(enhancedRequest);
    this.sortConsultationQueue();

    console.log(
      `🩺 Expert consultation submitted: ${request.id} (Priority: ${priority})`
    );

    // Try to process immediately if capacity allows
    await this.processConsultationQueue();

    return request.id;
  }

  /**
   * Process pending consultations and assign to available experts
   */
  public async processConsultationQueue(): Promise<void> {
    while (
      this.consultationQueue.length > 0 &&
      this.activeSessions.size < this.maxConcurrentSessions
    ) {
      const request = this.consultationQueue.shift()!;
      await this.initiateConsultationSession(request);
    }
  }

  /**
   * Get expert response for a consultation
   */
  public async getExpertResponse(
    consultationId: string
  ): Promise<EnhancedExpertResponse | null> {
    const session =
      this.activeSessions.get(consultationId) ||
      this.sessionHistory.find(
        (s) => s.consultation_request.id === consultationId
      );

    if (!session || !session.final_response) {
      return null;
    }

    return session.final_response;
  }

  /**
   * Integrate expert feedback into agent learning
   */
  public async integrateFeedback(
    agent: Agent,
    response: EnhancedExpertResponse,
    experience?: Experience
  ): Promise<LearningImpact> {
    const impact = await this.calculateLearningImpact(
      response,
      agent,
      experience
    );

    // Apply feedback based on integration mode
    switch (this.feedbackIntegrationMode) {
      case FeedbackIntegrationMode.IMMEDIATE:
        await this.applyImmediateFeedback(agent, response, impact);
        break;

      case FeedbackIntegrationMode.BATCH:
        await this.scheduleBatchFeedback(agent, response, impact);
        break;

      case FeedbackIntegrationMode.ADAPTIVE:
        await this.applyAdaptiveFeedback(agent, response, impact);
        break;
    }

    // Update metrics
    this.updateFeedbackMetrics(response, impact);

    console.log(
      `🎓 Integrated expert feedback: Impact score ${impact.long_term_benefit.toFixed(
        2
      )}`
    );

    return impact;
  }

  /**
   * Register a new expert in the system
   */
  public registerExpert(expert: ExpertProfile): void {
    this.experts.set(expert.id, expert);
    console.log(
      `👨‍⚕️ Registered expert: ${expert.name} (${expert.specialties.join(", ")})`
    );
  }

  /**
   * Get system metrics and insights
   */
  public getSystemMetrics(): ExpertFeedbackSystemMetrics {
    return {
      metrics: this.feedbackMetrics,
      activeConsultations: this.activeSessions.size,
      queuedConsultations: this.consultationQueue.length,
      availableExperts: this.getAvailableExperts().length,
      expertUtilization: this.calculateExpertUtilization(),
      avgSessionDuration: this.calculateAverageSessionDuration(),
      learningAcceleration: this.calculateLearningAcceleration(),
      qualityDistribution: this.getQualityDistribution(),
      topLearningOutcomes: this.getTopLearningOutcomes(5),
    };
  }

  // Private Methods

  private async enhanceConsultationRequest(
    request: ExpertConsultationRequest,
    agent: Agent
  ): Promise<EnhancedConsultationRequest> {
    return {
      ...request,
      agent_context: {
        agent_type: agent.type,
        experience_level: agent.getStats().episodeCount,
        recent_performance: this.getAgentRecentPerformance(agent),
        learning_objectives: await this.identifyLearningObjectives(
          request,
          agent
        ),
      },
      consultation_context: {
        urgency_level: this.assessUrgencyLevel(request),
        complexity_score: this.assessComplexityScore(request),
        learning_potential: this.assessLearningPotential(request, agent),
        required_specialties: this.identifyRequiredSpecialties(request),
      },
      priority: ConsultationPriority.NORMAL,
      submitted_time: new Date(),
    };
  }

  private async initiateConsultationSession(
    request: EnhancedConsultationRequest
  ): Promise<void> {
    // Select best expert for this consultation
    const selectedExpert = await this.selectExpert(request);

    if (!selectedExpert) {
      console.warn(`⚠️ No available expert for consultation ${request.id}`);
      return;
    }

    // Create consultation session
    const session: ExpertConsultationSession = {
      session_id: `session-${Date.now()}`,
      consultation_request: request,
      expert_assigned: selectedExpert,
      start_time: new Date(),
      interactions: [],
      final_response: await this.generateExpertResponse(
        request,
        selectedExpert
      ),
      session_rating: 0,
      learning_outcomes: [],
    };

    this.activeSessions.set(request.id, session);

    // Simulate consultation process
    await this.simulateConsultationProcess(session);

    console.log(
      `💬 Started consultation session: ${session.session_id} with ${selectedExpert.name}`
    );
  }

  private async selectExpert(
    request: EnhancedConsultationRequest
  ): Promise<ExpertProfile | null> {
    const availableExperts = this.getAvailableExperts();

    if (availableExperts.length === 0) {
      return null;
    }

    switch (this.expertSelectionStrategy) {
      case ExpertSelectionStrategy.BEST_MATCH:
        return this.selectBestMatchExpert(request, availableExperts);

      case ExpertSelectionStrategy.HIGHEST_QUALITY:
        return this.selectHighestQualityExpert(availableExperts);

      case ExpertSelectionStrategy.FASTEST_RESPONSE:
        return this.selectFastestResponseExpert(availableExperts);

      case ExpertSelectionStrategy.LOAD_BALANCED:
        return this.selectLoadBalancedExpert(availableExperts);

      default:
        return availableExperts[0];
    }
  }

  private selectBestMatchExpert(
    request: EnhancedConsultationRequest,
    experts: ExpertProfile[]
  ): ExpertProfile {
    const scoredExperts = experts.map((expert) => ({
      expert,
      score: this.calculateExpertMatchScore(expert, request),
    }));

    scoredExperts.sort((a, b) => b.score - a.score);
    return scoredExperts[0].expert;
  }

  private calculateExpertMatchScore(
    expert: ExpertProfile,
    request: EnhancedConsultationRequest
  ): number {
    let score = 0;

    // Specialty match
    const requiredSpecialties =
      request.consultation_context.required_specialties;
    const specialtyMatch = expert.specialties.some((s) =>
      requiredSpecialties.includes(s)
    );
    if (specialtyMatch) score += 0.4;

    // Experience weight
    score += Math.min(0.3, expert.experience_years / 30); // Max 30 years experience

    // Quality score
    score += expert.feedback_quality_score * 0.2;

    // Confidence level
    score += expert.confidence_level * 0.1;

    return score;
  }

  private async generateExpertResponse(
    request: EnhancedConsultationRequest,
    expert: ExpertProfile
  ): Promise<EnhancedExpertResponse> {
    // Simulate expert thinking and response generation
    const baseResponse = await this.simulateExpertReasoning(request, expert);

    // Assess response quality
    const quality = this.assessResponseQuality(baseResponse, request);

    // Calculate learning impact
    const impact = await this.calculateInitialLearningImpact(
      baseResponse,
      request
    );

    // Generate alternative approaches
    const alternatives = this.generateAlternativeApproaches(request, expert);

    return {
      ...baseResponse,
      expert_profile: expert,
      response_quality: quality,
      learning_impact: impact,
      follow_up_needed: quality.overall_score < this.qualityThreshold,
      alternative_approaches: alternatives,
    };
  }

  private async simulateExpertReasoning(
    request: EnhancedConsultationRequest,
    expert: ExpertProfile
  ): Promise<ExpertResponse> {
    // Simulate expert response based on their profile and the request
    const confidence = this.calculateExpertConfidence(expert, request);

    const explanation = this.generateExpertExplanation(request, expert);
    const learningFeedback = this.generateLearningFeedback(request, expert);

    return {
      requestId: request.id,
      recommendation: request.action, // Simplified - expert might modify
      confidence,
      explanation,
      learningFeedback,
      timestamp: new Date(),
    };
  }

  private calculateExpertConfidence(
    expert: ExpertProfile,
    request: EnhancedConsultationRequest
  ): number {
    // Base confidence from expert profile
    let confidence = expert.confidence_level;

    // Adjust based on specialty match
    const requiredSpecialties =
      request.consultation_context.required_specialties;
    const hasSpecialtyMatch = expert.specialties.some((s) =>
      requiredSpecialties.includes(s)
    );

    if (hasSpecialtyMatch) {
      confidence += 0.1;
    } else {
      confidence -= 0.2;
    }

    // Adjust based on case complexity
    const complexityPenalty =
      request.consultation_context.complexity_score * 0.1;
    confidence -= complexityPenalty;

    return Math.min(0.95, Math.max(0.3, confidence));
  }

  private generateExpertExplanation(
    request: EnhancedConsultationRequest,
    expert: ExpertProfile
  ): string {
    const specialtyContext = expert.specialties.includes(
      MedicalSpecialty.EMERGENCY_MEDICINE
    )
      ? "emergency medicine perspective"
      : "clinical perspective";

    return `From a ${specialtyContext}, based on ${expert.experience_years} years of experience: ${request.questionType} requires careful consideration. The uncertainty factors and clinical context suggest this approach.`;
  }

  private generateLearningFeedback(
    request: EnhancedConsultationRequest,
    expert: ExpertProfile
  ): string {
    const learningObjectives = request.agent_context.learning_objectives;

    return `Key learning points: Focus on ${learningObjectives.join(
      ", "
    )}. Continue developing clinical reasoning skills through systematic approach to similar cases.`;
  }

  private assessResponseQuality(
    response: ExpertResponse,
    request: EnhancedConsultationRequest
  ): FeedbackQuality {
    // Assess different quality dimensions
    const completeness = this.assessCompleteness(response, request);
    const specificity = this.assessSpecificity(response);
    const actionability = this.assessActionability(response);
    const clinicalRelevance = this.assessClinicalRelevance(response, request);

    const overall_score =
      completeness * 0.25 +
      specificity * 0.25 +
      actionability * 0.25 +
      clinicalRelevance * 0.25;

    return {
      completeness,
      specificity,
      actionability,
      clinical_relevance: clinicalRelevance,
      overall_score,
    };
  }

  private async calculateLearningImpact(
    response: EnhancedExpertResponse,
    agent: Agent,
    experience?: Experience
  ): Promise<LearningImpact> {
    // Assess different dimensions of learning impact
    const knowledgeTransfer = this.assessKnowledgeTransfer(response, agent);
    const confidenceImprovement = this.assessConfidenceImprovement(
      response,
      agent
    );
    const errorCorrection = this.assessErrorCorrection(response, experience);
    const skillDevelopment = this.assessSkillDevelopment(response, agent);

    const longTermBenefit =
      knowledgeTransfer * 0.3 +
      confidenceImprovement * 0.2 +
      errorCorrection * 0.3 +
      skillDevelopment * 0.2;

    return {
      knowledge_transfer: knowledgeTransfer,
      confidence_improvement: confidenceImprovement,
      error_correction: errorCorrection,
      skill_development: skillDevelopment,
      long_term_benefit: longTermBenefit,
    };
  }

  private async applyImmediateFeedback(
    agent: Agent,
    response: EnhancedExpertResponse,
    impact: LearningImpact
  ): Promise<void> {
    // Apply feedback immediately to agent's learning system
    // This would integrate with the agent's specific learning mechanisms

    console.log(
      `⚡ Applied immediate feedback with impact: ${impact.long_term_benefit.toFixed(
        2
      )}`
    );
  }

  private async simulateConsultationProcess(
    session: ExpertConsultationSession
  ): Promise<void> {
    // Simulate the back-and-forth consultation process

    // Initial question from agent
    session.interactions.push({
      timestamp: new Date(),
      type: InteractionType.QUESTION,
      from: "agent",
      content: session.consultation_request.questionType,
    });

    // Expert response
    session.interactions.push({
      timestamp: new Date(),
      type: InteractionType.ANSWER,
      from: "expert",
      content: session.final_response.explanation,
    });

    // Possible follow-up
    if (session.final_response.follow_up_needed) {
      session.interactions.push({
        timestamp: new Date(),
        type: InteractionType.FOLLOW_UP,
        from: "expert",
        content: "Would you like me to elaborate on any specific aspect?",
      });
    }

    // End session
    session.end_time = new Date();
    session.session_rating = this.calculateSessionRating(session);
    session.learning_outcomes = this.generateLearningOutcomes(session);

    // Move to history
    this.activeSessions.delete(session.consultation_request.id);
    this.sessionHistory.push(session);
  }

  // Utility and helper methods

  private sortConsultationQueue(): void {
    this.consultationQueue.sort((a, b) => {
      // Sort by priority first, then by urgency
      if (a.priority !== b.priority) {
        return b.priority - a.priority; // Higher priority first
      }
      return (
        b.consultation_context.urgency_level -
        a.consultation_context.urgency_level
      );
    });
  }

  private getAvailableExperts(): ExpertProfile[] {
    // Simplified - in real system would check actual availability
    return Array.from(this.experts.values()).filter(
      (expert) => expert.availability_schedule.length > 0
    );
  }

  private initializeDefaultExperts(): void {
    // Create some default expert profiles for demonstration
    const experts: ExpertProfile[] = [
      {
        id: "expert-em-1",
        name: "Dr. Sarah Chen",
        specialties: [
          MedicalSpecialty.EMERGENCY_MEDICINE,
          MedicalSpecialty.TRAUMA,
        ],
        experience_years: 15,
        confidence_level: 0.9,
        availability_schedule: [
          { day_of_week: 1, start_hour: 8, end_hour: 18, timezone: "UTC" },
          { day_of_week: 3, start_hour: 8, end_hour: 18, timezone: "UTC" },
        ],
        feedback_quality_score: 0.85,
        response_time_avg: 12,
        agreement_rate_with_outcomes: 0.82,
      },
      {
        id: "expert-cardio-1",
        name: "Dr. Michael Rodriguez",
        specialties: [
          MedicalSpecialty.CARDIOLOGY,
          MedicalSpecialty.INTERNAL_MEDICINE,
        ],
        experience_years: 22,
        confidence_level: 0.88,
        availability_schedule: [
          { day_of_week: 2, start_hour: 9, end_hour: 17, timezone: "UTC" },
          { day_of_week: 4, start_hour: 9, end_hour: 17, timezone: "UTC" },
        ],
        feedback_quality_score: 0.92,
        response_time_avg: 8,
        agreement_rate_with_outcomes: 0.89,
      },
    ];

    experts.forEach((expert) => this.registerExpert(expert));
  }

  private initializeMetrics(): ExpertFeedbackMetrics {
    return {
      total_consultations: 0,
      avg_response_time: 0,
      feedback_quality_trend: 0.7,
      learning_velocity_improvement: 0,
      expert_agent_agreement: 0.75,
      consultation_success_rate: 0.85,
      knowledge_retention_rate: 0.8,
      cost_effectiveness: 0.7,
    };
  }

  // Assessment methods (simplified implementations)

  private assessUrgencyLevel(request: ExpertConsultationRequest): number {
    return request.urgency; // 0-1 scale
  }

  private assessComplexityScore(request: ExpertConsultationRequest): number {
    return request.uncertainty.total; // Use uncertainty as proxy for complexity
  }

  private assessLearningPotential(
    request: ExpertConsultationRequest,
    agent: Agent
  ): number {
    return request.uncertainty.informationGain; // High uncertainty = high learning potential
  }

  private identifyRequiredSpecialties(
    request: ExpertConsultationRequest
  ): MedicalSpecialty[] {
    // Simplified specialty identification
    return [MedicalSpecialty.EMERGENCY_MEDICINE];
  }

  private async identifyLearningObjectives(
    request: ExpertConsultationRequest,
    agent: Agent
  ): Promise<string[]> {
    return ["clinical_reasoning", "uncertainty_management", "decision_making"];
  }

  private getAgentRecentPerformance(agent: Agent): number {
    // Simplified - would analyze recent episode performance
    return 0.7;
  }

  private assessCompleteness(
    response: ExpertResponse,
    request: ExpertConsultationRequest
  ): number {
    return response.explanation.length > 50 ? 0.8 : 0.4;
  }

  private assessSpecificity(response: ExpertResponse): number {
    return response.confidence > 0.7 ? 0.8 : 0.5;
  }

  private assessActionability(response: ExpertResponse): number {
    return response.learningFeedback.length > 20 ? 0.8 : 0.4;
  }

  private assessClinicalRelevance(
    response: ExpertResponse,
    request: ExpertConsultationRequest
  ): number {
    return 0.8; // Simplified
  }

  private async calculateInitialLearningImpact(
    response: ExpertResponse,
    request: EnhancedConsultationRequest
  ): Promise<LearningImpact> {
    return {
      knowledge_transfer: response.confidence * 0.8,
      confidence_improvement: 0.3,
      error_correction: 0.4,
      skill_development: 0.5,
      long_term_benefit: 0.6,
    };
  }

  private generateAlternativeApproaches(
    request: EnhancedConsultationRequest,
    expert: ExpertProfile
  ): AlternativeApproach[] {
    return [
      {
        approach: "Conservative management approach",
        rationale:
          "When uncertainty is high, conservative approach may be safer",
        confidence: 0.7,
        when_to_use: "High uncertainty cases with stable patient",
      },
    ];
  }

  private assessKnowledgeTransfer(
    response: EnhancedExpertResponse,
    agent: Agent
  ): number {
    return response.response_quality.overall_score * 0.8;
  }

  private assessConfidenceImprovement(
    response: EnhancedExpertResponse,
    agent: Agent
  ): number {
    return response.confidence > 0.8 ? 0.6 : 0.3;
  }

  private assessErrorCorrection(
    response: EnhancedExpertResponse,
    experience?: Experience
  ): number {
    return experience && experience.reward.value < 0 ? 0.8 : 0.2;
  }

  private assessSkillDevelopment(
    response: EnhancedExpertResponse,
    agent: Agent
  ): number {
    return response.alternative_approaches.length > 0 ? 0.7 : 0.4;
  }

  private calculateSessionRating(session: ExpertConsultationSession): number {
    return session.final_response.response_quality.overall_score;
  }

  private generateLearningOutcomes(
    session: ExpertConsultationSession
  ): LearningOutcome[] {
    return [
      {
        category: LearningCategory.CLINICAL_REASONING,
        description: "Improved clinical reasoning through expert feedback",
        confidence_change: 0.2,
        skill_improvement: 0.15,
        knowledge_gained: ["expert_perspective", "alternative_approaches"],
        application_context: "Similar clinical scenarios",
      },
    ];
  }

  // Metrics calculation methods

  private calculateExpertUtilization(): number {
    const totalExperts = this.experts.size;
    const activeExperts = this.activeSessions.size;
    return totalExperts > 0 ? activeExperts / totalExperts : 0;
  }

  private calculateAverageSessionDuration(): number {
    const completedSessions = this.sessionHistory.filter((s) => s.end_time);
    if (completedSessions.length === 0) return 0;

    const totalDuration = completedSessions.reduce((sum, session) => {
      const duration =
        session.end_time!.getTime() - session.start_time.getTime();
      return sum + duration;
    }, 0);

    return totalDuration / completedSessions.length / (1000 * 60); // Convert to minutes
  }

  private calculateLearningAcceleration(): number {
    // Simplified calculation
    return this.feedbackMetrics.learning_velocity_improvement;
  }

  private getQualityDistribution(): any {
    const qualities = this.sessionHistory.map(
      (s) => s.final_response.response_quality.overall_score
    );
    if (qualities.length === 0) return {};

    return {
      excellent: qualities.filter((q) => q >= 0.8).length,
      good: qualities.filter((q) => q >= 0.6 && q < 0.8).length,
      fair: qualities.filter((q) => q >= 0.4 && q < 0.6).length,
      poor: qualities.filter((q) => q < 0.4).length,
    };
  }

  private getTopLearningOutcomes(count: number): LearningOutcome[] {
    const allOutcomes = this.sessionHistory.flatMap((s) => s.learning_outcomes);
    return allOutcomes
      .sort((a, b) => b.skill_improvement - a.skill_improvement)
      .slice(0, count);
  }

  private updateFeedbackMetrics(
    response: EnhancedExpertResponse,
    impact: LearningImpact
  ): void {
    this.feedbackMetrics.total_consultations++;
    this.feedbackMetrics.feedback_quality_trend =
      this.feedbackMetrics.feedback_quality_trend * 0.8 +
      response.response_quality.overall_score * 0.2;
    this.feedbackMetrics.learning_velocity_improvement =
      this.feedbackMetrics.learning_velocity_improvement * 0.9 +
      impact.long_term_benefit * 0.1;
  }

  // Additional helper methods for different expert selection strategies

  private selectHighestQualityExpert(experts: ExpertProfile[]): ExpertProfile {
    return experts.reduce((best, expert) =>
      expert.feedback_quality_score > best.feedback_quality_score
        ? expert
        : best
    );
  }

  private selectFastestResponseExpert(experts: ExpertProfile[]): ExpertProfile {
    return experts.reduce((fastest, expert) =>
      expert.response_time_avg < fastest.response_time_avg ? expert : fastest
    );
  }

  private selectLoadBalancedExpert(experts: ExpertProfile[]): ExpertProfile {
    // Simplified load balancing - select expert with least active consultations
    const expertLoads = experts.map((expert) => ({
      expert,
      load: Array.from(this.activeSessions.values()).filter(
        (s) => s.expert_assigned.id === expert.id
      ).length,
    }));

    return expertLoads.reduce((least, current) =>
      current.load < least.load ? current : least
    ).expert;
  }

  private async scheduleBatchFeedback(
    agent: Agent,
    response: EnhancedExpertResponse,
    impact: LearningImpact
  ): Promise<void> {
    // Implementation for batch feedback processing
    console.log(`📦 Scheduled batch feedback integration`);
  }

  private async applyAdaptiveFeedback(
    agent: Agent,
    response: EnhancedExpertResponse,
    impact: LearningImpact
  ): Promise<void> {
    // Implementation for adaptive feedback based on agent state
    console.log(`🎯 Applied adaptive feedback based on agent learning state`);
  }
}

// Enums and supporting types

export enum ExpertSelectionStrategy {
  BEST_MATCH = "best_match",
  HIGHEST_QUALITY = "highest_quality",
  FASTEST_RESPONSE = "fastest_response",
  LOAD_BALANCED = "load_balanced",
}

export enum FeedbackIntegrationMode {
  IMMEDIATE = "immediate",
  BATCH = "batch",
  ADAPTIVE = "adaptive",
}

export enum ConsultationPriority {
  LOW = 1,
  NORMAL = 2,
  HIGH = 3,
  URGENT = 4,
  CRITICAL = 5,
}

// Enhanced interfaces

interface EnhancedConsultationRequest extends ExpertConsultationRequest {
  agent_context: {
    agent_type: string;
    experience_level: number;
    recent_performance: number;
    learning_objectives: string[];
  };
  consultation_context: {
    urgency_level: number;
    complexity_score: number;
    learning_potential: number;
    required_specialties: MedicalSpecialty[];
  };
  priority: ConsultationPriority;
  submitted_time: Date;
}

interface ExpertFeedbackConfig {
  maxConcurrentSessions?: number;
  expertSelectionStrategy?: ExpertSelectionStrategy;
  feedbackIntegrationMode?: FeedbackIntegrationMode;
  qualityThreshold?: number;
}

interface ExpertFeedbackSystemMetrics {
  metrics: ExpertFeedbackMetrics;
  activeConsultations: number;
  queuedConsultations: number;
  availableExperts: number;
  expertUtilization: number;
  avgSessionDuration: number;
  learningAcceleration: number;
  qualityDistribution: any;
  topLearningOutcomes: LearningOutcome[];
}
