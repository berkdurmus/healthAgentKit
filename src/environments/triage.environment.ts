import { v4 as uuidv4 } from 'uuid';
import {
  State,
  Action,
  StepResult,
  Reward,
  PatientProfile,
  TriageDecision,
  TriagePriority,
  StateType,
  ActionType,
  EnvironmentType,
  RewardCategory,
  SeverityLevel,
  AcuityLevel,
  Gender,
  InsuranceType,
  HousingStatus,
  EmploymentStatus,
  EducationLevel,
  TransportationAccess,
  SocialSupportLevel,
  FoodSecurityLevel
} from '@/types/core.types';
import { BaseEnvironment, EnvironmentConfig } from '@/core/base.environment';

/**
 * Emergency Department Triage Environment
 * Simulates triage workflow where agents must prioritize patients based on acuity and resource availability
 */
export class TriageEnvironment extends BaseEnvironment {
  private patientQueue: PatientProfile[] = [];
  private triageDecisions: TriageDecision[] = [];
  private resources: TriageResource[] = [];
  private metrics: TriageMetrics;
  
  constructor(config: TriageEnvironmentConfig = {}) {
    super('Emergency Department Triage', EnvironmentType.EMERGENCY_DEPARTMENT, config);
    
    this.metrics = {
      patientsProcessed: 0,
      averageWaitTime: 0,
      priorityAccuracy: 0,
      resourceUtilization: 0,
      patientSatisfaction: 0,
      safetyIncidents: 0,
      totalCost: 0,
      waitTimes: [],
      outcomesHistory: []
    };
    
    this.initializeResources();
  }

  /**
   * Initialize triage resources (rooms, staff, equipment)
   */
  private initializeResources(): void {
    const config = this.config as TriageEnvironmentConfig;
    
    this.resources = [
      {
        id: 'trauma-bay-1',
        type: 'trauma_bay',
        capacity: 1,
        available: true,
        requiredForPriority: [TriagePriority.IMMEDIATE],
        costPerHour: 500
      },
      {
        id: 'trauma-bay-2',
        type: 'trauma_bay',
        capacity: 1,
        available: true,
        requiredForPriority: [TriagePriority.IMMEDIATE],
        costPerHour: 500
      },
      {
        id: 'urgent-room-1',
        type: 'urgent_care_room',
        capacity: 1,
        available: true,
        requiredForPriority: [TriagePriority.URGENT, TriagePriority.LESS_URGENT],
        costPerHour: 200
      },
      {
        id: 'urgent-room-2',
        type: 'urgent_care_room',
        capacity: 1,
        available: true,
        requiredForPriority: [TriagePriority.URGENT, TriagePriority.LESS_URGENT],
        costPerHour: 200
      },
      {
        id: 'urgent-room-3',
        type: 'urgent_care_room',
        capacity: 1,
        available: true,
        requiredForPriority: [TriagePriority.URGENT, TriagePriority.LESS_URGENT],
        costPerHour: 200
      },
      {
        id: 'general-bed-1',
        type: 'general_bed',
        capacity: 1,
        available: true,
        requiredForPriority: [TriagePriority.SEMI_URGENT, TriagePriority.NON_URGENT],
        costPerHour: 100
      },
      {
        id: 'general-bed-2',
        type: 'general_bed',
        capacity: 1,
        available: true,
        requiredForPriority: [TriagePriority.SEMI_URGENT, TriagePriority.NON_URGENT],
        costPerHour: 100
      },
      {
        id: 'general-bed-3',
        type: 'general_bed',
        capacity: 1,
        available: true,
        requiredForPriority: [TriagePriority.SEMI_URGENT, TriagePriority.NON_URGENT],
        costPerHour: 100
      }
    ];
  }

  /**
   * Get all available actions for the current state
   */
  public getAvailableActions(state?: State): Action[] {
    const currentState = state || this.getCurrentState();
    const actions: Action[] = [];

    // If there are patients waiting, offer triage actions
    if (this.patientQueue.length > 0) {
      for (const patient of this.patientQueue) {
        // Add triage priority actions for each priority level
        for (const priority of Object.values(TriagePriority)) {
          if (typeof priority === 'number') {
            actions.push({
              id: `triage-${patient.id}-priority-${priority}`,
              type: ActionType.TRIAGE_ASSIGN,
              parameters: {
                patientId: patient.id,
                priority: priority,
                reasoning: `Assign priority ${priority} to patient ${patient.id}`
              },
              estimatedDuration: this.getTriageDuration(priority),
              constraints: this.getTriageConstraints(patient, priority)
            });
          }
        }
      }
    }

    // Add wait action
    actions.push({
      id: 'wait',
      type: ActionType.WAIT,
      parameters: { duration: 5 },
      estimatedDuration: 5
    });

    return actions;
  }

  /**
   * Execute a step in the environment
   */
  public async step(action: Action): Promise<StepResult> {
    if (!this.validateAction(action)) {
      throw new Error(`Invalid action: ${action.id}`);
    }

    const prevState = this.getCurrentState();
    let reward: Reward;
    let newState: State;
    let done = false;

    switch (action.type) {
      case ActionType.TRIAGE_ASSIGN:
        ({ reward, newState, done } = await this.executeTriageAction(action));
        break;
      
      case ActionType.WAIT:
        ({ reward, newState, done } = await this.executeWaitAction(action));
        break;
      
      default:
        throw new Error(`Unsupported action type: ${action.type}`);
    }

    this.updateState(newState);
    
    // Simulate patient arrivals
    this.simulatePatientArrivals();
    
    // Update resource availability
    this.updateResourceAvailability();

    return {
      state: newState,
      reward,
      done: done || this.isDone(),
      info: {
        queueLength: this.patientQueue.length,
        availableResources: this.resources.filter(r => r.available).length,
        metrics: this.metrics
      }
    };
  }

  /**
   * Execute triage assignment action
   */
  private async executeTriageAction(action: Action): Promise<{
    reward: Reward;
    newState: State;
    done: boolean;
  }> {
    const { patientId, priority, reasoning } = action.parameters;
    const patient = this.patientQueue.find(p => p.id === patientId);
    
    if (!patient) {
      throw new Error(`Patient ${patientId} not found in queue`);
    }

    // Create triage decision
    const triageDecision: TriageDecision = {
      patientId: patientId as string,
      priority: priority as TriagePriority,
      estimatedWaitTime: this.calculateWaitTime(priority as TriagePriority),
      recommendedPath: this.getRecommendedCarePath(patient, priority as TriagePriority),
      confidence: 0.8, // This would come from the agent in practice
      reasoning: reasoning as string,
      timestamp: new Date()
    };

    this.triageDecisions.push(triageDecision);
    
    // Remove patient from queue (they've been triaged)
    this.patientQueue = this.patientQueue.filter(p => p.id !== patientId);
    
    // Calculate reward based on triage accuracy and efficiency
    const reward = this.calculateTriageReward(patient, triageDecision);
    
    // Update metrics
    this.updateMetrics(patient, triageDecision, reward);

    const newState = this.createState(
      StateType.TRIAGE_ASSESSMENT,
      {
        queueLength: this.patientQueue.length,
        recentTriage: triageDecision,
        availableResources: this.getAvailableResourceCount(),
        metrics: { ...this.metrics }
      },
      this.patientQueue.length === 0 && this.episodeSteps > 50 // Terminal if queue empty and sufficient steps
    );

    return {
      reward,
      newState,
      done: false
    };
  }

  /**
   * Execute wait action
   */
  private async executeWaitAction(action: Action): Promise<{
    reward: Reward;
    newState: State;
    done: boolean;
  }> {
    const duration = action.parameters.duration as number || 5;
    
    // Small negative reward for waiting (encourages action)
    const reward: Reward = {
      value: -0.1 * duration,
      components: [
        {
          name: 'efficiency_penalty',
          value: -0.1 * duration,
          weight: 1.0,
          category: RewardCategory.EFFICIENCY
        }
      ],
      reasoning: `Waited ${duration} minutes without taking action`
    };

    const newState = this.createState(
      StateType.WAITING,
      {
        queueLength: this.patientQueue.length,
        waitDuration: duration,
        availableResources: this.getAvailableResourceCount()
      }
    );

    return { reward, newState, done: false };
  }

  /**
   * Reset the environment to initial state
   */
  public async reset(): Promise<State> {
    this.startEpisode();
    
    // Clear state
    this.patientQueue = [];
    this.triageDecisions = [];
    this.metrics = {
      patientsProcessed: 0,
      averageWaitTime: 0,
      priorityAccuracy: 0,
      resourceUtilization: 0,
      patientSatisfaction: 0,
      safetyIncidents: 0,
      totalCost: 0,
      waitTimes: [],
      outcomesHistory: []
    };
    
    // Reset resources
    this.initializeResources();
    
    // Generate initial patients
    this.generateInitialPatients();

    const initialState = this.createState(
      StateType.INITIAL,
      {
        queueLength: this.patientQueue.length,
        availableResources: this.getAvailableResourceCount(),
        shift: 'day', // Could be parameterized
        weatherConditions: 'normal' // Could affect patient volume
      }
    );

    this.updateState(initialState);
    return initialState;
  }

  // Implementation of abstract methods from BaseEnvironment
  protected calculateAverageWaitTime(): number {
    return this.metrics.averageWaitTime;
  }

  protected calculatePatientSatisfaction(): number {
    return this.metrics.patientSatisfaction;
  }

  protected calculateResourceUtilization(): Record<string, number> {
    const utilization: Record<string, number> = {};
    
    for (const resource of this.resources) {
      const utilizationRate = resource.available ? 0 : 1;
      utilization[resource.type] = utilizationRate;
    }
    
    return utilization;
  }

  protected calculateCostPerPatient(): number {
    return this.metrics.patientsProcessed > 0 
      ? this.metrics.totalCost / this.metrics.patientsProcessed 
      : 0;
  }

  protected getSafetyIncidents(): number {
    return this.metrics.safetyIncidents;
  }

  // Private helper methods
  private generateInitialPatients(): void {
    const config = this.config as TriageEnvironmentConfig;
    const initialPatients = config.initialPatientCount || 3;
    
    for (let i = 0; i < initialPatients; i++) {
      this.patientQueue.push(this.generateRandomPatient());
    }
  }

  private generateRandomPatient(): PatientProfile {
    // This would be more sophisticated in practice, possibly using real clinical data distributions
    const conditions = [
      { complaint: 'Chest pain', severity: SeverityLevel.SEVERE, acuity: AcuityLevel.HIGH },
      { complaint: 'Shortness of breath', severity: SeverityLevel.MODERATE, acuity: AcuityLevel.MEDIUM },
      { complaint: 'Abdominal pain', severity: SeverityLevel.MILD, acuity: AcuityLevel.LOW },
      { complaint: 'Headache', severity: SeverityLevel.MILD, acuity: AcuityLevel.LOW },
      { complaint: 'Trauma from accident', severity: SeverityLevel.CRITICAL, acuity: AcuityLevel.CRITICAL }
    ];
    
    const randomCondition = conditions[Math.floor(Math.random() * conditions.length)];
    
    return {
      id: uuidv4(),
      demographics: {
        age: Math.floor(Math.random() * 80) + 10,
        gender: Math.random() > 0.5 ? Gender.MALE : Gender.FEMALE,
        language: 'English',
        insuranceType: InsuranceType.PRIVATE,
        location: {
          address: '123 Main St',
          city: 'Anytown',
          state: 'NY',
          zipCode: '12345'
        }
      },
      medicalHistory: {
        conditions: [],
        surgeries: [],
        hospitalizations: [],
        familyHistory: []
      },
      currentCondition: {
        chiefComplaint: randomCondition.complaint,
        symptoms: [],
        onset: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000), // Random onset within 24h
        severity: randomCondition.severity,
        acuity: randomCondition.acuity,
        painLevel: Math.floor(Math.random() * 10) + 1
      },
      vitalSigns: {
        temperature: 36.5 + Math.random() * 2,
        bloodPressure: {
          systolic: 120 + Math.random() * 40,
          diastolic: 80 + Math.random() * 20
        },
        heartRate: 60 + Math.random() * 40,
        respiratoryRate: 12 + Math.random() * 8,
        oxygenSaturation: 95 + Math.random() * 5,
        timestamp: new Date()
      },
      socialDeterminants: {
        housing: HousingStatus.OWNED,
        employment: EmploymentStatus.EMPLOYED,
        education: EducationLevel.COLLEGE_DEGREE,
        transportation: TransportationAccess.RELIABLE,
        socialSupport: SocialSupportLevel.STRONG,
        foodSecurity: FoodSecurityLevel.SECURE
      },
      riskFactors: [],
      allergies: [],
      medications: []
    };
  }

  private simulatePatientArrivals(): void {
    const config = this.config as TriageEnvironmentConfig;
    const arrivalRate = config.patientArrivalRate || 0.1; // 10% chance per step
    
    if (Math.random() < arrivalRate && this.patientQueue.length < 20) {
      this.patientQueue.push(this.generateRandomPatient());
      this.log('info', 'New patient arrived', { queueLength: this.patientQueue.length });
    }
  }

  private updateResourceAvailability(): void {
    // Simulate resources becoming available over time
    // In a real system, this would be based on actual care completion times
    for (const resource of this.resources) {
      if (!resource.available && Math.random() < 0.05) { // 5% chance per step
        resource.available = true;
        this.log('info', `Resource ${resource.id} became available`);
      }
    }
  }

  private getTriageDuration(priority: TriagePriority): number {
    // Time varies by priority complexity
    const baseTimes = {
      [TriagePriority.IMMEDIATE]: 2,
      [TriagePriority.URGENT]: 5,
      [TriagePriority.LESS_URGENT]: 8,
      [TriagePriority.SEMI_URGENT]: 10,
      [TriagePriority.NON_URGENT]: 12
    };
    
    return baseTimes[priority] || 10;
  }

  private getTriageConstraints(patient: PatientProfile, priority: TriagePriority): any[] {
    // Define constraints based on clinical guidelines
    return [];
  }

  private calculateWaitTime(priority: TriagePriority): number {
    const availableResources = this.resources
      .filter(r => r.available && r.requiredForPriority.includes(priority));
    
    if (availableResources.length === 0) {
      // No resources available, estimate based on priority and queue
      const priorityMultiplier = {
        [TriagePriority.IMMEDIATE]: 0,
        [TriagePriority.URGENT]: 15,
        [TriagePriority.LESS_URGENT]: 60,
        [TriagePriority.SEMI_URGENT]: 120,
        [TriagePriority.NON_URGENT]: 240
      };
      
      return priorityMultiplier[priority] + (this.patientQueue.length * 10);
    }
    
    return Math.random() * 30; // Random wait time if resources available
  }

  private getRecommendedCarePath(patient: PatientProfile, priority: TriagePriority): any {
    // Simplified care path - would be more complex in practice
    return {
      id: `path-${priority}`,
      name: `Priority ${priority} Care Path`,
      steps: [],
      estimatedDuration: this.calculateWaitTime(priority),
      requiredResources: [],
      triggers: []
    };
  }

  private calculateTriageReward(patient: PatientProfile, decision: TriageDecision): Reward {
    const components: any[] = [];
    
    // Accuracy component - compare assigned priority to "ground truth"
    const optimalPriority = this.calculateOptimalPriority(patient);
    const priorityDifference = Math.abs(decision.priority - optimalPriority);
    const accuracyReward = Math.max(0, 10 - priorityDifference * 2);
    
    components.push({
      name: 'triage_accuracy',
      value: accuracyReward,
      weight: 0.4,
      category: RewardCategory.PATIENT_OUTCOMES
    });
    
    // Efficiency component - faster decisions get higher rewards
    const efficiencyReward = Math.max(0, 10 - decision.estimatedWaitTime / 10);
    components.push({
      name: 'efficiency',
      value: efficiencyReward,
      weight: 0.3,
      category: RewardCategory.EFFICIENCY
    });
    
    // Safety component - critical patients should be prioritized
    let safetyReward = 5;
    if (patient.currentCondition.acuity === AcuityLevel.CRITICAL && decision.priority > TriagePriority.URGENT) {
      safetyReward = -20; // Heavy penalty for under-triaging critical patients
    }
    
    components.push({
      name: 'safety',
      value: safetyReward,
      weight: 0.3,
      category: RewardCategory.SAFETY
    });
    
    const totalValue = components.reduce((sum, comp) => sum + (comp.value * comp.weight), 0);
    
    return {
      value: totalValue,
      components,
      reasoning: `Triage accuracy: ${accuracyReward.toFixed(1)}, Efficiency: ${efficiencyReward.toFixed(1)}, Safety: ${safetyReward.toFixed(1)}`
    };
  }

  private calculateOptimalPriority(patient: PatientProfile): TriagePriority {
    const { currentCondition, vitalSigns } = patient;
    
    // Simplified triage logic - in practice this would use clinical decision rules
    if (currentCondition.acuity === AcuityLevel.CRITICAL) {
      return TriagePriority.IMMEDIATE;
    }
    
    if (currentCondition.severity === SeverityLevel.SEVERE || 
        (vitalSigns.heartRate && vitalSigns.heartRate > 120) ||
        (vitalSigns.bloodPressure && vitalSigns.bloodPressure.systolic > 180)) {
      return TriagePriority.URGENT;
    }
    
    if (currentCondition.severity === SeverityLevel.MODERATE) {
      return TriagePriority.LESS_URGENT;
    }
    
    if (currentCondition.painLevel && currentCondition.painLevel > 7) {
      return TriagePriority.LESS_URGENT;
    }
    
    return TriagePriority.NON_URGENT;
  }

  private updateMetrics(patient: PatientProfile, decision: TriageDecision, reward: Reward): void {
    this.metrics.patientsProcessed++;
    
    // Update wait times
    const waitTime = decision.estimatedWaitTime;
    this.metrics.waitTimes.push(waitTime);
    this.metrics.averageWaitTime = this.metrics.waitTimes.reduce((a, b) => a + b, 0) / this.metrics.waitTimes.length;
    
    // Update accuracy
    const optimalPriority = this.calculateOptimalPriority(patient);
    const isAccurate = Math.abs(decision.priority - optimalPriority) <= 1;
    this.metrics.priorityAccuracy = (this.metrics.priorityAccuracy * (this.metrics.patientsProcessed - 1) + (isAccurate ? 1 : 0)) / this.metrics.patientsProcessed;
    
    // Update satisfaction (simplified)
    const satisfaction = Math.max(0, 1 - (waitTime / 240)); // Decreases with wait time
    this.metrics.patientSatisfaction = (this.metrics.patientSatisfaction * (this.metrics.patientsProcessed - 1) + satisfaction) / this.metrics.patientsProcessed;
    
    // Update cost
    const cost = this.calculateTriageCost(decision);
    this.metrics.totalCost += cost;
    
    // Check for safety incidents
    if (patient.currentCondition.acuity === AcuityLevel.CRITICAL && decision.priority > TriagePriority.URGENT) {
      this.metrics.safetyIncidents++;
    }
  }

  private calculateTriageCost(decision: TriageDecision): number {
    // Simplified cost calculation
    const baseCost = 50; // Base triage cost
    const priorityCost = {
      [TriagePriority.IMMEDIATE]: 200,
      [TriagePriority.URGENT]: 150,
      [TriagePriority.LESS_URGENT]: 100,
      [TriagePriority.SEMI_URGENT]: 75,
      [TriagePriority.NON_URGENT]: 50
    };
    
    return baseCost + (priorityCost[decision.priority] || 50);
  }

  private getAvailableResourceCount(): number {
    return this.resources.filter(r => r.available).length;
  }
}

// Types specific to the triage environment
interface TriageResource {
  id: string;
  type: string;
  capacity: number;
  available: boolean;
  requiredForPriority: TriagePriority[];
  costPerHour: number;
}

interface TriageMetrics {
  patientsProcessed: number;
  averageWaitTime: number;
  priorityAccuracy: number;
  resourceUtilization: number;
  patientSatisfaction: number;
  safetyIncidents: number;
  totalCost: number;
  waitTimes: number[];
  outcomesHistory: any[];
}

interface TriageEnvironmentConfig extends EnvironmentConfig {
  initialPatientCount?: number;
  patientArrivalRate?: number;
  resourceCapacity?: Record<string, number>;
  shiftType?: 'day' | 'night' | 'weekend';
} 