import { useRef } from 'react'

type FeatureUploadProps = {
  disabled?: boolean
  onUpload: (title: string, file: File) => Promise<void>
}

export default function FeatureUpload({ disabled, onUpload }: FeatureUploadProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const title = window.prompt('Nhập tiêu đề buổi ghi âm', file.name) || file.name
    await onUpload(title, file)
    event.target.value = ''
  }

  return (
    <section className="hero feature-hero">
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
        <p>
          Chào mừng đến với MIND - nền tảng AI giúp ghi âm và tóm tắt bài giảng, cuộc họp
          hoặc văn bản, giúp bạn nắm ý chính nhanh chóng và học tập hiệu quả hơn.
        </p>
      </div>
      <button
        className="hero__cta"
        type="button"
        onClick={handleClick}
        disabled={disabled}
      >
        Tải file/Phân tích
      </button>
      <input
        ref={fileInputRef}
        className="sr-only"
        type="file"
        accept="audio/*"
        onChange={handleFileChange}
      />
    </section>
  )
}
