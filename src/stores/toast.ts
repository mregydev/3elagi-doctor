import { reactive } from 'vue'

export type ToastKind = 'success' | 'error'
export interface ToastItem {
  id: number
  kind: ToastKind
  message: string
}

const state = reactive({ items: [] as ToastItem[] })
let nextId = 1

export const TOAST_DURATION_MS = 1500

export function pushToast(kind: ToastKind, message: string) {
  if (!message) return
  const id = nextId++
  state.items.push({ id, kind, message })
  setTimeout(() => {
    const idx = state.items.findIndex((t) => t.id === id)
    if (idx !== -1) state.items.splice(idx, 1)
  }, TOAST_DURATION_MS)
}

export function useToasts() {
  return state
}
