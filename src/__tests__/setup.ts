/**
 * Test setup and utilities for Health Agent Kit
 */
import { 
  StateType, 
  ActionType, 
  RewardCategory, 
  Gender,
  InsuranceType,
  HousingStatus,
  EmploymentStatus,
  EducationLevel,
  TransportationAccess,
  SocialSupportLevel,
  FoodSecurityLevel,
  SeverityLevel,
  AcuityLevel,
  EnvironmentType,
  AgentType
} from '../types/core.types';

// Mock implementations for testing
export const mockPatientProfile = {
  id: 'test-patient-1',
  demographics: {
    age: 45,
    gender: Gender.MALE,
    ethnicity: 'White',
    language: 'English',
    insuranceType: InsuranceType.PRIVATE,
    location: {
      address: '123 Test St',
      city: 'Test City',
      state: 'TS',
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
    chiefComplaint: 'Chest pain',
    symptoms: [],
    onset: new Date(),
    severity: SeverityLevel.MODERATE,
    acuity: AcuityLevel.MEDIUM,
    painLevel: 7
  },
  vitalSigns: {
    temperature: 37.0,
    bloodPressure: {
      systolic: 140,
      diastolic: 90
    },
    heartRate: 85,
    respiratoryRate: 16,
    oxygenSaturation: 98,
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

export const mockState = {
  id: 'test-state-1',
  timestamp: new Date(),
  type: StateType.INITIAL,
  data: { queueLength: 3 },
  isTerminal: false
};

export const mockAction = {
  id: 'test-action-1',
  type: ActionType.TRIAGE_ASSIGN,
  parameters: { patientId: 'test-patient-1', priority: 2 },
  estimatedDuration: 10
};

export const mockReward = {
  value: 5.0,
  components: [
    {
      name: 'accuracy',
      value: 8.0,
      weight: 0.5,
      category: RewardCategory.PATIENT_OUTCOMES
    },
    {
      name: 'efficiency',
      value: 2.0,
      weight: 0.5,
      category: RewardCategory.EFFICIENCY
    }
  ],
  reasoning: 'Good triage decision'
};

// Test utilities  
export const createMockEnvironment = () => ({
  id: 'test-env',
  name: 'Test Environment',
  type: EnvironmentType.EMERGENCY_DEPARTMENT,
  getCurrentState: jest.fn().mockReturnValue(mockState),
  getAvailableActions: jest.fn().mockReturnValue([mockAction]),
  step: jest.fn().mockResolvedValue({
    state: mockState,
    reward: mockReward,
    done: false,
    info: {}
  }),
  reset: jest.fn().mockResolvedValue(mockState),
  isDone: jest.fn().mockReturnValue(false),
  getMetrics: jest.fn().mockReturnValue({
    throughput: 1.0,
    averageWaitTime: 15,
    patientSatisfaction: 0.85,
    resourceUtilization: {},
    costPerPatient: 100,
    safetyIncidents: 0
  }),
  getStats: jest.fn().mockReturnValue({
    id: 'test-env',
    name: 'Test Environment',
    type: EnvironmentType.EMERGENCY_DEPARTMENT,
    totalEpisodes: 0,
    currentEpisodeSteps: 0,
    maxStepsPerEpisode: 100,
    isDone: false,
    startTime: new Date(),
    config: {}
  })
});

export const createMockAgent = () => ({
  id: 'test-agent',
  name: 'Test Agent',
  type: AgentType.RULE_BASED,
  selectAction: jest.fn().mockResolvedValue(mockAction),
  update: jest.fn().mockResolvedValue(undefined),
  getConfidence: jest.fn().mockReturnValue(0.8),
  reset: jest.fn(),
  startEpisode: jest.fn(),
  endEpisode: jest.fn(),
  getStats: jest.fn().mockReturnValue({
    id: 'test-agent',
    name: 'Test Agent',
    type: AgentType.RULE_BASED,
    episodeCount: 0,
    totalSteps: 0,
    experienceCount: 0,
    isTraining: true
  })
});

// Jest types should be available through @types/jest

// Jest setup
beforeEach(() => {
  jest.clearAllMocks();
});

// Global test timeout
jest.setTimeout(10000); 