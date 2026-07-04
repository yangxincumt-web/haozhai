import React, { useState, useCallback, useRef, useEffect } from 'react'

// 品牌色值
const COLORS = {
  paperBg: '#f7f2e8',
  inkBlack: '#2a2a2a',
  cinnabar: '#c0392b',
  copper: '#d4a574',
  jade: '#2d6a2d',
  purple: '#6b4c9a',
  qinglv: '#3a7d6e',
  textLight: '#8b7355',
  textMid: '#5a4a3a',
}

const PALACE_NAMES = {
  '西北': '乾', '正西': '兑', '西南': '坤',
  '正北': '坎', '正中': '中', '正南': '离',
  '东北': '艮', '正东': '震', '东南': '巽',
}

export default function SharePoster({
  result,
  renovationPenalty = 0,
  xingshaPenalty = 0,
  envData = null,
  renovationData = null,
  envAdvantageData = null,
  onClose
}) {
  const canvasRef = useRef(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [posterUrl, setPosterUrl] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)

  const generatePoster = useCallback(() => {
    setIsGenerating(true)
    const canvas = canvasRef.current
    if (!canvas) { setIsGenerating(false); return }

    const ctx = canvas.getContext('2d')
    const W = 390
    const H = 1020
    canvas.width = W
    canvas.height = H

    // 背景
    ctx.fillStyle = COLORS.paperBg
    ctx.fillRect(0, 0, W, H)

    // 淡墨纹理
    const g1 = ctx.createRadialGradient(W * 0.15, H * 0.05, 0, W * 0.15, H * 0.05, 200)
    g1.addColorStop(0, 'rgba(180,170,150,0.07)')
    g1.addColorStop(1, 'transparent')
    ctx.fillStyle = g1
    ctx.fillRect(0, 0, W, H)
    const g2 = ctx.createRadialGradient(W * 0.85, H * 0.95, 0, W * 0.85, H * 0.95, 220)
    g2.addColorStop(0, 'rgba(180,170,150,0.05)')
    g2.addColorStop(1, 'transparent')
    ctx.fillStyle = g2
    ctx.fillRect(0, 0, W, H)

    let curY = 0
    const CX = W / 2
    const PAD = 32

    // ===== 品牌 =====
    ctx.fillStyle = COLORS.inkBlack
    ctx.font = 'bold 26px "Songti SC","SimSun",serif'
    ctx.textAlign = 'center'
    ctx.fillText('☯ 好宅助手', CX, 48)
    ctx.fillStyle = COLORS.copper
    ctx.font = '11px "PingFang SC",sans-serif'
    ctx.fillText('V2.5 · 八宅飞星融合分析', CX, 70)
    ctx.strokeStyle = COLORS.copper
    ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(PAD, 86); ctx.lineTo(W - PAD, 86); ctx.stroke()
    curY = 98

    // ===== 评分 + 八字 =====
    const score = result?.overall?.score || 0
    const level = result?.overall?.level || '待评估'
    const scoreColor = score >= 65 ? COLORS.jade : score >= 50 ? COLORS.copper : COLORS.cinnabar

    ctx.fillStyle = scoreColor
    ctx.font = 'bold 52px "Georgia",serif'
    ctx.textAlign = 'center'
    ctx.fillText(String(score), CX - 18, curY + 42)
    ctx.fillStyle = COLORS.textLight
    ctx.font = '13px "PingFang SC",sans-serif'
    ctx.fillText('分', CX + 26, curY + 30)
    ctx.fillStyle = scoreColor
    ctx.font = 'bold 17px "Songti SC",serif'
    ctx.fillText(level, CX, curY + 66)

    if (result?.baZi) {
      ctx.fillStyle = COLORS.textMid
      ctx.font = '13px "PingFang SC",sans-serif'
      ctx.fillText(
        `${result.baZi.yearPillar}年 ${result.baZi.monthPillar}月 ${result.baZi.dayPillar}日 ${result.baZi.hourPillar}时`,
        CX, curY + 90
      )
    }
    curY += 106

    // 分隔
    const drawSep = (y) => {
      ctx.strokeStyle = 'rgba(139,115,85,0.25)'
      ctx.beginPath(); ctx.moveTo(PAD, y); ctx.lineTo(W - PAD, y); ctx.stroke()
      return y + 14
    }
    curY = drawSep(curY)

    // ===== 核心发现 =====
    ctx.fillStyle = COLORS.inkBlack
    ctx.font = 'bold 14px "Songti SC",serif'
    ctx.textAlign = 'left'
    ctx.fillText('📋 核心发现', PAD, curY + 2)
    curY += 20

    const findings = []
    findings.push(`宅卦：${result?.zhaiGua?.detail || '—'}`)
    findings.push(`命卦：${result?.mingGua?.name || '—'}（${result?.mingGua?.groupLabel || '—'}）`)
    findings.push(`人宅：${result?.match?.match ? '✅ 相配' : '⚠️ 不配'}`)
    if (result?.feiXing?.pattern) {
      findings.push(`格局：${result.feiXing.pattern.type}（${result.feiXing.period}运）`)
    }
    if (result?.wuxing?.xiYongShen?.length > 0) {
      findings.push(`喜用：${result.wuxing.xiYongShen.join('、')}`)
    }
    if (result?.conflicts?.conflictCount > 0) {
      findings.push(`冲突：${result.conflicts.conflictCount}处（飞星优先）`)
    }

    ctx.fillStyle = COLORS.textMid
    ctx.font = '12px "PingFang SC",sans-serif'
    findings.forEach(line => {
      ctx.fillText(line, PAD, curY + 2)
      curY += 19
    })
    curY += 4
    curY = drawSep(curY)

    // ===== 环境概况 =====
    const hasEnvInfo = envData?.details?.length > 0 || envAdvantageData?.advantages?.length > 0 || renovationData
    if (hasEnvInfo) {
      ctx.fillStyle = COLORS.inkBlack
      ctx.font = 'bold 14px "Songti SC",serif'
      ctx.textAlign = 'left'
      ctx.fillText('🏠 环境概况', PAD, curY + 2)
      curY += 20

      ctx.font = '12px "PingFang SC",sans-serif'
      if (envData?.details?.length > 0) {
        ctx.fillStyle = COLORS.cinnabar
        ctx.fillText(`形煞：${envData.details.length}项`, PAD, curY + 2)
        ctx.fillStyle = COLORS.textLight
        ctx.fillText(envData.details.slice(0, 3).map(d => d.name).join('、') + (envData.details.length > 3 ? '…' : ''), PAD + 88, curY + 2)
        curY += 18
      }
      if (envAdvantageData?.advantages?.length > 0) {
        ctx.fillStyle = COLORS.jade
        ctx.fillText(`优势：${envAdvantageData.advantages.length}项`, PAD, curY + 2)
        ctx.fillStyle = COLORS.textLight
        ctx.fillText(envAdvantageData.advantages.slice(0, 3).map(a => a.name).join('、') + (envAdvantageData.advantages.length > 3 ? '…' : ''), PAD + 88, curY + 2)
        curY += 18
      }
      if (renovationData) {
        const issues = renovationData.renovationIssues?.length || 0
        const fengshui = renovationData.fengshuiIssues?.length || 0
        const style = renovationData.styleIssues?.length || 0
        ctx.fillStyle = COLORS.purple
        ctx.fillText(`装修：${issues + fengshui + style}项`, PAD, curY + 2)
        ctx.fillStyle = COLORS.textLight
        const parts = []
        if (issues) parts.push(`${issues}质量`)
        if (fengshui) parts.push(`${fengshui}风水`)
        if (style) parts.push(`${style}风格`)
        ctx.fillText(parts.join('·'), PAD + 88, curY + 2)
        curY += 18
      }
      curY += 4
      curY = drawSep(curY)
    }

    // ===== 吉凶方位九宫格 =====
    ctx.fillStyle = COLORS.inkBlack
    ctx.font = 'bold 14px "Songti SC",serif'
    ctx.textAlign = 'left'
    ctx.fillText('🧭 吉凶方位', PAD, curY + 2)
    curY += 18

    const gridSize = 80
    const gridStartX = (W - gridSize * 3) / 2
    const gridStartY = curY
    const palaces = result?.palaces || []
    const getPalaceByPos = (pos) => palaces.find(p => p.position === pos)

    const gridPositions = [
      ['西北', '正北', '东北'],
      ['正西', '正中', '正东'],
      ['西南', '正南', '东南'],
    ]
    gridPositions.forEach((row, rowIdx) => {
      row.forEach((pos, colIdx) => {
        const x = gridStartX + colIdx * gridSize
        const y = gridStartY + rowIdx * gridSize
        const palace = getPalaceByPos(pos)
        const isJi = palace?.nature === '吉'
        const isXiong = palace?.nature === '凶'

        ctx.fillStyle = isJi ? 'rgba(45,106,45,0.10)' : isXiong ? 'rgba(192,57,43,0.07)' : 'rgba(212,165,116,0.05)'
        ctx.fillRect(x + 2, y + 2, gridSize - 4, gridSize - 4)
        ctx.strokeStyle = isJi ? COLORS.jade : isXiong ? COLORS.cinnabar : 'rgba(212,165,116,0.4)'
        ctx.lineWidth = 1
        ctx.strokeRect(x + 2, y + 2, gridSize - 4, gridSize - 4)

        ctx.fillStyle = isJi ? COLORS.jade : isXiong ? COLORS.cinnabar : COLORS.textLight
        ctx.font = 'bold 12px "Songti SC",serif'
        ctx.textAlign = 'center'
        ctx.fillText(pos, x + gridSize / 2, y + 19)
        ctx.font = '10px "PingFang SC",sans-serif'
        if (palace?.youxing) ctx.fillText(palace.youxing, x + gridSize / 2, y + 34)
        ctx.fillText(isJi ? '吉' : isXiong ? '凶' : '平', x + gridSize / 2, y + 48)
        ctx.font = '15px "Songti SC",serif'
        ctx.fillStyle = isJi ? COLORS.jade : isXiong ? COLORS.cinnabar : COLORS.copper
        ctx.fillText(PALACE_NAMES[pos] || '', x + gridSize / 2, y + 68)
      })
    })
    curY = gridStartY + gridSize * 3 + 6
    curY = drawSep(curY)

    // ===== 化解要点 =====
    if (result?.huajie?.problems?.length > 0) {
      ctx.fillStyle = COLORS.inkBlack
      ctx.font = 'bold 14px "Songti SC",serif'
      ctx.textAlign = 'left'
      ctx.fillText('🛡️ 化解要点', PAD, curY + 2)
      curY += 20

      ctx.font = '12px "PingFang SC",sans-serif'
      result.huajie.problems.slice(0, 3).forEach(p => {
        ctx.fillStyle = COLORS.cinnabar
        ctx.fillText('•', PAD, curY + 2)
        ctx.fillStyle = COLORS.textMid
        const txt = `${p.position}${p.youxing}位：${p.items?.slice(0, 2).map(i => i.name).join('、') || '建议调整'}`
        ctx.fillText(txt, PAD + 14, curY + 2)
        curY += 18
      })
      if (result.huajie.problems.length > 3) {
        ctx.fillStyle = COLORS.textLight
        ctx.font = '11px "PingFang SC",sans-serif'
        ctx.fillText(`另有${result.huajie.problems.length - 3}项，完整方案见APP`, PAD + 14, curY + 2)
        curY += 18
      }
      curY += 4
      curY = drawSep(curY)
    }

    // ===== 底部 =====
    curY = Math.max(curY, H - 72)

    // 印章
    ctx.save()
    ctx.translate(CX - 52, curY + 6)
    ctx.rotate(-6 * Math.PI / 180)
    ctx.strokeStyle = COLORS.cinnabar
    ctx.lineWidth = 2
    ctx.strokeRect(0, 0, 42, 42)
    ctx.fillStyle = COLORS.cinnabar
    ctx.font = 'bold 11px "Songti SC",serif'
    ctx.textAlign = 'center'
    ctx.fillText('好宅', 21, 25)
    ctx.font = '9px "Songti SC",serif'
    ctx.fillText('运筹', 21, 38)
    ctx.restore()

    // 二维码占位
    ctx.fillStyle = '#fff'
    ctx.fillRect(CX + 10, curY + 4, 42, 42)
    ctx.strokeStyle = COLORS.textLight
    ctx.lineWidth = 1
    ctx.strokeRect(CX + 10, curY + 4, 42, 42)
    ctx.fillStyle = COLORS.textLight
    ctx.font = '9px "PingFang SC",sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('扫码', CX + 31, curY + 22)
    ctx.fillText('测你家', CX + 31, curY + 36)

    ctx.fillStyle = COLORS.textLight
    ctx.font = '11px "PingFang SC",sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('扫码获取专属化解方案', CX, curY + 54)
    ctx.font = '9px "PingFang SC",sans-serif'
    ctx.fillText('本分析仅供参考，风水判断因人而异', CX, curY + 66)

    const dataUrl = canvas.toDataURL('image/png')
    setPosterUrl(dataUrl)
    setIsGenerating(false)
  }, [result, envData, renovationData, envAdvantageData])

  useEffect(() => {
    if (result) generatePoster()
  }, [result, generatePoster])

  // 保存海报 - 多种降级方案
  const savePoster = useCallback(async () => {
    if (!posterUrl) return
    setIsSaving(true)

    try {
      // 方案1: Web Share API（支持分享文件到微信等）
      if (navigator.canShare && navigator.share) {
        try {
          const canvas = canvasRef.current
          const blob = await new Promise((resolve, reject) => {
            canvas.toBlob(b => b ? resolve(b) : reject(new Error('toBlob failed')), 'image/png')
          })
          const file = new File([blob], '好宅助手_风水报告.png', { type: 'image/png' })
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: '好宅助手 - 风水分析报告',
              text: `我的家宅评分${result?.overall?.score}分，来看看你的！`,
              files: [file],
            })
            setIsSaving(false)
            return
          }
        } catch (err) {
          if (err.name === 'AbortError') { setIsSaving(false); return }
        }
      }

      // 方案2: 下载（桌面浏览器）
      const link = document.createElement('a')
      link.download = `好宅助手_${result?.baZi?.dayPillar || '风水报告'}.png`
      link.href = posterUrl
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err) {
      console.error('Save poster failed:', err)
    }
    setIsSaving(false)
  }, [posterUrl, result])

  // 复制链接分享
  const copyShareLink = useCallback(async () => {
    const shareText = `【好宅助手】我的家宅风水评分${result?.overall?.score}分（${result?.overall?.level}），八字：${result?.baZi?.yearPillar || ''}年${result?.baZi?.monthPillar || ''}月${result?.baZi?.dayPillar || ''}日${result?.baZi?.hourPillar || ''}时，快来测测你家！${window.location.href}`
    
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareText)
      } else {
        // 降级方案：用textarea复制
        const ta = document.createElement('textarea')
        ta.value = shareText
        ta.style.cssText = 'position:fixed;left:-9999px'
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
      }
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (e) {
      // 最后降级：弹出提示让用户手动复制
      prompt('请复制以下内容分享给朋友：', shareText)
    }
  }, [result])

  // 长按保存提示
  const handleImageClick = useCallback(() => {
    if (posterUrl && !navigator.share) {
      alert('💡 长按海报图片可保存到相册，或点击「复制分享链接」发送给朋友')
    }
  }, [posterUrl])

  return (
    <div className="poster-modal">
      <div className="poster-container">
        <button className="poster-close" onClick={onClose}>×</button>
        <h3 className="poster-title">分享海报</h3>

        <div className="poster-preview">
          {isGenerating ? (
            <div className="poster-loading">
              <span className="loading-spinner" />
              <span>正在生成海报...</span>
            </div>
          ) : posterUrl ? (
            <img src={posterUrl} alt="分享海报" className="poster-image" onClick={handleImageClick} />
          ) : (
            <div className="poster-empty">点击下方按钮生成海报</div>
          )}
        </div>

        <canvas ref={canvasRef} style={{ display: 'none' }} />

        <div className="poster-actions">
          <button className="btn-poster-generate" onClick={generatePoster} disabled={isGenerating}>
            {isGenerating ? '生成中...' : '🔄 重新生成'}
          </button>
          {posterUrl && (
            <button className="btn-poster-download" onClick={savePoster} disabled={isSaving}>
              {isSaving ? '处理中...' : '📥 保存海报'}
            </button>
          )}
          <button className="btn-poster-share" onClick={copyShareLink}>
            {copySuccess ? '✅ 已复制' : '🔗 复制分享链接'}
          </button>
        </div>

        <p className="poster-hint">
          {navigator.share
            ? '点击「保存海报」可分享图片；点击「复制链接」发文字给朋友'
            : '长按海报图片保存到相册，或复制链接发给朋友'
          }
        </p>
      </div>
    </div>
  )
}
