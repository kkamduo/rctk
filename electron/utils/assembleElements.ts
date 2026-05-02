/**
 * Stage3A/3B 조립 후처리 — main.ts와 viz 스크립트가 동일한 파이프라인을 거치도록 공용화
 *
 * addZoneRectsFallback      : Stage2 zones 기준으로 rectangle 없는 zone에 배경 패널 자동 삽입
 * promoteBottomIcons        : 하단 큰 icon → button-nav 승격
 * reclassifySidebarIcons    : 좌측 사이드바 소형 icon → image-crop (온도계·배터리 등 픽처 그래픽)
 * reclassifySmallRectToIndicator : 하단 모서리 소형 rectangle → indicator (상태 LED 오분류 복구)
 * stabilizeRtc              : 텍스트 요소 중 HH:mm 패턴 + 상단 위치 → rtc 승격
 * assembleElements          : zone-rect → visual → text 순서 최종 병합
 */

export interface RawZone {
  id: string
  label: string
  xPct: number
  yPct: number
  widthPct: number
  heightPct: number
}

export interface RawElement {
  id?: string
  zoneId?: string
  type: string
  label?: string
  value?: string
  xPct: number
  yPct: number
  widthPct: number
  heightPct: number
  color?: string
  bgColor?: string
  confident?: boolean
  [key: string]: unknown
}

const TIME_PATTERN = /^\d{1,2}:\d{2}(:\d{2})?$/ // HH:mm 또는 HH:mm:ss

/** IoU 계산 (% 좌표 기준) */
function iou(a: RawElement, b: RawZone): number {
  const ix = Math.max(0, Math.min(a.xPct + a.widthPct, b.xPct + b.widthPct) - Math.max(a.xPct, b.xPct))
  const iy = Math.max(0, Math.min(a.yPct + a.heightPct, b.yPct + b.heightPct) - Math.max(a.yPct, b.yPct))
  const inter = ix * iy
  const union = a.widthPct * a.heightPct + b.widthPct * b.heightPct - inter
  return union > 0 ? inter / union : 0
}

/**
 * Stage3A 결과에서 rectangle이 없는 zone마다 배경 패널 rectangle을 자동 삽입.
 * IoU >= 0.3인 rectangle이 이미 있으면 삽입하지 않는다.
 * 전체 화면 크기(widthPct >= 90 && heightPct >= 90)인 zone은 제외 —
 * 전체 배경 이미지(image-crop)와 충돌하여 잘못된 rectangle이 생기는 것을 방지.
 */
export function addZoneRectsFallback(
  visualElements: RawElement[],
  zones: RawZone[],
  bgColor: string,
): RawElement[] {
  return zones
    .filter(zone => !(zone.widthPct >= 90 && zone.heightPct >= 90))  // full-screen zone 제외
    .filter(zone => !visualElements.some(el => el.type === 'rectangle' && iou(el, zone) >= 0.3))
    .map(zone => ({
      id: `zone-rect-${zone.id}`,
      zoneId: zone.id,
      type: 'rectangle',
      label: zone.label,
      xPct: zone.xPct,
      yPct: zone.yPct,
      widthPct: zone.widthPct,
      heightPct: zone.heightPct,
      color: '#ffffff',
      bgColor,
      confident: true,
    }))
}

const NAV_LABEL_RE = /left|right|arrow|turn|parking|brake|p_button|nav|direction/i
const LAMP_LABEL_RE = /headlight|lamp|light|indicator_dot|status/i

/**
 * 전체 화면을 덮는 rectangle → image-crop 재분류.
 * AI가 직접 만든 full-screen rectangle도 포함 (zone-rect-* 예외 없음).
 * 배경 이미지가 rectangle로 오분류되는 것을 방지.
 */
export function reclassifyFullScreenRect(elements: RawElement[]): RawElement[] {
  return elements.map(el => {
    if (el.type !== 'rectangle') return el
    const isFullScreen =
      (el.widthPct >= 90 && el.heightPct >= 90) ||
      (el.xPct <= 2 && el.yPct <= 2 && el.widthPct >= 95 && el.heightPct >= 95)
    return isFullScreen ? { ...el, type: 'image-crop' } : el
  })
}

/**
 * 하단 조작 버튼(좌/우 화살표, P 등)만 button-nav로 승격.
 * 조명/상태등(headlight, lamp, light 계열)은 승격 제외.
 * 조건: yPct >= 80, widthPct >= 7, heightPct >= 7, 이름이 nav 계열, 이름이 lamp 계열 아님.
 */
export function promoteBottomIcons(elements: RawElement[]): RawElement[] {
  return elements.map(el => {
    if (el.type !== 'icon') return el
    const label = String(el.label ?? '')
    const isLargeBottomControl = el.yPct >= 80 && el.widthPct >= 7 && el.heightPct >= 7
    const isLikelyNav = NAV_LABEL_RE.test(label)
    const isStatusLamp = LAMP_LABEL_RE.test(label)
    if (isLargeBottomControl && isLikelyNav && !isStatusLamp) {
      return { ...el, type: 'button-nav' }
    }
    return el
  })
}

const PICTURE_LABEL_RE = /temp|thermometer|battery|sensor|icon_image|picture|logo|diagram/i

/**
 * 좌측 사이드바 소형 icon → image-crop 재분류.
 * 온도계, 배터리 등 복잡한 픽처 그래픽이 icon으로 오분류되는 경우를 복구.
 * 조건: xPct < 20, heightPct >= 8, label이 픽처 패턴
 */
export function reclassifySidebarIcons(elements: RawElement[]): RawElement[] {
  return elements.map(el => {
    if (el.type !== 'icon') return el
    const label = String(el.label ?? '')
    const isLeftSidebar = el.xPct < 20
    const isTallEnough = el.heightPct >= 8
    const isPictureLike = PICTURE_LABEL_RE.test(label)
    if (isLeftSidebar && isTallEnough && isPictureLike) {
      return { ...el, type: 'image-crop' }
    }
    return el
  })
}

const INDICATOR_LABEL_RE = /indicator|lamp|led|dot|status_light|warning|signal/i

/**
 * 하단 모서리 소형 rectangle → indicator 재분류.
 * 상태 LED가 rectangle로 오분류되는 경우를 복구.
 * 조건: widthPct <= 8 && heightPct <= 12, label이 indicator 패턴
 */
export function reclassifySmallRectToIndicator(elements: RawElement[]): RawElement[] {
  return elements.map(el => {
    if (el.type !== 'rectangle') return el
    const label = String(el.label ?? '')
    const isSmall = el.widthPct <= 8 && el.heightPct <= 12
    const isIndicatorLike = INDICATOR_LABEL_RE.test(label)
    if (isSmall && isIndicatorLike) {
      return { ...el, type: 'indicator' }
    }
    return el
  })
}

/**
 * Stage3A/3B 전체 요소에서 rtc 안정화:
 * - 이미 rtc 타입이면 유지
 * - label 또는 value가 HH:mm 패턴이고 상단(yPct < 25)이면 rtc로 승격
 * - Stage3A에서 rtc가 0개일 때 회귀 방지
 */
export function stabilizeRtc(elements: RawElement[]): RawElement[] {
  const hasRtc = elements.some(el => el.type === 'rtc')
  if (hasRtc) return elements  // 이미 있으면 그대로

  return elements.map(el => {
    const text = (el.label ?? '') + ' ' + (el.value ?? '')
    const isTimeText = TIME_PATTERN.test(text.trim()) || TIME_PATTERN.test((el.label ?? '').trim())
    if (isTimeText && el.yPct < 25) {
      return { ...el, type: 'rtc' }
    }
    return el
  })
}

/**
 * 최종 조립: zone-rect(배경) → visualElements → textElements
 * 후처리 순서: container→rectangle → promoteBottomIcons → stabilizeRtc
 */
export function assembleElements(
  s3aElements: RawElement[],
  s3bTexts: RawElement[],
  zones: RawZone[],
  bgColor: string,
): RawElement[] {
  const visualElements = promoteBottomIcons(
    s3aElements.map(el => ({ ...el, type: el.type === 'container' ? 'rectangle' : el.type }))
  )
  const textElements = s3bTexts.map(el => ({
    ...el,
    type: el.type === 'container' ? 'rectangle' : el.type,
  }))
  const zoneRects = addZoneRectsFallback(visualElements, zones, bgColor)
  const merged = reclassifySmallRectToIndicator(
    reclassifySidebarIcons(
      reclassifyFullScreenRect([...zoneRects, ...visualElements, ...textElements])
    )
  )
  return stabilizeRtc(merged)
}
