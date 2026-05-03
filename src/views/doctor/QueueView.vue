<template>
  <div class="p-4 md:p-6 space-y-5 md:space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <h1 class="text-xl md:text-2xl font-bold">{{ $t('queue.title') }}</h1>
      <button
        @click="callNext"
        :disabled="!hasWaiting || isCallingNext"
        class="flex items-center justify-center gap-2 px-5 py-2.5 bg-[hsl(var(--primary))] text-white font-semibold text-sm rounded-xl disabled:opacity-40 hover:opacity-90 transition-opacity w-full sm:w-auto"
      >
        <ArrowDownToLine :size="16" />
        {{ isCallingNext ? $t('common.loading') : $t('queue.callNext') }}
      </button>
    </div>

    <div v-if="isLoading" class="flex justify-center py-12">
      <Loader2 class="animate-spin text-[hsl(var(--primary))]" :size="32" />
    </div>
    <div v-else-if="!queue?.length" class="text-center py-16 text-[hsl(var(--muted-foreground))]">
      {{ $t('queue.noQueue') }}
    </div>

    <div v-else class="space-y-2.5">
      <div
        v-for="appt in queue"
        :key="appt.id"
        class="rounded-xl border transition-all overflow-hidden"
        :class="{
          'border-blue-400 bg-blue-50 shadow-md': appt.status === 'active',
          'border-[hsl(var(--border))] bg-white hover:shadow-sm': appt.status === 'waiting',
          'border-[hsl(var(--border))] bg-[hsl(var(--muted))] opacity-60': appt.status === 'done',
        }"
      >
        <div
          class="p-4 flex items-center justify-between gap-3 cursor-pointer"
          @click="toggle(appt.id)"
          role="button"
          :tabindex="0"
          @keydown.enter="toggle(appt.id)"
        >
          <div class="flex items-center gap-3 min-w-0">
            <div
              class="w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0"
              :class="appt.status === 'active' ? 'bg-blue-500 text-white' : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'"
            >
              {{ appt.queue_position }}
            </div>
            <div class="min-w-0">
              <div class="font-bold text-sm truncate">{{ appt.patient?.name || appt.patient_name || appt.patient_phone }}</div>
              <div class="text-xs text-[hsl(var(--muted-foreground))]">{{ appt.patient_phone }}</div>
            </div>
          </div>

          <div class="flex items-center gap-2 flex-shrink-0">
            <span
              class="px-2.5 py-1 text-xs font-bold rounded-full"
              :class="appt.status === 'active' ? 'bg-blue-500 text-white' : 'bg-yellow-100 text-yellow-700'"
            >
              {{ $t(`appointments.status.${appt.status}`) }}
            </span>
            <ChevronUp v-if="expandedId === appt.id" :size="18" class="text-[hsl(var(--muted-foreground))]" />
            <ChevronDown v-else :size="18" class="text-[hsl(var(--muted-foreground))]" />
          </div>
        </div>

        <div
          v-if="expandedId === appt.id"
          class="border-t border-[hsl(var(--border))] bg-white/70 p-4 space-y-3"
        >
          <div v-if="loadingDetailId === appt.id" class="flex justify-center py-4">
            <Loader2 class="animate-spin text-[hsl(var(--primary))]" :size="20" />
          </div>
          <template v-else-if="detailMap[appt.id]">
            <div class="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase">
              {{ $t('reservations.intakeDialog') }}
            </div>
            <IntakeAnswersList
              :questions="detailMap[appt.id]?.intake_test?.questions ?? null"
              :answers="detailMap[appt.id]?.intake_answers ?? null"
            />
          </template>
          <button
            v-if="appt.patient_id"
            @click.stop="navigateToPatient(appt.patient_id)"
            class="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[hsl(var(--primary))] text-white text-xs font-semibold rounded-lg hover:opacity-90"
          >
            {{ $t('queue.goToPatient') }}
            <ChevronLeft v-if="locale === 'ar'" :size="14" />
            <ChevronRight v-else :size="14" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Loader2, ArrowDownToLine, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useDoctorQueue, useCallNextPatient } from '@/lib/api'
import { apiFetch } from '@/lib/utils'
import IntakeAnswersList from '@/components/IntakeAnswersList.vue'

interface IntakeOption { id: string; text?: string; text_ar?: string; text_en?: string }
interface IntakeQ {
  id: string; type: string; required?: boolean
  text?: string; text_ar?: string; text_en?: string
  options?: IntakeOption[]
}
interface AppointmentDetail {
  id: string
  intake_test_id: string | null
  intake_answers: Record<string, string[]> | null
  intake_test: { id: string; name: string; questions: IntakeQ[] } | null
}

const { locale } = useI18n()
const router = useRouter()
const auth = useAuthStore()
const doctorId = computed(() => (auth.profile as { id?: string } | null)?.id)
const today = computed(() => new Date().toISOString().split('T')[0])

const { data: queue, isLoading } = useDoctorQueue(doctorId, today)
const callNextMutation = useCallNextPatient(doctorId)

const hasWaiting = computed(() => (queue.value ?? []).some(a => a.status === 'waiting'))
const isCallingNext = computed(() => callNextMutation.isPending.value)

const expandedId = ref<string | null>(null)
const loadingDetailId = ref<string | null>(null)
const detailMap = reactive<Record<string, AppointmentDetail | null>>({})

function openWhatsapp(phone: string | null | undefined, message: string) {
  if (!phone) return
  // Strip non-digits except leading +
  const cleaned = phone.replace(/[^\d+]/g, '').replace(/^\+/, '')
  if (!cleaned) return
  const url = `https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`
  window.open(url, '_blank', 'noopener')
}

function buildGreeting(kind: 'now' | 'next', name: string | null, hideName: boolean) {
  const safeName = hideName ? '' : (name || '')
  const ar = kind === 'now'
    ? `${safeName ? 'مرحباً ' + safeName + '،' : 'مرحباً،'} حان دورك الآن مع الطبيب. يُرجى التوجه إلى العيادة.`
    : `${safeName ? 'مرحباً ' + safeName + '،' : 'مرحباً،'} أنت التالي في قائمة الانتظار. يُرجى الاستعداد.`
  const en = kind === 'now'
    ? `${safeName ? 'Hi ' + safeName + ',' : 'Hi,'} it is your turn now with the doctor. Please come to the clinic.`
    : `${safeName ? 'Hi ' + safeName + ',' : 'Hi,'} you are next in the queue. Please get ready.`
  return locale.value === 'ar' ? ar : en
}

async function callNext() {
  const res = await callNextMutation.mutateAsync() as {
    notify?: {
      now_serving?: { name: string | null; phone: string | null; hide_name: boolean } | null
      next_up?: { name: string | null; phone: string | null; hide_name: boolean } | null
    }
  } | undefined
  const notify = res?.notify
  const nowServing = notify?.now_serving
  const nextUp = notify?.next_up
  if (nowServing?.phone) {
    openWhatsapp(nowServing.phone, buildGreeting('now', nowServing.name, !!nowServing.hide_name))
  }
  if (nextUp?.phone) {
    // Gate second popup behind a confirm so the browser doesn't block it.
    const ask = locale.value === 'ar'
      ? 'هل تريد إرسال إشعار واتساب للمريض التالي أيضاً؟'
      : 'Send a WhatsApp notice to the next patient too?'
    if (window.confirm(ask)) {
      openWhatsapp(nextUp.phone, buildGreeting('next', nextUp.name, !!nextUp.hide_name))
    }
  }
}

async function toggle(apptId: string) {
  if (expandedId.value === apptId) {
    expandedId.value = null
    return
  }
  expandedId.value = apptId
  if (detailMap[apptId]) return
  loadingDetailId.value = apptId
  try {
    detailMap[apptId] = await apiFetch<AppointmentDetail>(`/appointments/${apptId}`)
  } catch {
    detailMap[apptId] = null
  } finally {
    loadingDetailId.value = null
  }
}

function navigateToPatient(patientId: string) {
  router.push(`/doctor/patients/${patientId}`)
}
</script>
