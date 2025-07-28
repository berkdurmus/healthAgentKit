import { State, Action, Experience, PatientProfile, TriagePriority } from '@/types/core.types';
import { BaseAgent } from '@/core/base.agent';
/**
 * Rule-based agent that uses clinical guidelines for triage decisions
 * Based on established triage protocols like ESI (Emergency Severity Index)
 */
export declare class RuleBasedTriageAgent extends BaseAgent {
    private rules;
    private decisionHistory;
    constructor(name?: string, id?: string);
    /**
     * Select an action based on rule-based triage logic
     */
    selectAction(state: State, availableActions: Action[]): Promise<Action>;
    /**
     * Update the agent based on experience (rule-based agents typically don't learn)
     */
    update(experience: Experience): Promise<void>;
    /**
     * Get confidence in the selected action based on rule certainty
     */
    getConfidence(state: State, action: Action): number;
    /**
     * Initialize clinical triage rules based on established protocols
     */
    private initializeTriageRules;
    /**
     * Group available actions by patient ID
     */
    private groupActionsByPatient;
    /**
     * Select which patient to triage first based on urgency indicators
     */
    private selectPatientForTriage;
    /**
     * Apply triage rules to determine the appropriate priority
     */
    private applyTriageRules;
    /**
     * Get reasoning for the triage decision
     */
    private getTriageReasoning;
    /**
     * Record a triage decision for analysis
     */
    private recordDecision;
    /**
     * Calculate confidence in the decision based on rule strength
     */
    private calculateDecisionConfidence;
    /**
     * Update performance metrics based on experience
     */
    private updatePerformanceMetrics;
    /**
     * Get decision history for analysis
     */
    getDecisionHistory(): readonly TriageDecisionRecord[];
    /**
     * Get triage rules for inspection
     */
    getTriageRules(): readonly TriageRule[];
}
interface TriageRule {
    id: string;
    priority: TriagePriority;
    condition: (patient: PatientProfile) => boolean;
    weight: number;
    reasoning: string;
}
interface TriageDecisionRecord {
    patientId: string;
    assignedPriority: TriagePriority;
    confidence: number;
    reasoning: string;
    timestamp: Date;
    action: Action;
}
export {};
//# sourceMappingURL=rule-based.agent.d.ts.map