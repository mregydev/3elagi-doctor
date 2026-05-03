import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { pushToast } from "@/stores/toast"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const API_BASE = import.meta.env.VITE_API_BASE_URL || '/3eyadahub-api'

export function apiUrl(path: string) {
  return `${API_BASE}${path}`
}

interface ApiFetchOptions extends RequestInit {
  silent?: boolean
  successMessage?: string
}

function defaultSuccessMessage(method: string): string {
  const m = method.toUpperCase()
  if (m === 'POST') return 'Saved'
  if (m === 'PATCH' || m === 'PUT') return 'Updated'
  if (m === 'DELETE') return 'Deleted'
  return ''
}

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { silent, successMessage, ...init } = options
  const token = localStorage.getItem('token')
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(init.headers as Record<string, string> || {}),
  }
  const method = (init.method || 'GET').toUpperCase()
  let res: Response
  try {
    res = await fetch(apiUrl(path), { ...init, headers })
  } catch (e) {
    if (!silent) pushToast('error', (e as Error).message || 'Network error')
    throw e
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }))
    const msg = err.message || 'Request failed'
    if (!silent) pushToast('error', Array.isArray(msg) ? msg.join(', ') : msg)
    throw new Error(Array.isArray(msg) ? msg.join(', ') : msg)
  }
  const data = res.status === 204 ? (undefined as T) : await res.json()
  if (!silent && method !== 'GET') {
    const msg = successMessage ?? defaultSuccessMessage(method)
    if (msg) pushToast('success', msg)
  }
  return data as T
}
