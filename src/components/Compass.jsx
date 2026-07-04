import React, { useState, useEffect, useRef, useCallback } from 'react'
import RemoteOrientation from './RemoteOrientation.jsx'

/**
 * 二十四山罗盘组件
 * 专业风水罗盘，显示24山方位，实时响应手机朝向
 * 兼容iOS 13+需用户授权
 */

// 二十四山数据：每山15°，从正北0°顺时针
const MOUNTAINS_24 = [
  { name: '壬', type: 'gan', deg: 0 },
  { name: '子', type: 'zhi', deg: 15 },
  { name: '癸', type: 'gan', deg: 30 },
  { name: '丑', type: 'zhi', deg: 45 },
  { name: '艮', type: 'gua', deg: 60 },
  { name: '寅', type: 'zhi', deg: 75 },
  { name: '甲', type: 'gan', deg: 90 },
  { name: '卯', type: 'zhi', deg: 105 },
  { name: '乙', type: 'gan', deg: 120 },
  { name: '辰', type: 'zhi', deg: 135 },
  { name: '巽', type: 'gua', deg: 150 },
  { name: '巳', type: 'zhi', deg: 165 },
  { name: '丙', type: 'gan', deg: 180 },
  { name: '午', type: 'zhi', deg: 195 },
  { name: '丁', type: 'gan', deg: 210 },
  { name: '未', type: 'zhi', deg: 225 },
  { name: '坤', type: 'gua', deg: 240 },
  { name: '申', type: 'zhi', deg: 255 },
  { name: '庚', type: 'gan', deg: 270 },
  { name: '酉', type: 'zhi', deg: 285 },
  { name: '辛', type: 'gan', deg: 300 },
  { name: '戌', type: 'zhi', deg: 315 },
  { name: '乾', type: 'gua', deg: 330 },
  { name: '亥', type: 'zhi', deg: 345 },
]

// 八干四维大字（天干+四卦），用于外圈
const OUTER_LABELS = [
  { name: '北', deg: 0 },
  { name: '东北', deg: 45 },
  { name: '东', deg: 90 },
  { name: '东南', deg: 135 },
  { name: '南', deg: 180 },
  { name: '西南', deg: 225 },
  { name: '西', deg: 270 },
  { name: '西北', deg: 315 },
]

export default function Compass({ onDone, onBack }) {
  const canvasRef = useRef(null)
  const [heading, setHeading] = useState(null)
  const [hasPermission, setHasPermission] = useState(false)
  const [error, setError] = useState('')
  const [stabilized, setStabilized] = useState(false)
  const [remoteMode, setRemoteMode] = useState(false)
  const readingsRef = useRef([])
  const stableCountRef = useRef(0)
  const headingRef = useRef(null)
  const animFrameRef = useRef(null)

  // 绘制罗盘
  const drawCompass = useCallback((angle) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const dpr = window.devicePixelRatio || 1
    // 根据屏幕宽度自适应罗盘大小
    const isSmall = window.innerWidth <= 375
    const size = isSmall ? 240 : 260
    canvas.width = size * dpr
    canvas.height = size * dpr
    canvas.style.width = size + 'px'
    canvas.style.height = size + 'px'

    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)

    const cx = size / 2
    const cy = size / 2
    const R = size / 2 - 6 // 最外圈半径

    // 清空
    ctx.clearRect(0, 0, size, size)

    // === 外圈背景 ===
    ctx.beginPath()
    ctx.arc(cx, cy, R, 0, Math.PI * 2)
    const outerGrad = ctx.createRadialGradient(cx, cy, R * 0.7, cx, cy, R)
    outerGrad.addColorStop(0, '#f5f0e8')
    outerGrad.addColorStop(1, '#ebe5d8')
    ctx.fillStyle = outerGrad
    ctx.fill()

    // 外圈边框
    ctx.beginPath()
    ctx.arc(cx, cy, R, 0, Math.PI * 2)
    ctx.strokeStyle = 'rgba(166, 124, 61, 0.35)'
    ctx.lineWidth = 2
    ctx.stroke()

    // === 第1圈：方位文字（最外圈）===
    const r1 = R - 2
    const r1inner = R - 22

    // 画外圈环
    ctx.beginPath()
    ctx.arc(cx, cy, r1inner, 0, Math.PI * 2)
    ctx.strokeStyle = 'rgba(166, 124, 61, 0.2)'
    ctx.lineWidth = 1
    ctx.stroke()

    // 绘制8个方位标签（北东南西）
    OUTER_LABELS.forEach(label => {
      const a = (label.deg - angle) * Math.PI / 180 - Math.PI / 2
      const tr = (r1 + r1inner) / 2
      const tx = cx + tr * Math.cos(a)
      const ty = cy + tr * Math.sin(a)

      ctx.save()
      ctx.translate(tx, ty)
      ctx.rotate(a + Math.PI / 2)
      ctx.font = '600 10px "PingFang SC", "Microsoft YaHei", sans-serif'
      ctx.fillStyle = label.deg === 0 ? '#c23a2a' : 'rgba(90, 90, 90, 0.6)'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(label.name, 0, 0)
      ctx.restore()
    })

    // === 第2圈：二十四山 ===
    const r2 = r1inner - 2
    const r2inner = r1inner - 36

    // 画二十四山环
    ctx.beginPath()
    ctx.arc(cx, cy, r2inner, 0, Math.PI * 2)
    ctx.strokeStyle = 'rgba(166, 124, 61, 0.18)'
    ctx.lineWidth = 1
    ctx.stroke()

    // 绘制二十四山分割线和文字
    MOUNTAINS_24.forEach(m => {
      const a = (m.deg - angle) * Math.PI / 180 - Math.PI / 2

      // 分割线
      const x1 = cx + r2 * Math.cos(a)
      const y1 = cy + r2 * Math.sin(a)
      const x2 = cx + r2inner * Math.cos(a)
      const y2 = cy + r2inner * Math.sin(a)
      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
      ctx.strokeStyle = 'rgba(166, 124, 61, 0.12)'
      ctx.lineWidth = 0.5
      ctx.stroke()

      // 文字
      const tr = (r2 + r2inner) / 2
      const tx = cx + tr * Math.cos(a)
      const ty = cy + tr * Math.sin(a)

      ctx.save()
      ctx.translate(tx, ty)
      ctx.rotate(a + Math.PI / 2)

      // 颜色：天干用金色，地支用白色，四维用朱砂色
      let color, fontSize
      if (m.type === 'gua') {
        color = '#c23a2a'
        fontSize = 13
      } else if (m.type === 'zhi') {
        color = '#3a3a3a'
        fontSize = 12
      } else {
        color = '#a67c3d'
        fontSize = 12
      }

      ctx.font = `600 ${fontSize}px "PingFang SC", "Microsoft YaHei", sans-serif`
      ctx.fillStyle = color
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(m.name, 0, 0)
      ctx.restore()
    })

    // === 第3圈：度数刻度 ===
    const r3 = r2inner - 2
    const r3inner = r2inner - 16

    ctx.beginPath()
    ctx.arc(cx, cy, r3inner, 0, Math.PI * 2)
    ctx.strokeStyle = 'rgba(166, 124, 61, 0.12)'
    ctx.lineWidth = 1
    ctx.stroke()

    // 每15度画刻度
    for (let d = 0; d < 360; d += 15) {
      const a = (d - angle) * Math.PI / 180 - Math.PI / 2
      const isMajor = d % 90 === 0
      const isMid = d % 45 === 0
      const len = isMajor ? 10 : isMid ? 7 : 4

      const x1 = cx + r3 * Math.cos(a)
      const y1 = cy + r3 * Math.sin(a)
      const x2 = cx + (r3 - len) * Math.cos(a)
      const y2 = cy + (r3 - len) * Math.sin(a)

      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
      ctx.strokeStyle = isMajor ? 'rgba(166, 124, 61, 0.5)' : 'rgba(166, 124, 61, 0.2)'
      ctx.lineWidth = isMajor ? 1.5 : 0.5
      ctx.stroke()
    }

    // === 内圈装饰 ===
    const r4 = r3inner - 2
    const r4inner = r3inner - 20

    // 内圈填充
    const innerGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r4inner)
    innerGrad.addColorStop(0, 'rgba(248, 246, 241, 0.95)')
    innerGrad.addColorStop(1, 'rgba(235, 229, 216, 0.95)')
    ctx.beginPath()
    ctx.arc(cx, cy, r4inner, 0, Math.PI * 2)
    ctx.fillStyle = innerGrad
    ctx.fill()

    ctx.beginPath()
    ctx.arc(cx, cy, r4inner, 0, Math.PI * 2)
    ctx.strokeStyle = 'rgba(166, 124, 61, 0.25)'
    ctx.lineWidth = 1.5
    ctx.stroke()

    // 内圈十字线
    for (let d = 0; d < 360; d += 90) {
      const a = (d - angle) * Math.PI / 180 - Math.PI / 2
      ctx.beginPath()
      ctx.moveTo(cx + r4inner * 0.3 * Math.cos(a), cy + r4inner * 0.3 * Math.sin(a))
      ctx.lineTo(cx + r4inner * 0.9 * Math.cos(a), cy + r4inner * 0.9 * Math.sin(a))
      ctx.strokeStyle = d === 0 ? 'rgba(194, 58, 42, 0.3)' : 'rgba(166, 124, 61, 0.12)'
      ctx.lineWidth = 1
      ctx.stroke()
    }

    // 内圈太极点
    ctx.beginPath()
    ctx.arc(cx, cy, 6, 0, Math.PI * 2)
    const centerGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 6)
    centerGrad.addColorStop(0, '#c4982e')
    centerGrad.addColorStop(1, '#8b6914')
    ctx.fillStyle = centerGrad
    ctx.fill()

    // === 固定指北针（红色三角在顶部） ===
    ctx.beginPath()
    ctx.moveTo(cx, cy - R - 2)
    ctx.lineTo(cx - 8, cy - R - 14)
    ctx.lineTo(cx + 8, cy - R - 14)
    ctx.closePath()
    ctx.fillStyle = '#c23a2a'
    ctx.fill()

    // 南针（底部小三角）
    ctx.beginPath()
    ctx.moveTo(cx, cy + R + 2)
    ctx.lineTo(cx - 5, cy + R + 10)
    ctx.lineTo(cx + 5, cy + R + 10)
    ctx.closePath()
    ctx.fillStyle = 'rgba(166, 124, 61, 0.25)'
    ctx.fill()

  }, [])

  // 动画循环
  const animate = useCallback(() => {
    if (headingRef.current !== null) {
      drawCompass(headingRef.current)
    }
    animFrameRef.current = requestAnimationFrame(animate)
  }, [drawCompass])

  // 请求iOS权限
  const requestPermission = async () => {
    if (typeof DeviceOrientationEvent !== 'undefined' &&
        typeof DeviceOrientationEvent.requestPermission === 'function') {
      try {
        const permission = await DeviceOrientationEvent.requestPermission()
        if (permission === 'granted') {
          setHasPermission(true)
        } else {
          setError('需要授权才能使用罗盘，请在设置中允许')
        }
      } catch (e) {
        setError('罗盘授权失败：' + e.message)
      }
    } else {
      setHasPermission(true)
    }
  }

  // 监听方向变化
  useEffect(() => {
    if (!hasPermission) return

    const handler = (event) => {
      let h = null
      if (event.webkitCompassHeading !== undefined && event.webkitCompassHeading !== null) {
        // iOS: webkitCompassHeading 直接是罗盘朝向（0=北，顺时针）
        h = event.webkitCompassHeading
      } else if (event.alpha !== null) {
        // Android alpha 遵循 W3C 规范：0=朝北，逆时针递增
        // 罗盘朝向（顺时针）= (360 - alpha) % 360
        // 无论 deviceorientation 还是 deviceorientationabsolute，转换公式相同
        // 区别仅在于：absolute 的 alpha 以真北为基准，非 absolute 以任意方向为基准
        h = (360 - event.alpha) % 360
      }

      if (h !== null) {
        headingRef.current = h
        setHeading(h)
        checkStabilized(h)
      }
    }

    // 优先使用 deviceorientationabsolute（Android上更可靠）
    // 这个事件保证alpha以北方为基准，不会受初始朝向影响
    let useAbsolute = false
    if ('ondeviceorientationabsolute' in window) {
      window.addEventListener('deviceorientationabsolute', handler, true)
      useAbsolute = true
    } else {
      window.addEventListener('deviceorientation', handler, true)
    }

    return () => {
      if (useAbsolute) {
        window.removeEventListener('deviceorientationabsolute', handler, true)
      } else {
        window.removeEventListener('deviceorientation', handler, true)
      }
    }
  }, [hasPermission])

  // 检测读数是否稳定
  const checkStabilized = (h) => {
    readingsRef.current.push(h)
    if (readingsRef.current.length > 10) {
      readingsRef.current.shift()
    }

    if (readingsRef.current.length >= 5) {
      const recent = readingsRef.current.slice(-5)
      const maxDiff = Math.max(...recent) - Math.min(...recent)
      if (maxDiff < 2) {
        stableCountRef.current++
        if (stableCountRef.current >= 3 && !stabilized) {
          setStabilized(true)
        }
      } else {
        stableCountRef.current = 0
      }
    }
  }

  // 获取当前山名
  const getCurrentMountain = (angle) => {
    if (angle === null) return '--'
    const a = ((angle % 360) + 360) % 360
    const idx = Math.round(a / 15) % 24
    return MOUNTAINS_24[idx].name
  }

  // 获取方位名
  const getDirectionName = (angle) => {
    if (angle === null) return '--'
    const a = ((angle % 360) + 360) % 360
    if (a >= 337.5 || a < 22.5) return '正北'
    if (a >= 22.5 && a < 67.5) return '东北'
    if (a >= 67.5 && a < 112.5) return '正东'
    if (a >= 112.5 && a < 157.5) return '东南'
    if (a >= 157.5 && a < 202.5) return '正南'
    if (a >= 202.5 && a < 247.5) return '西南'
    if (a >= 247.5 && a < 292.5) return '正西'
    return '西北'
  }

  // 确认朝向
  const confirmHeading = () => {
    if (heading !== null) {
      const recent = readingsRef.current.slice(-5)
      const avg = recent.reduce((a, b) => a + b, 0) / recent.length
      onDone(Math.round(avg * 10) / 10)
    }
  }

  // 启动动画
  useEffect(() => {
    if (hasPermission) {
      drawCompass(0)
      animFrameRef.current = requestAnimationFrame(animate)
      return () => {
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      }
    }
  }, [hasPermission, drawCompass, animate])

  // 降级：手动输入角度
  // 同步检测是否移动端，避免useEffect延迟导致PC端闪烁"授权罗盘"
  const [manualMode, setManualMode] = useState(() => {
    const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent)
    return !isMobile
  })
  const [manualAngle, setManualAngle] = useState(180)

  // 传感器超时降级：授权后3秒无数据自动切手动模式
  useEffect(() => {
    if (manualMode) return
    if (!hasPermission) return
    const timer = setTimeout(() => {
      if (headingRef.current === null) {
        console.log('[Compass] 传感器3秒无数据，自动切换手动模式')
        setManualMode(true)
      }
    }, 3000)
    return () => clearTimeout(timer)
  }, [manualMode, hasPermission])

  // 手动模式也绘制罗盘
  useEffect(() => {
    if (manualMode) {
      drawCompass(manualAngle)
    }
  }, [manualMode, manualAngle, drawCompass])

  // 远程模式
  if (remoteMode) {
    return (
      <div className="compass-container">
        <RemoteOrientation
          onDone={(angle, directionName) => onDone(angle)}
          onBack={() => setRemoteMode(false)}
        />
      </div>
    )
  }

  if (error) {
    return (
      <div className="compass-container">
        <div style={{ padding: 20, textAlign: 'center', color: 'var(--cinnabar)' }}>
          <p>{error}</p>
          <button className="btn-secondary" onClick={() => setManualMode(true)}
            style={{ marginTop: 16 }}>
            切换手动输入
          </button>
          <button className="btn-remote-entry" onClick={() => setRemoteMode(true)}
            style={{ marginTop: 12 }}>
            📍 远程看盘
          </button>
        </div>
      </div>
    )
  }

  if (manualMode) {
    return (
      <div className="compass-container">
        <canvas ref={canvasRef} style={{ display: 'block', margin: '0 auto' }} />
        <div className="compass-reading">
          <div className="compass-angle">
            {manualAngle}°
          </div>
          <div className="compass-mountain">
            {getCurrentMountain(manualAngle)}山 · {getDirectionName(manualAngle)}
          </div>
        </div>
        <div style={{ width: 240, margin: '0 auto' }}>
          <input
            type="range"
            min="0"
            max="359"
            value={manualAngle}
            onChange={(e) => setManualAngle(parseInt(e.target.value))}
            style={{
              width: '100%',
              accentColor: 'var(--copper-gold)',
            }}
          />
        </div>
        <div className="compass-hint-box">
          <span className="compass-hint-icon">📱</span>
          <span>请输入房屋朝向角度（0°=正北，顺时针）</span>
        </div>
        <button
          className="btn-confirm-heading"
          onClick={() => onDone(manualAngle)}
          style={{ marginTop: 12 }}
        >
          确认朝向
        </button>
        <button
          className="btn-remote-entry"
          onClick={() => setRemoteMode(true)}
          style={{ marginTop: 10 }}
        >
          远程看盘（不在现场也能测）
        </button>
        {onBack && (
          <button className="btn-back" onClick={onBack} style={{ marginTop: 10 }}>
            ← 上一步
          </button>
        )}
      </div>
    )
  }

  if (!hasPermission) {
    return (
      <div className="compass-container">
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
            需要授权使用手机罗盘传感器
          </p>
          <button className="btn-primary" onClick={requestPermission}>
            授权罗盘
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="compass-container">
      <canvas ref={canvasRef} style={{ display: 'block', margin: '0 auto' }} />

      <div className="compass-reading">
        <div className="compass-angle">
          {heading !== null ? `${Math.round(heading)}°` : '--°'}
        </div>
        <div className="compass-mountain">
          {getCurrentMountain(heading)}山 · {getDirectionName(heading)}
        </div>
      </div>

      {stabilized && (
        <div style={{ color: 'var(--ji-color)', fontSize: 13, textAlign: 'center' }}>
          ✓ 朝向已稳定
        </div>
      )}

      <div className="compass-hint-box">
        <span className="compass-hint-icon">📱</span>
        <span className="compass-hint-text">手机水平拿稳，屏幕朝上，顶部朝向房屋前方</span>
      </div>

      <div className="compass-actions-group">
        <div className="compass-action-item primary">
          <button
            className="btn-confirm-heading"
            onClick={confirmHeading}
            disabled={heading === null}
          >
            ✓ 确认当前朝向
          </button>
          <p className="action-desc">使用罗盘实时测量的朝向（推荐）</p>
        </div>

        <div className="compass-action-item">
          <button
            className="btn-manual-switch"
            onClick={() => setManualMode(true)}
          >
            ✎ 手动输入角度
          </button>
          <p className="action-desc">已知朝向角度，直接输入度数</p>
        </div>

        <div className="compass-action-item">
          <button
            className="btn-remote-entry"
            onClick={() => setRemoteMode(true)}
          >
            📍 远程卫星测量
          </button>
          <p className="action-desc">不在现场，通过卫星图识别朝向</p>
        </div>
      </div>
      {onBack && (
        <button className="btn-back" onClick={onBack} style={{ marginTop: 12 }}>
          ← 上一步
        </button>
      )}
    </div>
  )
}
