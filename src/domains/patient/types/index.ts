export interface Patient {
  id: string
  clinic_id: string
  name: string
  birth_date?: string
  phone: string
  age?: number
  created_at: string
  updated_at: string
}

export interface PatientWithDocuments extends Patient {
  documents: MedicalDocument[]
}

export interface CreatePatientDto {
  clinic_id: string
  name: string
  phone: string
  birth_date?: string
  age?: number
}

export interface UpdatePatientDto {
  name?: string
  phone?: string
  birth_date?: string
  age?: number
}

export type DocumentType = 'xray' | 'lab' | 'symptom' | 'prescription' | 'diagnosis'

export interface MedicalDocument {
  id: string
  patient_id: string
  type: DocumentType
  file_url?: string
  notes?: string
  file_name?: string
  created_at: string
  updated_at: string
}

export interface CreateDocumentDto {
  patient_id: string
  type: DocumentType
  file_url?: string
  notes?: string
  file_name?: string
}
