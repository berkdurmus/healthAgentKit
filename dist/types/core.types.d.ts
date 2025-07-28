/**
 * Core types for Healthcare Agent Kit
 * Defines the fundamental interfaces for reinforcement learning in healthcare scenarios
 */
/**
 * Represents the state of the healthcare environment at any given time
 */
export interface State {
    readonly id: string;
    readonly timestamp: Date;
    readonly type: StateType;
    readonly data: Record<string, unknown>;
    readonly isTerminal: boolean;
}
/**
 * Represents an action that can be taken by an agent
 */
export interface Action {
    readonly id: string;
    readonly type: ActionType;
    readonly parameters: Record<string, unknown>;
    readonly constraints?: ActionConstraint[];
    readonly estimatedDuration?: number;
    readonly requiredRole?: ClinicalRole;
}
/**
 * Represents the reward signal for an action in a given state
 */
export interface Reward {
    readonly value: number;
    readonly components: RewardComponent[];
    readonly reasoning?: string;
    readonly metadata?: Record<string, unknown>;
}
/**
 * Individual component of a reward (for multi-objective optimization)
 */
export interface RewardComponent {
    readonly name: string;
    readonly value: number;
    readonly weight: number;
    readonly category: RewardCategory;
}
/**
 * Core agent interface for healthcare RL
 */
export interface Agent {
    readonly id: string;
    readonly name: string;
    readonly type: AgentType;
    /**
     * Select an action given the current state and available actions
     */
    selectAction(state: State, availableActions: Action[]): Promise<Action>;
    /**
     * Update the agent's policy based on experience
     */
    update(experience: Experience): Promise<void>;
    /**
     * Get the agent's confidence in its action selection
     */
    getConfidence(state: State, action: Action): number;
    /**
     * Reset the agent's internal state
     */
    reset(): void;
    /**
     * Start a new episode
     */
    startEpisode(): void;
    /**
     * End the current episode
     */
    endEpisode(): void;
    /**
     * Get agent statistics
     */
    getStats(): AgentStats;
}
/**
 * Agent statistics interface
 */
export interface AgentStats {
    readonly id: string;
    readonly name: string;
    readonly type: AgentType;
    readonly episodeCount: number;
    readonly totalSteps: number;
    readonly experienceCount: number;
    readonly isTraining: boolean;
}
/**
 * Experience tuple for learning
 */
export interface Experience {
    readonly state: State;
    readonly action: Action;
    readonly reward: Reward;
    readonly nextState: State;
    readonly done: boolean;
    readonly timestamp: Date;
}
/**
 * Healthcare environment interface
 */
export interface Environment {
    readonly id: string;
    readonly name: string;
    readonly type: EnvironmentType;
    /**
     * Get the current state of the environment
     */
    getCurrentState(): State;
    /**
     * Get all valid actions for the current state
     */
    getAvailableActions(state?: State): Action[];
    /**
     * Execute an action and return the new state and reward
     */
    step(action: Action): Promise<StepResult>;
    /**
     * Reset the environment to initial state
     */
    reset(): Promise<State>;
    /**
     * Check if the environment has reached a terminal state
     */
    isDone(): boolean;
    /**
     * Get environment metrics and statistics
     */
    getMetrics(): EnvironmentMetrics;
    /**
     * Get environment statistics
     */
    getStats(): EnvironmentStats;
}
/**
 * Environment statistics interface
 */
export interface EnvironmentStats {
    readonly id: string;
    readonly name: string;
    readonly type: EnvironmentType;
    readonly totalEpisodes: number;
    readonly currentEpisodeSteps: number;
    readonly maxStepsPerEpisode: number;
    readonly isDone: boolean;
    readonly startTime: Date | null;
    readonly config: Record<string, unknown>;
}
/**
 * Result of taking a step in the environment
 */
export interface StepResult {
    readonly state: State;
    readonly reward: Reward;
    readonly done: boolean;
    readonly info: Record<string, unknown>;
}
/**
 * Patient profile with clinical information
 */
export interface PatientProfile {
    readonly id: string;
    readonly demographics: PatientDemographics;
    readonly medicalHistory: MedicalHistory;
    readonly currentCondition: CurrentCondition;
    readonly vitalSigns: VitalSigns;
    readonly socialDeterminants: SocialDeterminants;
    readonly riskFactors: RiskFactor[];
    readonly allergies: Allergy[];
    readonly medications: Medication[];
}
export interface PatientDemographics {
    readonly age: number;
    readonly gender: Gender;
    readonly ethnicity?: string;
    readonly language: string;
    readonly insuranceType: InsuranceType;
    readonly location: Location;
}
export interface MedicalHistory {
    readonly conditions: DiagnosedCondition[];
    readonly surgeries: Surgery[];
    readonly hospitalizations: Hospitalization[];
    readonly familyHistory: FamilyHistory[];
}
export interface CurrentCondition {
    readonly chiefComplaint: string;
    readonly symptoms: Symptom[];
    readonly onset: Date;
    readonly severity: SeverityLevel;
    readonly acuity: AcuityLevel;
    readonly painLevel?: number;
}
export interface VitalSigns {
    readonly temperature?: number;
    readonly bloodPressure?: {
        readonly systolic: number;
        readonly diastolic: number;
    };
    readonly heartRate?: number;
    readonly respiratoryRate?: number;
    readonly oxygenSaturation?: number;
    readonly bloodGlucose?: number;
    readonly timestamp: Date;
}
export interface SocialDeterminants {
    readonly housing: HousingStatus;
    readonly employment: EmploymentStatus;
    readonly education: EducationLevel;
    readonly transportation: TransportationAccess;
    readonly socialSupport: SocialSupportLevel;
    readonly foodSecurity: FoodSecurityLevel;
}
/**
 * Triage decision point in clinical workflow
 */
export interface TriageDecision {
    readonly patientId: string;
    readonly priority: TriagePriority;
    readonly estimatedWaitTime: number;
    readonly recommendedPath: CarePath;
    readonly confidence: number;
    readonly reasoning: string;
    readonly timestamp: Date;
}
/**
 * Care pathway definition
 */
export interface CarePath {
    readonly id: string;
    readonly name: string;
    readonly steps: CareStep[];
    readonly estimatedDuration: number;
    readonly requiredResources: Resource[];
    readonly triggers: PathTrigger[];
}
export interface CareStep {
    readonly id: string;
    readonly name: string;
    readonly type: CareStepType;
    readonly duration: number;
    readonly requirements: StepRequirement[];
    readonly outcomes: PossibleOutcome[];
}
export declare enum StateType {
    INITIAL = "initial",
    PATIENT_ARRIVAL = "patient_arrival",
    TRIAGE_ASSESSMENT = "triage_assessment",
    WAITING = "waiting",
    CONSULTATION = "consultation",
    TREATMENT = "treatment",
    DISCHARGE = "discharge",
    TRANSFER = "transfer",
    EMERGENCY = "emergency"
}
export declare enum ActionType {
    TRIAGE_ASSIGN = "triage_assign",
    PRIORITIZE_PATIENT = "prioritize_patient",
    SCHEDULE_APPOINTMENT = "schedule_appointment",
    REQUEST_TESTS = "request_tests",
    PRESCRIBE_MEDICATION = "prescribe_medication",
    REFER_SPECIALIST = "refer_specialist",
    DISCHARGE_PATIENT = "discharge_patient",
    ESCALATE_CARE = "escalate_care",
    REASSESS_CONDITION = "reassess_condition",
    WAIT = "wait"
}
export declare enum AgentType {
    RULE_BASED = "rule_based",
    ML_MODEL = "ml_model",
    LLM_AGENT = "llm_agent",
    HYBRID = "hybrid",
    HUMAN_EXPERT = "human_expert"
}
export declare enum EnvironmentType {
    EMERGENCY_DEPARTMENT = "emergency_department",
    PRIMARY_CARE = "primary_care",
    SPECIALIST_CLINIC = "specialist_clinic",
    HOSPITAL_WARD = "hospital_ward",
    TELEMEDICINE = "telemedicine",
    TRIAGE_CENTER = "triage_center"
}
export declare enum RewardCategory {
    PATIENT_OUTCOMES = "patient_outcomes",
    EFFICIENCY = "efficiency",
    SAFETY = "safety",
    SATISFACTION = "satisfaction",
    COST = "cost",
    COMPLIANCE = "compliance"
}
export declare enum TriagePriority {
    IMMEDIATE = 1,// Life-threatening
    URGENT = 2,// Within 15 minutes
    LESS_URGENT = 3,// Within 60 minutes
    SEMI_URGENT = 4,// Within 2 hours
    NON_URGENT = 5
}
export declare enum SeverityLevel {
    MILD = "mild",
    MODERATE = "moderate",
    SEVERE = "severe",
    CRITICAL = "critical"
}
export declare enum AcuityLevel {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
}
export declare enum Gender {
    MALE = "male",
    FEMALE = "female",
    NON_BINARY = "non_binary",
    PREFER_NOT_TO_SAY = "prefer_not_to_say"
}
export declare enum InsuranceType {
    PRIVATE = "private",
    MEDICARE = "medicare",
    MEDICAID = "medicaid",
    UNINSURED = "uninsured",
    GOVERNMENT = "government"
}
export declare enum ClinicalRole {
    PHYSICIAN = "physician",
    NURSE = "nurse",
    SPECIALIST = "specialist",
    TECHNICIAN = "technician",
    PHARMACIST = "pharmacist",
    THERAPIST = "therapist"
}
export declare enum CareStepType {
    ASSESSMENT = "assessment",
    DIAGNOSTIC = "diagnostic",
    TREATMENT = "treatment",
    MONITORING = "monitoring",
    EDUCATION = "education",
    DISCHARGE_PLANNING = "discharge_planning"
}
export interface ActionConstraint {
    readonly type: string;
    readonly value: unknown;
    readonly message?: string;
}
export interface Resource {
    readonly id: string;
    readonly type: string;
    readonly available: boolean;
    readonly capacity?: number;
    readonly location?: string;
}
export interface EnvironmentMetrics {
    readonly throughput: number;
    readonly averageWaitTime: number;
    readonly patientSatisfaction: number;
    readonly resourceUtilization: Record<string, number>;
    readonly costPerPatient: number;
    readonly safetyIncidents: number;
}
export interface Location {
    readonly address: string;
    readonly city: string;
    readonly state: string;
    readonly zipCode: string;
    readonly coordinates?: {
        readonly latitude: number;
        readonly longitude: number;
    };
}
export interface DiagnosedCondition {
    readonly icd10Code: string;
    readonly name: string;
    readonly diagnosedDate: Date;
    readonly severity: SeverityLevel;
}
export interface Symptom {
    readonly name: string;
    readonly severity: number;
    readonly duration: string;
    readonly location?: string;
}
export interface RiskFactor {
    readonly type: string;
    readonly level: "low" | "medium" | "high";
    readonly modifiable: boolean;
}
export interface Allergy {
    readonly allergen: string;
    readonly reaction: string;
    readonly severity: SeverityLevel;
}
export interface Medication {
    readonly name: string;
    readonly dosage: string;
    readonly frequency: string;
    readonly startDate: Date;
    readonly prescribedBy: string;
}
export interface Surgery {
    readonly procedure: string;
    readonly date: Date;
    readonly surgeon: string;
    readonly complications?: string[];
}
export interface Hospitalization {
    readonly reason: string;
    readonly admissionDate: Date;
    readonly dischargeDate: Date;
    readonly length: number;
}
export interface FamilyHistory {
    readonly condition: string;
    readonly relationship: string;
    readonly ageAtDiagnosis?: number;
}
export declare enum HousingStatus {
    OWNED = "owned",
    RENTED = "rented",
    HOMELESS = "homeless",
    TEMPORARY = "temporary"
}
export declare enum EmploymentStatus {
    EMPLOYED = "employed",
    UNEMPLOYED = "unemployed",
    RETIRED = "retired",
    DISABLED = "disabled",
    STUDENT = "student"
}
export declare enum EducationLevel {
    LESS_THAN_HIGH_SCHOOL = "less_than_high_school",
    HIGH_SCHOOL = "high_school",
    SOME_COLLEGE = "some_college",
    COLLEGE_DEGREE = "college_degree",
    GRADUATE_DEGREE = "graduate_degree"
}
export declare enum TransportationAccess {
    RELIABLE = "reliable",
    LIMITED = "limited",
    NONE = "none"
}
export declare enum SocialSupportLevel {
    STRONG = "strong",
    MODERATE = "moderate",
    WEAK = "weak",
    NONE = "none"
}
export declare enum FoodSecurityLevel {
    SECURE = "secure",
    MODERATELY_INSECURE = "moderately_insecure",
    SEVERELY_INSECURE = "severely_insecure"
}
export interface PathTrigger {
    readonly condition: string;
    readonly threshold?: number;
    readonly action: string;
}
export interface StepRequirement {
    readonly type: string;
    readonly value: unknown;
    readonly optional: boolean;
}
export interface PossibleOutcome {
    readonly id: string;
    readonly probability: number;
    readonly nextStep?: string;
    readonly impact: OutcomeImpact;
}
export interface OutcomeImpact {
    readonly patientHealth: number;
    readonly cost: number;
    readonly time: number;
    readonly satisfaction: number;
}
//# sourceMappingURL=core.types.d.ts.map