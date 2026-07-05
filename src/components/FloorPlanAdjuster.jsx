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

// ===== V2.4.2 朝向选择：点击边框标识朝向 =====
const SIDE_TO_DEFAULT_ANGLE = { 'top': 0, 'right': 90, 'bottom': 180, 'left': 270 }
const SIDE_ARROW = { 'top': '↑', 'right': '→', 'bottom': '↓', 'left': '←' }
const SIDE_HINT_TEXT = { 'top': '点击此侧为朝向', 'right': '点击此侧为朝向', 'bottom': '点击此侧为朝向', 'left': '点击此侧为朝向' }
const SIDE_STYLES = {
  'top': { top: 0, left: '10%', right: '10%', height: '60px', borderRadius: '16px 16px 0 0', borderBottom: 'none' },
  'bottom': { bottom: 0, left: '10%', right: '10%', height: '60px', borderRadius: '0 0 16px 16px', borderTop: 'none' },
  'left': { top: '10%', bottom: '10%', left: 0, width: '60px', borderRadius: '16px 0 0 16px', borderRight: 'none' },
  'right': { top: '10%', bottom: '10%', right: 0, width: '60px', borderRadius: '0 16px 16px 0', borderLeft: 'none' },
}

// 根据点击侧边和罗盘角度，计算图片旋转偏移
function calculateRotationOffset(clickedSide, magneticHeading) {
  if (!clickedSide || !magneticHeading) return 0
  const defaultAngle = SIDE_TO_DEFAULT_ANGLE[clickedSide]
  if (defaultAngle === undefined) return 0
  let offset = magneticHeading - defaultAngle
  while (offset > 180) offset -= 360
  while (offset < -180) offset += 360
  return offset
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
  
  // V2.9.12 调试开关：合成图预览（调试完成后改为 false）
  const DEBUG_COMPOSITE_PREVIEW = false

  // 状态
  const [showGrid, setShowGrid] = useState(true)
  const [clickedSide, setClickedSide] = useState(null)
  const [hoveredSide, setHoveredSide] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [imgSize, setImgSize] = useState({ width: 0, height: 0, left: 0, top: 0 })
  const [compositePreview, setCompositePreview] = useState(null) // 合成图预览 base64
  const [pendingAdjustData, setPendingAdjustData] = useState(null) // 暂存待确认的调整数据
  
  // 九宫格微调参数
  const [gridOffset, setGridOffset] = useState({ x: 0, y: 0 })
  const [gridScaleX, setGridScaleX] = useState(1)
  const [gridScaleY, setGridScaleY] = useState(1)
  const [gridAngle, setGridAngle] = useState(0)
  
  const dragStartRef = useRef({ x: 0, y: 0, offsetX: 0, offsetY: 0 })
  
  // 计算方位偏移量（罗盘角度 + 用户点击侧边 → 图片旋转偏移）
  const imageRotationOffset = useMemo(() => {
    return calculateRotationOffset(clickedSide, magneticHeading)
  }, [clickedSide, magneticHeading])
  
  // 九宫格上方朝向 = 从罗盘角度+点击侧边推导
  const gridTopDirection = useMemo(() => {
    return getDirectionName(imageRotationOffset)
  }, [imageRotationOffset])
  
  // 九宫格布局
  const gridOrder = useMemo(() => generateGridOrder(gridTopDirection), [gridTopDirection])
  
  const rooms = validationResult?.rooms || []
  
  // 主户型体边界：优先使用AI直接返回的边界（需验证合理性），其次从房间坐标推算，最后使用默认边界
  const floorPlanBody = useMemo(() => {
    if (!imgSize.width) return null
    
    // 方案1：AI直接返回了主户型体边界（需验证合理性）
    const aiBody = validationResult?.floorPlanBody
    if (aiBody && aiBody.left != null && aiBody.right != null && aiBody.top != null && aiBody.bottom != null) {
      const aiWidth = aiBody.right - aiBody.left
      const aiHeight = aiBody.bottom - aiBody.top
      // 验证：AI返回的边界不能超过图片的90%（否则说明AI没正确识别主户型体）
      if (aiWidth < 0.9 && aiHeight < 0.9) {
        console.log('[V2.9] 使用AI返回的主户型体边界:', aiBody)
        return {
          left: imgSize.left + aiBody.left * imgSize.width,
          top: imgSize.top + aiBody.top * imgSize.height,
          width: aiWidth * imgSize.width,
          height: aiHeight * imgSize.height,
        }
      } else {
        console.log('[V2.9] AI返回的边界过大（覆盖' + Math.round(aiWidth*100) + '%x' + Math.round(aiHeight*100) + '%），判定为无效，使用默认边界')
      }
    }
    
    // 方案2：从房间坐标推算（过滤掉阳台和异常房间）
    if (!rooms.length) return null
    
    // 过滤：排除名称含"阳台"的房间 + 排除centerX>0.8且centerY>0.7的房间（通常是凸出阳台）
    const mainRooms = rooms.filter(r => {
      if (r.name?.includes('阳台')) return false
      // 如果房间中心在右下角区域（x>0.8, y>0.7），很可能是凸出的阳台
      if (r.centerX > 0.8 && r.centerY > 0.7) return false
      return true
    })
    
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
    const calcWidth = maxX - minX
    const calcHeight = maxY - minY
    // 验证：推算的边界也不能超过90%
    if (calcWidth < 0.9 && calcHeight < 0.9) {
      console.log('[V2.9] 从房间坐标推算主户型体边界:', {minX, minY, maxX, maxY})
      return {
        left: imgSize.left + minX * imgSize.width,
        top: imgSize.top + minY * imgSize.height,
        width: calcWidth * imgSize.width,
        height: calcHeight * imgSize.height,
      }
    }
    
    return null
  }, [rooms, imgSize, validationResult?.floorPlanBody])
  
  // 九宫格实际覆盖范围：优先主户型体边界，其次默认排除右下角阳台区域，最后 fallback 到图片尺寸
  const gridBaseRect = floorPlanBody || (() => {
    // 默认假设主户型体占图片的左上 85% x 80% 区域（排除右下角凸出的阳台）
    const defaultBody = {
      left: imgSize.left + imgSize.width * 0.02,
      top: imgSize.top + imgSize.height * 0.02,
      width: imgSize.width * 0.83,
      height: imgSize.height * 0.78,
    }
    console.log('[V2.9] 使用默认主户型体边界（排除右下角阳台区域）')
    return defaultBody
  })()
  
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
  // 判定点击的侧边（点击户型图容器时，判断离哪边最近）
  const handleImageClick = useCallback((e) => {
    if (isDragging) return
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const w = rect.width
    const h = rect.height
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

  // 朝向标注的位置（基于点击侧边，选择对角位置显示）
  const getFacingLabelPosition = () => {
    if (!clickedSide) return {}
    const positions = {
      'top': { bottom: '15%', right: '15%' },
      'right': { top: '15%', left: '15%' },
      'bottom': { top: '15%', left: '15%' },
      'left': { top: '15%', right: '15%' },
    }
    return positions[clickedSide]
  }

  const handleResetAdjust = () => {
    setGridOffset({ x: 0, y: 0 })
    setGridScaleX(1)
    setGridScaleY(1)
    setClickedSide(null)
  }
  
  // Canvas roundRect polyfill
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.arcTo(x + w, y, x + w, y + r, r)
  ctx.lineTo(x + w, y + h - r)
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
  ctx.lineTo(x + r, y + h)
  ctx.arcTo(x, y + h, x, y + h - r, r)
  ctx.lineTo(x, y + r)
  ctx.arcTo(x, y, x + r, y, r)
  ctx.closePath()
}

  // 确认调整：截图→裁剪到九宫格范围→传给AI视觉识别房间宫位
  const handleConfirm = async () => {
    if (!onAdjustComplete) return

    const ib = imgSize
    // V2.9.6: 偏移量百分比必须相对于九宫格自身尺寸，而非图片尺寸
    // 因为CSS中translate(X%, Y%)的百分比是相对于元素自身宽高的
    const gridOffsetPctX = gridBaseRect.width > 0 ? (gridOffset.x / gridBaseRect.width) * 100 : 0
    const gridOffsetPctY = gridBaseRect.height > 0 ? (gridOffset.y / gridBaseRect.height) * 100 : 0

    const containerW = containerRef.current?.clientWidth || 1
    const containerH = containerRef.current?.clientHeight || 1
    const imageBoundsPct = {
      left: (imgSize.left / containerW) * 100,
      top: (imgSize.top / containerH) * 100,
      width: (imgSize.width / containerW) * 100,
      height: (imgSize.height / containerH) * 100,
    }

    // V2.9.9: gridBoundsPct 相对于图片实际边界（imgSize），而非容器
    // 调整页容器是正方形（aspect-ratio:1），结果页 wrapper 是图片实际尺寸
    // 用容器百分比会导致结果页九宫格大小/位置与用户选择的不一致
    const gridBoundsPct = {
      left: imgSize.width > 0 ? ((gridBaseRect.left - imgSize.left) / imgSize.width) * 100 : 0,
      top: imgSize.height > 0 ? ((gridBaseRect.top - imgSize.top) / imgSize.height) * 100 : 0,
      width: imgSize.width > 0 ? (gridBaseRect.width / imgSize.width) * 100 : 100,
      height: imgSize.height > 0 ? (gridBaseRect.height / imgSize.height) * 100 : 100,
    }

    const adjustmentData = {
      gridOffset,
      gridScaleX,
      gridScaleY,
      gridAngle,
      gridOffsetPctX,
      gridOffsetPctY,
      gridTopDirection,
      clickedSide,
      imageRotationOffset,
      magneticHeading,
      facing: getDirectionName(magneticHeading),
      zuoXiang: `${zuo}坐${chao}朝`,
      gridOrder,
      imageBounds: imgSize,
      imageBoundsPct,
      gridBoundsPct,
    }

    // V2.9.2: Canvas合成截图——精确复现屏幕上的九宫格叠加效果
    // 核心：在container像素空间中绘制户型图+九宫格，与CSS transform完全一致
    // V2.9.10: 重写Canvas合成——裁剪到九宫格区域，用数字编号替代中文标签
    // 让AI只关注"房间在哪个编号格子"，数字识别比中文更可靠
    let compositeScreenshot = null
    try {
      const fpImg = new Image()
      fpImg.crossOrigin = 'anonymous'
      await new Promise((resolve, reject) => {
        fpImg.onload = resolve
        fpImg.onerror = reject
        fpImg.src = floorPlanPreview
      })

      const gL = gridBaseRect.left, gT = gridBaseRect.top
      const gW = gridBaseRect.width, gH = gridBaseRect.height
      // V2.9.13: 裁剪区域必须包含用户缩放/偏移后的实际九宫格
      // 之前只用baseRect尺寸，用户调了宽度115%后裁剪区没跟上
      const padding = 0
      const SCALE = 2  // V2.9.11: 2x分辨率，让AI看清细节

      // 先画全尺寸Canvas（用于绘制户型图）
      const fullCanvas = document.createElement('canvas')
      fullCanvas.width = containerW * SCALE
      fullCanvas.height = containerH * SCALE
      const fCtx = fullCanvas.getContext('2d')
      fCtx.scale(SCALE, SCALE)
      fCtx.fillStyle = '#ffffff'
      fCtx.fillRect(0, 0, containerW, containerH)
      fCtx.drawImage(fpImg, ib.left, ib.top, ib.width, ib.height)

      // V2.9.13: 计算缩放+偏移后的实际九宫格边界
      // CSS transform: translate(gridCX+gridOffset.x, gridCY+gridOffset.y) scale(gridScaleX, gridScaleY) translate(-gridCX, -gridCY)
      // 等价于以grid中心为锚点缩放，然后整体偏移gridOffset
      const gridCX = gL + gW / 2
      const gridCY = gT + gH / 2
      const scaledW = gW * gridScaleX
      const scaledH = gH * gridScaleY
      // 缩放后网格的左上角（不含旋转，旋转角度通常很小或为0）
      const scaledLeft = gridCX - scaledW / 2 + gridOffset.x
      const scaledTop = gridCY - scaledH / 2 + gridOffset.y

      // V2.9.13: 裁剪区域 = 实际九宫格边界（严格贴合，无padding）
      const cropX = Math.max(0, scaledLeft - padding)
      const cropY = Math.max(0, scaledTop - padding)
      const cropW = Math.min(containerW - cropX, scaledW + padding * 2)
      const cropH = Math.min(containerH - cropY, scaledH + padding * 2)

      const outCanvas = document.createElement('canvas')
      outCanvas.width = cropW * SCALE
      outCanvas.height = cropH * SCALE
      const ctx = outCanvas.getContext('2d')
      ctx.scale(SCALE, SCALE)

      // 绘制裁剪后的户型图
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, cropW, cropH)
      ctx.drawImage(fullCanvas, cropX * SCALE, cropY * SCALE, cropW * SCALE, cropH * SCALE, 0, 0, cropW, cropH)

      // 九宫格在裁剪后Canvas中的坐标（用baseRect，transform会在下面应用）
      const gridOX = gL - cropX
      const gridOY = gT - cropY
      // 网格中心（在outCanvas坐标系中，以baseRect为基准）
      const baseGridCX = gridOX + gW / 2
      const baseGridCY = gridOY + gH / 2

      // V2.9.13: 应用transform（缩放以baseRect中心为锚点，再偏移）
      ctx.save()
      ctx.translate(baseGridCX + gridOffset.x, baseGridCY + gridOffset.y)
      if (gridAngle) ctx.rotate(gridAngle * Math.PI / 180)
      ctx.scale(gridScaleX, gridScaleY)
      ctx.translate(-baseGridCX, -baseGridCY)

      // V2.9.11: 网格线减淡，避免遮挡房间名称
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)'
      ctx.lineWidth = Math.max(2, gW / 150)
      for (let i = 1; i < 3; i++) {
        ctx.beginPath()
        ctx.moveTo(gridOX + (gW / 3) * i, gridOY)
        ctx.lineTo(gridOX + (gW / 3) * i, gridOY + gH)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(gridOX, gridOY + (gH / 3) * i)
        ctx.lineTo(gridOX + gW, gridOY + (gH / 3) * i)
        ctx.stroke()
      }

      // V2.9.11: 编号标签移到格子左上角，缩小尺寸，避免遮挡房间内容
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      const labelSize = Math.max(12, gW / 14)
      const cellW = gW / 3, cellH = gH / 3

      for (let ri = 0; ri < 3; ri++) {
        for (let ci = 0; ci < 3; ci++) {
          const num = ri * 3 + ci + 1
          // 标签放在格子左上角
          const lx = gridOX + ci * cellW + labelSize * 0.9
          const ly = gridOY + ri * cellH + labelSize * 0.9

          ctx.save()
          ctx.translate(lx, ly)
          if (gridAngle) ctx.rotate(-gridAngle * Math.PI / 180)

          // 白色圆角背景
          const bgW = labelSize * 1.2, bgH = labelSize * 1.1
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)'
          ctx.lineWidth = 1
          roundRect(ctx, -bgW / 2, -bgH / 2, bgW, bgH, 4)
          ctx.fill()
          ctx.stroke()

          // 编号
          ctx.fillStyle = '#000'
          ctx.font = `bold ${labelSize}px sans-serif`
          ctx.fillText(String(num), 0, 0)

          ctx.restore()
        }
      }
      ctx.restore()

      compositeScreenshot = outCanvas.toDataURL('image/png', 0.95)
      console.log('[V2.9.13] Canvas合成完成(无padding):', cropW * SCALE, 'x', cropH * SCALE,
        '(2x), grid:', gW.toFixed(0), 'x', gH.toFixed(0), 'crop==grid:', cropW === gW && cropH === gH, 'gridAngle:', gridAngle)
    } catch (err) {
      console.warn('[V2.9.11] Canvas合成失败:', err)
    }

    const finalData = {
      ...adjustmentData,
      croppedScreenshot: compositeScreenshot,
    }

    // V2.9.12: 调试模式——先预览合成图，确认后再发给AI
    console.log('[V2.9.12] DEBUG_COMPOSITE_PREVIEW:', DEBUG_COMPOSITE_PREVIEW, 'compositeScreenshot:', !!compositeScreenshot, 'size:', compositeScreenshot ? compositeScreenshot.length : 0)
    if (DEBUG_COMPOSITE_PREVIEW) {
      setPendingAdjustData(finalData)
      setCompositePreview(compositeScreenshot || '__ERROR__')
      return
    }

    onAdjustComplete(finalData)
  }

  // V2.9.12: 预览确认后继续
  const handlePreviewConfirm = () => {
    if (pendingAdjustData && onAdjustComplete) {
      onAdjustComplete(pendingAdjustData)
    }
    setCompositePreview(null)
    setPendingAdjustData(null)
  }

  const handlePreviewCancel = () => {
    setCompositePreview(null)
    setPendingAdjustData(null)
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
      
      {/* 引导提示（点击前显示） */}
      {!clickedSide && (
        <div className="direction-guide">
          <span className="guide-icon">🏠</span>
          <span className="guide-text">请点击户型图中阳台或大窗户所在的一侧</span>
        </div>
      )}
      
      {/* ===== 户型图预览区域 ===== */}
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
        
        {/* 校准前：侧边高亮提示 */}
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
                  <span className="side-tooltip">{SIDE_HINT_TEXT[side]}</span>
                )}
              </div>
            ))}
            <div className="side-center-hint">
              <span className="hint-icon">👆</span>
              <span className="hint-text">点击边框标识朝向</span>
            </div>
          </>
        )}
        
        {/* 校准后：朝向标注 */}
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
      
      {/* 校准提示 */}
      {clickedSide && (
        <div className="adjuster-hint success">
          <span>✅ 朝向已校准：图片上方 = <strong>{gridTopDirection}方</strong>（{TRIGRAMS[gridOrder[0][0]]}宫在左上）</span>
          <button className="btn-reclick" onClick={() => setClickedSide(null)}>重新选择</button>
        </div>
      )}
      
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
      
      {/* V2.9.12 调试：合成图预览模态框 */}
      {compositePreview && (
        <div className="composite-preview-overlay" onClick={handlePreviewCancel}>
          <div className="composite-preview-modal" onClick={e => e.stopPropagation()}>
            <div className="composite-preview-header">
              <h3>🔍 九宫格合成图预览</h3>
              <span className="composite-preview-hint">
                这是即将发给AI识别的图片，请确认：1) 网格线对齐 2) 编号标签清晰 3) 户型图完整
              </span>
            </div>
            <div className="composite-preview-body">
              {compositePreview === '__ERROR__' ? (
                <div className="composite-preview-error">
                  <p>⚠️ Canvas 合成失败</p>
                  <p>请打开浏览器控制台查看错误日志，或尝试重新调整九宫格后重试</p>
                </div>
              ) : (
                <img src={compositePreview} alt="九宫格合成图预览" />
              )}
            </div>
            <div className="composite-preview-actions">
              <button className="btn-secondary" onClick={handlePreviewCancel}>
                返回调整
              </button>
              {compositePreview !== '__ERROR__' && (
                <button className="btn-primary btn-glow" onClick={handlePreviewConfirm}>
                  确认无误，继续分析 →
                </button>
              )}
            </div>
          </div>
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
