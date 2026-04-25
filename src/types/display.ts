export type ElementType = 'indicator' | 'gauge' | 'arc-gauge' | 'numeric' | 'label' | 'title' | 'logo' | 'button'

export interface DisplayElement {
  id: string
  type: ElementType
  x: number
  y: number
  width: number
  height: number
  label: string
  value?: string
  color: string
  bgColor: string
  active?: boolean
  unit?: string
  fontSize?: number
}

export interface DisplayConfig {
  name: string
  width: number
  height: number
  bgColor: string
  elements: DisplayElement[]
}
