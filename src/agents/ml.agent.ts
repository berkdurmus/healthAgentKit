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
 * ML-based Triage Agent using neural network concepts
 * Learns from experience to improve triage decisions over time
 */
export class MLTriageAgent extends BaseAgent {
  private weights: MLWeights;
  private learningRate: number = 0.01;
  private explorationRate: number = 0.1;
  private decayRate: number = 0.995;
  private trainingHistory: TrainingRecord[] = [];
  
  constructor(name: string = 'ML Triage Agent', id?: string) {
    super(name, AgentType.ML_MODEL, id);
    this.weights = this.initializeWeights();
  }

  /**
   * Select action using neural network-like decision making
   */
  public async selectAction(state: State, availableActions: Action[]): Promise<Action> {
    const triageActions = availableActions.filter(a => a.type === ActionType.TRIAGE_ASSIGN);
    
    if (triageActions.length === 0) {
      const waitAction = availableActions.find(a => a.type === ActionType.WAIT);
      if (waitAction) return waitAction;
      throw new Error('No valid actions available');
    }

    // Extract patient data from actions (simplified - in real implementation would come from state)
    const patientActions = this.groupActionsByPatient(triageActions);
    
    if (patientActions.size === 0) {
      const waitAction = availableActions.find(a => a.type === ActionType.WAIT);
      if (waitAction) return waitAction;
      throw new Error('No patients to triage');
    }

    // Select patient with highest urgency score
    const selectedPatient = this.selectPatientWithML(state, patientActions);
    
    if (!selectedPatient) {
      const waitAction = availableActions.find(a => a.type === ActionType.WAIT);
      if (waitAction) return waitAction;
      throw new Error('Could not select patient');
    }

    // Use ML model to predict optimal priority
    const predictedPriority = this.predictOptimalPriority(selectedPatient.patientData);
    
    // Exploration vs exploitation
    let targetPriority = predictedPriority;
    if (this.isTraining && Math.random() < this.explorationRate) {
      // Explore: choose random priority
      const priorities = [1, 2, 3, 4, 5] as TriagePriority[];
      targetPriority = priorities[Math.floor(Math.random() * priorities.length)];
      this.log('info', 'Exploring: chose random priority', { 
        predicted: predictedPriority, 
        chosen: targetPriority 
      });
    }

    // Find action matching target priority
    const targetAction = selectedPatient.actions.find(a => 
      a.parameters.priority === targetPriority
    );

    if (!targetAction) {
      this.log('warn', 'Target priority not available, using fallback', {
        targetPriority,
        availablePriorities: selectedPatient.actions.map(a => a.parameters.priority)
      });
      return selectedPatient.actions[0];
    }

    this.log('info', 'ML agent selected action', {
      patientId: selectedPatient.patientId,
      priority: targetPriority,
      confidence: this.getConfidence(state, targetAction)
    });

    return targetAction;
  }

  /**
   * Update the agent's neural network weights based on experience
   */
  public async update(experience: Experience): Promise<void> {
    this.addExperience(experience);
    
    if (!this.isTraining) return;

    // Extract features from the experience
    const features = this.extractFeatures(experience.state, experience.action);
    const actualReward = experience.reward.value;
    
    // Get predicted Q-value for the action taken
    const predictedValue = this.predictQValue(features, experience.action);
    
    // Calculate target Q-value using Bellman equation
    const nextFeatures = this.extractFeatures(experience.nextState, experience.action);
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
      timestamp: new Date()
    });
    
    // Decay exploration rate
    this.explorationRate *= this.decayRate;
    this.explorationRate = Math.max(0.01, this.explorationRate); // Minimum exploration

    this.log('info', 'Updated ML model', {
      error: error.toFixed(3),
      explorationRate: this.explorationRate.toFixed(3),
      trainingSteps: this.trainingHistory.length
    });
  }

  /**
   * Get confidence based on model certainty
   */
  public getConfidence(state: State, action: Action): number {
    if (action.type !== ActionType.TRIAGE_ASSIGN) return 0.5;
    
    const features = this.extractFeatures(state, action);
    const qValue = this.predictQValue(features, action);
    
    // Convert Q-value to confidence (0-1 scale)
    const confidence = Math.min(0.95, Math.max(0.1, (qValue + 10) / 20));
    return confidence;
  }

  /**
   * Initialize neural network weights
   */
  private initializeWeights(): MLWeights {
    return {
      // Input layer weights (features to hidden layer)
      inputToHidden: this.randomMatrix(10, 8), // 10 features, 8 hidden units
      hiddenBias: this.randomArray(8),
      
      // Output layer weights (hidden to priority outputs)
      hiddenToOutput: this.randomMatrix(8, 5), // 8 hidden units, 5 priorities
      outputBias: this.randomArray(5)
    };
  }

  /**
   * Extract features from state and action for ML model
   */
  private extractFeatures(state: State, action: Action): number[] {
    // Extract patient features if available in action parameters
    const patientId = action.parameters.patientId as string;
    
    // In a real implementation, we'd extract patient data from state
    // For now, use simplified features
    const features = [
      // State features
      (state.data.queueLength as number) / 10 || 0, // Normalized queue length
      state.data.availableResources as number / 8 || 1, // Normalized resource availability
      state.timestamp.getHours() / 24, // Time of day
      
      // Mock patient features (would be extracted from actual patient data)
      Math.random(), // Age (normalized)
      Math.random(), // Vital signs composite
      Math.random(), // Severity score
      Math.random(), // Acuity score
      Math.random(), // Pain level
      Math.random(), // Comorbidity score
      Math.random()  // Social determinants score
    ];
    
    return features;
  }

  /**
   * Predict Q-value for a state-action pair
   */
  private predictQValue(features: number[], action: Action): number {
    const hidden = this.forwardPass(features);
    const priority = action.parameters.priority as TriagePriority;
    return hidden[priority - 1] || 0; // Priority 1-5 maps to index 0-4
  }

  /**
   * Get maximum Q-value for all possible actions in a state
   */
  private getMaxQValue(features: number[]): number {
    const hidden = this.forwardPass(features);
    return Math.max(...hidden);
  }

  /**
   * Forward pass through the neural network
   */
  private forwardPass(features: number[]): number[] {
    // Input to hidden layer
    const hidden = this.weights.hiddenBias.map((bias, i) => {
      let sum = bias;
      for (let j = 0; j < features.length; j++) {
        sum += features[j] * this.weights.inputToHidden[j][i];
      }
      return this.relu(sum);
    });

    // Hidden to output layer
    const output = this.weights.outputBias.map((bias, i) => {
      let sum = bias;
      for (let j = 0; j < hidden.length; j++) {
        sum += hidden[j] * this.weights.hiddenToOutput[j][i];
      }
      return sum;
    });

    return output;
  }

  /**
   * Update weights using gradient descent
   */
  private updateWeights(features: number[], error: number): void {
    // Simplified weight update (in practice would use proper backpropagation)
    
    // Update output layer weights
    for (let i = 0; i < this.weights.hiddenToOutput.length; i++) {
      for (let j = 0; j < this.weights.hiddenToOutput[i].length; j++) {
        this.weights.hiddenToOutput[i][j] += this.learningRate * error * features[i % features.length];
      }
    }
    
    // Update output bias
    for (let i = 0; i < this.weights.outputBias.length; i++) {
      this.weights.outputBias[i] += this.learningRate * error;
    }
    
    // Update input layer weights (simplified)
    for (let i = 0; i < this.weights.inputToHidden.length; i++) {
      for (let j = 0; j < this.weights.inputToHidden[i].length; j++) {
        this.weights.inputToHidden[i][j] += this.learningRate * error * features[i];
      }
    }
  }

  /**
   * Predict optimal priority using ML model
   */
  private predictOptimalPriority(patientData: PatientProfile | null): TriagePriority {
    if (!patientData) return TriagePriority.NON_URGENT;
    
    // Create feature vector from patient data
    const features = this.extractPatientFeatures(patientData);
    const qValues = this.forwardPass(features);
    
    // Select priority with highest Q-value
    const bestPriorityIndex = qValues.indexOf(Math.max(...qValues));
    return (bestPriorityIndex + 1) as TriagePriority;
  }

  /**
   * Extract features from patient data
   */
  private extractPatientFeatures(patient: PatientProfile): number[] {
    return [
      patient.demographics.age / 100, // Normalized age
      patient.currentCondition.painLevel ? patient.currentCondition.painLevel / 10 : 0,
      patient.vitalSigns.heartRate ? patient.vitalSigns.heartRate / 200 : 0,
      patient.vitalSigns.bloodPressure ? patient.vitalSigns.bloodPressure.systolic / 250 : 0,
      patient.vitalSigns.temperature ? (patient.vitalSigns.temperature - 36) / 5 : 0,
      patient.vitalSigns.oxygenSaturation ? patient.vitalSigns.oxygenSaturation / 100 : 1,
      this.encodeSeverity(patient.currentCondition.severity),
      this.encodeAcuity(patient.currentCondition.acuity),
      patient.medicalHistory.conditions.length / 10, // Normalized condition count
      Math.random() // Placeholder for additional features
    ];
  }

  /**
   * Helper methods
   */
  private groupActionsByPatient(actions: Action[]): Map<string, PatientTriageData> {
    const patientMap = new Map<string, PatientTriageData>();
    
    for (const action of actions) {
      const patientId = action.parameters.patientId as string;
      
      if (!patientMap.has(patientId)) {
        patientMap.set(patientId, {
          patientId,
          actions: [],
          patientData: null // Would be populated from state in real implementation
        });
      }
      
      patientMap.get(patientId)!.actions.push(action);
    }
    
    return patientMap;
  }

  private selectPatientWithML(state: State, patientActions: Map<string, PatientTriageData>): PatientTriageData | null {
    // For now, select first patient (would use ML scoring in practice)
    const patients = Array.from(patientActions.values());
    return patients.length > 0 ? patients[0] : null;
  }

  private encodeSeverity(severity: SeverityLevel): number {
    const mapping = {
      [SeverityLevel.MILD]: 0.25,
      [SeverityLevel.MODERATE]: 0.5,
      [SeverityLevel.SEVERE]: 0.75,
      [SeverityLevel.CRITICAL]: 1.0
    };
    return mapping[severity] || 0;
  }

  private encodeAcuity(acuity: AcuityLevel): number {
    const mapping = {
      [AcuityLevel.LOW]: 0.25,
      [AcuityLevel.MEDIUM]: 0.5,
      [AcuityLevel.HIGH]: 0.75,
      [AcuityLevel.CRITICAL]: 1.0
    };
    return mapping[acuity] || 0;
  }

  private relu(x: number): number {
    return Math.max(0, x);
  }

  private randomMatrix(rows: number, cols: number): number[][] {
    return Array(rows).fill(0).map(() => 
      Array(cols).fill(0).map(() => (Math.random() - 0.5) * 0.1)
    );
  }

  private randomArray(size: number): number[] {
    return Array(size).fill(0).map(() => (Math.random() - 0.5) * 0.1);
  }

  /**
   * Get training history for analysis
   */
  public getTrainingHistory(): readonly TrainingRecord[] {
    return [...this.trainingHistory];
  }

  /**
   * Get current model weights (for saving/loading)
   */
  public getWeights(): MLWeights {
    return JSON.parse(JSON.stringify(this.weights)); // Deep copy
  }

  /**
   * Set model weights (for loading trained model)
   */
  public setWeights(weights: MLWeights): void {
    this.weights = weights;
  }

  /**
   * Get learning parameters
   */
  public getLearningParams(): LearningParams {
    return {
      learningRate: this.learningRate,
      explorationRate: this.explorationRate,
      decayRate: this.decayRate,
      trainingSteps: this.trainingHistory.length
    };
  }
}

// Supporting interfaces
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

interface LearningParams {
  learningRate: number;
  explorationRate: number;
  decayRate: number;
  trainingSteps: number;
} 