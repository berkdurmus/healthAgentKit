import {
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

/**
 * Clinical Data Models for Realistic Patient Generation
 * Based on real-world healthcare statistics and distributions
 */

// Age-based demographic distributions
export const AGE_DEMOGRAPHICS = {
  pediatric: { min: 0, max: 17, weight: 0.22 },      // 22% of ED visits
  young_adult: { min: 18, max: 34, weight: 0.28 },  // 28%
  middle_aged: { min: 35, max: 54, weight: 0.25 },  // 25%
  older_adult: { min: 55, max: 74, weight: 0.18 },  // 18%
  elderly: { min: 75, max: 95, weight: 0.07 }       // 7%
};

// Chief complaints with real ED frequency distributions
export const CHIEF_COMPLAINTS = [
  {
    complaint: 'Chest pain',
    frequency: 0.08,
    urgencyDistribution: {
      [AcuityLevel.CRITICAL]: 0.15,
      [AcuityLevel.HIGH]: 0.35,
      [AcuityLevel.MEDIUM]: 0.30,
      [AcuityLevel.LOW]: 0.20
    },
    ageFactors: {
      pediatric: 0.1,
      young_adult: 0.8,
      middle_aged: 1.5,
      older_adult: 2.0,
      elderly: 2.5
    }
  },
  {
    complaint: 'Shortness of breath',
    frequency: 0.07,
    urgencyDistribution: {
      [AcuityLevel.CRITICAL]: 0.20,
      [AcuityLevel.HIGH]: 0.40,
      [AcuityLevel.MEDIUM]: 0.25,
      [AcuityLevel.LOW]: 0.15
    },
    ageFactors: {
      pediatric: 0.8,
      young_adult: 0.7,
      middle_aged: 1.2,
      older_adult: 1.8,
      elderly: 2.2
    }
  },
  {
    complaint: 'Abdominal pain',
    frequency: 0.12,
    urgencyDistribution: {
      [AcuityLevel.CRITICAL]: 0.05,
      [AcuityLevel.HIGH]: 0.20,
      [AcuityLevel.MEDIUM]: 0.45,
      [AcuityLevel.LOW]: 0.30
    },
    ageFactors: {
      pediatric: 1.2,
      young_adult: 1.3,
      middle_aged: 1.0,
      older_adult: 0.8,
      elderly: 0.7
    }
  },
  {
    complaint: 'Headache',
    frequency: 0.06,
    urgencyDistribution: {
      [AcuityLevel.CRITICAL]: 0.02,
      [AcuityLevel.HIGH]: 0.08,
      [AcuityLevel.MEDIUM]: 0.30,
      [AcuityLevel.LOW]: 0.60
    },
    ageFactors: {
      pediatric: 0.6,
      young_adult: 1.5,
      middle_aged: 1.2,
      older_adult: 0.8,
      elderly: 0.5
    }
  },
  {
    complaint: 'Motor vehicle accident',
    frequency: 0.04,
    urgencyDistribution: {
      [AcuityLevel.CRITICAL]: 0.30,
      [AcuityLevel.HIGH]: 0.40,
      [AcuityLevel.MEDIUM]: 0.20,
      [AcuityLevel.LOW]: 0.10
    },
    ageFactors: {
      pediatric: 0.5,
      young_adult: 2.0,
      middle_aged: 1.5,
      older_adult: 1.0,
      elderly: 0.8
    }
  },
  {
    complaint: 'Fever',
    frequency: 0.09,
    urgencyDistribution: {
      [AcuityLevel.CRITICAL]: 0.05,
      [AcuityLevel.HIGH]: 0.15,
      [AcuityLevel.MEDIUM]: 0.40,
      [AcuityLevel.LOW]: 0.40
    },
    ageFactors: {
      pediatric: 3.0,
      young_adult: 1.0,
      middle_aged: 0.8,
      older_adult: 1.2,
      elderly: 1.5
    }
  },
  {
    complaint: 'Back pain',
    frequency: 0.05,
    urgencyDistribution: {
      [AcuityLevel.CRITICAL]: 0.01,
      [AcuityLevel.HIGH]: 0.04,
      [AcuityLevel.MEDIUM]: 0.25,
      [AcuityLevel.LOW]: 0.70
    },
    ageFactors: {
      pediatric: 0.2,
      young_adult: 1.2,
      middle_aged: 1.8,
      older_adult: 1.5,
      elderly: 1.3
    }
  },
  {
    complaint: 'Laceration',
    frequency: 0.08,
    urgencyDistribution: {
      [AcuityLevel.CRITICAL]: 0.05,
      [AcuityLevel.HIGH]: 0.25,
      [AcuityLevel.MEDIUM]: 0.50,
      [AcuityLevel.LOW]: 0.20
    },
    ageFactors: {
      pediatric: 1.5,
      young_adult: 1.8,
      middle_aged: 1.2,
      older_adult: 0.8,
      elderly: 0.6
    }
  },
  {
    complaint: 'Psychiatric emergency',
    frequency: 0.06,
    urgencyDistribution: {
      [AcuityLevel.CRITICAL]: 0.15,
      [AcuityLevel.HIGH]: 0.30,
      [AcuityLevel.MEDIUM]: 0.35,
      [AcuityLevel.LOW]: 0.20
    },
    ageFactors: {
      pediatric: 0.3,
      young_adult: 2.0,
      middle_aged: 1.5,
      older_adult: 1.0,
      elderly: 0.8
    }
  },
  {
    complaint: 'Syncope',
    frequency: 0.03,
    urgencyDistribution: {
      [AcuityLevel.CRITICAL]: 0.10,
      [AcuityLevel.HIGH]: 0.30,
      [AcuityLevel.MEDIUM]: 0.40,
      [AcuityLevel.LOW]: 0.20
    },
    ageFactors: {
      pediatric: 0.5,
      young_adult: 0.8,
      middle_aged: 1.0,
      older_adult: 1.8,
      elderly: 2.5
    }
  }
];

// Comorbidity patterns based on real clinical data
export const COMORBIDITY_PATTERNS = [
  {
    name: 'Diabetes + Hypertension',
    prevalence: 0.08,
    ageMultiplier: { pediatric: 0.1, young_adult: 0.5, middle_aged: 1.5, older_adult: 2.0, elderly: 2.5 },
    complications: ['cardiovascular', 'renal', 'neuropathy'],
    riskFactor: 1.6
  },
  {
    name: 'COPD + Heart Disease',
    prevalence: 0.04,
    ageMultiplier: { pediatric: 0.01, young_adult: 0.1, middle_aged: 0.8, older_adult: 2.0, elderly: 3.0 },
    complications: ['respiratory', 'cardiovascular'],
    riskFactor: 2.1
  },
  {
    name: 'Hypertension + Hyperlipidemia',
    prevalence: 0.12,
    ageMultiplier: { pediatric: 0.05, young_adult: 0.3, middle_aged: 1.2, older_adult: 1.8, elderly: 2.2 },
    complications: ['cardiovascular', 'stroke'],
    riskFactor: 1.4
  },
  {
    name: 'Depression + Anxiety',
    prevalence: 0.06,
    ageMultiplier: { pediatric: 0.3, young_adult: 1.5, middle_aged: 1.3, older_adult: 1.0, elderly: 0.8 },
    complications: ['psychiatric', 'substance_abuse'],
    riskFactor: 1.3
  },
  {
    name: 'Asthma + Allergies',
    prevalence: 0.05,
    ageMultiplier: { pediatric: 2.0, young_adult: 1.5, middle_aged: 1.0, older_adult: 0.8, elderly: 0.6 },
    complications: ['respiratory', 'allergic'],
    riskFactor: 1.2
  }
];

// Vital signs ranges by age group (normal ranges)
export const VITAL_SIGNS_RANGES = {
  pediatric: {
    heartRate: { min: 80, max: 140, critical_low: 60, critical_high: 160 },
    systolicBP: { min: 90, max: 110, critical_low: 70, critical_high: 130 },
    diastolicBP: { min: 50, max: 70, critical_low: 40, critical_high: 85 },
    respiratoryRate: { min: 18, max: 30, critical_low: 12, critical_high: 40 },
    temperature: { min: 36.1, max: 37.2, critical_low: 35.0, critical_high: 39.0 },
    oxygenSaturation: { min: 95, max: 100, critical_low: 90 }
  },
  young_adult: {
    heartRate: { min: 60, max: 100, critical_low: 50, critical_high: 120 },
    systolicBP: { min: 110, max: 140, critical_low: 90, critical_high: 180 },
    diastolicBP: { min: 70, max: 90, critical_low: 60, critical_high: 110 },
    respiratoryRate: { min: 12, max: 20, critical_low: 8, critical_high: 30 },
    temperature: { min: 36.1, max: 37.2, critical_low: 35.0, critical_high: 39.5 },
    oxygenSaturation: { min: 95, max: 100, critical_low: 90 }
  },
  middle_aged: {
    heartRate: { min: 60, max: 100, critical_low: 50, critical_high: 120 },
    systolicBP: { min: 120, max: 150, critical_low: 90, critical_high: 190 },
    diastolicBP: { min: 75, max: 95, critical_low: 60, critical_high: 115 },
    respiratoryRate: { min: 12, max: 20, critical_low: 8, critical_high: 30 },
    temperature: { min: 36.1, max: 37.2, critical_low: 35.0, critical_high: 39.5 },
    oxygenSaturation: { min: 95, max: 100, critical_low: 90 }
  },
  older_adult: {
    heartRate: { min: 55, max: 95, critical_low: 45, critical_high: 115 },
    systolicBP: { min: 130, max: 160, critical_low: 100, critical_high: 200 },
    diastolicBP: { min: 70, max: 90, critical_low: 60, critical_high: 110 },
    respiratoryRate: { min: 12, max: 22, critical_low: 8, critical_high: 32 },
    temperature: { min: 36.0, max: 37.1, critical_low: 35.0, critical_high: 39.0 },
    oxygenSaturation: { min: 94, max: 100, critical_low: 88 }
  },
  elderly: {
    heartRate: { min: 50, max: 90, critical_low: 40, critical_high: 110 },
    systolicBP: { min: 130, max: 170, critical_low: 100, critical_high: 210 },
    diastolicBP: { min: 65, max: 85, critical_low: 55, critical_high: 105 },
    respiratoryRate: { min: 12, max: 24, critical_low: 8, critical_high: 35 },
    temperature: { min: 36.0, max: 37.0, critical_low: 35.0, critical_high: 38.5 },
    oxygenSaturation: { min: 92, max: 100, critical_low: 85 }
  }
};

// Social determinants distributions based on healthcare access research
export const SOCIAL_DETERMINANTS_DISTRIBUTIONS = {
  housing: {
    [HousingStatus.OWNED]: 0.65,
    [HousingStatus.RENTED]: 0.30,
    [HousingStatus.TEMPORARY]: 0.04,
    [HousingStatus.HOMELESS]: 0.01
  },
  employment: {
    [EmploymentStatus.EMPLOYED]: 0.60,
    [EmploymentStatus.UNEMPLOYED]: 0.08,
    [EmploymentStatus.RETIRED]: 0.16,
    [EmploymentStatus.DISABLED]: 0.12,
    [EmploymentStatus.STUDENT]: 0.04
  },
  education: {
    [EducationLevel.LESS_THAN_HIGH_SCHOOL]: 0.12,
    [EducationLevel.HIGH_SCHOOL]: 0.28,
    [EducationLevel.SOME_COLLEGE]: 0.30,
    [EducationLevel.COLLEGE_DEGREE]: 0.20,
    [EducationLevel.GRADUATE_DEGREE]: 0.10
  },
  transportation: {
    [TransportationAccess.RELIABLE]: 0.70,
    [TransportationAccess.LIMITED]: 0.25,
    [TransportationAccess.NONE]: 0.05
  },
  socialSupport: {
    [SocialSupportLevel.STRONG]: 0.45,
    [SocialSupportLevel.MODERATE]: 0.35,
    [SocialSupportLevel.WEAK]: 0.15,
    [SocialSupportLevel.NONE]: 0.05
  },
  foodSecurity: {
    [FoodSecurityLevel.SECURE]: 0.85,
    [FoodSecurityLevel.MODERATELY_INSECURE]: 0.10,
    [FoodSecurityLevel.SEVERELY_INSECURE]: 0.05
  }
};

// Insurance distribution in US healthcare
export const INSURANCE_DISTRIBUTIONS = {
  [InsuranceType.PRIVATE]: 0.49,
  [InsuranceType.MEDICARE]: 0.21,
  [InsuranceType.MEDICAID]: 0.20,
  [InsuranceType.GOVERNMENT]: 0.02,
  [InsuranceType.UNINSURED]: 0.08
};

// Gender distribution
export const GENDER_DISTRIBUTION = {
  [Gender.FEMALE]: 0.52,
  [Gender.MALE]: 0.47,
  [Gender.NON_BINARY]: 0.005,
  [Gender.PREFER_NOT_TO_SAY]: 0.005
};

// Pain level distributions by condition type
export const PAIN_DISTRIBUTIONS = {
  trauma: { low: 0.10, moderate: 0.30, high: 0.40, severe: 0.20 },
  cardiac: { low: 0.20, moderate: 0.35, high: 0.35, severe: 0.10 },
  respiratory: { low: 0.40, moderate: 0.35, high: 0.20, severe: 0.05 },
  gastrointestinal: { low: 0.25, moderate: 0.40, high: 0.25, severe: 0.10 },
  neurological: { low: 0.15, moderate: 0.25, high: 0.35, severe: 0.25 },
  psychiatric: { low: 0.60, moderate: 0.25, high: 0.10, severe: 0.05 },
  general: { low: 0.35, moderate: 0.35, high: 0.20, severe: 0.10 }
};

// Time-based arrival patterns (24-hour format)
export const ARRIVAL_PATTERNS = {
  // Higher arrival rates during these hours
  peak_hours: [9, 10, 11, 14, 15, 16, 19, 20, 21],
  // Lower arrival rates
  low_hours: [1, 2, 3, 4, 5, 6],
  // Moderate arrival rates
  moderate_hours: [7, 8, 12, 13, 17, 18, 22, 23, 0],
  
  // Multipliers for different time periods
  multipliers: {
    peak: 1.5,
    moderate: 1.0,
    low: 0.4
  }
};

// Seasonal variations in chief complaints
export const SEASONAL_PATTERNS = {
  respiratory: {
    winter: 1.8,
    spring: 1.1,
    summer: 0.7,
    fall: 1.4
  },
  trauma: {
    winter: 0.8,
    spring: 1.2,
    summer: 1.6,
    fall: 1.4
  },
  psychiatric: {
    winter: 1.3,
    spring: 1.0,
    summer: 0.9,
    fall: 1.1
  },
  cardiovascular: {
    winter: 1.2,
    spring: 1.0,
    summer: 0.9,
    fall: 1.1
  }
};

// Utility functions for data selection
export function getAgeGroup(age: number): string {
  if (age < 18) return 'pediatric';
  if (age < 35) return 'young_adult';
  if (age < 55) return 'middle_aged';
  if (age < 75) return 'older_adult';
  return 'elderly';
}

export function selectFromDistribution<T>(distribution: Record<T extends string | number | symbol ? T : never, number>): T {
  const random = Math.random();
  let cumulative = 0;
  
  for (const [key, probability] of Object.entries(distribution)) {
    cumulative += probability as number;
    if (random <= cumulative) {
      return key as T;
    }
  }
  
  // Fallback to first option
  return Object.keys(distribution)[0] as T;
}

export function getVitalSignsForAge(age: number): any {
  const ageGroup = getAgeGroup(age) as keyof typeof VITAL_SIGNS_RANGES;
  return VITAL_SIGNS_RANGES[ageGroup];
}

export function generateRealisticVitalSigns(age: number, acuity: AcuityLevel, hasComorbidities: boolean): any {
  const ranges = getVitalSignsForAge(age);
  const isCritical = acuity === AcuityLevel.CRITICAL || acuity === AcuityLevel.HIGH;
  
  // Generate vital signs based on acuity and comorbidities
  const heartRate = isCritical ? 
    Math.random() > 0.5 ? 
      ranges.heartRate.critical_low + Math.random() * 10 :
      ranges.heartRate.critical_high - Math.random() * 20 :
    ranges.heartRate.min + Math.random() * (ranges.heartRate.max - ranges.heartRate.min);
    
  const systolic = isCritical ?
    Math.random() > 0.5 ?
      ranges.systolicBP.critical_low + Math.random() * 15 :
      ranges.systolicBP.critical_high - Math.random() * 30 :
    ranges.systolicBP.min + Math.random() * (ranges.systolicBP.max - ranges.systolicBP.min);
    
  const diastolic = systolic * (0.6 + Math.random() * 0.2); // Realistic diastolic ratio
  
  return {
    heartRate: Math.round(heartRate),
    bloodPressure: {
      systolic: Math.round(systolic),
      diastolic: Math.round(diastolic)
    },
    respiratoryRate: Math.round(
      isCritical ? 
        ranges.respiratoryRate.critical_high - Math.random() * 8 :
        ranges.respiratoryRate.min + Math.random() * (ranges.respiratoryRate.max - ranges.respiratoryRate.min)
    ),
    temperature: 
      isCritical && Math.random() > 0.7 ?
        ranges.temperature.critical_high - Math.random() * 1.0 :
        ranges.temperature.min + Math.random() * (ranges.temperature.max - ranges.temperature.min),
    oxygenSaturation: Math.round(
      isCritical ?
        ranges.oxygenSaturation.critical_low + Math.random() * 5 :
        ranges.oxygenSaturation.min + Math.random() * (ranges.oxygenSaturation.max - ranges.oxygenSaturation.min)
    )
  };
} 