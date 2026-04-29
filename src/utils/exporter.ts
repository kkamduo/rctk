import type { RemoteConfig } from '../types/remote'
import type { ThemeColors } from '../stores/styleStore'
import JSZip from 'jszip'

export function generateHTML(remote: RemoteConfig, colors: ThemeColors): string {
  const { grid, buttons, bodyColor, name } = remote
  const btnSize = 72
  const gap = grid.gap

  const buttonsHTML = buttons
    .map((btn) => {
      const isEmergency = btn.function === 'emergency'
      return `  <button
    class="rctk-btn"
    data-fn="${btn.function}"
    data-id="${btn.id}"
    style="
      width:${btnSize}px;height:${btnSize}px;
      background:${btn.bgColor};
      color:${btn.color};
      border-radius:${isEmergency ? '50%' : '8px'};
      border:2px solid ${isEmergency ? '#ef4444' : 'rgba(255,255,255,0.08)'};
      font-family:monospace;font-size:${btnSize > 68 ? 11 : 9}px;font-weight:700;
      cursor:pointer;display:flex;flex-direction:column;
      align-items:center;justify-content:center;gap:3px;
      padding:4px;
      box-shadow:${isEmergency ? '0 0 14px #ef444444' : '0 2px 8px rgba(0,0,0,0.35)'};
      transition:filter 0.1s,transform 0.1s;
      outline:none;
    "
    ${!btn.enabled ? 'disabled style="opacity:0.3;cursor:not-allowed"' : ''}
  >
    <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:${btnSize - 12}px">${btn.label}</span>
    ${btn.subLabel ? `<span style="font-size:8px;opacity:0.55;max-width:${btnSize - 12}px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${btn.subLabel}</span>` : ''}
  </button>`
    })
    .join('\n')

  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>RCTK — ${name}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{
    background:${colors.background};
    color:${colors.text};
    font-family:monospace;
    min-height:100vh;
    display:flex;
    flex-direction:column;
    align-items:center;
    justify-content:center;
    gap:16px;
  }
  .title{
    font-size:11px;
    letter-spacing:.12em;
    text-transform:uppercase;
    color:${colors.primary};
    opacity:.75;
  }
  .remote-name{
    font-size:15px;
    font-weight:700;
    letter-spacing:.05em;
    color:${colors.text};
  }
  .remote-body{
    background:${bodyColor};
    border:2px solid ${colors.border};
    border-radius:10px;
    padding:20px;
    box-shadow:0 24px 64px rgba(0,0,0,.55);
  }
  .strip{
    width:100%;height:3px;border-radius:2px;
    background:${colors.primary};opacity:.4;
    margin-bottom:14px;
  }
  .grid{
    display:grid;
    grid-template-columns:repeat(${grid.cols},${btnSize}px);
    grid-template-rows:repeat(${grid.rows},${btnSize}px);
    gap:${gap}px;
  }
  .rctk-btn:hover{filter:brightness(1.15)}
  .rctk-btn:active{transform:scale(.93)}
  .rctk-btn.active{filter:brightness(1.3);box-shadow:0 0 12px currentColor!important}
  .footer{
    font-size:8px;letter-spacing:.1em;
    color:${colors.text};opacity:.18;
    display:flex;justify-content:space-between;
    margin-top:12px;
  }
</style>
</head>
<body>
<div class="title">Remote Control</div>
<div class="remote-name">${name}</div>
<div class="remote-body">
  <div class="strip"></div>
  <div class="grid">
${buttonsHTML}
  </div>
  <div class="footer">
    <span>RCTK-GEN</span>
    <span>${grid.rows}×${grid.cols}</span>
  </div>
</div>
<script>
document.querySelectorAll('.rctk-btn').forEach(btn=>{
  const fn=btn.dataset.fn
  if(fn==='toggle'){
    btn.addEventListener('click',()=>btn.classList.toggle('active'))
  }
})
</script>
</body>
</html>`
}

import type { DisplayConfig } from '../types/display'

export function generateDisplayHTML(display: DisplayConfig): string {
  const elements = display.elements.map((el) => {
    const left = el.xPct
    const top = el.yPct
    const width = el.widthPct
    const height = el.heightPct
    const color = el.color ?? '#ffffff'
    const bg = el.bgColor ?? 'transparent'
    const label = el.label ?? el.value ?? ''

    let content = ''
    if (el.type === 'arc-gauge') {
      const pct = Math.min(100, Math.max(0, parseFloat(String(el.value ?? 0))))
      const angle = -135 + (pct / 100) * 270
      content = `
        <svg viewBox="0 0 100 100" style="width:100%;height:100%">
          <path d="M15,85 A50,50 0 1,1 85,85" fill="none" stroke="#333" stroke-width="8" stroke-linecap="round"/>
          <path d="M15,85 A50,50 0 1,1 85,85" fill="none" stroke="${color}" stroke-width="8" stroke-linecap="round"
            stroke-dasharray="235" stroke-dashoffset="${235 - (pct / 100) * 235}"/>
          <text x="50" y="60" text-anchor="middle" fill="${color}" font-size="18" font-family="monospace">${el.value ?? 0}</text>
          <text x="50" y="75" text-anchor="middle" fill="${color}" font-size="9" font-family="monospace" opacity="0.6">${el.unit ?? ''}</text>
        </svg>`
    } else if (el.type === 'gauge') {
      const pct = Math.min(100, Math.max(0, parseFloat(String(el.value ?? 0))))
      content = `
        <div style="width:100%;height:40%;background:#333;border-radius:4px;overflow:hidden;margin-top:30%">
          <div style="width:${pct}%;height:100%;background:${color};border-radius:4px;"></div>
        </div>
        <div style="text-align:center;color:${color};font-size:11px;font-family:monospace;margin-top:4px">${el.value ?? 0}${el.unit ?? ''}</div>`
    } else if (el.type === 'indicator') {
      const active = el.active !== false
      content = `<div style="width:60%;height:60%;border-radius:50%;background:${active ? color : '#333'};margin:auto;margin-top:20%;box-shadow:${active ? `0 0 12px ${color}` : 'none'}"></div>`
    } else if (el.type === 'numeric') {
      content = `
        <div style="font-size:clamp(10px,2.5vw,22px);font-weight:700;color:${color};font-family:monospace;text-align:center;line-height:1">${el.value ?? 0}</div>
        <div style="font-size:clamp(7px,1vw,10px);color:${color};opacity:0.6;text-align:center;font-family:monospace">${el.unit ?? ''}</div>
        <div style="font-size:clamp(7px,1vw,9px);color:${color};opacity:0.4;text-align:center;font-family:monospace">${el.label ?? ''}</div>`
    } else {
      content = `<div style="font-size:clamp(8px,1.5vw,13px);color:${color};font-family:monospace;text-align:center;word-break:break-all">${label}</div>`
    }

    return `<div style="
      position:absolute;
      left:${left}%;top:${top}%;
      width:${width}%;height:${height}%;
      background:${bg};
      display:flex;flex-direction:column;
      align-items:center;justify-content:center;
      border-radius:4px;box-sizing:border-box;overflow:hidden;
    ">${content}</div>`
  }).join('\n')

  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<title>${display.name}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#000;display:flex;align-items:center;justify-content:center;min-height:100vh;}
  .display{position:relative;width:${display.width}px;height:${display.height}px;background:${display.bgColor};border:1px solid #333;border-radius:4px;overflow:hidden;}
</style>
</head>
<body>
<div class="display">
${elements}
</div>
</body>
</html>`
}

export function generateTFT(display: DisplayConfig): string {
  let idCounter = 1
  const items = display.elements.map((el) => {
    const id = idCounter++
    const x = Math.round((el.xPct / 100) * display.width)
    const y = Math.round((el.yPct / 100) * display.height)
    const w = Math.round((el.widthPct / 100) * display.width)
    const h = Math.round((el.heightPct / 100) * display.height)

    const hexToRgb = (hex: string) => {
      const r = parseInt(hex.slice(1, 3), 16)
      const g = parseInt(hex.slice(3, 5), 16)
      const b = parseInt(hex.slice(5, 7), 16)
      return `${r};${g};${b}`
    }

    const pickFont = (heightPx: number, type: string) => {
      if (type === 'button') return '7'
      if (heightPx < 15) return '6'
      if (heightPx < 40) return '19'
      if (heightPx < 55) return '16'
      return '13'
    }

    const color = hexToRgb(el.color ?? '#ffffff')
    const name = (el.label ?? el.id).replace(/[<>"&]/g, '_')

    if (el.type === 'image-crop') {
      const ext = (el.mediaType ?? 'image/png').split('/')[1] ?? 'png'
      const filename = `${name}.${ext}`
      return `<item name="${name}" id="${id}" type="image" url="Images\\${filename}" transparent="0" transparent_color="0;0;0" xOffset="${x}" yOffset="${y}" width="${w}" height="${h}" bind_variant="" show_condition="0" condition_variant="" condition_value="0"/>`
    } else if (el.type === 'arc-gauge') {
      return `<item name="${name}" id="${id}" type="meter" show_bkg_style="0" bkg_image_path="" angle_start="225" angle_end="315" show_numerical="1" numerical_font_size="9" numerical_color="${color}" clock_wise="1" bkg_color="50;50;50" show_bkg_color="1" scale_color="${color}" scale_width="2" show_scale="1" mark_count="5" mark_color="${color}" mark_width="8" sub_mark_count="4" sub_mark_color="${color}" sub_scale_width="" show_sub_mark="1" pointer_type="0" pointer_color="${color}" pointer_center_color="192;192;192" xOffset="${x}" yOffset="${y}" width="${w}" height="${h}" value="${el.value ?? 0}" start_value="0" end_value="100" bind_variant="" show_condition="0" condition_variant="" condition_value="0"/>`
    } else if (el.type === 'gauge') {
      return `<item name="${name}" id="${id}" type="progress" progress_style="0" show_bkg_style="0" bkg_color="50;50;50" bkg_image_path="" show_fore_style="0" fore_color="${color}" fore_image_path="" xOffset="${x}" yOffset="${y}" width="${w}" height="${h}" value="${el.value ?? 0}" min_value="0" max_value="100" show_text="1" show_percent="0" enable_sliding="0" font="5" text_color="${color}" bind_variant="" show_condition="0" condition_variant="" condition_value="0"/>`
    } else if (el.type === 'indicator') {
      return `<item name="${name}" id="${id}" type="animation" icon="1" play_finish_notify="0" press_notify="0" step="1" frame_list="" transparent_process="0" auto_play="1" visible="${el.active !== false ? 1 : 0}" interval="1000" repeat_count="0" xOffset="${x}" yOffset="${y}" width="${w}" height="${h}" bind_variant="" show_condition="0" condition_variant="" condition_value="0" multi_lang="0"/>`
    } else if (el.type === 'numeric') {
      return `<item name="${name}" id="${id}" type="text_display" text="${el.value ?? 0}" tipinfo="" font="${pickFont(h, el.type)}" encode="1" show_bkg_style="0" fore_color="${color}" bkg_color="0;255;0" bkg_image_path="" xOffset="${x}" yOffset="${y}" width="${w}" height="${h}" input_mode="0" variant="0" text_type="0" text_len_max="255" password="0" focus_rect="0" text_align="2" text_align_v="1" value_limit="0" value_precision="0" max_value="100" min_value="0" bind_variant="" show_condition="0" condition_variant="" condition_value="0"/>`
    } else if (el.type === 'button') {
      return `<item name="${name}" id="${id}" type="button" text="${el.label ?? ''}" font="${pickFont(h, el.type)}" fore_color="${color}" bk_color="255;255;255" show_bk="1" xOffset="${x}" yOffset="${y}" width="${w}" height="${h}" bind_variant="" show_condition="0" condition_variant="" condition_value="0"/>`
    }
    else {
      return `<item name="${name}" id="${id}" type="text" multi_lang="0" text_align="1" text_align_v="1" text="${el.label ?? ''}" font="${pickFont(h, el.type)}" encode="0" show_bk="0" fore_color="${color}" bk_color="255;255;255" xOffset="${x}" yOffset="${y}" width="${w}" height="${h}" row_gap="0" col_gap="0"/>`
    }
  }).join('')

  const bgRgb = (() => {
    const hex = display.bgColor ?? '#000000'
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `${r};${g};${b}`
  })()

  return `<DrawPage name="${display.name}" bk_transparent="0" bk_color="${bgRgb}" bk_image="" size_option="0" width="${display.width}" height="${display.height}">${items}</DrawPage>`
}


export async function generateZip(display: DisplayConfig): Promise<Blob> {
  const zip = new JSZip()
  const imagesFolder = zip.folder('Images')

  const cropElements = display.elements.filter(el => el.type === 'image-crop' && el.imageData)

  // Images/ 폴더에 image-crop 요소 저장
  const imageEntries: string[] = []
  cropElements.forEach((el) => {
    const ext = (el.mediaType ?? 'image/png').split('/')[1] ?? 'png'
    const safeName = (el.label ?? el.id).replace(/[<>"&]/g, '_')
    const filename = `${safeName}.${ext}`
    imagesFolder?.file(filename, el.imageData!, { base64: true })
    imageEntries.push(`  <Image RelativePath="Images\\${filename}"/>`)
  })

  // TFT 추가 (image-crop → Images\ 참조 포함)
  const tft = generateTFT(display)
  zip.file(`${display.name}.tft`, tft)

  // tftprj 추가 (Images 블록에 파일 목록 등록)
  const tftprj = `<?xml version="1.0" encoding="utf-8"?>
<VisualTFT Name="${display.name}" OutputDirectory="output\\" StartupPage="${display.name}" StartupAction="" StartupActionLoop="1" DeviceType="51201" DeviceEnableControl="1" DeviceEnableTouchPane="1" DeviceEnableBuzzer="2" DeviceEnableCRC="0" DeviceBaudRate="3" DeviceCoordinateUpdateMode="4" DeviceControlNotify="3" DeviceScreenNotify="1" DeviceScreenRvs="0" DeviceBacklightAutoControl="0" DeviceBacklightTime="10" DeviceBacklightOn="200" DeviceBacklightOff="50" DeviceBacklightNotify="0" DeviceLockConfig="1" Version="1.0">
  <Pages><Page RelativePath="${display.name}.tft"/></Pages>
  <Images>
${imageEntries.join('\n')}
  </Images>
  <Waves/>
</VisualTFT>`
  zip.file(`${display.name}.tftprj`, tftprj)

  // HTML 추가
  const html = generateDisplayHTML(display)
  zip.file(`${display.name}.html`, html)

  return zip.generateAsync({ type: 'blob' })
}