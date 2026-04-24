export type ElementType = 'indicator' | 'gauge' | 'numeric' | 'label' | 'title' | 'logo'

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
}

export interface DisplayConfig {
  name: string
  width: number
  height: number
  bgColor: string
  elements: DisplayElement[]
}
