/**
 * 好宅助手 - 户型图朝向调整组件
 * V2.5.3: 简化交互——直接选择图片上方朝向，替代复杂的侧边点击
 * 
 * 核心流程：
 * 1. AI预检测图片上方朝向（作为推荐值高亮）
 * 2. 用户确认或修改方向（8个方向按钮）
 * 3. 九宫格自动对齐
 * 4. 可选微调九宫格位置/缩放
 */
import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react'

// 方位转角度
const DIR_TO_ANGLE = {
  '北': 0, '东北': 45, '东': 90, '东南': 135,
  '南': 180, '西南': 225, '西': 270, '西北': 315,
}

// 角度转方位名
const getDirectionName = (angle) => {
  if (angle === null || angle === undefined) return ''
  const a = ((angle % 360) + 360) % 360
  if (a >= 337.5 || a < 22.5) return '北'
  if (a >= 22.5 && a < 67.5) return '东北'
  if (a >= 67.5 && a < 112.5) return '东'
  if (a >= 112.5 && a < 157.5) return '东南'
  if (a >= 157.5 && a < 202.5) return '南'
  if (a >= 202.5 && a < 247.5) return '西南'
  if (a >= 247.5 && a < 292.5) return '西'
  return '西北'
}

// 获取坐向名称
const getZuoXiang = (facingAngle) => {
  const facing = getDirectionName(facingAngle)
  const facingIdx = Object.keys(DIR_TO_ANGLE).indexOf(facing)
  const facingNames = Object.keys(DIR_TO_ANGLE)
  const zuoIdx = (facingIdx + 4) % 8
  const zuo = facingNames[zuoIdx]
  return { zuo, chao: facing }
}

// 八宫八卦对应
const TRIGRAMS = {
  '坎': '北', '艮': '东北', '震': '东', '巽': '东南',
  '离': '南', '坤': '西南', '兑': '西', '乾': '西北', '中': '中宫',
}

// 九宫格序号
const PALACE_NUMBER = {
  '坎': '①', '坤': '②', '震': '③', '巽': '④',
  '中': '⑤', '乾': '⑥', '兑': '⑦', '艮': '⑧', '离': '⑨',
}

// 根据图片上方朝向生成九宫格卦象布局
// 罗盘模型：GRID_IDX = [[7,0,1],[6,-,2],[5,4,3]]
function generateGridOrder(topDirection) {
  const compassOrder = ['北', '东北', '东', '东南', '南', '西南', '西', '西北']
  const dirToTrigram = {
    '北': '坎', '东北': '艮', '东': '震', '东南': '巽',
    '南': '离', '西南': '坤', '西': '兑', '西北': '乾',
  }

  const topIdx = compassOrder.indexOf(topDirection)
  if (topIdx === -1) {
    return [['巽', '离', '坤'], ['震', '中', '兑'], ['艮', '坎', '乾']]
  }

  const GRID_IDX = [
    [7, 0, 1],  // 顶行: 左上=7, 上中=0, 右上=1
    [6, -1, 2], // 中行: 左中=6, 中心, 右中=2
    [5, 4, 3],  // 底行: 左下=5, 下中=4, 右下=3
  ]

  return Array.from({length: 3}, (_, row) =>
    Array.from({length: 3}, (_, col) => {
      if (row === 1 && col === 1) return '中'
      const compassIdx = (topIdx + GRID_IDX[row][col] + 80) % 8
      return dirToTrigram[compassOrder[compassIdx]]
    })
  )
}

// 吉凶颜色
function getPalaceColor(heatValue) {
  if (heatValue >= 0.6) return 'rgba(45, 106, 45, 0.35)'
  if (heatValue >= 0.4) return 'rgba(139, 115, 85, 0.2)'
  return 'rgba(180, 50, 50, 0.3)'
}

// 默认热力值
function getDefaultHeatValue(row, col) {
  if (row === 1 && col === 1) return 0.7
  if ((row === 0 && col === 1) || (row === 1 && col === 0) || 
      (row === 1 && col === 2) || (row === 2 && col === 1)) return 0.6
  if ((row === 0 && col === 0) || (row === 0 && col === 2) ||
      (row === 2 && col === 0) || (row === 2 && col === 2)) return 0.5
  return 0.5
}

// 8个方向按钮的布局（3x3网格，中间是说明文字）
const DIR_BUTTONS = [
  { dir: '西北', row: 0, col: 0 }, { dir: '北', row: 0, col: 1 }, { dir: '东北', row: 0, col: 2 },
  { dir: '西', row: 1, col: 0 },   /* center */              { dir: '东', row: 1, col: 2 },
  { dir: '西南', row: 2, col: 0 }, { dir: '南', row: 2, col: 1 }, { dir: '东南', row: 2, col: 2 },
]

export default function FloorPlanAdjuster({
  floorPlanPreview,
  magneticHeading,
  validationResult,
  onAdjustComplete,
  onReset,
  onSkip,
}) {
  const containerRef = useRef(null)
  const imgRef = useRef(null)
  
  // 状态
  const [showGrid, setShowGrid] = useState(true)
  const [isDragging, setIsDragging] = useState(false)
  const [imgSize, setImgSize] = useState({ width: 0, height: 0, left: 0, top: 0 })
  
  // 九宫格微调参数
  const [gridOffset, setGridOffset] = useState({ x: 0, y: 0 })
  const [gridScaleX, setGridScaleX] = useState(1)
  const [gridScaleY, setGridScaleY] = useState(1)
  const [gridAngle, setGridAngle] = useState(0)
  
  const dragStartRef = useRef({ x: 0, y: 0, offsetX: 0, offsetY: 0 })
  
  // AI预检测的图片上方朝向（作为推荐值）
  const aiTopDir = validationResult?.floorPlanInfo?.imageTopDirection || null
  
  // 用户选择的图片上方朝向
  // 默认使用AI推荐值，用户可以修改
  const [userSelectedTopDir, setUserSelectedTopDir] = useState(aiTopDir)
  
  // 九宫格上方朝向 = 用户选择 > AI推荐 > 默认北
  const gridTopDirection = userSelectedTopDir || aiTopDir || '北'
  
  // 九宫格布局
  const gridOrder = useMemo(() => generateGridOrder(gridTopDirection), [gridTopDirection])
  
  const rooms = validationResult?.rooms || []
  
  // 主户型体边界：优先使用AI直接返回的边界，其次从房间坐标推算
  const floorPlanBody = useMemo(() => {
    if (!imgSize.width) return null
    
    // 方案1：AI直接返回了主户型体边界（最新prompt会让AI返回floorPlanBody字段）
    const aiBody = validationResult?.floorPlanBody
    if (aiBody && aiBody.left != null && aiBody.right != null && aiBody.top != null && aiBody.bottom != null) {
      console.log('[V2.9] 使用AI返回的主户型体边界:', aiBody)
      return {
        left: imgSize.left + aiBody.left * imgSize.width,
        top: imgSize.top + aiBody.top * imgSize.height,
        width: (aiBody.right - aiBody.left) * imgSize.width,
        height: (aiBody.bottom - aiBody.top) * imgSize.height,
      }
    }
    
    // 方案2：从房间坐标推算（旧版兼容，过滤掉阳台）
    if (!rooms.length) return null
    const mainRooms = rooms.filter(r => !r.name?.includes('阳台'))
    if (!mainRooms.length) return null
    let minX = 1, minY = 1, maxX = 0, maxY = 0
    mainRooms.forEach(r => {
      if (!r.centerX || !r.centerY) return
      const left = r.centerX - (r.width || 0.1) / 2
      const right = r.centerX + (r.width || 0.1) / 2
      const top = r.centerY - (r.height || 0.1) / 2
      const bottom = r.centerY + (r.height || 0.1) / 2
      minX = Math.min(minX, left)
      minY = Math.min(minY, top)
      maxX = Math.max(maxX, right)
      maxY = Math.max(maxY, bottom)
    })
    const padX = (maxX - minX) * 0.05
    const padY = (maxY - minY) * 0.05
    minX = Math.max(0, minX - padX)
    minY = Math.max(0, minY - padY)
    maxX = Math.min(1, maxX + padX)
    maxY = Math.min(1, maxY + padY)
    return {
      left: imgSize.left + minX * imgSize.width,
      top: imgSize.top + minY * imgSize.height,
      width: (maxX - minX) * imgSize.width,
      height: (maxY - minY) * imgSize.height,
    }
  }, [rooms, imgSize, validationResult?.floorPlanBody])
  
  // 九宫格实际覆盖范围：使用主户型体边界（排除阳台），fallback到图片尺寸
  const gridBaseRect = floorPlanBody || imgSize
  
  // 计算坐向
  const { zuo, chao } = useMemo(() => {
    if (!magneticHeading) return { zuo: '北', chao: '南' }
    return getZuoXiang(magneticHeading)
  }, [magneticHeading])
  
  // 获取图片在容器中的实际边界
  const getImageBounds = useCallback(() => {
    const container = containerRef.current
    const img = imgRef.current
    if (!container || !img) return null
    
    const containerRect = container.getBoundingClientRect()
    const imgRect = img.getBoundingClientRect()
    
    const left = imgRect.left - containerRect.left
    const top = imgRect.top - containerRect.top
    const width = imgRect.width
    const height = imgRect.height
    
    return { left, top, width, height }
  }, [])
  
  // 监听图片加载和窗口变化
  useEffect(() => {
    const updateImageBounds = () => {
      const bounds = getImageBounds()
      if (bounds) {
        setImgSize(bounds)
      }
    }
    
    if (imgRef.current?.complete) {
      updateImageBounds()
    }
    
    imgRef.current?.addEventListener('load', updateImageBounds)
    window.addEventListener('resize', updateImageBounds)
    
    return () => {
      imgRef.current?.removeEventListener('load', updateImageBounds)
      window.removeEventListener('resize', updateImageBounds)
    }
  }, [floorPlanPreview, getImageBounds])
  
  // 拖拽处理
  const handleDragStart = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    dragStartRef.current = {
      x: clientX,
      y: clientY,
      offsetX: gridOffset.x,
      offsetY: gridOffset.y,
    }
  }, [gridOffset])
  
  const handleDragMove = useCallback((e) => {
    if (!isDragging) return
    e.preventDefault()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    const dx = clientX - dragStartRef.current.x
    const dy = clientY - dragStartRef.current.y
    setGridOffset({
      x: dragStartRef.current.offsetX + dx,
      y: dragStartRef.current.offsetY + dy,
    })
  }, [isDragging])
  
  const handleDragEnd = useCallback(() => {
    setIsDragging(false)
  }, [])
  
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDragMove)
      window.addEventListener('mouseup', handleDragEnd)
      window.addEventListener('touchmove', handleDragMove, { passive: false })
      window.addEventListener('touchend', handleDragEnd)
      return () => {
        window.removeEventListener('mousemove', handleDragMove)
        window.removeEventListener('mouseup', handleDragEnd)
        window.removeEventListener('touchmove', handleDragMove)
        window.removeEventListener('touchend', handleDragEnd)
      }
    }
  }, [isDragging, handleDragMove, handleDragEnd])
  
  // 重置调整
  const handleResetAdjust = () => {
    setGridOffset({ x: 0, y: 0 })
    setGridScaleX(1)
    setGridScaleY(1)
  }
  
  // 确认调整：截图→裁剪到九宫格范围→传给AI视觉识别房间宫位
  const handleConfirm = async () => {
    if (!onAdjustComplete) return

    const ib = imgSize
    const gridOffsetPctX = ib.width > 0 ? (gridOffset.x / ib.width) * 100 : 0
    const gridOffsetPctY = ib.height > 0 ? (gridOffset.y / ib.height) * 100 : 0

    const containerW = containerRef.current?.clientWidth || 1
    const containerH = containerRef.current?.clientHeight || 1
    const imageBoundsPct = {
      left: (imgSize.left / containerW) * 100,
      top: (imgSize.top / containerH) * 100,
      width: (imgSize.width / containerW) * 100,
      height: (imgSize.height / containerH) * 100,
    }

    const adjustmentData = {
      gridOffset,
      gridScaleX,
      gridScaleY,
      gridAngle,
      gridOffsetPctX,
      gridOffsetPctY,
      gridTopDirection,
      facing: getDirectionName(magneticHeading),
      zuoXiang: `${zuo}坐${chao}朝`,
      gridOrder,
      imageBounds: imgSize,
      imageBoundsPct,
    }

    // V2.9: 用canvas直接绘制户型图+九宫格，彻底弃用html2canvas
    // 九宫格画多大，截图就是多大，像素级精确
    let compositeScreenshot = null
    try {
      // 加载原始户型图到canvas
      const fpImg = new Image()
      fpImg.crossOrigin = 'anonymous'
      await new Promise((resolve, reject) => {
        fpImg.onload = resolve
        fpImg.onerror = reject
        fpImg.src = floorPlanPreview
      })

      // 九宫格在图片坐标中的区域（归一化 0-1）
      const gridRect = gridBaseRect === imgSize
        ? { left: 0, top: 0, right: 1, bottom: 1 }  // 无AI边界时用整图
        : {
            left: (gridBaseRect.left - imgSize.left) / imgSize.width,
            top: (gridBaseRect.top - imgSize.top) / imgSize.height,
            right: (gridBaseRect.left - imgSize.left + gridBaseRect.width) / imgSize.width,
            bottom: (gridBaseRect.top - imgSize.top + gridBaseRect.height) / imgSize.height,
          }

      // 应用用户微调（offset/scale 转为归一化偏移）
      const gridW = gridRect.right - gridRect.left
      const gridH = gridRect.bottom - gridRect.top
      const offX = imgSize.width > 0 ? (gridOffset.x / imgSize.width) * gridW : 0
      const offY = imgSize.height > 0 ? (gridOffset.y / imgSize.height) * gridH : 0
      const adjLeft = gridRect.left + offX
      const adjTop = gridRect.top + offY
      const adjW = gridW * gridScaleX
      const adjH = gridH * gridScaleY

      // 输出canvas尺寸 = 九宫格覆盖的原始图片像素区域
      const outW = Math.round(fpImg.naturalWidth * adjW)
      const outH = Math.round(fpImg.naturalHeight * adjH)
      const srcX = Math.round(fpImg.naturalWidth * adjLeft)
      const srcY = Math.round(fpImg.naturalHeight * adjTop)
      const srcW = Math.round(fpImg.naturalWidth * adjW)
      const srcH = Math.round(fpImg.naturalHeight * adjH)

      const outCanvas = document.createElement('canvas')
      outCanvas.width = outW
      outCanvas.height = outH
      const ctx = outCanvas.getContext('2d')

      // 绘制白色背景
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, outW, outH)

      // 绘制户型图裁剪区域
      ctx.drawImage(fpImg, srcX, srcY, srcW, srcH, 0, 0, outW, outH)

      // 绘制九宫格（3x3网格线）
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)'
      ctx.lineWidth = 2
      const cellW = outW / 3
      const cellH = outH / 3
      for (let i = 1; i < 3; i++) {
        ctx.beginPath()
        ctx.moveTo(i * cellW, 0)
        ctx.lineTo(i * cellW, outH)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(0, i * cellH)
        ctx.lineTo(outW, i * cellH)
        ctx.stroke()
      }

      // 绘制宫位标签
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      for (let ri = 0; ri < 3; ri++) {
        for (let ci = 0; ci < 3; ci++) {
          const palace = gridOrder[ri][ci]
          const cx = (ci + 0.5) * cellW
          const cy = (ri + 0.5) * cellH

          // 半透明背景色
          const heatValue = getDefaultHeatValue(ri, ci)
          const bgColor = getPalaceColor(heatValue)
          ctx.fillStyle = bgColor
          ctx.fillRect(ci * cellW + 2, ri * cellH + 2, cellW - 4, cellH - 4)

          // 宫位名称
          ctx.fillStyle = palace === '中' ? '#999' : '#333'
          ctx.font = `bold ${Math.max(14, outW / 18)}px sans-serif`
          ctx.fillText(palace, cx, cy - outW / 30)

          // 方位
          if (palace !== '中') {
            ctx.font = `${Math.max(11, outW / 25)}px sans-serif`
            ctx.fillStyle = '#666'
            ctx.fillText(TRIGRAMS[palace], cx, cy + outW / 30)
          }
        }
      }

      compositeScreenshot = outCanvas.toDataURL('image/png', 0.9)
      console.log('[V2.9] Canvas合成完成:', outW, 'x', outH)
    } catch (err) {
      console.warn('[V2.9] Canvas合成失败:', err)
    }

    onAdjustComplete({
      ...adjustmentData,
      croppedScreenshot: compositeScreenshot, // canvas合成的截图，九宫格画多大就是多大
    })
  }

  return (
    <div className="floorplan-adjuster animate-in">
      {/* 朝向信息头部 */}
      <div className="adjuster-header">
        <div className="zuoxiang-badge">
          <span className="zuoxiang-icon">☯</span>
          <span className="zuoxiang-text">坐{zuo}朝{chao}</span>
        </div>
        <div className="compass-mini-info">
          <span>罗盘 {magneticHeading}°</span>
          <span className="direction-label">{getDirectionName(magneticHeading)}向</span>
        </div>
      </div>
      
      {/* ===== 方向选择器 ===== */}
      <div className="dir-selector-section" style={{ marginBottom: '12px' }}>
        <div className="dir-selector-label">
          <span>📐 图片上方代表什么方向？</span>
          {aiTopDir && (
            <span className="ai-suggestion-tag">
              AI推荐: {aiTopDir}方
            </span>
          )}
        </div>
        <div style={{ fontSize: '12px', color: '#888', marginTop: '4px', marginBottom: '8px' }}>
          💡 看图中的指北针（N箭头），N指向哪边就是北。如果N指向上方就选"北"，指向右方就选"西"（因为图片上方就是西）
        </div>
        <div className="dir-picker-grid">
          {DIR_BUTTONS.map(({ dir, row, col }) => {
            const isSelected = gridTopDirection === dir
            const isAiSuggestion = aiTopDir === dir
            return (
              <button
                key={dir}
                className={`dir-pick-btn ${isSelected ? 'active' : ''} ${isAiSuggestion && !isSelected ? 'ai-suggested' : ''}`}
                onClick={() => setUserSelectedTopDir(dir)}
              >
                {dir}
                {isAiSuggestion && <span className="ai-dot">✦</span>}
              </button>
            )
          })}
          {/* 中心说明 */}
          <div className="dir-picker-center">
            <span>↑ 图片上方</span>
          </div>
        </div>
      </div>
      
      {/* ===== 户型图预览区域 ===== */}
      <div 
        ref={containerRef}
        className={`adjuster-container ${isDragging ? 'dragging' : ''}`}
      >
        {/* 户型图 */}
        <div className="floorplan-wrapper">
          <img 
            ref={imgRef}
            src={floorPlanPreview} 
            alt="户型图" 
            className="floorplan-preview-img"
            draggable={false}
          />
        </div>
        
        {/* 九宫格叠加层 - 基于户型图实际位置定位 */}
        {showGrid && imgSize.width > 0 && (
          <div 
            className={`nine-grid-overlay aligned ${isDragging ? 'dragging' : ''}`}
            style={{
              left: gridBaseRect.left,
              top: gridBaseRect.top,
              width: gridBaseRect.width,
              height: gridBaseRect.height,
              transform: `translate(${gridOffset.x}px, ${gridOffset.y}px) scale(${gridScaleX}, ${gridScaleY}) rotate(${gridAngle}deg)`,
            }}
          >
            {gridOrder.map((row, ri) => (
              <div key={ri} className="grid-row">
                {row.map((palace, ci) => {
                  const heatValue = getDefaultHeatValue(ri, ci)
                  const bgColor = getPalaceColor(heatValue)
                  const isCenter = palace === '中'
                  
                  return (
                    <div
                      key={ci}
                      className={`grid-cell ${isCenter ? 'center' : ''}`}
                      style={{ backgroundColor: bgColor }}
                    >
                      <span className="grid-palace">{palace}</span>
                      <span className="grid-number">{PALACE_NUMBER[palace]}</span>
                      {!isCenter && (
                        <span className="grid-direction">{TRIGRAMS[palace]}</span>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
            
            {/* 中心拖拽控制点 */}
            <div 
              className="grid-center-handle"
              title="拖拽移动九宫格"
              onMouseDown={handleDragStart}
              onTouchStart={handleDragStart}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="handle-icon">⊕</div>
            </div>
          </div>
        )}
      </div>
      
      {/* 当前方向提示 */}
      <div className="adjuster-hint success">
        <span>📐 图片上方 = <strong>{gridTopDirection}方</strong>（{TRIGRAMS[gridOrder[0][0]]}宫在左上）</span>
        <button className="btn-reclick" onClick={() => setUserSelectedTopDir(null)}>
          重置方向
        </button>
      </div>
      
      {/* 微调控制面板 */}
      <div className="adjust-controls">
        <div className="control-section">
          <div className="control-header">
            <span className="control-title">九宫格微调</span>
            <button 
              className="btn-reset-adjust"
              onClick={handleResetAdjust}
            >
              重置
            </button>
          </div>
          
          {/* 宽度微调 */}
          <div className="control-item">
            <label className="control-label">
              <span className="label-icon">↔</span>
              宽度
            </label>
            <div className="control-slider">
              <input
                type="range"
                min="0.5"
                max="1.5"
                step="0.05"
                value={gridScaleX}
                onChange={(e) => setGridScaleX(parseFloat(e.target.value))}
              />
              <span className="slider-value">{Math.round(gridScaleX * 100)}%</span>
            </div>
          </div>
          
          {/* 高度微调 */}
          <div className="control-item">
            <label className="control-label">
              <span className="label-icon">↕</span>
              高度
            </label>
            <div className="control-slider">
              <input
                type="range"
                min="0.5"
                max="1.5"
                step="0.05"
                value={gridScaleY}
                onChange={(e) => setGridScaleY(parseFloat(e.target.value))}
              />
              <span className="slider-value">{Math.round(gridScaleY * 100)}%</span>
            </div>
          </div>
          
          <p className="control-note">
            💡 如果九宫格与房间不对齐，可微调缩放或拖拽中心点
          </p>
        </div>
        
        {/* 九宫格开关 */}
        <div className="control-section">
          <div className="control-item toggle-row">
            <label className="control-label">
              <span className="label-icon">⊞</span>
              显示九宫格
            </label>
            <button 
              className={`toggle-switch ${showGrid ? 'on' : 'off'}`}
              onClick={() => setShowGrid(!showGrid)}
            >
              <span className="toggle-handle" />
            </button>
          </div>
        </div>
      </div>
      
      {/* AI识别信息 */}
      {validationResult && (
        <div className="ai-info-panel">
          <div className="ai-info-header">
            <span className="ai-badge">🤖 AI识别</span>
            <span className="ai-confidence">
              置信度 {Math.round((validationResult.validationDetail?.confidence || 0) * 100)}%
            </span>
          </div>
          
          {validationResult.floorPlanInfo && (
            <div className="floorplan-info">
              {validationResult.floorPlanInfo.floorPlanType && (
                <span className="info-tag">{validationResult.floorPlanInfo.floorPlanType}</span>
              )}
              {validationResult.floorPlanInfo.totalArea && (
                <span className="info-tag">{validationResult.floorPlanInfo.totalArea}㎡</span>
              )}
            </div>
          )}
          
          {rooms.length > 0 && (
            <div className="rooms-preview">
              {rooms.slice(0, 6).map((room, idx) => (
                <span key={idx} className="room-chip">
                  {room.name}
                  {room.area && <small>{room.area}㎡</small>}
                </span>
              ))}
              {rooms.length > 6 && (
                <span className="room-chip more">+{rooms.length - 6}</span>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* 确认按钮 */}
      <div className="adjuster-actions">
        <button className="btn-secondary" onClick={onReset}>
          重新选择
        </button>
        <button 
          className="btn-primary btn-glow" 
          onClick={handleConfirm}
        >
          确认并继续 →
        </button>
      </div>
      
      {onSkip && (
        <button className="btn-skip" onClick={onSkip}>
          跳过微调，直接使用AI数据 →
        </button>
      )}
    </div>
  )
}
