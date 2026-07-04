/**
 * 好宅助手 - 九宫格与房间映射工具
 * V2.5.4: 九宫格与户型图完全对齐（不再使用90% inset）
 * 
 * 核心原理：
 * AI返回的房间坐标 = 图片归一化坐标 [0,1]（图片空间）
 * 九宫格叠加层 = 与图片完全对齐（left/width = imageBounds）
 * 两者在同一坐标空间，直接计算即可
 */

// ===== 方位常量 =====
export const COMPASS_ORDER = ['北', '东北', '东', '东南', '南', '西南', '西', '西北']

export const DIR_TO_TRIGRAM = {
  '北': '坎', '东北': '艮', '东': '震', '东南': '巽',
  '南': '离', '西南': '坤', '西': '兑', '西北': '乾',
}

export const TRIGRAM_TO_DIR = {
  '坎': '北', '艮': '东北', '震': '东', '巽': '东南',
  '离': '南', '坤': '西南', '兑': '西', '乾': '西北', '中': '中宫',
}

// ===== 九宫格布局生成 =====
// 罗盘模型：九宫格叠加在户型图上，随图片方向旋转
// 每个格子的罗盘方位 = (topIdx + GRID_IDX[row][col]) % 8
// GRID_IDX: 按罗盘排列——上中=0,右上=1,右中=2,右下=3,下中=4,左下=5,左中=6,左上=7
export function generateGridOrder(topDirection) {
  const topIdx = COMPASS_ORDER.indexOf(topDirection)
  if (topIdx === -1) return [['巽', '离', '坤'], ['震', '中', '兑'], ['艮', '坎', '乾']]

  const GRID_IDX = [
    [7, 0, 1],  // 顶行: 左上=7(西北), 上中=0(北=top), 右上=1(东北)
    [6, -1, 2], // 中行: 左中=6(西), 中心, 右中=2(东)
    [5, 4, 3],  // 底行: 左下=5(西南), 下中=4(南), 右下=3(东南)
  ]

  return Array.from({length: 3}, (_, row) =>
    Array.from({length: 3}, (_, col) => {
      if (row === 1 && col === 1) return '中'
      const compassIdx = (topIdx + GRID_IDX[row][col] + 80) % 8
      return DIR_TO_TRIGRAM[COMPASS_ORDER[compassIdx]]
    })
  )
}

// V2.5.4: 九宫格与户型图完全对齐，不再使用 inset 和 size 缩减

/**
 * 核心函数：给定房间在图片中的归一化坐标，计算它落在九宫格的哪个单元格
 * 
 * V2.6: 全部使用归一化[0,1]坐标，彻底不依赖像素值
 * 九宫格默认覆盖归一化空间[0,1]×[0,1]（与图片完全对齐）
 * 用户调整（offset/scale）也用归一化值
 */
function computeGridCell(normX, normY, adjustedData) {
  const { gridScaleX = 1, gridScaleY = 1 } = adjustedData || {}
  
  // 归一化空间：网格覆盖 [0,1]×[0,1]
  const cellW = 1 / 3
  const cellH = 1 / 3

  // 百分比偏移 → 归一化偏移
  const offsetPctX = adjustedData?.gridOffsetPctX ?? 0
  const offsetPctY = adjustedData?.gridOffsetPctY ?? 0
  const offsetX = offsetPctX / 100  // 转为归一化值
  const offsetY = offsetPctY / 100

  // 逆运算 CSS transform（在归一化空间中）
  // transform-origin: 50% 50% → 中心在 (0.5, 0.5)
  const totalOffsetX = 0.5 * (1 - gridScaleX) + offsetX
  const totalOffsetY = 0.5 * (1 - gridScaleY) + offsetY
  const localX = (normX - totalOffsetX) / gridScaleX
  const localY = (normY - totalOffsetY) / gridScaleY

  // V2.7.4: 边界检查——中心点在九宫格外则返回null
  if (localX < 0 || localX > 1 || localY < 0 || localY > 1) {
    return null
  }

  const col = Math.max(0, Math.min(2, Math.floor(localX / cellW)))
  const row = Math.max(0, Math.min(2, Math.floor(localY / cellH)))

  return { row, col }
}

// ===== 直接映射：房间原始坐标 → 主宫位（无归一化） =====
// 用于有用户调整数据的场景，坐标空间完全一致
function mapRoomToGridDirect(room, gridOrder, adjustedData) {
  if (room.centerX == null || room.centerY == null) return null
  const normX = Math.max(0, Math.min(1, room.centerX))
  const normY = Math.max(0, Math.min(1, room.centerY))
  // V2.7.4: computeGridCell 可能返回 null（中心点在九宫格外）
  const cell = computeGridCell(normX, normY, adjustedData)
  if (!cell) return null
  return gridOrder[cell.row][cell.col]
}

// ===== V2.6: 多宫位映射——全部使用归一化坐标 =====
// 计算房间边界框覆盖的所有宫格，支持一个房间跨多个宫位
// 彻底不依赖像素值，在任何容器尺寸下都正确
export function computeRoomGridOverlap(room, gridOrder, adjustedData) {
  if (room.centerX == null || room.centerY == null) return []
  
  const { gridScaleX = 1, gridScaleY = 1 } = adjustedData || {}
  
  // 百分比偏移 → 归一化偏移
  const offsetPctX = adjustedData?.gridOffsetPctX ?? 0
  const offsetPctY = adjustedData?.gridOffsetPctY ?? 0
  const offsetX = offsetPctX / 100
  const offsetY = offsetPctY / 100
  
  const w = room.width || 0.1
  const h = room.height || 0.1
  
  // 归一化坐标 → 网格局部坐标（CSS逆运算）
  function toLocal(normX, normY) {
    const totalOffsetX = 0.5 * (1 - gridScaleX) + offsetX
    const totalOffsetY = 0.5 * (1 - gridScaleY) + offsetY
    return {
      x: (normX - totalOffsetX) / gridScaleX,
      y: (normY - totalOffsetY) / gridScaleY
    }
  }
  
  // V2.7.4: 边界检查——房间中心点在九宫格外则跳过
  const center = toLocal(room.centerX, room.centerY)
  if (center.x < -0.01 || center.x > 1.01 || center.y < -0.01 || center.y > 1.01) {
    console.log('[V2.7.4] 房间', room.name, '中心点在九宫格外(local:', center.x.toFixed(3), center.y.toFixed(3), ')，跳过')
    return []
  }
  
  // 房间边界（归一化坐标 [0,1]）
  const minX = Math.max(0, room.centerX - w / 2)
  const maxX = Math.min(1, room.centerX + w / 2)
  const minY = Math.max(0, room.centerY - h / 2)
  const maxY = Math.min(1, room.centerY + h / 2)
  
  const cellW = 1 / 3
  const cellH = 1 / 3
  
  const tl = toLocal(minX, minY)
  const br = toLocal(maxX, maxY)
  
  // V2.7.4: 裁剪到九宫格范围[0,1]，防止超出部分被钳制到边缘宫格
  const minCol = Math.max(0, Math.floor(Math.max(0, tl.x) / cellW))
  const maxCol = Math.min(2, Math.floor((Math.min(1, br.x) - 0.001) / cellW))
  const minRow = Math.max(0, Math.floor(Math.max(0, tl.y) / cellH))
  const maxRow = Math.min(2, Math.floor((Math.min(1, br.y) - 0.001) / cellH))
  
  // 如果裁剪后无效（完全在九宫格外），跳过
  if (minCol > maxCol || minRow > maxRow) {
    console.log('[V2.7.4] 房间', room.name, '边界框裁剪后无效，跳过')
    return []
  }
  
  // 中心点所在宫格 = 主宫位
  const centerCol = Math.max(0, Math.min(2, Math.floor(center.x / cellW)))
  const centerRow = Math.max(0, Math.min(2, Math.floor(center.y / cellH)))
  
  const results = []
  for (let r = minRow; r <= maxRow; r++) {
    for (let c = minCol; c <= maxCol; c++) {
      results.push({
        row: r, col: c,
        palace: gridOrder[r][c],
        isPrimary: (r === centerRow && c === centerCol)
      })
    }
  }
  
  return results
}

// ===== 多宫位映射：一个房间 → 多个宫位 =====
// V2.5.2: 综合考虑 AI主palace + AI次要palaces + 数学边界框重叠
export function mapRoomToMultiPalace(room, gridOrder, adjustedData) {
  if (room.centerX == null || room.centerY == null) return []
  
  // AI直接判断的宫位
  const aiPalace = room.palace && room.palace !== '中' ? room.palace : null
  const aiSecondary = room.secondaryPalaces || []
  
  // 数学计算的重叠宫格（V2.7.4: 含边界检查，九宫格外的房间返回空数组）
  const overlaps = computeRoomGridOverlap(room, gridOrder, adjustedData)
  
  // V2.7.4: 如果有adjustedData（用户调整了九宫格），以数学映射为准
  // 数学映射认为房间在九宫格外 → 直接跳过，不用AI palace兜底
  if (adjustedData && adjustedData.gridTopDirection) {
    if (overlaps.length === 0) return []
    return overlaps.map(o => ({ palace: o.palace, isPrimary: o.isPrimary }))
  }
  
  // 无adjustedData时的回退逻辑
  if (aiPalace && overlaps.length > 0) {
    const aiInOverlaps = overlaps.some(o => o.palace === aiPalace)
    if (aiInOverlaps) {
      return overlaps.map(o => ({
        ...o,
        isPrimary: o.palace === aiPalace,
      }))
    } else {
      return [
        { palace: aiPalace, isPrimary: true },
        ...overlaps
          .filter(o => o.palace !== aiPalace && o.palace !== '中')
          .map(o => ({ ...o, isPrimary: false }))
      ]
    }
  } else if (aiPalace) {
    return [
      { palace: aiPalace, isPrimary: true },
      ...aiSecondary
        .filter(p => p !== aiPalace && p !== '中')
        .map(p => ({ palace: p, isPrimary: false }))
    ]
  } else if (overlaps.length > 0) {
    return overlaps.map(o => ({ palace: o.palace, isPrimary: o.isPrimary }))
  }
  
  return []
}

// ===== 批量映射：所有房间→宫位 =====
// V2.5.2: 支持一个房间跨多个宫位
export function computeRoomPalaceMapping(rooms, adjustedData) {
  if (!rooms || rooms.length === 0) return {}
  if (!adjustedData || !adjustedData.gridTopDirection) return {}

  const gridOrder = generateGridOrder(adjustedData.gridTopDirection)
  const mapping = {}

  rooms.forEach(room => {
    if (!room.name) return
    const palaces = mapRoomToMultiPalace(room, gridOrder, adjustedData)
    if (palaces.length > 0) {
      mapping[room.name] = {
        palaces: palaces.map(p => p.palace),
        primaryPalace: palaces.find(p => p.isPrimary)?.palace || palaces[0].palace,
      }
    }
  })

  return mapping
}

// ===== 兼容接口：保留旧函数名，返回主宫位 =====
export function mapRoomToGridPalaceNormalized(room, gridOrder, bounds, adjustedData) {
  if (adjustedData?.gridTopDirection) {
    return mapRoomToGridDirect(room, gridOrder, adjustedData)
  }
  return null
}

// 保留旧函数签名避免其他地方报错
export function calcRoomsBounds(rooms) { return null }
export function normalizeRoomCoord(room, bounds) { return null }
