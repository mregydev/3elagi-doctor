import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const basePath = import.meta.env.BASE_URL

const router = createRouter({
  history: createWebHistory(basePath),
  routes: [
    {
      path: '/',
      redirect: '/auth',
    },
    {
      path: '/auth',
      component: () => import('@/views/auth/AuthView.vue'),
      meta: { public: true },
    },
    {
      path: '/clinic',
      component: () => import('@/views/layout/ClinicLayout.vue'),
      meta: { role: 'clinic_admin' },
      children: [
        { path: '', redirect: '/clinic/dashboard' },
        { path: 'dashboard', component: () => import('@/views/clinic/DashboardView.vue') },
        { path: 'doctors', component: () => import('@/views/clinic/DoctorsView.vue') },
        { path: 'join-requests', component: () => import('@/views/clinic/JoinRequestsView.vue') },
        { path: 'patients', component: () => import('@/views/clinic/PatientsView.vue') },
        { path: 'patients/:id', component: () => import('@/views/clinic/PatientDetailView.vue') },
        { path: 'appointments', component: () => import('@/views/clinic/AppointmentsView.vue') },
        { path: 'settings', component: () => import('@/views/clinic/ClinicSettingsView.vue') },
      ],
    },
    {
      path: '/doctor',
      component: () => import('@/views/layout/DoctorLayout.vue'),
      meta: { role: 'doctor' },
      children: [
        { path: '', redirect: '/doctor/queue' },
        { path: 'queue', component: () => import('@/views/doctor/QueueView.vue') },
        { path: 'patients', component: () => import('@/views/doctor/DoctorPatientsView.vue') },
        { path: 'clinics', component: () => import('@/views/doctor/ClinicsView.vue') },
        { path: 'templates', component: () => import('@/views/doctor/PrescriptionTemplatesView.vue') },
        { path: 'intake-tests', component: () => import('@/views/doctor/IntakeTestsView.vue') },
        { path: 'intake-tests/new', component: () => import('@/views/doctor/IntakeTestBuilderView.vue') },
        { path: 'intake-tests/:id/edit', component: () => import('@/views/doctor/IntakeTestBuilderView.vue') },
        { path: 'schedule', component: () => import('@/views/doctor/DoctorScheduleView.vue') },
        { path: 'reservations', component: () => import('@/views/doctor/DoctorReservationsView.vue') },
        { path: 'patients/:id', component: () => import('@/views/clinic/PatientDetailView.vue') },
        { path: 'settings', component: () => import('@/views/doctor/DoctorSettingsView.vue') },
      ],
    },
    {
      path: '/admin',
      component: () => import('@/views/layout/AdminLayout.vue'),
      meta: { role: 'admin' },
      children: [
        { path: '', redirect: '/admin/doctors' },
        { path: 'doctors', component: () => import('@/views/admin/AdminDoctorsView.vue') },
        { path: 'clinics', component: () => import('@/views/admin/AdminClinicsView.vue') },
        { path: 'patients', component: () => import('@/views/admin/AdminPatientsView.vue') },
        { path: 'default-intake', component: () => import('@/views/admin/AdminDefaultIntakeView.vue') },
        { path: 'settings', component: () => import('@/views/admin/AdminSettingsView.vue') },
      ],
    },
    {
      path: '/prescriptions/new/:id',
      component: () => import('@/views/PrescriptionEditorView.vue'),
      meta: { role: 'doctor' },
    },
    {
      path: '/tv/:clinicId',
      component: () => import('@/views/TVQueueView.vue'),
      meta: { public: true },
    },
  ],
})

function defaultHomeForRole(role: string | null): string {
  if (role === 'admin') return '/admin'
  if (role === 'clinic_admin') return '/clinic'
  if (role === 'doctor') return '/doctor'
  return '/auth'
}

router.beforeEach((to) => {
  const auth = useAuthStore()
  auth.restoreSession()

  // Patients have no place in the doctor portal — clear their session here
  // so they can sign in with a doctor/clinic/admin account.
  if (auth.token && auth.role === 'patient') {
    auth.logout()
    if (to.path !== '/auth') return '/auth'
    return true
  }

  if (to.path === '/auth') {
    if (auth.token) return defaultHomeForRole(auth.role)
    return true
  }

  if (to.meta.public) return true

  if (!auth.token) return '/auth'

  if (to.meta.role && auth.role !== to.meta.role) {
    return defaultHomeForRole(auth.role)
  }

  return true
})

export default router
