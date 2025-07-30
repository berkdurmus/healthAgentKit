import React, { useState, useEffect } from 'react'
import { 
  User, 
  Heart, 
  Activity, 
  Thermometer, 
  RefreshCw,
  Clock,
  MapPin,
  Phone,
  AlertTriangle,
  Shield,
  Pill,
  FileText,
  Users,
  TrendingUp,
  BarChart3
} from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Progress } from './ui/progress'
import { Select, SelectOption } from './ui/select'

// Mock patient data based on the clinical.data.ts structure
interface PatientProfile {
  id: string
  demographics: {
    age: number
    gender: 'Male' | 'Female' | 'Other'
    ethnicity: string
    language: string
    insuranceType: 'Private' | 'Medicare' | 'Medicaid' | 'Uninsured'
    location: {
      address: string
      city: string
      state: string
      zipCode: string
    }
  }
  medicalHistory: {
    conditions: string[]
    surgeries: string[]
    hospitalizations: string[]
    familyHistory: string[]
  }
  currentCondition: {
    chiefComplaint: string
    symptoms: string[]
    onset: Date
    severity: 'Mild' | 'Moderate' | 'Severe' | 'Critical'
    acuity: 'Low' | 'Medium' | 'High' | 'Critical'
    painLevel: number
  }
  vitalSigns: {
    temperature: number
    bloodPressure: {
      systolic: number
      diastolic: number
    }
    heartRate: number
    respiratoryRate: number
    oxygenSaturation: number
    timestamp: Date
  }
  socialDeterminants: {
    housing: string
    employment: string
    education: string
    transportation: string
    socialSupport: string
    foodSecurity: string
  }
  riskFactors: string[]
  allergies: string[]
  medications: string[]
}

const generateMockPatient = (): PatientProfile => {
  const genders = ['Male', 'Female', 'Other'] as const
  const ethnicities = ['White', 'Black or African American', 'Hispanic or Latino', 'Asian', 'Native American', 'Other']
  const chiefComplaints = [
    'Chest pain',
    'Shortness of breath',
    'Abdominal pain',
    'Headache',
    'Fever',
    'Back pain',
    'Nausea and vomiting',
    'Dizziness',
    'Leg pain',
    'Cough'
  ]
  const severities = ['Mild', 'Moderate', 'Severe', 'Critical'] as const
  const acuities = ['Low', 'Medium', 'High', 'Critical'] as const

  return {
    id: `patient-${Math.random().toString(36).substr(2, 9)}`,
    demographics: {
      age: Math.floor(Math.random() * 80) + 20,
      gender: genders[Math.floor(Math.random() * genders.length)],
      ethnicity: ethnicities[Math.floor(Math.random() * ethnicities.length)],
      language: 'English',
      insuranceType: ['Private', 'Medicare', 'Medicaid', 'Uninsured'][Math.floor(Math.random() * 4)] as any,
      location: {
        address: `${Math.floor(Math.random() * 9999) + 1} Main St`,
        city: 'Healthcare City',
        state: 'HC',
        zipCode: `${Math.floor(Math.random() * 90000) + 10000}`
      }
    },
    medicalHistory: {
      conditions: ['Hypertension', 'Diabetes Type 2', 'Asthma'].slice(0, Math.floor(Math.random() * 3) + 1),
      surgeries: ['Appendectomy', 'Gallbladder removal'].slice(0, Math.floor(Math.random() * 2)),
      hospitalizations: [],
      familyHistory: ['Heart disease', 'Cancer', 'Diabetes'].slice(0, Math.floor(Math.random() * 3))
    },
    currentCondition: {
      chiefComplaint: chiefComplaints[Math.floor(Math.random() * chiefComplaints.length)],
      symptoms: ['Pain', 'Discomfort', 'Swelling'].slice(0, Math.floor(Math.random() * 3) + 1),
      onset: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Within last week
      severity: severities[Math.floor(Math.random() * severities.length)],
      acuity: acuities[Math.floor(Math.random() * acuities.length)],
      painLevel: Math.floor(Math.random() * 10) + 1
    },
    vitalSigns: {
      temperature: 98.6 + (Math.random() - 0.5) * 4,
      bloodPressure: {
        systolic: 120 + Math.floor(Math.random() * 40),
        diastolic: 80 + Math.floor(Math.random() * 20)
      },
      heartRate: 70 + Math.floor(Math.random() * 50),
      respiratoryRate: 16 + Math.floor(Math.random() * 8),
      oxygenSaturation: 96 + Math.floor(Math.random() * 4),
      timestamp: new Date()
    },
    socialDeterminants: {
      housing: 'Owned',
      employment: 'Employed',
      education: 'College Degree',
      transportation: 'Reliable',
      socialSupport: 'Strong',
      foodSecurity: 'Secure'
    },
    riskFactors: ['Smoking', 'High BMI'].slice(0, Math.floor(Math.random() * 2)),
    allergies: ['Penicillin', 'Latex'].slice(0, Math.floor(Math.random() * 2)),
    medications: ['Lisinopril', 'Metformin', 'Albuterol'].slice(0, Math.floor(Math.random() * 3))
  }
}

const PatientViewer: React.FC = () => {
  const [currentPatient, setCurrentPatient] = useState<PatientProfile>(generateMockPatient())
  const [generationSettings, setGenerationSettings] = useState({
    ageRange: 'all',
    severity: 'all',
    acuity: 'all'
  })
  const [patientHistory, setPatientHistory] = useState<PatientProfile[]>([])
  const [demographics, setDemographics] = useState({
    totalGenerated: 1247,
    averageAge: 54.3,
    genderDistribution: { male: 48.2, female: 49.1, other: 2.7 },
    severityDistribution: { mild: 32.1, moderate: 45.2, severe: 18.4, critical: 4.3 }
  })

  const generateNewPatient = () => {
    const newPatient = generateMockPatient()
    setCurrentPatient(newPatient)
    setPatientHistory(prev => [newPatient, ...prev.slice(0, 9)]) // Keep last 10
  }

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'mild': return 'success'
      case 'moderate': return 'warning'
      case 'severe': return 'destructive'
      case 'critical': return 'destructive'
      default: return 'secondary'
    }
  }

  const getAcuityColor = (acuity: string) => {
    switch (acuity.toLowerCase()) {
      case 'low': return 'success'
      case 'medium': return 'warning'
      case 'high': return 'destructive'
      case 'critical': return 'destructive'
      default: return 'secondary'
    }
  }

  const getVitalStatus = (vital: string, value: number) => {
    switch (vital) {
      case 'temperature':
        if (value < 97 || value > 100.4) return 'abnormal'
        return 'normal'
      case 'heartRate':
        if (value < 60 || value > 100) return 'abnormal'
        return 'normal'
      case 'bloodPressure':
        // Simplified - using systolic value
        if (value > 140) return 'abnormal'
        return 'normal'
      case 'oxygenSaturation':
        if (value < 95) return 'abnormal'
        return 'normal'
      default:
        return 'normal'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with Generation Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Patient Generation</h2>
          <p className="text-muted-foreground">
            Realistic patient profiles with clinical data distributions
          </p>
        </div>
        <Button onClick={generateNewPatient} className="flex items-center space-x-2">
          <RefreshCw className="h-4 w-4" />
          <span>Generate New Patient</span>
        </Button>
      </div>

      {/* Generation Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Generated</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{demographics.totalGenerated.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +247 from yesterday
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Age</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{demographics.averageAge}</div>
            <p className="text-xs text-muted-foreground">
              years old
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Cases</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{demographics.severityDistribution.critical}%</div>
            <p className="text-xs text-muted-foreground">
              require immediate care
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Distribution</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>Male</span>
                <span>{demographics.genderDistribution.male}%</span>
              </div>
              <Progress value={demographics.genderDistribution.male} className="h-1" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Current Patient Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Patient Overview */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <User className="h-6 w-6 text-blue-500" />
                  <div>
                    <CardTitle>Patient #{currentPatient.id}</CardTitle>
                    <CardDescription>
                      {currentPatient.demographics.age} year old {currentPatient.demographics.gender} • {currentPatient.demographics.ethnicity}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Badge variant={getSeverityColor(currentPatient.currentCondition.severity)}>
                    {currentPatient.currentCondition.severity}
                  </Badge>
                  <Badge variant={getAcuityColor(currentPatient.currentCondition.acuity)}>
                    {currentPatient.currentCondition.acuity} Acuity
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center">
                    <FileText className="h-4 w-4 mr-2" />
                    Chief Complaint
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {currentPatient.currentCondition.chiefComplaint}
                  </p>
                  <div className="flex items-center space-x-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>Onset: {currentPatient.currentCondition.onset.toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    <span>Pain Level: {currentPatient.currentCondition.painLevel}/10</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    Demographics
                  </h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Insurance: {currentPatient.demographics.insuranceType}</p>
                    <p>Language: {currentPatient.demographics.language}</p>
                    <p>Location: {currentPatient.demographics.location.city}, {currentPatient.demographics.location.state}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vital Signs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="h-5 w-5 mr-2" />
                Vital Signs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Thermometer className="h-4 w-4 text-red-500" />
                    <span className="text-sm">Temp</span>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{currentPatient.vitalSigns.temperature.toFixed(1)}°F</p>
                    <Badge variant={getVitalStatus('temperature', currentPatient.vitalSigns.temperature) === 'normal' ? 'success' : 'destructive'} className="text-xs">
                      {getVitalStatus('temperature', currentPatient.vitalSigns.temperature)}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Heart className="h-4 w-4 text-pink-500" />
                    <span className="text-sm">HR</span>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{currentPatient.vitalSigns.heartRate} bpm</p>
                    <Badge variant={getVitalStatus('heartRate', currentPatient.vitalSigns.heartRate) === 'normal' ? 'success' : 'destructive'} className="text-xs">
                      {getVitalStatus('heartRate', currentPatient.vitalSigns.heartRate)}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Activity className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">BP</span>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{currentPatient.vitalSigns.bloodPressure.systolic}/{currentPatient.vitalSigns.bloodPressure.diastolic}</p>
                    <Badge variant={getVitalStatus('bloodPressure', currentPatient.vitalSigns.bloodPressure.systolic) === 'normal' ? 'success' : 'destructive'} className="text-xs">
                      {getVitalStatus('bloodPressure', currentPatient.vitalSigns.bloodPressure.systolic)}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4 text-green-500" />
                    <span className="text-sm">SpO2</span>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{currentPatient.vitalSigns.oxygenSaturation}%</p>
                    <Badge variant={getVitalStatus('oxygenSaturation', currentPatient.vitalSigns.oxygenSaturation) === 'normal' ? 'success' : 'destructive'} className="text-xs">
                      {getVitalStatus('oxygenSaturation', currentPatient.vitalSigns.oxygenSaturation)}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Medical History & Current Status */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Medical History</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h5 className="text-xs font-medium text-muted-foreground mb-2">Conditions</h5>
                  <div className="flex flex-wrap gap-1">
                    {currentPatient.medicalHistory.conditions.map((condition, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {condition}
                      </Badge>
                    ))}
                    {currentPatient.medicalHistory.conditions.length === 0 && (
                      <span className="text-xs text-muted-foreground">None reported</span>
                    )}
                  </div>
                </div>
                
                <div>
                  <h5 className="text-xs font-medium text-muted-foreground mb-2">Allergies</h5>
                  <div className="flex flex-wrap gap-1">
                    {currentPatient.allergies.map((allergy, index) => (
                      <Badge key={index} variant="destructive" className="text-xs">
                        {allergy}
                      </Badge>
                    ))}
                    {currentPatient.allergies.length === 0 && (
                      <span className="text-xs text-muted-foreground">NKDA</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center">
                  <Pill className="h-4 w-4 mr-2" />
                  Current Medications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {currentPatient.medications.map((medication, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                      <span className="text-sm">{medication}</span>
                      <Badge variant="outline" className="text-xs">Active</Badge>
                    </div>
                  ))}
                  {currentPatient.medications.length === 0 && (
                    <span className="text-sm text-muted-foreground">No current medications</span>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Patient History & Generation Settings */}
        <div className="space-y-6">
          {/* Generation Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Generation Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Age Range</label>
                <Select 
                  value={generationSettings.ageRange}
                  onChange={(e) => setGenerationSettings(prev => ({ ...prev, ageRange: e.target.value }))}
                >
                  <SelectOption value="all">All Ages</SelectOption>
                  <SelectOption value="pediatric">Pediatric (0-17)</SelectOption>
                  <SelectOption value="adult">Adult (18-64)</SelectOption>
                  <SelectOption value="geriatric">Geriatric (65+)</SelectOption>
                </Select>
              </div>
              
              <div>
                <label className="text-xs font-medium text-muted-foreground">Severity</label>
                <Select 
                  value={generationSettings.severity}
                  onChange={(e) => setGenerationSettings(prev => ({ ...prev, severity: e.target.value }))}
                >
                  <SelectOption value="all">All Severities</SelectOption>
                  <SelectOption value="mild">Mild</SelectOption>
                  <SelectOption value="moderate">Moderate</SelectOption>
                  <SelectOption value="severe">Severe</SelectOption>
                  <SelectOption value="critical">Critical</SelectOption>
                </Select>
              </div>
              
              <div>
                <label className="text-xs font-medium text-muted-foreground">Acuity Level</label>
                <Select 
                  value={generationSettings.acuity}
                  onChange={(e) => setGenerationSettings(prev => ({ ...prev, acuity: e.target.value }))}
                >
                  <SelectOption value="all">All Acuity Levels</SelectOption>
                  <SelectOption value="low">Low</SelectOption>
                  <SelectOption value="medium">Medium</SelectOption>
                  <SelectOption value="high">High</SelectOption>
                  <SelectOption value="critical">Critical</SelectOption>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Recent Patients */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Recent Patients</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {patientHistory.slice(0, 5).map((patient, index) => (
                  <div 
                    key={patient.id}
                    className="flex items-center justify-between p-2 bg-muted/50 rounded cursor-pointer hover:bg-muted transition-colors"
                    onClick={() => setCurrentPatient(patient)}
                  >
                    <div>
                      <p className="text-xs font-medium">#{patient.id.slice(-6)}</p>
                      <p className="text-xs text-muted-foreground">{patient.currentCondition.chiefComplaint}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant={getSeverityColor(patient.currentCondition.severity)} className="text-xs">
                        {patient.currentCondition.severity}
                      </Badge>
                    </div>
                  </div>
                ))}
                {patientHistory.length === 0 && (
                  <p className="text-xs text-muted-foreground">No previous patients</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default PatientViewer 