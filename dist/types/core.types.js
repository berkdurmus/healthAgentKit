"use strict";
/**
 * Core types for Healthcare Agent Kit
 * Defines the fundamental interfaces for reinforcement learning in healthcare scenarios
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FoodSecurityLevel = exports.SocialSupportLevel = exports.TransportationAccess = exports.EducationLevel = exports.EmploymentStatus = exports.HousingStatus = exports.CareStepType = exports.ClinicalRole = exports.InsuranceType = exports.Gender = exports.AcuityLevel = exports.SeverityLevel = exports.TriagePriority = exports.RewardCategory = exports.EnvironmentType = exports.AgentType = exports.ActionType = exports.StateType = void 0;
// ============================================================================
// ENUMS AND CONSTANTS
// ============================================================================
var StateType;
(function (StateType) {
    StateType["INITIAL"] = "initial";
    StateType["PATIENT_ARRIVAL"] = "patient_arrival";
    StateType["TRIAGE_ASSESSMENT"] = "triage_assessment";
    StateType["WAITING"] = "waiting";
    StateType["CONSULTATION"] = "consultation";
    StateType["TREATMENT"] = "treatment";
    StateType["DISCHARGE"] = "discharge";
    StateType["TRANSFER"] = "transfer";
    StateType["EMERGENCY"] = "emergency";
})(StateType || (exports.StateType = StateType = {}));
var ActionType;
(function (ActionType) {
    ActionType["TRIAGE_ASSIGN"] = "triage_assign";
    ActionType["PRIORITIZE_PATIENT"] = "prioritize_patient";
    ActionType["SCHEDULE_APPOINTMENT"] = "schedule_appointment";
    ActionType["REQUEST_TESTS"] = "request_tests";
    ActionType["PRESCRIBE_MEDICATION"] = "prescribe_medication";
    ActionType["REFER_SPECIALIST"] = "refer_specialist";
    ActionType["DISCHARGE_PATIENT"] = "discharge_patient";
    ActionType["ESCALATE_CARE"] = "escalate_care";
    ActionType["REASSESS_CONDITION"] = "reassess_condition";
    ActionType["WAIT"] = "wait";
})(ActionType || (exports.ActionType = ActionType = {}));
var AgentType;
(function (AgentType) {
    AgentType["RULE_BASED"] = "rule_based";
    AgentType["ML_MODEL"] = "ml_model";
    AgentType["LLM_AGENT"] = "llm_agent";
    AgentType["HYBRID"] = "hybrid";
    AgentType["HUMAN_EXPERT"] = "human_expert";
})(AgentType || (exports.AgentType = AgentType = {}));
var EnvironmentType;
(function (EnvironmentType) {
    EnvironmentType["EMERGENCY_DEPARTMENT"] = "emergency_department";
    EnvironmentType["PRIMARY_CARE"] = "primary_care";
    EnvironmentType["SPECIALIST_CLINIC"] = "specialist_clinic";
    EnvironmentType["HOSPITAL_WARD"] = "hospital_ward";
    EnvironmentType["TELEMEDICINE"] = "telemedicine";
    EnvironmentType["TRIAGE_CENTER"] = "triage_center";
})(EnvironmentType || (exports.EnvironmentType = EnvironmentType = {}));
var RewardCategory;
(function (RewardCategory) {
    RewardCategory["PATIENT_OUTCOMES"] = "patient_outcomes";
    RewardCategory["EFFICIENCY"] = "efficiency";
    RewardCategory["SAFETY"] = "safety";
    RewardCategory["SATISFACTION"] = "satisfaction";
    RewardCategory["COST"] = "cost";
    RewardCategory["COMPLIANCE"] = "compliance";
})(RewardCategory || (exports.RewardCategory = RewardCategory = {}));
var TriagePriority;
(function (TriagePriority) {
    TriagePriority[TriagePriority["IMMEDIATE"] = 1] = "IMMEDIATE";
    TriagePriority[TriagePriority["URGENT"] = 2] = "URGENT";
    TriagePriority[TriagePriority["LESS_URGENT"] = 3] = "LESS_URGENT";
    TriagePriority[TriagePriority["SEMI_URGENT"] = 4] = "SEMI_URGENT";
    TriagePriority[TriagePriority["NON_URGENT"] = 5] = "NON_URGENT";
})(TriagePriority || (exports.TriagePriority = TriagePriority = {}));
var SeverityLevel;
(function (SeverityLevel) {
    SeverityLevel["MILD"] = "mild";
    SeverityLevel["MODERATE"] = "moderate";
    SeverityLevel["SEVERE"] = "severe";
    SeverityLevel["CRITICAL"] = "critical";
})(SeverityLevel || (exports.SeverityLevel = SeverityLevel = {}));
var AcuityLevel;
(function (AcuityLevel) {
    AcuityLevel["LOW"] = "low";
    AcuityLevel["MEDIUM"] = "medium";
    AcuityLevel["HIGH"] = "high";
    AcuityLevel["CRITICAL"] = "critical";
})(AcuityLevel || (exports.AcuityLevel = AcuityLevel = {}));
var Gender;
(function (Gender) {
    Gender["MALE"] = "male";
    Gender["FEMALE"] = "female";
    Gender["NON_BINARY"] = "non_binary";
    Gender["PREFER_NOT_TO_SAY"] = "prefer_not_to_say";
})(Gender || (exports.Gender = Gender = {}));
var InsuranceType;
(function (InsuranceType) {
    InsuranceType["PRIVATE"] = "private";
    InsuranceType["MEDICARE"] = "medicare";
    InsuranceType["MEDICAID"] = "medicaid";
    InsuranceType["UNINSURED"] = "uninsured";
    InsuranceType["GOVERNMENT"] = "government";
})(InsuranceType || (exports.InsuranceType = InsuranceType = {}));
var ClinicalRole;
(function (ClinicalRole) {
    ClinicalRole["PHYSICIAN"] = "physician";
    ClinicalRole["NURSE"] = "nurse";
    ClinicalRole["SPECIALIST"] = "specialist";
    ClinicalRole["TECHNICIAN"] = "technician";
    ClinicalRole["PHARMACIST"] = "pharmacist";
    ClinicalRole["THERAPIST"] = "therapist";
})(ClinicalRole || (exports.ClinicalRole = ClinicalRole = {}));
var CareStepType;
(function (CareStepType) {
    CareStepType["ASSESSMENT"] = "assessment";
    CareStepType["DIAGNOSTIC"] = "diagnostic";
    CareStepType["TREATMENT"] = "treatment";
    CareStepType["MONITORING"] = "monitoring";
    CareStepType["EDUCATION"] = "education";
    CareStepType["DISCHARGE_PLANNING"] = "discharge_planning";
})(CareStepType || (exports.CareStepType = CareStepType = {}));
var HousingStatus;
(function (HousingStatus) {
    HousingStatus["OWNED"] = "owned";
    HousingStatus["RENTED"] = "rented";
    HousingStatus["HOMELESS"] = "homeless";
    HousingStatus["TEMPORARY"] = "temporary";
})(HousingStatus || (exports.HousingStatus = HousingStatus = {}));
var EmploymentStatus;
(function (EmploymentStatus) {
    EmploymentStatus["EMPLOYED"] = "employed";
    EmploymentStatus["UNEMPLOYED"] = "unemployed";
    EmploymentStatus["RETIRED"] = "retired";
    EmploymentStatus["DISABLED"] = "disabled";
    EmploymentStatus["STUDENT"] = "student";
})(EmploymentStatus || (exports.EmploymentStatus = EmploymentStatus = {}));
var EducationLevel;
(function (EducationLevel) {
    EducationLevel["LESS_THAN_HIGH_SCHOOL"] = "less_than_high_school";
    EducationLevel["HIGH_SCHOOL"] = "high_school";
    EducationLevel["SOME_COLLEGE"] = "some_college";
    EducationLevel["COLLEGE_DEGREE"] = "college_degree";
    EducationLevel["GRADUATE_DEGREE"] = "graduate_degree";
})(EducationLevel || (exports.EducationLevel = EducationLevel = {}));
var TransportationAccess;
(function (TransportationAccess) {
    TransportationAccess["RELIABLE"] = "reliable";
    TransportationAccess["LIMITED"] = "limited";
    TransportationAccess["NONE"] = "none";
})(TransportationAccess || (exports.TransportationAccess = TransportationAccess = {}));
var SocialSupportLevel;
(function (SocialSupportLevel) {
    SocialSupportLevel["STRONG"] = "strong";
    SocialSupportLevel["MODERATE"] = "moderate";
    SocialSupportLevel["WEAK"] = "weak";
    SocialSupportLevel["NONE"] = "none";
})(SocialSupportLevel || (exports.SocialSupportLevel = SocialSupportLevel = {}));
var FoodSecurityLevel;
(function (FoodSecurityLevel) {
    FoodSecurityLevel["SECURE"] = "secure";
    FoodSecurityLevel["MODERATELY_INSECURE"] = "moderately_insecure";
    FoodSecurityLevel["SEVERELY_INSECURE"] = "severely_insecure";
})(FoodSecurityLevel || (exports.FoodSecurityLevel = FoodSecurityLevel = {}));
//# sourceMappingURL=core.types.js.map