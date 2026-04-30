export type ElementType = 'indicator' | 'gauge' | 'arc-gauge' | 'numeric' | 'label' | 'title' | 'logo' | 'button' | 'image-crop' | 'icon' | 'container'

export interface DisplayElement {
  id: string
  type: ElementType
  /** 0–100  캔버스 너비 기준 % */
  xPct: number
  /** 0–100  캔버스 높이 기준 % */
  yPct: number
  /** 0–100  캔버스 너비 기준 % */
  widthPct: number
  /** 0–100  캔버스 높이 기준 % */
  heightPct: number
  label: string
  value?: string
  color: string
  bgColor: string
  active?: boolean
  unit?: string
  /** base64 JPEG 크롭 이미지 (image-crop 타입 전용) */
  imageData?: string
  /** MIME 타입 (image-crop 타입 전용) */
  mediaType?: string
  /** 변동 여부: true=동적(값 변함), false=정적(고정) */
  dynamic?: boolean
  /** AI 판단 확실도: false=불확실(사용자 확인 필요) */
  confident?: boolean
}

export interface DisplayConfig {
  name: string
  width: number
  height: number
  bgColor: string
  elements: DisplayElement[]
}

/** pct → 렌더링용 픽셀 값 계산 */
export function computePixels(
  el: DisplayElement,
  canvasW: number,
  canvasH: number,
) {
  return {
    x: Math.round(el.xPct / 100 * canvasW),
    y: Math.round(el.yPct / 100 * canvasH),
    width: Math.max(8, Math.round(el.widthPct / 100 * canvasW)),
    height: Math.max(8, Math.round(el.heightPct / 100 * canvasH)),
  }
}
