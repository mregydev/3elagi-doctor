import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiFetch } from '@/lib/utils'

interface ClinicProfile {
  id: string
  name: string
  phone?: string
  location?: string
  permission_doc_url?: string
  owner_id: string
  created_at: string
  updated_at: string
}

export interface DoctorProfile {
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
  default_clinic_id?: string
  email?: string
  created_at: string
  updated_at: string
}

export interface PatientProfile {
  user_id: string
  name: string
  phone: string
  birth_date?: string | null
  gender?: string | null
  chronic_conditions?: string | null
  allergies?: string | null
  medical_notes?: string | null
  onboarded_at?: string | null
  created_at?: string
  updated_at?: string
}

export type AppRole = 'admin' | 'clinic_admin' | 'doctor' | 'patient'

interface AuthResponse {
  access_token: string
  role: AppRole
  user_id: string
  profile: ClinicProfile | DoctorProfile | PatientProfile | null
}

interface RegisterClinicPayload {
  email: string
  password: string
  clinic_name: string
  clinic_phone: string
  clinic_location: string
  permission_doc_url?: string
}

interface RegisterDoctorPayload {
  email: string
  password: string
  name: string
  phone?: string
  age?: number
  photo_url?: string
  graduation_cert_url?: string
  work_permit_url?: string
}

interface RegisterPatientPayload {
  email: string
  password: string
  name: string
  phone: string
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(null)
  const role = ref<AppRole | null>(null)
  const userId = ref<string | null>(null)
  const profile = ref<ClinicProfile | DoctorProfile | PatientProfile | null>(null)

  const isAuthenticated = computed(() => !!token.value)

  function restoreSession() {
    const t = localStorage.getItem('token')
    const r = localStorage.getItem('role') as AppRole | null
    const u = localStorage.getItem('userId')
    const p = localStorage.getItem('profile')
    if (t) {
      token.value = t
      role.value = r
      userId.value = u
      profile.value = p ? JSON.parse(p) : null
    }
  }

  async function login(email: string, password: string) {
    const data = await apiFetch<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    setSession(data)
    return data
  }

  async function registerClinic(payload: RegisterClinicPayload) {
    const data = await apiFetch<AuthResponse>('/auth/register/clinic', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    setSession(data)
    return data
  }

  async function registerDoctor(payload: RegisterDoctorPayload) {
    const data = await apiFetch<AuthResponse>('/auth/register/doctor', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    setSession(data)
    return data
  }

  async function registerPatient(payload: RegisterPatientPayload) {
    const data = await apiFetch<AuthResponse>('/auth/register/patient', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    setSession(data)
    return data
  }

  function setSession(data: AuthResponse) {
    token.value = data.access_token
    role.value = data.role
    userId.value = data.user_id
    profile.value = data.profile
    localStorage.setItem('token', data.access_token)
    localStorage.setItem('role', data.role)
    localStorage.setItem('userId', data.user_id)
    localStorage.setItem('profile', JSON.stringify(data.profile))
  }

  function updateProfile(p: ClinicProfile | DoctorProfile | PatientProfile | null) {
    profile.value = p
    localStorage.setItem('profile', JSON.stringify(p))
  }

  function logout() {
    token.value = null
    role.value = null
    userId.value = null
    profile.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    localStorage.removeItem('userId')
    localStorage.removeItem('profile')
  }

  return {
    token,
    role,
    userId,
    profile,
    isAuthenticated,
    restoreSession,
    login,
    registerClinic,
    registerDoctor,
    registerPatient,
    updateProfile,
    logout,
  }
})
