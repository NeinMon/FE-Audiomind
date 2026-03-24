export type Meeting = {
  id: number
  title: string
  audioPath: string
  createdAt: string
}

export type ActionItem = {
  task: string
  owner?: string
  deadline?: string
}

export type AiAnalysis = {
  meeting_id: number
  summary: string
  keywords: string[]
  technical_terms: string[]
  action_items: ActionItem[]
  created_at: string
}
