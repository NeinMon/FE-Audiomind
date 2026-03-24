import { useCallback, useMemo, useState } from 'react'
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
  startProcessing,
  getAiAnalysis,
} from './services/api'
import type { AiAnalysis, Meeting } from './types'

const mockUser = {
  name: 'Nguyễn Văn A',
  role: 'Học viên',
}

const getStoredUser = () => {
  const raw = localStorage.getItem('audiomind.user')
  return raw ? (JSON.parse(raw) as typeof mockUser) : null
}

export default function App() {
  const [user, setUser] = useState<typeof mockUser | null>(() => getStoredUser())
  const [meeting, setMeeting] = useState<Meeting | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const [activeNav, setActiveNav] = useState('Trang chủ')
  const [featureScene, setFeatureScene] = useState<'upload' | 'analysis' | 'mindmap'>('upload')
  const [analysis, setAnalysis] = useState<AiAnalysis | null>(null)

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

  const handleUpload = useCallback(async (title: string, file: File) => {
    setBusy(true)
    try {
      const result = await uploadMeeting(title, file)
      setMeeting(result)
      setAnalysis(null)
      showToast(`Đã tải lên thành công: ${result.title}`)
    } catch (error) {
      showToast('Không thể tải file. Vui lòng thử lại.')
    } finally {
      setBusy(false)
    }
  }, [showToast])

  const handleStartProcessing = useCallback(async () => {
    if (!meeting?.id) {
      showToast('Hãy tải file ghi âm trước khi xử lý.')
      return
    }

    setBusy(true)
    try {
      await startProcessing(meeting.id)
      showToast('Đã bắt đầu xử lý ghi âm.')
    } catch (error) {
      showToast('Không thể bắt đầu xử lý. Vui lòng thử lại.')
    } finally {
      setBusy(false)
    }
  }, [meeting, showToast])

  const handleLoadAnalysis = useCallback(async () => {
    if (!meeting?.id) {
      showToast('Hãy tải file ghi âm trước khi tải phân tích.')
      return
    }

    setBusy(true)
    try {
      const result = await getAiAnalysis(meeting.id)
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

    const current = analysis ?? await getAiAnalysis(meeting.id)
    if (!analysis) {
      setAnalysis(current)
    }
    const keywords = current.keywords.slice(0, 5).join(', ')
    const actions = current.action_items.slice(0, 2)
    const actionText = actions.length
      ? actions.map((item) => `- ${item.task}`).join('\n')
      : '- Không có hành động nổi bật.'

    return `Câu hỏi: ${query}\n\nTóm tắt: ${current.summary}\n\nTừ khóa: ${keywords}\n\nViệc cần làm:\n${actionText}`
  }, [analysis, meeting])

  const renderFeatureScene = () => {
    if (featureScene === 'analysis') {
      return (
        <FeatureAnalysis
          meetingId={meeting?.id}
          busy={busy}
          analysis={analysis}
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
