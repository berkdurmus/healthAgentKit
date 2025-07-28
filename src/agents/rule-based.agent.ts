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
  StateType
} from '@/types/core.types';
import { BaseAgent } from '@/core/base.agent';

/**
 * Rule-based agent that uses clinical guidelines for triage decisions
 * Based on established triage protocols like ESI (Emergency Severity Index)
 */
export class RuleBasedTriageAgent extends BaseAgent {
  private rules: TriageRule[] = [];
  private decisionHistory: TriageDecisionRecord[] = [];
  
  constructor(name: string = 'Rule-Based Triage Agent', id?: string) {
    super(name, AgentType.RULE_BASED, id);
    this.initializeTriageRules();
  }

  /**
   * Select an action based on rule-based triage logic
   */
  public async selectAction(state: State, availableActions: Action[]): Promise<Action> {
    // Filter to only triage actions if we're in triage mode
    const triageActions = availableActions.filter(a => a.type === ActionType.TRIAGE_ASSIGN);
    
    if (triageActions.length === 0) {
      // If no triage actions available, default to wait
      const waitAction = availableActions.find(a => a.type === ActionType.WAIT);
      if (waitAction) {
        return waitAction;
      }
      throw new Error('No valid actions available');
    }

    // Extract patient information from the current triage actions
    const patientActions = this.groupActionsByPatient(triageActions);
    
    if (patientActions.size === 0) {
      const waitAction = availableActions.find(a => a.type === ActionType.WAIT);
      if (waitAction) return waitAction;
      throw new Error('No patients to triage');
    }

    // Select the highest priority patient to triage first
    const selectedPatient = this.selectPatientForTriage(state, patientActions);
    
    if (!selectedPatient) {
      const waitAction = availableActions.find(a => a.type === ActionType.WAIT);
      if (waitAction) return waitAction;
      throw new Error('Could not select patient for triage');
    }

    // Apply triage rules to determine priority
    const recommendedPriority = this.applyTriageRules(selectedPatient.patientData);
    
    // Find the action that matches our recommended priority
    const recommendedAction = selectedPatient.actions.find(a => 
      a.parameters.priority === recommendedPriority
    );

    if (!recommendedAction) {
      // Fallback to the first available action for this patient
      this.log('warn', 'Could not find action for recommended priority, using fallback', {
        patientId: selectedPatient.patientId,
        recommendedPriority,
        availablePriorities: selectedPatient.actions.map(a => a.parameters.priority)
      });
      return selectedPatient.actions[0];
    }

    // Record decision for analysis
    this.recordDecision(selectedPatient.patientData, recommendedPriority, recommendedAction);
    
    this.log('info', 'Selected triage action', {
      patientId: selectedPatient.patientId,
      priority: recommendedPriority,
      reasoning: this.getTriageReasoning(selectedPatient.patientData, recommendedPriority)
    });

    return recommendedAction;
  }

  /**
   * Update the agent based on experience (rule-based agents typically don't learn)
   */
  public async update(experience: Experience): Promise<void> {
    // Store experience for potential rule refinement
    this.addExperience(experience);
    
    // Rule-based agents typically don't update their rules based on experience,
    // but we can track performance for monitoring
    this.updatePerformanceMetrics(experience);
  }

  /**
   * Get confidence in the selected action based on rule certainty
   */
  public getConfidence(state: State, action: Action): number {
    if (action.type !== ActionType.TRIAGE_ASSIGN) {
      return 0.5; // Neutral confidence for non-triage actions
    }

    const patientId = action.parameters.patientId;
    const priority = action.parameters.priority;
    
    // Find the matching decision record
    const decision = this.decisionHistory.find(d => 
      d.patientId === patientId && d.assignedPriority === priority
    );
    
    return decision ? decision.confidence : 0.5;
  }

  /**
   * Initialize clinical triage rules based on established protocols
   */
  private initializeTriageRules(): void {
    this.rules = [
      // Critical/Immediate Priority Rules
      {
        id: 'critical-vitals',
        priority: TriagePriority.IMMEDIATE,
        condition: (patient: PatientProfile) => {
          const vitals = patient.vitalSigns;
          return (
            (vitals.heartRate !== undefined && (vitals.heartRate < 50 || vitals.heartRate > 150)) ||
            (vitals.bloodPressure !== undefined && vitals.bloodPressure.systolic < 80) ||
            (vitals.oxygenSaturation !== undefined && vitals.oxygenSaturation < 90) ||
            (vitals.respiratoryRate !== undefined && (vitals.respiratoryRate < 10 || vitals.respiratoryRate > 30))
          );
        },
        weight: 1.0,
        reasoning: 'Critical vital signs requiring immediate intervention'
      },
      {
        id: 'critical-acuity',
        priority: TriagePriority.IMMEDIATE,
        condition: (patient: PatientProfile) => patient.currentCondition.acuity === AcuityLevel.CRITICAL,
        weight: 1.0,
        reasoning: 'Critical acuity level requires immediate care'
      },
      {
        id: 'critical-trauma',
        priority: TriagePriority.IMMEDIATE,
        condition: (patient: PatientProfile) => 
          patient.currentCondition.chiefComplaint.toLowerCase().includes('trauma') &&
          patient.currentCondition.severity === SeverityLevel.CRITICAL,
        weight: 1.0,
        reasoning: 'Critical trauma requires immediate attention'
      },

      // Urgent Priority Rules
      {
        id: 'severe-symptoms',
        priority: TriagePriority.URGENT,
        condition: (patient: PatientProfile) => 
          patient.currentCondition.severity === SeverityLevel.SEVERE ||
          patient.currentCondition.acuity === AcuityLevel.HIGH,
        weight: 0.9,
        reasoning: 'Severe symptoms require urgent care'
      },
      {
        id: 'chest-pain',
        priority: TriagePriority.URGENT,
        condition: (patient: PatientProfile) => 
          patient.currentCondition.chiefComplaint.toLowerCase().includes('chest pain') ||
          patient.currentCondition.chiefComplaint.toLowerCase().includes('cardiac'),
        weight: 0.9,
        reasoning: 'Chest pain may indicate cardiac emergency'
      },
      {
        id: 'high-pain-level',
        priority: TriagePriority.URGENT,
        condition: (patient: PatientProfile) => 
          patient.currentCondition.painLevel !== undefined && patient.currentCondition.painLevel >= 8,
        weight: 0.8,
        reasoning: 'High pain level (8+/10) requires urgent assessment'
      },

      // Less Urgent Priority Rules
      {
        id: 'moderate-symptoms',
        priority: TriagePriority.LESS_URGENT,
        condition: (patient: PatientProfile) => 
          patient.currentCondition.severity === SeverityLevel.MODERATE ||
          patient.currentCondition.acuity === AcuityLevel.MEDIUM,
        weight: 0.7,
        reasoning: 'Moderate symptoms require timely assessment'
      },
      {
        id: 'moderate-pain',
        priority: TriagePriority.LESS_URGENT,
        condition: (patient: PatientProfile) => 
          patient.currentCondition.painLevel !== undefined && 
          patient.currentCondition.painLevel >= 5 && patient.currentCondition.painLevel < 8,
        weight: 0.6,
        reasoning: 'Moderate pain level (5-7/10)'
      },

      // Semi-Urgent Priority Rules
      {
        id: 'mild-symptoms-elderly',
        priority: TriagePriority.SEMI_URGENT,
        condition: (patient: PatientProfile) => 
          patient.currentCondition.severity === SeverityLevel.MILD &&
          patient.demographics.age >= 65,
        weight: 0.6,
        reasoning: 'Elderly patients with mild symptoms may deteriorate'
      },
      {
        id: 'low-pain',
        priority: TriagePriority.SEMI_URGENT,
        condition: (patient: PatientProfile) => 
          patient.currentCondition.painLevel !== undefined && 
          patient.currentCondition.painLevel >= 3 && patient.currentCondition.painLevel < 5,
        weight: 0.5,
        reasoning: 'Low-moderate pain level (3-4/10)'
      },

      // Non-Urgent Priority Rules
      {
        id: 'mild-symptoms',
        priority: TriagePriority.NON_URGENT,
        condition: (patient: PatientProfile) => 
          patient.currentCondition.severity === SeverityLevel.MILD &&
          patient.currentCondition.acuity === AcuityLevel.LOW,
        weight: 0.4,
        reasoning: 'Mild symptoms with low acuity'
      },
      {
        id: 'minimal-pain',
        priority: TriagePriority.NON_URGENT,
        condition: (patient: PatientProfile) => 
          patient.currentCondition.painLevel !== undefined && patient.currentCondition.painLevel < 3,
        weight: 0.4,
        reasoning: 'Minimal pain level (<3/10)'
      }
    ];
  }

  /**
   * Group available actions by patient ID
   */
  private groupActionsByPatient(actions: Action[]): Map<string, PatientTriageData> {
    const patientMap = new Map<string, PatientTriageData>();
    
    for (const action of actions) {
      const patientId = action.parameters.patientId as string;
      
      if (!patientMap.has(patientId)) {
        patientMap.set(patientId, {
          patientId,
          actions: [],
          patientData: null // This would be extracted from state in a real implementation
        });
      }
      
      patientMap.get(patientId)!.actions.push(action);
    }
    
    return patientMap;
  }

  /**
   * Select which patient to triage first based on urgency indicators
   */
  private selectPatientForTriage(
    state: State, 
    patientActions: Map<string, PatientTriageData>
  ): PatientTriageData | null {
    
    // In a real implementation, we would extract patient data from the state
    // For now, we'll select the first patient
    const patients = Array.from(patientActions.values());
    
    if (patients.length === 0) return null;
    
    // Simple selection: first patient (in practice, this would be more sophisticated)
    return patients[0];
  }

  /**
   * Apply triage rules to determine the appropriate priority
   */
  private applyTriageRules(patient: PatientProfile | null): TriagePriority {
    if (!patient) {
      return TriagePriority.NON_URGENT; // Default fallback
    }

    let highestPriority = TriagePriority.NON_URGENT;
    let highestWeight = 0;
    let matchingRules: TriageRule[] = [];

    // Evaluate all rules
    for (const rule of this.rules) {
      if (rule.condition(patient)) {
        matchingRules.push(rule);
        
        // Higher priority = lower number (1 = immediate, 5 = non-urgent)
        if (rule.priority < highestPriority || 
           (rule.priority === highestPriority && rule.weight > highestWeight)) {
          highestPriority = rule.priority;
          highestWeight = rule.weight;
        }
      }
    }

    this.log('info', 'Applied triage rules', {
      patientId: patient.id,
      matchingRules: matchingRules.map(r => r.id),
      selectedPriority: highestPriority
    });

    return highestPriority;
  }

  /**
   * Get reasoning for the triage decision
   */
  private getTriageReasoning(patient: PatientProfile | null, priority: TriagePriority): string {
    if (!patient) return 'No patient data available';

    const matchingRules = this.rules.filter(rule => 
      rule.condition(patient) && rule.priority === priority
    );

    if (matchingRules.length === 0) {
      return `Default priority assignment: ${priority}`;
    }

    return matchingRules.map(rule => rule.reasoning).join('; ');
  }

  /**
   * Record a triage decision for analysis
   */
  private recordDecision(
    patient: PatientProfile | null, 
    priority: TriagePriority, 
    action: Action
  ): void {
    if (!patient) return;

    const confidence = this.calculateDecisionConfidence(patient, priority);
    
    this.decisionHistory.push({
      patientId: patient.id,
      assignedPriority: priority,
      confidence,
      reasoning: this.getTriageReasoning(patient, priority),
      timestamp: new Date(),
      action
    });

    // Limit history size
    if (this.decisionHistory.length > 1000) {
      this.decisionHistory = this.decisionHistory.slice(-500);
    }
  }

  /**
   * Calculate confidence in the decision based on rule strength
   */
  private calculateDecisionConfidence(patient: PatientProfile, priority: TriagePriority): number {
    const matchingRules = this.rules.filter(rule => 
      rule.condition(patient) && rule.priority === priority
    );

    if (matchingRules.length === 0) return 0.3; // Low confidence for default assignment

    // Higher confidence if multiple rules agree or if the rule has high weight
    const maxWeight = Math.max(...matchingRules.map(r => r.weight));
    const ruleCount = matchingRules.length;
    
    return Math.min(0.95, maxWeight * 0.8 + ruleCount * 0.1);
  }

  /**
   * Update performance metrics based on experience
   */
  private updatePerformanceMetrics(experience: Experience): void {
    // Track accuracy, timing, and other metrics
    // This would be used for rule refinement and monitoring
    
    const reward = experience.reward.value;
    
    // Simple performance tracking
    if (reward > 5) {
      this.log('info', 'Positive outcome from rule-based decision', { reward });
    } else if (reward < -5) {
      this.log('warn', 'Negative outcome from rule-based decision', { reward });
    }
  }

  /**
   * Get decision history for analysis
   */
  public getDecisionHistory(): readonly TriageDecisionRecord[] {
    return [...this.decisionHistory];
  }

  /**
   * Get triage rules for inspection
   */
  public getTriageRules(): readonly TriageRule[] {
    return [...this.rules];
  }
}

// Supporting interfaces
interface TriageRule {
  id: string;
  priority: TriagePriority;
  condition: (patient: PatientProfile) => boolean;
  weight: number;
  reasoning: string;
}

interface PatientTriageData {
  patientId: string;
  actions: Action[];
  patientData: PatientProfile | null;
}

interface TriageDecisionRecord {
  patientId: string;
  assignedPriority: TriagePriority;
  confidence: number;
  reasoning: string;
  timestamp: Date;
  action: Action;
} 