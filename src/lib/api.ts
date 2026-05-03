import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { computed, unref, type MaybeRef } from 'vue'
import { apiFetch } from './utils'
import type { Clinic, ClinicDashboard, JoinRequest, UpdateClinicDto } from '@/domains/clinic/types'
import type { Doctor, DoctorQueueAppointment, UpdateDoctorDto } from '@/domains/doctor/types'
import type { Patient, PatientWithDocuments, CreatePatientDto, UpdatePatientDto, CreateDocumentDto } from '@/domains/patient/types'

export const API_BASE = '/3eyadahub-api'

export async function uploadFile(file: File): Promise<{ url: string; objectPath: string }> {
  const token = localStorage.getItem('token')
  const formData = new FormData()
  formData.append('file', file)
  const res = await fetch(`${API_BASE}/uploads/file`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }))
    throw new Error(err.message || 'Upload failed')
  }
  return res.json()
}

export function useClinicDashboard(clinicId: MaybeRef<string | undefined>) {
  return useQuery({
    queryKey: computed(() => ['clinic-dashboard', unref(clinicId)]),
    queryFn: () => apiFetch<ClinicDashboard>(`/clinics/${unref(clinicId)}/dashboard`),
    enabled: computed(() => !!unref(clinicId)),
  })
}

export function useClinic(clinicId: MaybeRef<string | undefined>) {
  return useQuery({
    queryKey: computed(() => ['clinic', unref(clinicId)]),
    queryFn: () => apiFetch<Clinic>(`/clinics/${unref(clinicId)}`),
    enabled: computed(() => !!unref(clinicId)),
  })
}

export function useUpdateClinic() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateClinicDto }) =>
      apiFetch<Clinic>(`/clinics/${id}`, { method: 'PUT', body: JSON.stringify(updates) }),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['clinic', id] })
    },
  })
}

export function useClinicDoctors(clinicId: MaybeRef<string | undefined>) {
  return useQuery({
    queryKey: computed(() => ['clinic-doctors', unref(clinicId)]),
    queryFn: () => apiFetch<Doctor[]>(`/doctors/clinic/${unref(clinicId)}`),
    enabled: computed(() => !!unref(clinicId)),
  })
}

export function useJoinRequests(clinicId: MaybeRef<string | undefined>) {
  return useQuery({
    queryKey: computed(() => ['join-requests', unref(clinicId)]),
    queryFn: () => apiFetch<JoinRequest[]>(`/join-requests/clinic/${unref(clinicId)}`),
    enabled: computed(() => !!unref(clinicId)),
  })
}

export function useDoctorProfile(doctorId: MaybeRef<string | undefined>) {
  return useQuery({
    queryKey: computed(() => ['doctor', unref(doctorId)]),
    queryFn: () => apiFetch<Doctor>(`/doctors/${unref(doctorId)}`),
    enabled: computed(() => !!unref(doctorId)),
  })
}

export function useUpdateDoctorSelf() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (updates: UpdateDoctorDto) =>
      apiFetch<Doctor>('/doctors/me', { method: 'PATCH', body: JSON.stringify(updates) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['doctor'] })
    },
  })
}

export function useDoctorQueue(
  doctorId: MaybeRef<string | undefined>,
  date: MaybeRef<string>,
) {
  return useQuery({
    queryKey: computed(() => ['queue', unref(doctorId), unref(date)]),
    queryFn: () =>
      apiFetch<DoctorQueueAppointment[]>(
        `/appointments/doctor/${unref(doctorId)}/queue?date=${unref(date)}`,
      ),
    enabled: computed(() => !!unref(doctorId)),
    refetchInterval: 10000,
  })
}

export function useCallNextPatient(doctorId: MaybeRef<string | undefined>) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () =>
      apiFetch(`/appointments/doctor/${unref(doctorId)}/call-next`, { method: 'PATCH' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['queue'] })
    },
  })
}

export function useClinicPatients(clinicId: MaybeRef<string | undefined>) {
  return useQuery({
    queryKey: computed(() => ['patients', unref(clinicId)]),
    queryFn: () => apiFetch<Patient[]>(`/patients/clinic/${unref(clinicId)}`),
    enabled: computed(() => !!unref(clinicId)),
  })
}

export function usePatient(patientId: MaybeRef<string | undefined>) {
  return useQuery({
    queryKey: computed(() => ['patient', unref(patientId)]),
    queryFn: () => apiFetch<PatientWithDocuments>(`/patients/${unref(patientId)}`),
    enabled: computed(() => !!unref(patientId)),
  })
}

export function useCreatePatient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreatePatientDto) =>
      apiFetch<Patient>('/patients', { method: 'POST', body: JSON.stringify(dto) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['patients'] })
    },
  })
}

export function useUpdatePatient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdatePatientDto }) =>
      apiFetch<Patient>(`/patients/${id}`, { method: 'PUT', body: JSON.stringify(updates) }),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['patient', id] })
      qc.invalidateQueries({ queryKey: ['patients'] })
    },
  })
}

export function useCreateDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateDocumentDto) =>
      apiFetch('/medical-documents', { method: 'POST', body: JSON.stringify(dto) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['patient'] })
    },
  })
}
