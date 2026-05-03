export interface Clinic {
  id: string
  name: string
  phone?: string
  location?: string
  permission_doc_url?: string
  logo_url?: string
  owner_id: string
  created_at: string
  updated_at: string
}

export interface CreateClinicDto {
  email: string
  password: string
  clinic_name: string
  clinic_phone: string
  clinic_location: string
  permission_doc_url?: string
}

export interface UpdateClinicDto {
  name?: string
  phone?: string
  location?: string
  permission_doc_url?: string
  logo_url?: string
}

export interface ClinicDashboard {
  appointmentsToday: number
  doctorCount: number
  pendingRequests: number
}

export interface JoinRequest {
  id: string
  clinic_id: string
  doctor_id: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  updated_at: string
  doctor?: {
    id: string
    name: string
    phone?: string
    email?: string
    photo_url?: string
    graduation_cert_url?: string
    work_permit_url?: string
  }
}
