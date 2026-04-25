import { useState } from 'react'
import { useStyleStore } from './stores/styleStore'
import { useDisplayEditorStore } from './stores/displayEditorStore'
import DisplayEditor from './components/display/DisplayEditor'
import ElementPanel from './components/display/ElementPanel'
import ExportModal from './components/export/ExportModal'
import ImageAnalyzer from './components/analyzer/ImageAnalyzer'
import TextGenerator from './components/analyzer/TextGenerator'
import { Cpu, Download, Sparkles } from 'lucide-react'

export default function App() {
  const [showExport, setShowExport] = useState(false)
  const [showAnalyzer, setShowAnalyzer] = useState(false)
  const { colors } = useStyleStore()
  const { config } = useDisplayEditorStore()

  return (
    <div
      className="flex flex-col h-screen overflow-hidden"
      style={{ background: colors.background, color: colors.text }}
    >
      {/* Header */}
      <header
        className="flex items-center justify-between px-4 py-2 shrink-0 border-b"
        style={{ background: colors.surface, borderColor: colors.border }}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Cpu size={18} style={{ color: colors.primary }} />
            <span className="font-black text-sm tracking-widest uppercase" style={{ color: colors.primary }}>RCTK</span>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded font-mono" style={{ background: colors.border, color: colors.text, opacity: 0.7 }}>
            v2.0
          </span>
          <span className="text-xs font-mono opacity-50" style={{ color: colors.text }}>{config.name}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono" style={{ color: colors.text, opacity: 0.3 }}>
            {config.width}×{config.height} · {config.elements.length}개 요소
          </span>
          <button
            onClick={() => setShowAnalyzer(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-opacity hover:opacity-80"
            style={{ background: colors.primary + '20', color: colors.primary, border: `1px solid ${colors.primary}40` }}
          >
            <Sparkles size={11} />
            AI 분석
          </button>
          <button
            onClick={() => setShowExport(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-opacity hover:opacity-80"
            style={{ background: colors.primary, color: '#fff' }}
          >
            <Download size={11} />
            내보내기
          </button>
        </div>
      </header>

      {/* Main */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel: element properties */}
        <aside
          className="w-60 shrink-0 flex flex-col overflow-hidden border-r"
          style={{ background: colors.surface, borderColor: colors.border }}
        >
          <ElementPanel />
        </aside>

        {/* Center: display canvas */}
        <main
          className="flex-1 flex items-center justify-center overflow-auto p-8"
          style={{ background: colors.background }}
        >
          <DisplayEditor />
        </main>

        {/* Right panel: vibe coding — always visible */}
        <aside className="shrink-0 flex flex-col overflow-hidden">
          <TextGenerator />
        </aside>
      </div>

      {showExport && <ExportModal onClose={() => setShowExport(false)} />}
      {showAnalyzer && <ImageAnalyzer onClose={() => setShowAnalyzer(false)} />}
    </div>
  )
}
