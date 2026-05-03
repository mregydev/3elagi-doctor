export type ApprovalStatus = 'pending' | 'approved' | 'rejected'

export interface Doctor {
  id: string
  user_id: string
  name: string
  age?: number
  phone?: string
  photo_url?: string
  graduation_cert_url?: string
  work_permit_url?: string
  digital_signature_url?: string
  personal_clinic_location?: string
  default_clinic_id?: string | null
  email?: string
  professional_title?: string | null
  description?: string | null
  experience_years?: number | null
  consultation_fee_egp?: number | null
  approval_status?: ApprovalStatus
  created_at: string
  updated_at: string
}

export interface RegisterDoctorDto {
  email: string
  password: string
  name: string
  phone?: string
  age?: number
  photo_url?: string
  graduation_cert_url?: string
  work_permit_url?: string
}

export interface UpdateDoctorDto {
  name?: string
  phone?: string
  age?: number
  email?: string
  photo_url?: string
  graduation_cert_url?: string
  work_permit_url?: string
  digital_signature_url?: string
  personal_clinic_location?: string
}

export interface DoctorQueueAppointment {
  id: string
  clinic_id: string
  doctor_id: string | null
  patient_id: string | null
  patient_name: string | null
  patient_phone: string
  date: string
  time: string | null
  status: 'waiting' | 'active' | 'done' | 'cancelled'
  queue_position: number
  created_at: string
  updated_at: string
  patient?: { name: string; phone: string } | null
}
