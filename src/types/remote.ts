export type ButtonFunction =
  | 'momentary'
  | 'toggle'
  | 'hold'
  | 'emergency'
  | 'encoder'
  | 'indicator'

export interface ButtonConfig {
  id: string
  label: string
  subLabel: string
  function: ButtonFunction
  color: string
  bgColor: string
  enabled: boolean
  col: number
  row: number
  colSpan: number
  rowSpan: number
}

export interface GridConfig {
  rows: number
  cols: number
  gap: number
}

export type GridPreset = '2x3' | '2x4' | '3x3' | '3x4' | '4x4' | '2x6' | 'custom'

export interface RemoteConfig {
  name: string
  grid: GridConfig
  buttons: ButtonConfig[]
  bodyColor: string
  bodyStyle: 'rounded' | 'sharp' | 'industrial'
}
