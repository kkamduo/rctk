import type { RemoteConfig } from '../types/remote'
import type { ThemeColors } from '../stores/styleStore'

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
