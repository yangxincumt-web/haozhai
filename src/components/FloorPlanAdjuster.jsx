/**
 * 好宅助手 - 户型图朝向绑定组件
 * 
 * 核心流程：
 * 1. 罗盘测量获得精确角度 magneticHeading
 * 2. 用户点击标识户型图哪一侧是朝向面
 * 3. 系统自动计算方位偏移量
 * 4. 九宫格自动对齐
 * 
 * V2.4.1: 简化交互 + 九宫格精确定位
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

// 侧边与默认角度映射
const SIDE_TO_DEFAULT_ANGLE = { 'top': 0, 'right': 90, 'bottom': 180, 'left': 270 }

// 侧边中文名
const SIDE_NAMES = { 'top': '上', 'right': '右', 'bottom': '下', 'left': '左' }

// 朝向提示文字（简化版）
const SIDE_HINT_TEXT = {
  'top': '点击此侧为朝向',
  'right': '点击此侧为朝向',
  'bottom': '点击此侧为朝向',
  'left': '点击此侧为朝向',
}

// 侧边箭头符号
const SIDE_ARROW = {
  'top': '↑',
  'right': '→',
  'bottom': '↓',
  'left': '←',
}

// 侧边方位（仅内部使用）
const SIDE_DIRECTION_INTERNAL = {
  'top': '上',
  'right': '右',
  'bottom': '下',
  'left': '左',
}

// 侧边样式配置（基于容器边缘）
const SIDE_STYLES = {
  'top': { top: 0, left: '10%', right: '10%', height: '80px', borderRadius: '16px 16px 0 0', borderBottom: 'none' },
  'bottom': { bottom: 0, left: '10%', right: '10%', height: '80px', borderRadius: '0 0 16px 16px', borderTop: 'none' },
  'left': { top: '10%', bottom: '10%', left: 0, width: '80px', borderRadius: '16px 0 0 16px', borderRight: 'none' },
  'right': { top: '10%', bottom: '10%', right: 0, width: '80px', borderRadius: '0 16px 16px 0', borderLeft: 'none' },
}

// 根据点击侧边计算图片旋转偏移
function calculateRotationOffset(clickedSide, magneticHeading) {
  if (!clickedSide || !magneticHeading) return 0
  const defaultAngle = SIDE_TO_DEFAULT_ANGLE[clickedSide]
  if (defaultAngle === undefined) return 0
  let offset = magneticHeading - defaultAngle
  while (offset > 180) offset -= 360
  while (offset < -180) offset += 360
  return offset
}

// 根据图片上方朝向生成九宫格卦象布局
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

  const offsets = [
    [(topIdx - 1 + 8) % 8, topIdx, (topIdx + 1) % 8],
    [(topIdx - 2 + 8) % 8, -1, (topIdx + 2) % 8],
    [(topIdx - 3 + 8) % 8, (topIdx + 4) % 8, (topIdx + 3) % 8],
  ]

  return offsets.map(row =>
    row.map(i => i === -1 ? '中' : dirToTrigram[compassOrder[i]])
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
  const [clickedSide, setClickedSide] = useState(null)
  const [hoveredSide, setHoveredSide] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [imgSize, setImgSize] = useState({ width: 0, height: 0, left: 0, top: 0 })
  
  // 九宫格微调参数
  const [gridOffset, setGridOffset] = useState({ x: 0, y: 0 })
  const [gridScale, setGridScale] = useState(1)
  const [gridAngle, setGridAngle] = useState(0)
  
  const dragStartRef = useRef({ x: 0, y: 0, offsetX: 0, offsetY: 0 })
  
  // 计算方位偏移量
  const imageRotationOffset = useMemo(() => {
    return calculateRotationOffset(clickedSide, magneticHeading)
  }, [clickedSide, magneticHeading])
  
  // 计算坐向和朝向
  const { zuo, chao } = useMemo(() => {
    if (!magneticHeading) return { zuo: '北', chao: '南' }
    return getZuoXiang(magneticHeading)
  }, [magneticHeading])
  
  // 九宫格上方朝向
  const gridTopDirection = useMemo(() => {
    const topAngle = imageRotationOffset
    return getDirectionName(topAngle)
  }, [imageRotationOffset])
  
  // 九宫格布局
  const gridOrder = useMemo(() => generateGridOrder(gridTopDirection), [gridTopDirection])
  
  const rooms = validationResult?.rooms || []
  
  // 获取图片在容器中的实际边界（精确匹配）
  const getImageBounds = useCallback(() => {
    const container = containerRef.current
    const img = imgRef.current
    if (!container || !img) return null
    
    const containerRect = container.getBoundingClientRect()
    const imgRect = img.getBoundingClientRect()
    
    // 计算 img 相对于 container 的位置
    const left = imgRect.left - containerRect.left
    const top = imgRect.top - containerRect.top
    const width = imgRect.width
    const height = imgRect.height
    
    return { left, top, width, height }
  }, [])
  
  // 监听图片加载和窗口变化，实时更新图片边界
  useEffect(() => {
    const updateImageBounds = () => {
      const bounds = getImageBounds()
      if (bounds) {
        setImgSize(bounds)
      }
    }
    
    // 初始更新
    if (imgRef.current?.complete) {
      updateImageBounds()
    }
    
    // 监听图片加载
    imgRef.current?.addEventListener('load', updateImageBounds)
    
    // 监听窗口变化
    window.addEventListener('resize', updateImageBounds)
    
    return () => {
      imgRef.current?.removeEventListener('load', updateImageBounds)
      window.removeEventListener('resize', updateImageBounds)
    }
  }, [floorPlanPreview, getImageBounds])
  
  // 判定点击的侧边
  const handleImageClick = useCallback((e) => {
    if (isDragging) return
    
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const w = rect.width
    const h = rect.height
    
    // 判断点击位置离哪边最近
    const distTop = y
    const distBottom = h - y
    const distLeft = x
    const distRight = w - x
    
    const minDist = Math.min(distTop, distBottom, distLeft, distRight)
    
    if (minDist === distTop) setClickedSide('top')
    else if (minDist === distBottom) setClickedSide('bottom')
    else if (minDist === distLeft) setClickedSide('left')
    else setClickedSide('right')
  }, [isDragging])
  
  // 处理拖拽开始
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
  
  // 处理拖拽移动
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
  
  // 处理拖拽结束
  const handleDragEnd = useCallback(() => {
    setIsDragging(false)
  }, [])
  
  // 添加全局鼠标/触摸事件监听
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
    setGridScale(1)
    setClickedSide(null)
  }
  
  // 确认调整
  const handleConfirm = () => {
    if (onAdjustComplete) {
      onAdjustComplete({
        gridOffset,
        gridScale,
        gridAngle,
        gridTopDirection,
        clickedSide,
        imageRotationOffset,
        facing: getDirectionName(magneticHeading),
        zuoXiang: `${zuo}坐${chao}朝`,
        gridOrder,
      })
    }
  }

  // 校准后的朝向箭头位置
  const getFacingArrowStyle = () => {
    if (!clickedSide) return {}
    const positions = {
      'top': { top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-90deg)' },
      'bottom': { top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(90deg)' },
      'left': { top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(180deg)' },
      'right': { top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(0deg)' },
    }
    return positions[clickedSide]
  }

  // 朝向标注的位置（基于点击的侧边，选择空白角落）
  const getFacingLabelPosition = () => {
    if (!clickedSide) return {}
    // 根据点击的侧边，选择对角位置显示标注
    // 这样可以避开被点击的区域，显示在空白处
    const positions = {
      'top': { bottom: '15%', right: '15%' },    // 点击顶部，标注在右下
      'right': { top: '15%', left: '15%' },      // 点击右侧，标注在左上
      'bottom': { top: '15%', left: '15%' },     // 点击底部，标注在左上
      'left': { top: '15%', right: '15%' },      // 点击左侧，标注在右上
    }
    return positions[clickedSide]
  }

  return (
    <div className="floorplan-adjuster animate-in">
      {/* 引导提示 */}
      {!clickedSide && (
        <div className="direction-guide">
          <span className="guide-icon">🏠</span>
          <span className="guide-text">请点击户型图中阳台或大窗户所在的一侧</span>
        </div>
      )}
      
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
      
      {/* 户型图预览区域 */}
      <div 
        ref={containerRef}
        className={`adjuster-container ${isDragging ? 'dragging' : ''}`}
        onClick={handleImageClick}
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
        
        {/* 校准前的侧边高亮提示 */}
        {!clickedSide && (
          <>
            {['top', 'right', 'bottom', 'left'].map(side => (
              <div 
                key={side}
                className={`side-highlight ${side} ${hoveredSide === side ? 'hovered' : ''}`}
                style={SIDE_STYLES[side]}
                onMouseEnter={() => setHoveredSide(side)}
                onMouseLeave={() => setHoveredSide(null)}
                onClick={(e) => {
                  e.stopPropagation()
                  setClickedSide(side)
                }}
              >
                {hoveredSide === side && (
                  <span className="side-tooltip">
                    {SIDE_HINT_TEXT[side]}
                  </span>
                )}
              </div>
            ))}
            
            {/* 中心提示文字 */}
            <div className="side-center-hint">
              <span className="hint-icon">👆</span>
              <span className="hint-text">点击边框标识朝向</span>
            </div>
          </>
        )}
        
        {/* 校准后的朝向标注（显示在户型图内部空白处） */}
        {clickedSide && (
          <div className="facing-label" style={getFacingLabelPosition()}>
            <span className="facing-label-arrow">{SIDE_ARROW[clickedSide]}</span>
            <span className="facing-label-text">朝向面</span>
          </div>
        )}
        
        {/* 九宫格叠加层 - 基于户型图实际位置定位 */}
        {showGrid && clickedSide && imgSize.width > 0 && (
          <div 
            className={`nine-grid-overlay aligned ${isDragging ? 'dragging' : ''}`}
            style={{
              left: imgSize.left,
              top: imgSize.top,
              width: imgSize.width,
              height: imgSize.height,
              transform: `translate(${gridOffset.x}px, ${gridOffset.y}px) scale(${gridScale}) rotate(${gridAngle}deg)`,
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
      
      {/* 已校准提示 */}
      {clickedSide && (
        <div className="adjuster-hint success">
          <span>✅ 朝向已校准</span>
          <button className="btn-reclick" onClick={() => setClickedSide(null)}>
            重新选择
          </button>
        </div>
      )}
      
      {/* 微调控制面板 */}
      {clickedSide && (
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
            
            {/* 缩放控制 */}
            <div className="control-item">
              <label className="control-label">
                <span className="label-icon">⊡</span>
                大小
              </label>
              <div className="control-slider">
                <input
                  type="range"
                  min="0.5"
                  max="1.5"
                  step="0.05"
                  value={gridScale}
                  onChange={(e) => setGridScale(parseFloat(e.target.value))}
                />
                <span className="slider-value">{Math.round(gridScale * 100)}%</span>
              </div>
            </div>
            
            <p className="control-note">
              💡 九宫格方向由朝向自动确定
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
      )}
      
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
          disabled={!clickedSide}
        >
          {clickedSide ? '确认并继续' : '请先点击标识朝向面'}
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
