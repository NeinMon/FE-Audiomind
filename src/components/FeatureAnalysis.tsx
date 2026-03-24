import type { AiAnalysis } from '../types'

type FeatureAnalysisProps = {
  meetingId?: number | null
  busy?: boolean
  analysis: AiAnalysis | null
  onStartProcessing: () => Promise<void>
  onLoadAnalysis: () => Promise<void>
}

export default function FeatureAnalysis({
  meetingId,
  busy,
  analysis,
  onStartProcessing,
  onLoadAnalysis,
}: FeatureAnalysisProps) {
  const keywordCount = analysis?.keywords.length ?? 0
  const actionCount = analysis?.action_items.length ?? 0

  return (
    <section className="feature-scene feature-analysis-scene">
      <section className="hero feature-hero feature-hero--analysis">
        <div className="hero__search">
          <input className="search-input" type="search" placeholder="Tìm bài giảng, môn học, ghi chú..." />
          <span className="search-icon">⌕</span>
        </div>
        <div className="hero__content">
          <h1>Phân tích âm thanh</h1>
          <p>Nhận diện nội dung, tóm tắt ý chính và trích xuất danh sách hành động từ buổi ghi âm.</p>
        </div>
      </section>

      <section className="feature-panel feature-analysis">
        <header className="feature-panel__header">
          <h2>Bảng điều khiển phân tích</h2>
          <span className="feature-chip">Meeting ID: {meetingId ?? '--'}</span>
        </header>

        <div className="analysis-kpis">
          <article className="analysis-kpi">
            <span className="analysis-kpi__label">Tổng từ khóa</span>
            <strong className="analysis-kpi__value">{keywordCount}</strong>
          </article>
          <article className="analysis-kpi">
            <span className="analysis-kpi__label">Việc cần làm</span>
            <strong className="analysis-kpi__value">{actionCount}</strong>
          </article>
          <article className="analysis-kpi">
            <span className="analysis-kpi__label">Trạng thái</span>
            <strong className="analysis-kpi__value">{analysis ? 'Đã phân tích' : 'Chờ dữ liệu'}</strong>
          </article>
        </div>

        <div className="feature-actions">
          <button type="button" className="hero__cta" disabled={busy || !meetingId} onClick={onStartProcessing}>
            Bắt đầu xử lý
          </button>
          <button type="button" className="secondary-cta" disabled={busy || !meetingId} onClick={onLoadAnalysis}>
            Tải kết quả phân tích
          </button>
        </div>

        {analysis ? (
          <div className="analysis-grid">
            <article className="analysis-card analysis-card--wide">
              <h3>Tóm tắt</h3>
              <p>{analysis.summary}</p>
            </article>

            <article className="analysis-card analysis-card--timeline">
              <h3>Nhịp nội dung</h3>
              <div className="timeline-bars" role="presentation">
                <span style={{ height: '42%' }} />
                <span style={{ height: '68%' }} />
                <span style={{ height: '52%' }} />
                <span style={{ height: '84%' }} />
                <span style={{ height: '60%' }} />
                <span style={{ height: '77%' }} />
                <span style={{ height: '44%' }} />
                <span style={{ height: '58%' }} />
              </div>
            </article>

            <article className="analysis-card">
              <h3>Từ khóa</h3>
              <ul>
                {analysis.keywords.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>

            <article className="analysis-card">
              <h3>Việc cần làm</h3>
              <ul>
                {analysis.action_items.map((item, index) => (
                  <li key={`${item.task}-${index}`}>{item.task}</li>
                ))}
              </ul>
            </article>
          </div>
        ) : (
          <div className="analysis-empty">Chưa có dữ liệu phân tích. Hãy tải file và bắt đầu xử lý.</div>
        )}
      </section>
    </section>
  )
}
