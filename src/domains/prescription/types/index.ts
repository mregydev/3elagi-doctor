export interface PrescriptionItem {
  name: string
  dose?: string
  frequency?: string
  duration?: string
  notes?: string
}

export interface Prescription {
  id: string
  doctor_id: string
  patient_id: string
  clinic_id: string | null
  title: string
  symptoms: string | null
  items: PrescriptionItem[]
  pdf_url: string | null
  created_at: string
}

export interface CreatePrescriptionDto {
  patient_id: string
  title: string
  symptoms?: string
  items: PrescriptionItem[]
}

export interface PrescriptionTemplate {
  items: PrescriptionItem[]
  symptoms: string | null
}
