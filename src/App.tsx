import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import TopNav from './components/TopNav'
import HeroChart from './components/HeroChart'
import Sidebar from './components/Sidebar'
import QuickActions from './components/QuickActions'
import AiAssistant from './components/AiAssistant'
import FeatureUpload from './components/FeatureUpload'
import FeatureAnalysis from './components/FeatureAnalysis'
import FeatureMindmap from './components/FeatureMindmap'
import NewsAbout from './components/NewsAbout'
import LoginModal from './components/LoginModal'
import StatusToast from './components/StatusToast'
import {
  uploadMeeting,
  getMeetings,
  startProcessing,
  getProcessingStatus,
  getProcessingAnalysis,
} from './services/api'
import type { AiAnalysis, Meeting } from './types'

type ProcessedMeetingItem = {
  id: number
  title: string
  processedAt: string
}

const mockUser = {
  name: 'Nguyễn Văn A',
  role: 'Học viên',
}

const meetingStorageKey = 'audiomind.currentMeeting'
const analysisStorageKey = 'audiomind.currentAnalysis'
const statusStorageKey = 'audiomind.processingStatus'
const processedMeetingsStorageKey = 'audiomind.processedMeetings'

const getStoredUser = () => {
  const raw = localStorage.getItem('audiomind.user')
  return raw ? (JSON.parse(raw) as typeof mockUser) : null
}

const getStoredMeeting = () => {
  const raw = localStorage.getItem(meetingStorageKey)
  return raw ? (JSON.parse(raw) as Meeting) : null
}

const getStoredAnalysis = () => {
  const raw = localStorage.getItem(analysisStorageKey)
  return raw ? (JSON.parse(raw) as AiAnalysis) : null
}

const getStoredStatus = () => localStorage.getItem(statusStorageKey) ?? 'IDLE'

const getStoredProcessedMeetings = () => {
  const raw = localStorage.getItem(processedMeetingsStorageKey)
  return raw ? (JSON.parse(raw) as ProcessedMeetingItem[]) : []
}

export default function App() {
  const [user, setUser] = useState<typeof mockUser | null>(() => getStoredUser())
  const [meeting, setMeeting] = useState<Meeting | null>(() => getStoredMeeting())
  const [toast, setToast] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const [activeNav, setActiveNav] = useState('Trang chủ')
  const [featureScene, setFeatureScene] = useState<'upload' | 'analysis' | 'mindmap'>('upload')
  const [analysis, setAnalysis] = useState<AiAnalysis | null>(() => getStoredAnalysis())
  const [processingStatus, setProcessingStatus] = useState(() => getStoredStatus())
  const [processedMeetings, setProcessedMeetings] = useState<ProcessedMeetingItem[]>(
    () => getStoredProcessedMeetings()
  )
  const pollRunIdRef = useRef(0)

  const showToast = useCallback((message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(null), 3200)
  }, [])

  const handleLogin = useCallback((name: string) => {
    const nextUser = {
      name: name.trim() || mockUser.name,
      role: mockUser.role,
    }
    localStorage.setItem('audiomind.user', JSON.stringify(nextUser))
    setUser(nextUser)
    setShowLogin(false)
  }, [])

  const handleLogout = useCallback(() => {
    localStorage.removeItem('audiomind.user')
    setUser(null)
    setActiveNav('Trang chủ')
  }, [])

  const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms))

  useEffect(() => {
    if (meeting) {
      localStorage.setItem(meetingStorageKey, JSON.stringify(meeting))
    } else {
      localStorage.removeItem(meetingStorageKey)
    }
  }, [meeting])

  useEffect(() => {
    if (analysis) {
      localStorage.setItem(analysisStorageKey, JSON.stringify(analysis))
    } else {
      localStorage.removeItem(analysisStorageKey)
    }
  }, [analysis])

  useEffect(() => {
    localStorage.setItem(statusStorageKey, processingStatus)
  }, [processingStatus])

  useEffect(() => {
    localStorage.setItem(processedMeetingsStorageKey, JSON.stringify(processedMeetings))
  }, [processedMeetings])

  const addProcessedMeeting = useCallback((id: number, title?: string | null) => {
    const trimmedTitle = title?.trim()
    const safeTitle = trimmedTitle && trimmedTitle.length > 0
      ? trimmedTitle
      : `Meeting #${id}`

    setProcessedMeetings((prev) => {
      const next = prev.filter((item) => item.id !== id)
      next.unshift({
        id,
        title: safeTitle,
        processedAt: new Date().toISOString(),
      })
      return next.slice(0, 10)
    })
  }, [])

  useEffect(() => {
    let canceled = false

    const syncRecentMeetings = async () => {
      try {
        const meetings = await getMeetings()
        if (canceled || meetings.length === 0) return

        const currentMeeting = meeting ?? meetings[0]
        if (!meeting) {
          setMeeting(currentMeeting)
        }

        const statusResults = await Promise.all(
          meetings.map(async (item) => {
            try {
              const statusResponse = await getProcessingStatus(item.id)
              return {
                meeting: item,
                status: String(statusResponse.status ?? 'UNKNOWN').toUpperCase(),
              }
            } catch (error) {
              return {
                meeting: item,
                status: 'UNKNOWN',
              }
            }
          })
        )

        if (canceled) return

        const doneMeetings = statusResults.filter((item) => item.status === 'DONE')
        if (doneMeetings.length > 0) {
          doneMeetings.forEach(({ meeting: doneMeeting }) => {
            addProcessedMeeting(doneMeeting.id, doneMeeting.title)
          })

          if (!analysis) {
            const targetMeeting = doneMeetings[0].meeting
            setMeeting(targetMeeting)
            setProcessingStatus('DONE')
            const result = await getProcessingAnalysis(targetMeeting.id)
            if (canceled) return
            setAnalysis(result)
          }
        }
      } catch (error) {
        if (canceled) return
      }
    }

    void syncRecentMeetings()

    return () => {
      canceled = true
    }
  }, [addProcessedMeeting, analysis, meeting])

  useEffect(() => {
    if (!meeting?.id) return

    let canceled = false
    const syncCurrentMeetingStatus = async () => {
      try {
        const statusResponse = await getProcessingStatus(meeting.id)
        if (canceled) return

        const latestStatus = String(statusResponse.status ?? 'UNKNOWN').toUpperCase()
        setProcessingStatus(latestStatus)

        if (latestStatus === 'DONE' && !analysis) {
          const result = await getProcessingAnalysis(meeting.id)
          if (canceled) return
          setAnalysis(result)
        }
      } catch (error) {
        if (canceled) return
        setProcessingStatus('UNKNOWN')
      }
    }

    void syncCurrentMeetingStatus()

    return () => {
      canceled = true
    }
  }, [analysis, meeting?.id])

  const pollProcessingUntilDone = useCallback(async (meetingId: number, meetingTitle?: string) => {
    const runId = ++pollRunIdRef.current

    for (let attempt = 0; attempt < 80; attempt += 1) {
      try {
        const statusResponse = await getProcessingStatus(meetingId)
        if (runId !== pollRunIdRef.current) return

        const nextStatus = String(statusResponse.status ?? 'UNKNOWN').toUpperCase()
        setProcessingStatus(nextStatus)

        if (nextStatus === 'DONE') {
          try {
            const result = await getProcessingAnalysis(meetingId)
            if (runId !== pollRunIdRef.current) return
            setAnalysis(result)
            addProcessedMeeting(meetingId, meetingTitle)
            showToast('Xử lý hoàn tất. Đã tải kết quả phân tích.')
          } catch (error) {
            showToast('Xử lý hoàn tất nhưng chưa tải được phân tích. Hãy thử lại.')
          }
          return
        }

        if (nextStatus === 'FAILED') {
          const errorText = typeof statusResponse.error === 'string'
            ? statusResponse.error
            : 'Xử lý thất bại. Vui lòng thử lại.'
          showToast(errorText)
          return
        }
      } catch (error) {
        if (runId !== pollRunIdRef.current) return
        showToast('Không thể kiểm tra trạng thái xử lý.')
        return
      }

      await wait(3000)
    }

    if (runId === pollRunIdRef.current) {
      showToast('Xử lý đang lâu hơn dự kiến, vui lòng chờ thêm.')
    }
  }, [addProcessedMeeting, showToast])

  const handleUpload = useCallback(async (title: string, file: File) => {
    setBusy(true)
    try {
      const result = await uploadMeeting(title, file)
      setMeeting(result)
      setAnalysis(null)
      setProcessingStatus('PENDING')
      await startProcessing(result.id)
      showToast(`Đã tải lên và bắt đầu xử lý: ${result.title}`)
      void pollProcessingUntilDone(result.id, result.title)
    } catch (error) {
      setProcessingStatus('FAILED')
      showToast('Không thể tải file hoặc bắt đầu xử lý. Vui lòng thử lại.')
    } finally {
      setBusy(false)
    }
  }, [pollProcessingUntilDone, showToast])

  const handleStartProcessing = useCallback(async () => {
    if (!meeting?.id) {
      showToast('Hãy tải file ghi âm trước khi xử lý.')
      return
    }

    setBusy(true)
    try {
      setAnalysis(null)
      setProcessingStatus('PENDING')
      await startProcessing(meeting.id)
      showToast('Đã bắt đầu xử lý ghi âm.')
      void pollProcessingUntilDone(meeting.id, meeting.title)
    } catch (error) {
      setProcessingStatus('FAILED')
      showToast('Không thể bắt đầu xử lý. Vui lòng thử lại.')
    } finally {
      setBusy(false)
    }
  }, [meeting, pollProcessingUntilDone, showToast])

  const handleLoadAnalysis = useCallback(async () => {
    if (!meeting?.id) {
      showToast('Hãy tải file ghi âm trước khi tải phân tích.')
      return
    }

    if (processingStatus === 'PENDING' || processingStatus === 'RUNNING') {
      showToast('Dữ liệu đang được xử lý. Hệ thống sẽ tự cập nhật khi hoàn tất.')
      return
    }

    setBusy(true)
    try {
      const result = await getProcessingAnalysis(meeting.id)
      setAnalysis(result)
      showToast('Đã tải kết quả phân tích.')
    } catch (error) {
      showToast('Chưa có dữ liệu phân tích. Thử xử lý âm thanh trước.')
    } finally {
      setBusy(false)
    }
  }, [meeting, showToast])

  const askAssistant = useCallback(async (message: string) => {
    const query = message.trim()
    if (!meeting?.id) {
      return 'Bạn cần tải file ghi âm để tôi tạo phân tích và mindmap.'
    }

    if (processingStatus === 'PENDING' || processingStatus === 'RUNNING') {
      return `Hệ thống đang xử lý ghi âm (trạng thái: ${processingStatus}). Tôi sẽ trả lời chi tiết ngay khi có phân tích.`
    }

    const current = analysis ?? await getProcessingAnalysis(meeting.id)
    if (!analysis) {
      setAnalysis(current)
    }
    const keywords = current.keywords.slice(0, 5).join(', ')
    const actions = current.action_items.slice(0, 2)
    const actionText = actions.length
      ? actions.map((item) => `- ${item.task}`).join('\n')
      : '- Không có hành động nổi bật.'

    return `Câu hỏi: ${query}\n\nTóm tắt: ${current.summary}\n\nTừ khóa: ${keywords}\n\nViệc cần làm:\n${actionText}`
  }, [analysis, meeting, processingStatus])

  const renderFeatureScene = () => {
    if (featureScene === 'analysis') {
      return (
        <FeatureAnalysis
          meetingId={meeting?.id}
          meetingTitle={meeting?.title}
          busy={busy}
          analysis={analysis}
          processingStatus={processingStatus}
          processedMeetings={processedMeetings}
          onStartProcessing={handleStartProcessing}
          onLoadAnalysis={handleLoadAnalysis}
        />
      )
    }

    if (featureScene === 'mindmap') {
      return (
        <FeatureMindmap
          analysis={analysis}
          onLoadAnalysis={handleLoadAnalysis}
          busy={busy}
          meetingId={meeting?.id}
        />
      )
    }

    return <FeatureUpload disabled={busy} onUpload={handleUpload} />
  }

  const heroSubtitle = useMemo(() => (
    'Chào mừng đến với MIND - nền tảng AI giúp ghi âm và tóm tắt bài giảng, ' +
    'cuộc họp hoặc văn bản, giúp bạn nắm ý chính nhanh chóng và học tập hiệu quả hơn.'
  ), [])

  return (
    <div className={`app ${user ? '' : 'app--guest'}`}>
      <TopNav
        user={user}
        onLogout={handleLogout}
        onTry={() => setShowLogin(true)}
        isGuest={!user}
        activeNav={activeNav}
        onNavChange={setActiveNav}
      />

      {user ? (
        <main className="page">
          {activeNav === 'Tính năng' ? (
            <>
              <section className="feature-tabs" aria-label="Feature scenes">
                <button
                  type="button"
                  className={`feature-tab ${featureScene === 'upload' ? 'feature-tab--active' : ''}`}
                  onClick={() => setFeatureScene('upload')}
                >
                  Tải file âm thanh
                </button>
                <button
                  type="button"
                  className={`feature-tab ${featureScene === 'analysis' ? 'feature-tab--active' : ''}`}
                  onClick={() => setFeatureScene('analysis')}
                >
                  Phân tích âm thanh
                </button>
                <button
                  type="button"
                  className={`feature-tab ${featureScene === 'mindmap' ? 'feature-tab--active' : ''}`}
                  onClick={() => setFeatureScene('mindmap')}
                >
                  Mindmap
                </button>
              </section>
              {renderFeatureScene()}
            </>
          ) : activeNav === 'Tin tức' ? (
            <NewsAbout />
          ) : (
            <>
              <section className="hero">
                <div className="hero__search">
                  <input
                    className="search-input"
                    type="search"
                    placeholder="Tìm bài giảng, môn học, ghi chú..."
                  />
                  <span className="search-icon">⌕</span>
                </div>
                <div className="hero__content">
                  <h1>Cách mạng hóa quy trình học bài</h1>
                  <p>{heroSubtitle}</p>
                </div>
                <HeroChart />
              </section>

              <section className="workspace">
                <Sidebar
                  meetingTitle={meeting?.title}
                  meetingId={meeting?.id}
                />

                <div className="workspace__main">
                  <QuickActions
                    disabled={busy}
                    onUpload={handleUpload}
                    onStartProcessing={handleStartProcessing}
                    meetingReady={Boolean(meeting?.id)}
                  />
                  <AiAssistant
                    busy={busy}
                    onAsk={askAssistant}
                    meetingId={meeting?.id}
                  />
                </div>
              </section>
            </>
          )}
        </main>
      ) : (
        <main className="guest">
          <div className="guest__search">
            <input
              className="search-input"
              type="search"
              placeholder="Tìm bài giảng, môn học, ghi chú..."
            />
            <span className="search-icon">⌕</span>
          </div>
          <div className="guest__content">
            <h1>Về chúng tôi</h1>
            <p>
              Chào mừng bạn đến với <span className="guest__brand">MIND</span> - nền tảng AI giúp
              ghi âm và tóm tắt bài giảng hoặc cuộc họp thành văn bản để đọc. Thay vì phải nghe
              lại 1-2 giờ ghi âm, người dùng chỉ cần 5-10 phút để đọc bản tóm tắt các ý chính,
              khái niệm, công thức và ví dụ quan trọng. <span className="guest__brand">MIND</span>
              hỗ trợ tiếng Việt học thuật, giúp người dùng hiểu các thuật ngữ chuyên ngành dễ
              dàng hơn. Nền tảng có thể sử dụng cho học online, lớp học trực tiếp hoặc các cuộc
              họp, giúp việc học và làm việc trở nên nhanh chóng và hiệu quả hơn.
            </p>
            <button className="guest__cta" type="button" onClick={() => setShowLogin(true)}>
              Dùng thử
            </button>
          </div>
        </main>
      )}

      {showLogin && (
        <LoginModal onLogin={handleLogin} onClose={() => setShowLogin(false)} />
      )}
      {toast && <StatusToast message={toast} />}
    </div>
  )
}
