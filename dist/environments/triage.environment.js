"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TriageEnvironment = void 0;
const uuid_1 = require("uuid");
const core_types_1 = require("@/types/core.types");
const base_environment_1 = require("@/core/base.environment");
/**
 * Emergency Department Triage Environment
 * Simulates triage workflow where agents must prioritize patients based on acuity and resource availability
 */
class TriageEnvironment extends base_environment_1.BaseEnvironment {
    patientQueue = [];
    triageDecisions = [];
    resources = [];
    metrics;
    constructor(config = {}) {
        super('Emergency Department Triage', core_types_1.EnvironmentType.EMERGENCY_DEPARTMENT, config);
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
    initializeResources() {
        const config = this.config;
        this.resources = [
            {
                id: 'trauma-bay-1',
                type: 'trauma_bay',
                capacity: 1,
                available: true,
                requiredForPriority: [core_types_1.TriagePriority.IMMEDIATE],
                costPerHour: 500
            },
            {
                id: 'trauma-bay-2',
                type: 'trauma_bay',
                capacity: 1,
                available: true,
                requiredForPriority: [core_types_1.TriagePriority.IMMEDIATE],
                costPerHour: 500
            },
            {
                id: 'urgent-room-1',
                type: 'urgent_care_room',
                capacity: 1,
                available: true,
                requiredForPriority: [core_types_1.TriagePriority.URGENT, core_types_1.TriagePriority.LESS_URGENT],
                costPerHour: 200
            },
            {
                id: 'urgent-room-2',
                type: 'urgent_care_room',
                capacity: 1,
                available: true,
                requiredForPriority: [core_types_1.TriagePriority.URGENT, core_types_1.TriagePriority.LESS_URGENT],
                costPerHour: 200
            },
            {
                id: 'urgent-room-3',
                type: 'urgent_care_room',
                capacity: 1,
                available: true,
                requiredForPriority: [core_types_1.TriagePriority.URGENT, core_types_1.TriagePriority.LESS_URGENT],
                costPerHour: 200
            },
            {
                id: 'general-bed-1',
                type: 'general_bed',
                capacity: 1,
                available: true,
                requiredForPriority: [core_types_1.TriagePriority.SEMI_URGENT, core_types_1.TriagePriority.NON_URGENT],
                costPerHour: 100
            },
            {
                id: 'general-bed-2',
                type: 'general_bed',
                capacity: 1,
                available: true,
                requiredForPriority: [core_types_1.TriagePriority.SEMI_URGENT, core_types_1.TriagePriority.NON_URGENT],
                costPerHour: 100
            },
            {
                id: 'general-bed-3',
                type: 'general_bed',
                capacity: 1,
                available: true,
                requiredForPriority: [core_types_1.TriagePriority.SEMI_URGENT, core_types_1.TriagePriority.NON_URGENT],
                costPerHour: 100
            }
        ];
    }
    /**
     * Get all available actions for the current state
     */
    getAvailableActions(state) {
        const currentState = state || this.getCurrentState();
        const actions = [];
        // If there are patients waiting, offer triage actions
        if (this.patientQueue.length > 0) {
            for (const patient of this.patientQueue) {
                // Add triage priority actions for each priority level
                for (const priority of Object.values(core_types_1.TriagePriority)) {
                    if (typeof priority === 'number') {
                        actions.push({
                            id: `triage-${patient.id}-priority-${priority}`,
                            type: core_types_1.ActionType.TRIAGE_ASSIGN,
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
            type: core_types_1.ActionType.WAIT,
            parameters: { duration: 5 },
            estimatedDuration: 5
        });
        return actions;
    }
    /**
     * Execute a step in the environment
     */
    async step(action) {
        if (!this.validateAction(action)) {
            throw new Error(`Invalid action: ${action.id}`);
        }
        const prevState = this.getCurrentState();
        let reward;
        let newState;
        let done = false;
        switch (action.type) {
            case core_types_1.ActionType.TRIAGE_ASSIGN:
                ({ reward, newState, done } = await this.executeTriageAction(action));
                break;
            case core_types_1.ActionType.WAIT:
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
    async executeTriageAction(action) {
        const { patientId, priority, reasoning } = action.parameters;
        const patient = this.patientQueue.find(p => p.id === patientId);
        if (!patient) {
            throw new Error(`Patient ${patientId} not found in queue`);
        }
        // Create triage decision
        const triageDecision = {
            patientId: patientId,
            priority: priority,
            estimatedWaitTime: this.calculateWaitTime(priority),
            recommendedPath: this.getRecommendedCarePath(patient, priority),
            confidence: 0.8, // This would come from the agent in practice
            reasoning: reasoning,
            timestamp: new Date()
        };
        this.triageDecisions.push(triageDecision);
        // Remove patient from queue (they've been triaged)
        this.patientQueue = this.patientQueue.filter(p => p.id !== patientId);
        // Calculate reward based on triage accuracy and efficiency
        const reward = this.calculateTriageReward(patient, triageDecision);
        // Update metrics
        this.updateMetrics(patient, triageDecision, reward);
        const newState = this.createState(core_types_1.StateType.TRIAGE_ASSESSMENT, {
            queueLength: this.patientQueue.length,
            recentTriage: triageDecision,
            availableResources: this.getAvailableResourceCount(),
            metrics: { ...this.metrics }
        }, this.patientQueue.length === 0 && this.episodeSteps > 50 // Terminal if queue empty and sufficient steps
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
    async executeWaitAction(action) {
        const duration = action.parameters.duration || 5;
        // Small negative reward for waiting (encourages action)
        const reward = {
            value: -0.1 * duration,
            components: [
                {
                    name: 'efficiency_penalty',
                    value: -0.1 * duration,
                    weight: 1.0,
                    category: core_types_1.RewardCategory.EFFICIENCY
                }
            ],
            reasoning: `Waited ${duration} minutes without taking action`
        };
        const newState = this.createState(core_types_1.StateType.WAITING, {
            queueLength: this.patientQueue.length,
            waitDuration: duration,
            availableResources: this.getAvailableResourceCount()
        });
        return { reward, newState, done: false };
    }
    /**
     * Reset the environment to initial state
     */
    async reset() {
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
        const initialState = this.createState(core_types_1.StateType.INITIAL, {
            queueLength: this.patientQueue.length,
            availableResources: this.getAvailableResourceCount(),
            shift: 'day', // Could be parameterized
            weatherConditions: 'normal' // Could affect patient volume
        });
        this.updateState(initialState);
        return initialState;
    }
    // Implementation of abstract methods from BaseEnvironment
    calculateAverageWaitTime() {
        return this.metrics.averageWaitTime;
    }
    calculatePatientSatisfaction() {
        return this.metrics.patientSatisfaction;
    }
    calculateResourceUtilization() {
        const utilization = {};
        for (const resource of this.resources) {
            const utilizationRate = resource.available ? 0 : 1;
            utilization[resource.type] = utilizationRate;
        }
        return utilization;
    }
    calculateCostPerPatient() {
        return this.metrics.patientsProcessed > 0
            ? this.metrics.totalCost / this.metrics.patientsProcessed
            : 0;
    }
    getSafetyIncidents() {
        return this.metrics.safetyIncidents;
    }
    // Private helper methods
    generateInitialPatients() {
        const config = this.config;
        const initialPatients = config.initialPatientCount || 3;
        for (let i = 0; i < initialPatients; i++) {
            this.patientQueue.push(this.generateRandomPatient());
        }
    }
    generateRandomPatient() {
        // This would be more sophisticated in practice, possibly using real clinical data distributions
        const conditions = [
            { complaint: 'Chest pain', severity: core_types_1.SeverityLevel.SEVERE, acuity: core_types_1.AcuityLevel.HIGH },
            { complaint: 'Shortness of breath', severity: core_types_1.SeverityLevel.MODERATE, acuity: core_types_1.AcuityLevel.MEDIUM },
            { complaint: 'Abdominal pain', severity: core_types_1.SeverityLevel.MILD, acuity: core_types_1.AcuityLevel.LOW },
            { complaint: 'Headache', severity: core_types_1.SeverityLevel.MILD, acuity: core_types_1.AcuityLevel.LOW },
            { complaint: 'Trauma from accident', severity: core_types_1.SeverityLevel.CRITICAL, acuity: core_types_1.AcuityLevel.CRITICAL }
        ];
        const randomCondition = conditions[Math.floor(Math.random() * conditions.length)];
        return {
            id: (0, uuid_1.v4)(),
            demographics: {
                age: Math.floor(Math.random() * 80) + 10,
                gender: Math.random() > 0.5 ? core_types_1.Gender.MALE : core_types_1.Gender.FEMALE,
                language: 'English',
                insuranceType: core_types_1.InsuranceType.PRIVATE,
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
                housing: core_types_1.HousingStatus.OWNED,
                employment: core_types_1.EmploymentStatus.EMPLOYED,
                education: core_types_1.EducationLevel.COLLEGE_DEGREE,
                transportation: core_types_1.TransportationAccess.RELIABLE,
                socialSupport: core_types_1.SocialSupportLevel.STRONG,
                foodSecurity: core_types_1.FoodSecurityLevel.SECURE
            },
            riskFactors: [],
            allergies: [],
            medications: []
        };
    }
    simulatePatientArrivals() {
        const config = this.config;
        const arrivalRate = config.patientArrivalRate || 0.1; // 10% chance per step
        if (Math.random() < arrivalRate && this.patientQueue.length < 20) {
            this.patientQueue.push(this.generateRandomPatient());
            this.log('info', 'New patient arrived', { queueLength: this.patientQueue.length });
        }
    }
    updateResourceAvailability() {
        // Simulate resources becoming available over time
        // In a real system, this would be based on actual care completion times
        for (const resource of this.resources) {
            if (!resource.available && Math.random() < 0.05) { // 5% chance per step
                resource.available = true;
                this.log('info', `Resource ${resource.id} became available`);
            }
        }
    }
    getTriageDuration(priority) {
        // Time varies by priority complexity
        const baseTimes = {
            [core_types_1.TriagePriority.IMMEDIATE]: 2,
            [core_types_1.TriagePriority.URGENT]: 5,
            [core_types_1.TriagePriority.LESS_URGENT]: 8,
            [core_types_1.TriagePriority.SEMI_URGENT]: 10,
            [core_types_1.TriagePriority.NON_URGENT]: 12
        };
        return baseTimes[priority] || 10;
    }
    getTriageConstraints(patient, priority) {
        // Define constraints based on clinical guidelines
        return [];
    }
    calculateWaitTime(priority) {
        const availableResources = this.resources
            .filter(r => r.available && r.requiredForPriority.includes(priority));
        if (availableResources.length === 0) {
            // No resources available, estimate based on priority and queue
            const priorityMultiplier = {
                [core_types_1.TriagePriority.IMMEDIATE]: 0,
                [core_types_1.TriagePriority.URGENT]: 15,
                [core_types_1.TriagePriority.LESS_URGENT]: 60,
                [core_types_1.TriagePriority.SEMI_URGENT]: 120,
                [core_types_1.TriagePriority.NON_URGENT]: 240
            };
            return priorityMultiplier[priority] + (this.patientQueue.length * 10);
        }
        return Math.random() * 30; // Random wait time if resources available
    }
    getRecommendedCarePath(patient, priority) {
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
    calculateTriageReward(patient, decision) {
        const components = [];
        // Accuracy component - compare assigned priority to "ground truth"
        const optimalPriority = this.calculateOptimalPriority(patient);
        const priorityDifference = Math.abs(decision.priority - optimalPriority);
        const accuracyReward = Math.max(0, 10 - priorityDifference * 2);
        components.push({
            name: 'triage_accuracy',
            value: accuracyReward,
            weight: 0.4,
            category: core_types_1.RewardCategory.PATIENT_OUTCOMES
        });
        // Efficiency component - faster decisions get higher rewards
        const efficiencyReward = Math.max(0, 10 - decision.estimatedWaitTime / 10);
        components.push({
            name: 'efficiency',
            value: efficiencyReward,
            weight: 0.3,
            category: core_types_1.RewardCategory.EFFICIENCY
        });
        // Safety component - critical patients should be prioritized
        let safetyReward = 5;
        if (patient.currentCondition.acuity === core_types_1.AcuityLevel.CRITICAL && decision.priority > core_types_1.TriagePriority.URGENT) {
            safetyReward = -20; // Heavy penalty for under-triaging critical patients
        }
        components.push({
            name: 'safety',
            value: safetyReward,
            weight: 0.3,
            category: core_types_1.RewardCategory.SAFETY
        });
        const totalValue = components.reduce((sum, comp) => sum + (comp.value * comp.weight), 0);
        return {
            value: totalValue,
            components,
            reasoning: `Triage accuracy: ${accuracyReward.toFixed(1)}, Efficiency: ${efficiencyReward.toFixed(1)}, Safety: ${safetyReward.toFixed(1)}`
        };
    }
    calculateOptimalPriority(patient) {
        const { currentCondition, vitalSigns } = patient;
        // Simplified triage logic - in practice this would use clinical decision rules
        if (currentCondition.acuity === core_types_1.AcuityLevel.CRITICAL) {
            return core_types_1.TriagePriority.IMMEDIATE;
        }
        if (currentCondition.severity === core_types_1.SeverityLevel.SEVERE ||
            (vitalSigns.heartRate && vitalSigns.heartRate > 120) ||
            (vitalSigns.bloodPressure && vitalSigns.bloodPressure.systolic > 180)) {
            return core_types_1.TriagePriority.URGENT;
        }
        if (currentCondition.severity === core_types_1.SeverityLevel.MODERATE) {
            return core_types_1.TriagePriority.LESS_URGENT;
        }
        if (currentCondition.painLevel && currentCondition.painLevel > 7) {
            return core_types_1.TriagePriority.LESS_URGENT;
        }
        return core_types_1.TriagePriority.NON_URGENT;
    }
    updateMetrics(patient, decision, reward) {
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
        if (patient.currentCondition.acuity === core_types_1.AcuityLevel.CRITICAL && decision.priority > core_types_1.TriagePriority.URGENT) {
            this.metrics.safetyIncidents++;
        }
    }
    calculateTriageCost(decision) {
        // Simplified cost calculation
        const baseCost = 50; // Base triage cost
        const priorityCost = {
            [core_types_1.TriagePriority.IMMEDIATE]: 200,
            [core_types_1.TriagePriority.URGENT]: 150,
            [core_types_1.TriagePriority.LESS_URGENT]: 100,
            [core_types_1.TriagePriority.SEMI_URGENT]: 75,
            [core_types_1.TriagePriority.NON_URGENT]: 50
        };
        return baseCost + (priorityCost[decision.priority] || 50);
    }
    getAvailableResourceCount() {
        return this.resources.filter(r => r.available).length;
    }
}
exports.TriageEnvironment = TriageEnvironment;
//# sourceMappingURL=triage.environment.js.map