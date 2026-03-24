import type { AiAnalysis, Meeting } from '../types'

const meetingBaseUrl = import.meta.env.VITE_MEETING_SERVICE_URL || 'http://localhost:8081'
const processingBaseUrl = import.meta.env.VITE_PROCESSING_SERVICE_URL || 'http://localhost:8082'
const aiBaseUrl = import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:8000'

const fetchJson = async <T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> => {
  const response = await fetch(input, init)
  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || response.statusText)
  }
  return response.json() as Promise<T>
}

export const uploadMeeting = async (title: string, file: File): Promise<Meeting> => {
  const body = new FormData()
  body.append('title', title)
  body.append('file', file)

  return fetchJson<Meeting>(`${meetingBaseUrl}/meetings/upload`, {
    method: 'POST',
    body,
  })
}

export const getMeeting = async (id: number): Promise<Meeting> => {
  return fetchJson<Meeting>(`${meetingBaseUrl}/meetings/${id}`)
}

export const startProcessing = async (meetingId: number) => {
  const params = new URLSearchParams({ meetingId: String(meetingId) })
  return fetchJson<Record<string, unknown>>(
    `${processingBaseUrl}/processing/start?${params.toString()}`,
    { method: 'POST' }
  )
}

export const getProcessingStatus = async (meetingId: number) => {
  return fetchJson<Record<string, unknown>>(
    `${processingBaseUrl}/processing/${meetingId}/status`
  )
}

export const getProcessingTranscript = async (meetingId: number) => {
  return fetchJson<Record<string, unknown>>(
    `${processingBaseUrl}/processing/${meetingId}/transcript`
  )
}

export const getProcessingAnalysis = async (meetingId: number) => {
  return fetchJson<Record<string, unknown>>(
    `${processingBaseUrl}/processing/${meetingId}/analysis`
  )
}

export const requestAiProcessing = async (payload: {
  meeting_id: number
  audio_path: string
  topic?: string
  glossary_terms?: string[]
  language?: string
}) => {
  return fetchJson<Record<string, unknown>>(`${aiBaseUrl}/api/process`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export const getAiTranscript = async (meetingId: number) => {
  return fetchJson<Record<string, unknown>>(
    `${aiBaseUrl}/api/meeting/${meetingId}/transcript`
  )
}

export const getAiAnalysis = async (meetingId: number): Promise<AiAnalysis> => {
  return fetchJson<AiAnalysis>(
    `${aiBaseUrl}/api/meeting/${meetingId}/analysis`
  )
}
