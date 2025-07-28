import { State, Action, StepResult } from '@/types/core.types';
import { BaseEnvironment, EnvironmentConfig } from '@/core/base.environment';
/**
 * Emergency Department Triage Environment
 * Simulates triage workflow where agents must prioritize patients based on acuity and resource availability
 */
export declare class TriageEnvironment extends BaseEnvironment {
    private patientQueue;
    private triageDecisions;
    private resources;
    private metrics;
    constructor(config?: TriageEnvironmentConfig);
    /**
     * Initialize triage resources (rooms, staff, equipment)
     */
    private initializeResources;
    /**
     * Get all available actions for the current state
     */
    getAvailableActions(state?: State): Action[];
    /**
     * Execute a step in the environment
     */
    step(action: Action): Promise<StepResult>;
    /**
     * Execute triage assignment action
     */
    private executeTriageAction;
    /**
     * Execute wait action
     */
    private executeWaitAction;
    /**
     * Reset the environment to initial state
     */
    reset(): Promise<State>;
    protected calculateAverageWaitTime(): number;
    protected calculatePatientSatisfaction(): number;
    protected calculateResourceUtilization(): Record<string, number>;
    protected calculateCostPerPatient(): number;
    protected getSafetyIncidents(): number;
    private generateInitialPatients;
    private generateRandomPatient;
    private simulatePatientArrivals;
    private updateResourceAvailability;
    private getTriageDuration;
    private getTriageConstraints;
    private calculateWaitTime;
    private getRecommendedCarePath;
    private calculateTriageReward;
    private calculateOptimalPriority;
    private updateMetrics;
    private calculateTriageCost;
    private getAvailableResourceCount;
}
interface TriageEnvironmentConfig extends EnvironmentConfig {
    initialPatientCount?: number;
    patientArrivalRate?: number;
    resourceCapacity?: Record<string, number>;
    shiftType?: 'day' | 'night' | 'weekend';
}
export {};
//# sourceMappingURL=triage.environment.d.ts.map