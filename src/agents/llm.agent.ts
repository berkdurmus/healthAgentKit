import { 
  State, 
  Action, 
  Experience, 
  AgentType, 
  PatientProfile,
  TriagePriority,
  ActionType,
  SeverityLevel,
  AcuityLevel
} from '@/types/core.types';
import { BaseAgent } from '@/core/base.agent';

/**
 * LLM-based Triage Agent
 * Uses large language model reasoning for clinical decision making
 * Simulates how an LLM like GPT-4 or Claude might approach triage
 */
export class LLMTriageAgent extends BaseAgent {
  private contextWindow: LLMContext[] = [];
  private reasoningHistory: TriageReasoning[] = [];
  private clinicalKnowledge: ClinicalKnowledgeBase;
  private confidenceThreshold: number = 0.7;
  
  constructor(name: string = 'LLM Clinical Agent', id?: string) {
    super(name, AgentType.LLM_AGENT, id);
    this.clinicalKnowledge = this.initializeClinicalKnowledge();
  }

  /**
   * Select action using LLM-style reasoning
   */
  public async selectAction(state: State, availableActions: Action[]): Promise<Action> {
    const triageActions = availableActions.filter(a => a.type === ActionType.TRIAGE_ASSIGN);
    
    if (triageActions.length === 0) {
      const waitAction = availableActions.find(a => a.type === ActionType.WAIT);
      if (waitAction) return waitAction;
      throw new Error('No valid actions available');
    }

    // Extract clinical context from state and actions
    const clinicalContext = this.extractClinicalContext(state, triageActions);
    
    // Perform multi-step reasoning like an LLM
    const reasoning = await this.performClinicalReasoning(clinicalContext);
    
    // Select action based on reasoning
    const selectedAction = this.selectActionFromReasoning(reasoning, triageActions);
    
    // Store reasoning for learning and explanation
    this.storeReasoning(reasoning, selectedAction, clinicalContext);
    
    this.log('info', 'LLM agent completed clinical reasoning', {
      patientCount: clinicalContext.patients.length,
      selectedPriority: selectedAction.parameters.priority,
      confidence: reasoning.confidence,
      reasoningSteps: reasoning.steps.length
    });

    return selectedAction;
  }

  /**
   * Update agent based on experience with explanation-based learning
   */
  public async update(experience: Experience): Promise<void> {
    this.addExperience(experience);
    
    if (!this.isTraining) return;

    // Find the reasoning that led to this action
    const relatedReasoning = this.findReasoningForAction(experience.action);
    
    if (relatedReasoning) {
      // Update reasoning based on outcome
      this.updateReasoningFromOutcome(relatedReasoning, experience);
      
      // Update clinical knowledge base
      this.updateClinicalKnowledge(experience, relatedReasoning);
    }

    this.log('info', 'LLM agent updated from experience', {
      reward: experience.reward.value,
      reasoningUpdated: !!relatedReasoning,
      knowledgeBaseSize: Object.keys(this.clinicalKnowledge.patterns).length
    });
  }

  /**
   * Get confidence based on reasoning quality and clinical knowledge
   */
  public getConfidence(state: State, action: Action): number {
    if (action.type !== ActionType.TRIAGE_ASSIGN) return 0.5;
    
    const clinicalContext = this.extractClinicalContext(state, [action]);
    const patient = clinicalContext.patients[0];
    
    if (!patient) return 0.3;
    
    // Calculate confidence based on multiple factors
    const factors = this.calculateConfidenceFactors(patient, action);
    
    // Weighted combination of confidence factors
    const confidence = 
      factors.clinicalCertainty * 0.4 +
      factors.knowledgeMatch * 0.3 +
      factors.contextClarity * 0.2 +
      factors.precedentMatch * 0.1;
    
    return Math.min(0.95, Math.max(0.1, confidence));
  }

  /**
   * Perform multi-step clinical reasoning similar to an LLM
   */
  private async performClinicalReasoning(context: ClinicalContext): Promise<TriageReasoning> {
    const reasoning: TriageReasoning = {
      id: `reasoning-${Date.now()}`,
      timestamp: new Date(),
      context,
      steps: [],
      confidence: 0,
      selectedPriority: TriagePriority.NON_URGENT,
      explanation: ''
    };

    // Step 1: Assess immediate threats to life
    const lifeThreatStep = this.assessLifeThreats(context.patients[0]);
    reasoning.steps.push(lifeThreatStep);

    if (lifeThreatStep.conclusion.includes('immediate')) {
      reasoning.selectedPriority = TriagePriority.IMMEDIATE;
      reasoning.confidence = 0.95;
      reasoning.explanation = 'Life-threatening condition requiring immediate intervention';
      return reasoning;
    }

    // Step 2: Evaluate symptom severity and vital signs
    const severityStep = this.evaluateSymptomSeverity(context.patients[0]);
    reasoning.steps.push(severityStep);

    // Step 3: Consider differential diagnosis
    const differentialStep = this.considerDifferentialDiagnosis(context.patients[0]);
    reasoning.steps.push(differentialStep);

    // Step 4: Assess resource requirements and urgency
    const resourceStep = this.assessResourceNeeds(context.patients[0], context.queueLength);
    reasoning.steps.push(resourceStep);

    // Step 5: Apply clinical guidelines and protocols
    const guidelineStep = this.applyClinicaGuidelines(context.patients[0]);
    reasoning.steps.push(guidelineStep);

    // Synthesize reasoning into final decision
    const finalDecision = this.synthesizeDecision(reasoning.steps);
    reasoning.selectedPriority = finalDecision.priority;
    reasoning.confidence = finalDecision.confidence;
    reasoning.explanation = finalDecision.explanation;

    return reasoning;
  }

  /**
   * Extract clinical context from state and actions
   */
  private extractClinicalContext(state: State, actions: Action[]): ClinicalContext {
    // Extract patient information from actions (simplified)
    const patients: PatientProfile[] = [];
    const patientIds = new Set(actions.map(a => a.parameters.patientId as string));
    
    // In a real implementation, patient data would come from the state
    // For now, create mock patient based on action parameters
    for (const patientId of patientIds) {
      const mockPatient = this.createMockPatientFromAction(patientId, actions);
      if (mockPatient) patients.push(mockPatient);
    }

    return {
      patients,
      queueLength: (state.data.queueLength as number) || 0,
      availableResources: (state.data.availableResources as number) || 8,
      timeOfDay: state.timestamp.getHours(),
      urgencyLevels: this.categorizePatientsByUrgency(patients)
    };
  }

  /**
   * Assess life-threatening conditions
   */
  private assessLifeThreats(patient: PatientProfile | undefined): ReasoningStep {
    if (!patient) {
      return {
        type: 'life_threat_assessment',
        input: 'No patient data',
        reasoning: 'Cannot assess without patient information',
        conclusion: 'Unable to determine life threat status',
        confidence: 0.1
      };
    }

    const vitalSigns = patient.vitalSigns;
    const threats = [];

    // Check for critical vital signs
    if (vitalSigns.heartRate && (vitalSigns.heartRate > 150 || vitalSigns.heartRate < 50)) {
      threats.push('Critical heart rate abnormality');
    }
    
    if (vitalSigns.bloodPressure && (vitalSigns.bloodPressure.systolic < 90 || vitalSigns.bloodPressure.systolic > 200)) {
      threats.push('Critical blood pressure');
    }
    
    if (vitalSigns.oxygenSaturation && vitalSigns.oxygenSaturation < 90) {
      threats.push('Critical hypoxemia');
    }
    
    if (vitalSigns.temperature && (vitalSigns.temperature > 39.5 || vitalSigns.temperature < 35.0)) {
      threats.push('Critical temperature');
    }

    // Check chief complaint for life-threatening patterns
    const complaint = patient.currentCondition.chiefComplaint.toLowerCase();
    if (complaint.includes('chest pain') && patient.demographics.age > 45) {
      threats.push('Potential acute coronary syndrome');
    }
    
    if (complaint.includes('shortness of breath') && vitalSigns.oxygenSaturation && vitalSigns.oxygenSaturation < 95) {
      threats.push('Respiratory distress');
    }

    const hasLifeThreats = threats.length > 0;
    
    return {
      type: 'life_threat_assessment',
      input: `Vitals: HR ${vitalSigns.heartRate || 'N/A'}, BP ${vitalSigns.bloodPressure ? `${vitalSigns.bloodPressure.systolic}/${vitalSigns.bloodPressure.diastolic}` : 'N/A'}, O2 ${vitalSigns.oxygenSaturation || 'N/A'}%, Chief complaint: ${patient.currentCondition.chiefComplaint}`,
      reasoning: hasLifeThreats ? 
        `Identified potential life threats: ${threats.join(', ')}` :
        'No immediate life-threatening signs detected based on vital signs and chief complaint',
      conclusion: hasLifeThreats ? 'immediate intervention required' : 'no immediate life threats',
      confidence: hasLifeThreats ? 0.9 : 0.8
    };
  }

  /**
   * Evaluate symptom severity
   */
  private evaluateSymptomSeverity(patient: PatientProfile | undefined): ReasoningStep {
    if (!patient) {
      return {
        type: 'symptom_severity',
        input: 'No patient data',
        reasoning: 'Cannot evaluate symptoms without patient information',
        conclusion: 'Unable to determine severity',
        confidence: 0.1
      };
    }

    const painLevel = patient.currentCondition.painLevel || 0;
    const acuity = patient.currentCondition.acuity;
    const severity = patient.currentCondition.severity;

    let severityScore = 0;
    let reasoning = [];

    // Pain assessment
    if (painLevel >= 8) {
      severityScore += 3;
      reasoning.push(`High pain level (${painLevel}/10) indicates significant distress`);
    } else if (painLevel >= 5) {
      severityScore += 2;
      reasoning.push(`Moderate pain level (${painLevel}/10) requires attention`);
    } else if (painLevel > 0) {
      severityScore += 1;
      reasoning.push(`Low pain level (${painLevel}/10) manageable`);
    }

    // Acuity assessment
    if (acuity === AcuityLevel.CRITICAL) {
      severityScore += 4;
      reasoning.push('Critical acuity level');
    } else if (acuity === AcuityLevel.HIGH) {
      severityScore += 3;
      reasoning.push('High acuity level');
    } else if (acuity === AcuityLevel.MEDIUM) {
      severityScore += 2;
      reasoning.push('Medium acuity level');
    }

    // Determine overall severity
    let conclusion = '';
    if (severityScore >= 6) {
      conclusion = 'high severity requiring urgent attention';
    } else if (severityScore >= 4) {
      conclusion = 'moderate severity requiring timely care';
    } else if (severityScore >= 2) {
      conclusion = 'mild to moderate severity';
    } else {
      conclusion = 'low severity, stable condition';
    }

    return {
      type: 'symptom_severity',
      input: `Pain: ${painLevel}/10, Acuity: ${acuity}, Severity: ${severity}`,
      reasoning: reasoning.join('; '),
      conclusion,
      confidence: 0.85
    };
  }

  /**
   * Consider differential diagnosis
   */
  private considerDifferentialDiagnosis(patient: PatientProfile | undefined): ReasoningStep {
    if (!patient) {
      return {
        type: 'differential_diagnosis',
        input: 'No patient data',
        reasoning: 'Cannot consider diagnosis without patient information',
        conclusion: 'Unable to determine differential',
        confidence: 0.1
      };
    }

    const complaint = patient.currentCondition.chiefComplaint;
    const age = patient.demographics.age;
    const conditions = patient.medicalHistory.conditions;

    const differentials = this.generateDifferentialDiagnosis(complaint, age, conditions);
    const urgentDifferentials = differentials.filter(d => d.urgency === 'high');

    return {
      type: 'differential_diagnosis',
      input: `Chief complaint: ${complaint}, Age: ${age}, PMH: ${conditions.map(c => c.name).join(', ')}`,
      reasoning: `Considering differentials: ${differentials.map(d => d.condition).join(', ')}. Urgent considerations: ${urgentDifferentials.map(d => d.condition).join(', ')}`,
      conclusion: urgentDifferentials.length > 0 ? 
        'urgent differential diagnoses require expedited evaluation' : 
        'differential diagnoses suggest routine evaluation appropriate',
      confidence: 0.75
    };
  }

  /**
   * Assess resource needs
   */
  private assessResourceNeeds(patient: PatientProfile | undefined, queueLength: number): ReasoningStep {
    if (!patient) {
      return {
        type: 'resource_assessment',
        input: `Queue length: ${queueLength}`,
        reasoning: 'Cannot assess resource needs without patient information',
        conclusion: 'Unable to determine resource requirements',
        confidence: 0.1
      };
    }

    const complaint = patient.currentCondition.chiefComplaint;
    const acuity = patient.currentCondition.acuity;
    
    let resourceLevel = 'standard';
    let reasoning = '';

    if (complaint.includes('trauma') || complaint.includes('accident')) {
      resourceLevel = 'trauma bay';
      reasoning = 'Trauma presentation requires specialized trauma resources';
    } else if (acuity === AcuityLevel.CRITICAL) {
      resourceLevel = 'critical care';
      reasoning = 'Critical acuity requires advanced monitoring and intervention capabilities';
    } else if (complaint.includes('chest pain') || complaint.includes('shortness of breath')) {
      resourceLevel = 'monitored bed';
      reasoning = 'Cardiopulmonary symptoms require continuous monitoring';
    }

    // Consider queue length in prioritization
    if (queueLength > 10) {
      reasoning += `. High queue volume (${queueLength} patients) increases urgency for resource allocation`;
    }

    return {
      type: 'resource_assessment',
      input: `Complaint: ${complaint}, Acuity: ${acuity}, Queue: ${queueLength}`,
      reasoning,
      conclusion: `requires ${resourceLevel} resources`,
      confidence: 0.8
    };
  }

  /**
   * Apply clinical guidelines
   */
  private applyClinicaGuidelines(patient: PatientProfile | undefined): ReasoningStep {
    if (!patient) {
      return {
        type: 'clinical_guidelines',
        input: 'No patient data',
        reasoning: 'Cannot apply guidelines without patient information',
        conclusion: 'Unable to apply clinical guidelines',
        confidence: 0.1
      };
    }

    const complaint = patient.currentCondition.chiefComplaint;
    const age = patient.demographics.age;
    
    // Apply ESI (Emergency Severity Index) like guidelines
    let esiLevel = 5;
    let guideline = '';

    if (complaint.includes('chest pain') && age > 35) {
      esiLevel = 2;
      guideline = 'ACS protocol: Chest pain in adults >35 requires immediate evaluation per AHA guidelines';
    } else if (complaint.includes('shortness of breath')) {
      esiLevel = 3;
      guideline = 'Respiratory distress protocol: Requires timely assessment and intervention';
    } else if (complaint.includes('trauma') || complaint.includes('accident')) {
      esiLevel = 2;
      guideline = 'Trauma protocol: Mechanism-based triage requires rapid assessment';
    } else if (patient.currentCondition.painLevel && patient.currentCondition.painLevel >= 8) {
      esiLevel = 3;
      guideline = 'Pain management protocol: Severe pain requires timely intervention';
    } else {
      esiLevel = 4;
      guideline = 'Standard triage: Routine evaluation appropriate';
    }

    return {
      type: 'clinical_guidelines',
      input: `Complaint: ${complaint}, Age: ${age}, Pain: ${patient.currentCondition.painLevel}`,
      reasoning: guideline,
      conclusion: `ESI Level ${esiLevel} equivalent`,
      confidence: 0.9
    };
  }

  /**
   * Synthesize final decision from reasoning steps
   */
  private synthesizeDecision(steps: ReasoningStep[]): { priority: TriagePriority, confidence: number, explanation: string } {
    // Weight each reasoning step
    const weights = {
      life_threat_assessment: 0.4,
      symptom_severity: 0.2,
      differential_diagnosis: 0.15,
      resource_assessment: 0.15,
      clinical_guidelines: 0.1
    };

    let urgencyScore = 0;
    let weightedConfidence = 0;
    let totalWeight = 0;

    for (const step of steps) {
      const weight = weights[step.type as keyof typeof weights] || 0.1;
      
      // Convert conclusions to urgency scores
      let stepUrgency = 0;
      if (step.conclusion.includes('immediate')) stepUrgency = 5;
      else if (step.conclusion.includes('urgent') || step.conclusion.includes('high')) stepUrgency = 4;
      else if (step.conclusion.includes('moderate')) stepUrgency = 3;
      else if (step.conclusion.includes('timely')) stepUrgency = 2;
      else stepUrgency = 1;

      urgencyScore += stepUrgency * weight;
      weightedConfidence += step.confidence * weight;
      totalWeight += weight;
    }

    urgencyScore /= totalWeight;
    weightedConfidence /= totalWeight;

    // Map urgency score to triage priority
    let priority: TriagePriority;
    if (urgencyScore >= 4.5) priority = TriagePriority.IMMEDIATE;
    else if (urgencyScore >= 3.5) priority = TriagePriority.URGENT;
    else if (urgencyScore >= 2.5) priority = TriagePriority.SEMI_URGENT;
    else if (urgencyScore >= 1.5) priority = TriagePriority.LESS_URGENT;
    else priority = TriagePriority.NON_URGENT;

    const explanation = `Synthesized ${steps.length} reasoning steps: ${steps.map(s => s.type).join(', ')}. Overall urgency score: ${urgencyScore.toFixed(2)}`;

    return { priority, confidence: weightedConfidence, explanation };
  }

  // Helper methods
  private initializeClinicalKnowledge(): ClinicalKnowledgeBase {
    return {
      patterns: {},
      guidelines: {},
      precedents: [],
      learningRate: 0.1
    };
  }

  private createMockPatientFromAction(patientId: string, actions: Action[]): PatientProfile | null {
    // This would normally extract patient data from the state
    // For now, return null to handle gracefully
    return null;
  }

  private categorizePatientsByUrgency(patients: PatientProfile[]): { [key: string]: number } {
    return patients.reduce((acc, p) => {
      const level = p.currentCondition.acuity.toString();
      acc[level] = (acc[level] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });
  }

  private generateDifferentialDiagnosis(complaint: string, age: number, conditions: any[]): any[] {
    // Simplified differential generation
    if (complaint.includes('chest pain')) {
      return [
        { condition: 'Acute MI', urgency: 'high' },
        { condition: 'Angina', urgency: 'medium' },
        { condition: 'Musculoskeletal', urgency: 'low' }
      ];
    }
    return [{ condition: 'General symptoms', urgency: 'medium' }];
  }

  private selectActionFromReasoning(reasoning: TriageReasoning, actions: Action[]): Action {
    // Find action with matching priority
    const targetAction = actions.find(a => 
      a.parameters.priority === reasoning.selectedPriority
    );
    
    return targetAction || actions[0];
  }

  private storeReasoning(reasoning: TriageReasoning, action: Action, context: ClinicalContext): void {
    this.reasoningHistory.push(reasoning);
    
    // Limit history size
    if (this.reasoningHistory.length > 100) {
      this.reasoningHistory = this.reasoningHistory.slice(-50);
    }
  }

  private findReasoningForAction(action: Action): TriageReasoning | null {
    // Find most recent reasoning (simplified)
    return this.reasoningHistory[this.reasoningHistory.length - 1] || null;
  }

  private updateReasoningFromOutcome(reasoning: TriageReasoning, experience: Experience): void {
    // Update confidence based on reward
    const reward = experience.reward.value;
    if (reward > 5) {
      reasoning.confidence = Math.min(0.95, reasoning.confidence + 0.05);
    } else if (reward < -5) {
      reasoning.confidence = Math.max(0.1, reasoning.confidence - 0.1);
    }
  }

  private updateClinicalKnowledge(experience: Experience, reasoning: TriageReasoning): void {
    // Simple pattern learning (would be more sophisticated in practice)
    const patternKey = `${reasoning.context.patients[0]?.currentCondition.chiefComplaint}_${reasoning.selectedPriority}`;
    
    if (!this.clinicalKnowledge.patterns[patternKey]) {
      this.clinicalKnowledge.patterns[patternKey] = { success: 0, total: 0 };
    }
    
    this.clinicalKnowledge.patterns[patternKey].total++;
    if (experience.reward.value > 0) {
      this.clinicalKnowledge.patterns[patternKey].success++;
    }
  }

  private calculateConfidenceFactors(patient: PatientProfile, action: Action): any {
    return {
      clinicalCertainty: 0.8,
      knowledgeMatch: 0.7,
      contextClarity: 0.9,
      precedentMatch: 0.6
    };
  }

  /**
   * Get reasoning history for analysis
   */
  public getReasoningHistory(): readonly TriageReasoning[] {
    return [...this.reasoningHistory];
  }

  /**
   * Get clinical knowledge base
   */
  public getClinicalKnowledge(): ClinicalKnowledgeBase {
    return JSON.parse(JSON.stringify(this.clinicalKnowledge));
  }

  /**
   * Export reasoning in human-readable format
   */
  public explainLastDecision(): string {
    const lastReasoning = this.reasoningHistory[this.reasoningHistory.length - 1];
    if (!lastReasoning) return 'No recent decisions to explain';
    
    let explanation = `Clinical Decision Explanation:\n`;
    explanation += `Priority: ${lastReasoning.selectedPriority}\n`;
    explanation += `Confidence: ${(lastReasoning.confidence * 100).toFixed(1)}%\n\n`;
    explanation += `Reasoning Steps:\n`;
    
    for (const step of lastReasoning.steps) {
      explanation += `${step.type}: ${step.conclusion} (confidence: ${(step.confidence * 100).toFixed(1)}%)\n`;
      explanation += `  Reasoning: ${step.reasoning}\n\n`;
    }
    
    explanation += `Final Assessment: ${lastReasoning.explanation}`;
    
    return explanation;
  }
}

// Supporting interfaces
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
}

interface ReasoningStep {
  type: string;
  input: string;
  reasoning: string;
  conclusion: string;
  confidence: number;
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