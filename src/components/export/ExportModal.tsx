import { useState } from 'react'
import { useRemoteStore } from '../../stores/remoteStore'
import { useDisplayEditorStore } from '../../stores/displayEditorStore'
import { useStyleStore } from '../../stores/styleStore'
import { X, FileJson, Code, CheckCircle2, Monitor } from 'lucide-react'
import { generateHTML, generateDisplayHTML, generateTFT, generateZip } from '../../utils/exporter'

declare global {
  interface Window {
    electronAPI?: {
      saveFile: (opts: {
        content: string
        filename: string
        filters: Array<{ name: string; extensions: string[] }>
      }) => Promise<{ success: boolean; filePath?: string }>
    }
  }
}

function downloadBrowser(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  URL.revokeObjectURL(a.href)
}

interface Props {
  onClose: () => void
}

export default function ExportModal({ onClose }: Props) {
  const { colors } = useStyleStore()
  const { config: remote } = useRemoteStore()
  const { config: display } = useDisplayEditorStore()
  const [status, setStatus] = useState<{ msg: string; ok: boolean } | null>(null)

  const doSave = async (content: string, filename: string, ext: string, mime: string) => {
    if (window.electronAPI) {
      const res = await window.electronAPI.saveFile({
        content,
        filename,
        filters: [{ name: ext.toUpperCase(), extensions: [ext] }],
      })
      setStatus(res.success ? { msg: `저장 완료: ${res.filePath}`, ok: true } : { msg: '저장 취소', ok: false })
    } else {
      downloadBrowser(content, filename, mime)
      setStatus({ msg: `${filename} 다운로드 완료`, ok: true })
    }
  }

  const exportJSON = () => {
    const data = JSON.stringify({ version: '1.0', remote, display }, null, 2)
    doSave(data, `${remote.name}.rctk.json`, 'json', 'application/json')
  }

  const exportHTML = () => {
    const html = generateHTML(remote, colors)
    doSave(html, `${remote.name}.html`, 'html', 'text/html')
  }

const exportDisplayHTML = () => {
  const html = generateDisplayHTML(display)
  doSave(html, `${display.name}-display.html`, 'html', 'text/html')
}

const exportTFT = () => {
  const tft = generateTFT(display)
  doSave(tft, `${display.name}.tft`, 'tft', 'text/xml')
}

const exportZip = async () => {
  const blob = await generateZip(display)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${display.name}.zip`
  a.click()
  URL.revokeObjectURL(url)
}

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.65)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-84 rounded-xl shadow-2xl p-5"
        style={{ background: colors.surface, border: `1px solid ${colors.border}`, minWidth: 320 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <span className="font-semibold text-sm" style={{ color: colors.text }}>
            내보내기
          </span>
          <button onClick={onClose} style={{ color: colors.text, opacity: 0.45 }}>
            <X size={16} />
          </button>
        </div>

        {/* Options */}
        <div className="space-y-2 mb-4">
          <button
            onClick={exportJSON}
            className="w-full flex items-center gap-3 p-3 rounded-lg text-left transition-opacity hover:opacity-80"
            style={{ background: colors.border }}
          >
            <FileJson size={20} style={{ color: colors.primary }} />
            <div className="flex-1">
              <div className="text-sm font-medium" style={{ color: colors.text }}>
                JSON 설정 파일
              </div>
              <div className="text-xs mt-0.5" style={{ color: colors.text, opacity: 0.5 }}>
                .rctk.json — 나중에 다시 불러올 수 있음
              </div>
            </div>
          </button>

          <button
            onClick={exportHTML}
            className="w-full flex items-center gap-3 p-3 rounded-lg text-left transition-opacity hover:opacity-80"
            style={{ background: colors.border }}
          >
            <Code size={20} style={{ color: colors.accent }} />
            <div className="flex-1">
              <div className="text-sm font-medium" style={{ color: colors.text }}>
                HTML 뷰어
              </div>
              <div className="text-xs mt-0.5" style={{ color: colors.text, opacity: 0.5 }}>
                .html — 브라우저에서 바로 실행 가능
              </div>
            </div>
          </button>

          <button
            onClick={exportDisplayHTML}
            className="w-full flex items-center gap-3 p-3 rounded-lg text-left transition-opacity hover:opacity-80"
            style={{ background: colors.border }}
          >
            <Monitor size={20} style={{ color: colors.success }} />
            <div className="flex-1">
              <div className="text-sm font-medium" style={{ color: colors.text }}>
                디스플레이 HTML
              </div>
              <div className="text-xs mt-0.5" style={{ color: colors.text, opacity: 0.5 }}>
                .html — 디스플레이 화면 단독 출력
              </div>
            </div>
          </button>

          <button
            onClick={exportTFT}
            className="w-full flex items-center gap-3 p-3 rounded-lg text-left transition-opacity hover:opacity-80"
            style={{ background: colors.border }}
          >
            <FileJson size={20} style={{ color: colors.warning }} />
            <div className="flex-1">
              <div className="text-sm font-medium" style={{ color: colors.text }}>
                VisualTFT (.tft)
              </div>
              <div className="text-xs mt-0.5" style={{ color: colors.text, opacity: 0.5 }}>
                .tft — VisualTFT 작화툴 호환
              </div>
            </div>
          </button>

          <button
            onClick={exportZip}
            className="w-full flex items-center gap-3 p-3 rounded-lg text-left transition-opacity hover:opacity-80"
            style={{ background: colors.border }}
          >
            <FileJson size={20} style={{ color: colors.primary }} />
            <div className="flex-1">
              <div className="text-sm font-medium" style={{ color: colors.text }}>
                전체 패키지 (.zip)
              </div>
              <div className="text-xs mt-0.5" style={{ color: colors.text, opacity: 0.5 }}>
                .zip — HTML + TFT + 이미지 전체
              </div>
            </div>
          </button>
        </div>

        {/* Status */}
        {status && (
          <div
            className="flex items-center gap-2 p-2.5 rounded-lg text-xs font-mono"
            style={{
              background: status.ok ? colors.success + '18' : colors.danger + '18',
              color: status.ok ? colors.success : colors.danger,
              border: `1px solid ${status.ok ? colors.success : colors.danger}30`,
            }}
          >
            <CheckCircle2 size={13} />
            {status.msg}
          </div>
        )}

        <div
          className="mt-3 pt-3 border-t text-xs text-center"
          style={{ borderColor: colors.border, color: colors.text, opacity: 0.3 }}
        >
        </div>
      </div>
    </div>
  )
}
