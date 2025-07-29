import { v4 as uuidv4 } from 'uuid';
import {
  PatientProfile,
  SeverityLevel,
  AcuityLevel,
  Gender,
  InsuranceType,
  HousingStatus,
  EmploymentStatus,
  EducationLevel,
  TransportationAccess,
  SocialSupportLevel,
  FoodSecurityLevel,
  DiagnosedCondition,
  RiskFactor,
  Allergy,
  Medication
} from '@/types/core.types';

import {
  AGE_DEMOGRAPHICS,
  CHIEF_COMPLAINTS,
  COMORBIDITY_PATTERNS,
  VITAL_SIGNS_RANGES,
  SOCIAL_DETERMINANTS_DISTRIBUTIONS,
  INSURANCE_DISTRIBUTIONS,
  GENDER_DISTRIBUTION,
  PAIN_DISTRIBUTIONS,
  ARRIVAL_PATTERNS,
  getAgeGroup,
  selectFromDistribution,
  generateRealisticVitalSigns
} from '@/data/clinical.data';

/**
 * Realistic Patient Generator
 * Creates clinically accurate patient profiles using real-world medical distributions
 */
export class PatientGenerator {
  private seed: number;
  private generatedCount: number = 0;
  
  constructor(seed?: number) {
    this.seed = seed || Math.floor(Math.random() * 10000);
  }

  /**
   * Generate a realistic patient profile
   */
  public generatePatient(options: PatientGenerationOptions = {}): PatientProfile {
    const patientId = uuidv4();
    
    // Generate demographics
    const demographics = this.generateDemographics(options);
    
    // Generate chief complaint based on age and time factors
    const chiefComplaint = this.selectChiefComplaint(demographics.age, options.timeOfDay, options.season);
    
    // Generate medical history with comorbidities
    const medicalHistory = this.generateMedicalHistory(demographics.age, chiefComplaint);
    
    // Generate current condition based on chief complaint
    const currentCondition = this.generateCurrentCondition(chiefComplaint, demographics.age);
    
    // Generate realistic vital signs
    const vitalSigns = this.generateVitalSigns(demographics.age, currentCondition.acuity, medicalHistory.conditions.length > 0);
    
    // Generate social determinants
    const socialDeterminants = this.generateSocialDeterminants(demographics.age);
    
    // Generate risk factors based on age and conditions
    const riskFactors = this.generateRiskFactors(demographics.age, medicalHistory.conditions);
    
    // Generate allergies
    const allergies = this.generateAllergies(demographics.age);
    
    // Generate medications based on conditions
    const medications = this.generateMedications(medicalHistory.conditions, demographics.age);

    this.generatedCount++;

    const patient: PatientProfile = {
      id: patientId,
      demographics,
      medicalHistory,
      currentCondition,
      vitalSigns: {
        ...vitalSigns,
        timestamp: new Date()
      },
      socialDeterminants,
      riskFactors,
      allergies,
      medications
    };

    return patient;
  }

  /**
   * Generate multiple patients with realistic variety
   */
  public generatePatients(count: number, options: PatientGenerationOptions = {}): PatientProfile[] {
    const patients: PatientProfile[] = [];
    
    for (let i = 0; i < count; i++) {
      // Vary generation options to create realistic diversity
      const patientOptions = {
        ...options,
        timeOfDay: options.timeOfDay || this.getRandomHour(),
        season: options.season || this.getCurrentSeason()
      };
      
      patients.push(this.generatePatient(patientOptions));
    }
    
    return patients;
  }

  /**
   * Generate demographics based on real-world distributions
   */
  private generateDemographics(options: PatientGenerationOptions): any {
    // Select age group based on ED visit distributions
    const ageGroup = this.selectAgeGroup();
    const age = this.generateAgeInGroup(ageGroup);
    
    // Select gender
    const gender = options.gender || selectFromDistribution(GENDER_DISTRIBUTION);
    
    // Select insurance based on age
    const insuranceType = this.selectInsuranceByAge(age);
    
    return {
      age,
      gender,
      ethnicity: this.selectEthnicity(),
      language: this.selectLanguage(),
      insuranceType,
      location: this.generateLocation()
    };
  }

  /**
   * Select chief complaint based on age and contextual factors
   */
  private selectChiefComplaint(age: number, timeOfDay?: number, season?: string): any {
    const ageGroup = getAgeGroup(age);
    
    // Apply time and seasonal modifiers
    let modifiedComplaints = CHIEF_COMPLAINTS.map(complaint => {
      let weight = complaint.frequency;
      
      // Apply age factor
      const ageFactor = complaint.ageFactors[ageGroup as keyof typeof complaint.ageFactors] || 1.0;
      weight *= ageFactor;
      
      // Apply time-of-day factors
      if (timeOfDay !== undefined) {
        const timeMultiplier = this.getTimeMultiplier(timeOfDay);
        weight *= timeMultiplier;
      }
      
      // Apply seasonal factors if applicable
      if (season) {
        const seasonalMultiplier = this.getSeasonalMultiplier(complaint.complaint, season);
        weight *= seasonalMultiplier;
      }
      
      return { ...complaint, adjustedWeight: weight };
    });
    
    // Normalize weights
    const totalWeight = modifiedComplaints.reduce((sum, c) => sum + c.adjustedWeight, 0);
    const normalizedComplaints = modifiedComplaints.map(c => ({
      ...c,
      normalizedWeight: c.adjustedWeight / totalWeight
    }));
    
    // Select complaint based on weighted distribution
    const random = Math.random();
    let cumulative = 0;
    
    for (const complaint of normalizedComplaints) {
      cumulative += complaint.normalizedWeight;
      if (random <= cumulative) {
        return complaint;
      }
    }
    
    return modifiedComplaints[0]; // Fallback
  }

  /**
   * Generate medical history with realistic comorbidity patterns
   */
  private generateMedicalHistory(age: number, chiefComplaint: any): any {
    const ageGroup = getAgeGroup(age);
    const conditions: DiagnosedCondition[] = [];
    const surgeries: any[] = [];
    const hospitalizations: any[] = [];
    const familyHistory: any[] = [];
    
    // Add comorbidities based on age and patterns
    for (const pattern of COMORBIDITY_PATTERNS) {
      const ageMultiplier = pattern.ageMultiplier[ageGroup as keyof typeof pattern.ageMultiplier] || 1.0;
      const adjustedPrevalence = pattern.prevalence * ageMultiplier;
      
      if (Math.random() < adjustedPrevalence) {
        const condition: DiagnosedCondition = {
          icd10Code: this.generateICD10Code(pattern.name),
          name: pattern.name,
          diagnosedDate: this.generatePastDate(age),
          severity: this.selectSeverityForCondition(pattern.name)
        };
        conditions.push(condition);
        
        // Add related surgeries if applicable
        if (pattern.complications.includes('cardiovascular') && Math.random() < 0.1) {
          surgeries.push({
            procedure: 'Cardiac catheterization',
            date: this.generatePastDate(age),
            surgeon: 'Dr. Smith',
            complications: []
          });
        }
      }
    }
    
    // Add family history
    if (age > 30 && Math.random() < 0.3) {
      familyHistory.push({
        condition: 'Hypertension',
        relationship: 'Parent',
        ageAtDiagnosis: 55 + Math.floor(Math.random() * 20)
      });
    }
    
    return {
      conditions,
      surgeries,
      hospitalizations,
      familyHistory
    };
  }

  /**
   * Generate current condition based on chief complaint
   */
  private generateCurrentCondition(chiefComplaint: any, age: number): any {
    // Select acuity based on complaint's distribution
    const acuity = selectFromDistribution(chiefComplaint.urgencyDistribution) as AcuityLevel;
    
    // Map acuity to severity
    const severity = this.mapAcuityToSeverity(acuity);
    
    // Generate pain level based on condition type
    const painLevel = this.generatePainLevel(chiefComplaint.complaint, acuity);
    
    // Generate onset time (realistic for complaint type)
    const onset = this.generateOnsetTime(chiefComplaint.complaint);
    
    return {
      chiefComplaint: chiefComplaint.complaint,
      symptoms: this.generateSymptomsForComplaint(chiefComplaint.complaint),
      onset,
      severity,
      acuity,
      painLevel
    };
  }

  /**
   * Generate realistic vital signs
   */
  private generateVitalSigns(age: number, acuity: AcuityLevel, hasComorbidities: boolean): any {
    return generateRealisticVitalSigns(age, acuity, hasComorbidities);
  }

  /**
   * Generate social determinants
   */
  private generateSocialDeterminants(age: number): any {
    const ageGroup = getAgeGroup(age);
    
    // Adjust distributions based on age
    let housing = selectFromDistribution(SOCIAL_DETERMINANTS_DISTRIBUTIONS.housing);
    let employment = selectFromDistribution(SOCIAL_DETERMINANTS_DISTRIBUTIONS.employment);
    
    // Age-specific adjustments
    if (ageGroup === 'elderly' && employment === EmploymentStatus.EMPLOYED) {
      employment = Math.random() < 0.7 ? EmploymentStatus.RETIRED : EmploymentStatus.EMPLOYED;
    }
    if (ageGroup === 'pediatric') {
      employment = EmploymentStatus.STUDENT;
    }
    
    return {
      housing,
      employment,
      education: selectFromDistribution(SOCIAL_DETERMINANTS_DISTRIBUTIONS.education),
      transportation: selectFromDistribution(SOCIAL_DETERMINANTS_DISTRIBUTIONS.transportation),
      socialSupport: selectFromDistribution(SOCIAL_DETERMINANTS_DISTRIBUTIONS.socialSupport),
      foodSecurity: selectFromDistribution(SOCIAL_DETERMINANTS_DISTRIBUTIONS.foodSecurity)
    };
  }

  /**
   * Generate risk factors based on age and conditions
   */
  private generateRiskFactors(age: number, conditions: DiagnosedCondition[]): RiskFactor[] {
    const riskFactors: RiskFactor[] = [];
    
    // Age-related risk factors
    if (age > 65) {
      riskFactors.push({
        type: 'Advanced age',
        level: 'medium',
        modifiable: false
      });
    }
    
    // Condition-related risk factors
    if (conditions.some(c => c.name.includes('Diabetes'))) {
      riskFactors.push({
        type: 'Diabetes complications',
        level: 'high',
        modifiable: true
      });
    }
    
    // Lifestyle risk factors
    if (Math.random() < 0.15) {
      riskFactors.push({
        type: 'Smoking',
        level: 'high',
        modifiable: true
      });
    }
    
    return riskFactors;
  }

  /**
   * Generate allergies
   */
  private generateAllergies(age: number): Allergy[] {
    const allergies: Allergy[] = [];
    
    // Common drug allergies
    if (Math.random() < 0.08) {
      allergies.push({
        allergen: 'Penicillin',
        reaction: 'Rash',
        severity: SeverityLevel.MILD
      });
    }
    
    if (Math.random() < 0.05) {
      allergies.push({
        allergen: 'Shellfish',
        reaction: 'Anaphylaxis',
        severity: SeverityLevel.SEVERE
      });
    }
    
    return allergies;
  }

  /**
   * Generate medications based on conditions
   */
  private generateMedications(conditions: DiagnosedCondition[], age: number): Medication[] {
    const medications: Medication[] = [];
    
    for (const condition of conditions) {
      if (condition.name.includes('Hypertension')) {
        medications.push({
          name: 'Lisinopril',
          dosage: '10mg',
          frequency: 'Daily',
          startDate: condition.diagnosedDate,
          prescribedBy: 'Dr. Johnson'
        });
      }
      
      if (condition.name.includes('Diabetes')) {
        medications.push({
          name: 'Metformin',
          dosage: '500mg',
          frequency: 'Twice daily',
          startDate: condition.diagnosedDate,
          prescribedBy: 'Dr. Wilson'
        });
      }
    }
    
    return medications;
  }

  // Helper methods
  private selectAgeGroup(): string {
    return selectFromDistribution(
      Object.fromEntries(
        Object.entries(AGE_DEMOGRAPHICS).map(([group, data]) => [group, data.weight])
      )
    );
  }

  private generateAgeInGroup(ageGroup: string): number {
    const groupData = AGE_DEMOGRAPHICS[ageGroup as keyof typeof AGE_DEMOGRAPHICS];
    return Math.floor(Math.random() * (groupData.max - groupData.min + 1)) + groupData.min;
  }

  private selectInsuranceByAge(age: number): InsuranceType {
    if (age >= 65) {
      return Math.random() < 0.8 ? InsuranceType.MEDICARE : InsuranceType.PRIVATE;
    }
    return selectFromDistribution(INSURANCE_DISTRIBUTIONS);
  }

  private selectEthnicity(): string {
    const ethnicities = ['White', 'Black', 'Hispanic', 'Asian', 'Other'];
    const weights = [0.60, 0.18, 0.16, 0.04, 0.02];
    
    const random = Math.random();
    let cumulative = 0;
    
    for (let i = 0; i < ethnicities.length; i++) {
      cumulative += weights[i];
      if (random <= cumulative) {
        return ethnicities[i];
      }
    }
    
    return ethnicities[0];
  }

  private selectLanguage(): string {
    return Math.random() < 0.85 ? 'English' : 'Spanish';
  }

  private generateLocation(): any {
    const cities = ['Boston', 'New York', 'Chicago', 'Los Angeles', 'Houston'];
    const city = cities[Math.floor(Math.random() * cities.length)];
    
    return {
      address: `${Math.floor(Math.random() * 9999) + 1} Main St`,
      city,
      state: 'MA',
      zipCode: `${Math.floor(Math.random() * 90000) + 10000}`
    };
  }

  private generateICD10Code(conditionName: string): string {
    const codes: Record<string, string> = {
      'Diabetes + Hypertension': 'E11.9',
      'COPD + Heart Disease': 'J44.9',
      'Hypertension + Hyperlipidemia': 'I10',
      'Depression + Anxiety': 'F32.9',
      'Asthma + Allergies': 'J45.9'
    };
    
    return codes[conditionName] || 'Z99.9';
  }

  private selectSeverityForCondition(conditionName: string): SeverityLevel {
    if (conditionName.includes('COPD') || conditionName.includes('Heart Disease')) {
      return Math.random() < 0.3 ? SeverityLevel.SEVERE : SeverityLevel.MODERATE;
    }
    return Math.random() < 0.6 ? SeverityLevel.MILD : SeverityLevel.MODERATE;
  }

  private generatePastDate(age: number): Date {
    const maxYearsAgo = Math.min(age - 18, 30);
    const yearsAgo = Math.random() * maxYearsAgo;
    return new Date(Date.now() - yearsAgo * 365 * 24 * 60 * 60 * 1000);
  }

  private mapAcuityToSeverity(acuity: AcuityLevel): SeverityLevel {
    const mapping = {
      [AcuityLevel.CRITICAL]: SeverityLevel.CRITICAL,
      [AcuityLevel.HIGH]: SeverityLevel.SEVERE,
      [AcuityLevel.MEDIUM]: SeverityLevel.MODERATE,
      [AcuityLevel.LOW]: SeverityLevel.MILD
    };
    return mapping[acuity];
  }

  private generatePainLevel(complaint: string, acuity: AcuityLevel): number {
    const baseLevel = acuity === AcuityLevel.CRITICAL ? 8 :
                     acuity === AcuityLevel.HIGH ? 6 :
                     acuity === AcuityLevel.MEDIUM ? 4 : 2;
    
    return Math.min(10, Math.max(0, baseLevel + Math.floor(Math.random() * 3) - 1));
  }

  private generateOnsetTime(complaint: string): Date {
    // Acute conditions have recent onset
    if (complaint.includes('accident') || complaint.includes('trauma')) {
      return new Date(Date.now() - Math.random() * 2 * 60 * 60 * 1000); // Last 2 hours
    }
    
    // Other conditions may have longer onset
    const hoursAgo = Math.random() * 48; // Up to 48 hours
    return new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
  }

  private generateSymptomsForComplaint(complaint: string): any[] {
    const symptomMap: Record<string, string[]> = {
      'Chest pain': ['Shortness of breath', 'Nausea', 'Sweating'],
      'Shortness of breath': ['Cough', 'Fatigue', 'Wheezing'],
      'Abdominal pain': ['Nausea', 'Vomiting', 'Loss of appetite'],
      'Headache': ['Sensitivity to light', 'Nausea', 'Dizziness'],
      'Fever': ['Chills', 'Fatigue', 'Body aches']
    };
    
    const symptoms = symptomMap[complaint] || ['General discomfort'];
    return symptoms.slice(0, Math.floor(Math.random() * 3) + 1).map(name => ({
      name,
      severity: Math.floor(Math.random() * 10) + 1,
      duration: '2 hours',
      location: 'General'
    }));
  }

  private getRandomHour(): number {
    return Math.floor(Math.random() * 24);
  }

  private getCurrentSeason(): string {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'fall';
    return 'winter';
  }

  private getTimeMultiplier(hour: number): number {
    if (ARRIVAL_PATTERNS.peak_hours.includes(hour)) return ARRIVAL_PATTERNS.multipliers.peak;
    if (ARRIVAL_PATTERNS.low_hours.includes(hour)) return ARRIVAL_PATTERNS.multipliers.low;
    return ARRIVAL_PATTERNS.multipliers.moderate;
  }

  private getSeasonalMultiplier(complaint: string, season: string): number {
    if (complaint.includes('breath') || complaint.includes('Fever')) {
      return { winter: 1.8, spring: 1.1, summer: 0.7, fall: 1.4 }[season] || 1.0;
    }
    if (complaint.includes('accident') || complaint.includes('trauma')) {
      return { winter: 0.8, spring: 1.2, summer: 1.6, fall: 1.4 }[season] || 1.0;
    }
    return 1.0;
  }

  /**
   * Get generation statistics
   */
  public getStats(): PatientGeneratorStats {
    return {
      totalGenerated: this.generatedCount,
      seed: this.seed
    };
  }

  /**
   * Reset the generator
   */
  public reset(newSeed?: number): void {
    this.seed = newSeed || Math.floor(Math.random() * 10000);
    this.generatedCount = 0;
  }
}

// Supporting interfaces
export interface PatientGenerationOptions {
  gender?: Gender;
  ageGroup?: string;
  chiefComplaint?: string;
  acuityLevel?: AcuityLevel;
  timeOfDay?: number;
  season?: string;
  hasComorbidities?: boolean;
}

export interface PatientGeneratorStats {
  totalGenerated: number;
  seed: number;
} 