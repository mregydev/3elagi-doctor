<template>
  <div class="p-4 md:p-6 max-w-5xl mx-auto" :dir="locale === 'ar' ? 'rtl' : 'ltr'">
    <div class="flex items-center justify-between mb-2 gap-3 flex-wrap">
      <div>
        <h1 class="text-xl md:text-2xl font-bold">{{ $t('templates.title') }}</h1>
        <p class="text-xs md:text-sm text-[hsl(var(--muted-foreground))] mt-1">{{ $t('templates.subtitle') }}</p>
      </div>
      <button
        @click="openCreate"
        class="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold bg-[hsl(var(--primary))] text-white rounded-lg hover:opacity-90"
      >
        <Plus :size="16" /> {{ $t('templates.add') }}
      </button>
    </div>

    <div v-if="isLoading" class="text-sm text-[hsl(var(--muted-foreground))] mt-6">{{ $t('common.loading') }}</div>

    <div v-else-if="!templates.length" class="mt-8 p-8 text-center bg-white border border-dashed border-[hsl(var(--border))] rounded-xl text-sm text-[hsl(var(--muted-foreground))]">
      {{ $t('templates.empty') }}
    </div>

    <div v-else class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
      <div
        v-for="tpl in templates"
        :key="tpl.id"
        class="bg-white border border-[hsl(var(--border))] rounded-xl p-4 flex flex-col"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <div class="font-semibold truncate">{{ tpl.name }}</div>
            <div v-if="tpl.title" class="text-xs text-[hsl(var(--primary))] mt-0.5 truncate">{{ tpl.title }}</div>
          </div>
          <div class="flex gap-1 flex-shrink-0">
            <button @click="openEdit(tpl)" class="p-1.5 rounded-lg hover:bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]">
              <Pencil :size="14" />
            </button>
            <button @click="remove(tpl)" class="p-1.5 rounded-lg hover:bg-red-50 text-red-500">
              <Trash2 :size="14" />
            </button>
          </div>
        </div>
        <div class="mt-2 text-xs text-[hsl(var(--muted-foreground))] space-y-0.5">
          <div v-for="(it, i) in tpl.items.slice(0, 4)" :key="i" class="truncate">
            • {{ it.name }}<span v-if="it.dose"> — {{ it.dose }}</span>
          </div>
          <div v-if="tpl.items.length > 4">+ {{ tpl.items.length - 4 }}</div>
          <div v-if="!tpl.items.length" class="italic">—</div>
        </div>
      </div>
    </div>

    <!-- Create / Edit modal -->
    <Teleport to="body">
      <div v-if="showModal" class="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" @click.self="closeModal">
        <div class="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[92vh] overflow-y-auto">
          <div class="flex items-center justify-between p-5 border-b border-[hsl(var(--border))] sticky top-0 bg-white">
            <h2 class="font-bold text-lg">{{ form.id ? $t('templates.edit') : $t('templates.add') }}</h2>
            <button @click="closeModal" class="p-1 rounded-lg hover:bg-[hsl(var(--muted))]"><X :size="18" /></button>
          </div>

          <form @submit.prevent="save" class="p-5 space-y-4">
            <div>
              <label class="block text-xs font-semibold mb-1.5">{{ $t('templates.nameLabel') }} <span class="text-red-500">*</span></label>
              <input v-model="form.name" required type="text" :placeholder="$t('templates.namePh')"
                class="w-full px-3 py-2.5 text-sm border border-[hsl(var(--border))] rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]" />
            </div>
            <div>
              <label class="block text-xs font-semibold mb-1.5">{{ $t('templates.diseaseLabel') }}</label>
              <input v-model="form.title" type="text" :placeholder="$t('templates.diseasePh')"
                class="w-full px-3 py-2.5 text-sm border border-[hsl(var(--border))] rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]" />
            </div>
            <div>
              <label class="block text-xs font-semibold mb-1.5">{{ $t('templates.symptomsLabel') }}</label>
              <textarea v-model="form.symptoms" rows="2"
                class="w-full px-3 py-2 text-sm border border-[hsl(var(--border))] rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]" />
            </div>

            <div>
              <div class="flex items-center justify-between mb-2">
                <label class="text-xs font-semibold">{{ $t('templates.medications') }}</label>
                <button type="button" @click="addItem" class="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[hsl(var(--primary))] bg-blue-50 rounded-md hover:bg-blue-100">
                  <Plus :size="12" /> {{ $t('prescription.addMedication') }}
                </button>
              </div>
              <div class="space-y-3">
                <div v-for="(item, idx) in form.items" :key="idx" class="border border-[hsl(var(--border))] rounded-xl p-3">
                  <div class="flex items-start justify-between gap-2 mb-2">
                    <div class="text-xs font-bold text-[hsl(var(--primary))]">#{{ idx + 1 }}</div>
                    <button type="button" @click="removeItem(idx)" class="text-red-400 hover:text-red-600"><Trash2 :size="14" /></button>
                  </div>
                  <input v-model="item.name" type="text" :placeholder="$t('prescription.medName')"
                    class="w-full px-2.5 py-2 text-sm font-medium border border-[hsl(var(--border))] rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]" />
                  <div class="grid grid-cols-3 gap-2">
                    <input v-model="item.dose" type="text" :placeholder="$t('prescription.dose')" class="px-2.5 py-1.5 text-xs border border-[hsl(var(--border))] rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]" />
                    <input v-model="item.frequency" type="text" :placeholder="$t('prescription.frequency')" class="px-2.5 py-1.5 text-xs border border-[hsl(var(--border))] rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]" />
                    <input v-model="item.duration" type="text" :placeholder="$t('prescription.duration')" class="px-2.5 py-1.5 text-xs border border-[hsl(var(--border))] rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]" />
                  </div>
                  <input v-model="item.notes" type="text" :placeholder="$t('prescription.medNotes')"
                    class="w-full mt-2 px-2.5 py-1.5 text-xs border border-[hsl(var(--border))] rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]" />
                </div>
                <button v-if="!form.items.length" type="button" @click="addItem"
                  class="w-full py-5 text-sm text-[hsl(var(--primary))] border-2 border-dashed border-[hsl(var(--primary))] rounded-xl hover:bg-blue-50">
                  + {{ $t('prescription.addFirstMedication') }}
                </button>
              </div>
            </div>

            <div class="flex gap-2 pt-2">
              <button type="button" @click="closeModal" class="flex-1 px-4 py-2.5 text-sm font-semibold border border-[hsl(var(--border))] rounded-lg hover:bg-[hsl(var(--muted))]">
                {{ $t('common.cancel') }}
              </button>
              <button type="submit" :disabled="saving || !form.name.trim()" class="flex-1 px-4 py-2.5 text-sm font-semibold bg-[hsl(var(--primary))] text-white rounded-lg hover:opacity-90 disabled:opacity-50">
                {{ saving ? $t('common.loading') : $t('templates.save') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { Plus, Pencil, Trash2, X } from 'lucide-vue-next'
import { apiFetch } from '@/lib/utils'

interface PrescriptionItem {
  name: string; dose?: string; frequency?: string; duration?: string; notes?: string
}
interface Template {
  id: string; name: string; title?: string | null; symptoms?: string | null; items: PrescriptionItem[]
}

const { locale, t: tt } = useI18n()
const qc = useQueryClient()

const { data, isLoading } = useQuery({
  queryKey: ['prescription-templates'],
  queryFn: () => apiFetch<Template[]>('/prescription-templates'),
})
const templates = computed(() => data.value ?? [])

const showModal = ref(false)
const saving = ref(false)
const form = reactive<{ id: string | null; name: string; title: string; symptoms: string; items: PrescriptionItem[] }>({
  id: null, name: '', title: '', symptoms: '', items: [],
})

function reset() {
  form.id = null; form.name = ''; form.title = ''; form.symptoms = ''; form.items = []
}
function openCreate() { reset(); showModal.value = true }
function openEdit(tpl: Template) {
  form.id = tpl.id
  form.name = tpl.name
  form.title = tpl.title || ''
  form.symptoms = tpl.symptoms || ''
  form.items = (tpl.items || []).map((i) => ({ ...i }))
  showModal.value = true
}
function closeModal() { showModal.value = false }
function addItem() { form.items.push({ name: '', dose: '', frequency: '', duration: '', notes: '' }) }
function removeItem(i: number) { form.items.splice(i, 1) }

async function save() {
  if (!form.name.trim()) return
  saving.value = true
  try {
    const body = JSON.stringify({
      name: form.name.trim(),
      title: form.title.trim() || undefined,
      symptoms: form.symptoms.trim() || undefined,
      items: form.items.filter((i) => i.name?.trim()),
    })
    if (form.id) {
      await apiFetch(`/prescription-templates/${form.id}`, { method: 'PATCH', body })
    } else {
      await apiFetch('/prescription-templates', { method: 'POST', body })
    }
    qc.invalidateQueries({ queryKey: ['prescription-templates'] })
    closeModal()
  } finally {
    saving.value = false
  }
}

async function remove(tpl: Template) {
  // eslint-disable-next-line no-alert
  if (!window.confirm(tt('templates.deleteConfirm'))) return
  await apiFetch(`/prescription-templates/${tpl.id}`, { method: 'DELETE' })
  qc.invalidateQueries({ queryKey: ['prescription-templates'] })
}
</script>
