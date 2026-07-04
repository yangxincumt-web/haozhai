/**
 * 好宅助手 - 户型风水专业分析报告卡片
 * V1.7: 方向对齐 + 户型适配评分 + 布局优化
 */
import React, { useState, useRef, useMemo, useCallback } from 'react'
import { scoreToHeatValue, DIRECTION_TO_PALACE } from '../utils/heatmapRenderer.js'
import { NINE_STARS } from '../algorithms/feixing.js'
import {
  COMPASS_ORDER,
  DIR_TO_TRIGRAM,
  TRIGRAM_TO_DIR,
  generateGridOrder,
  mapRoomToGridPalaceNormalized,
  mapRoomToMultiPalace,
  computeRoomGridOverlap,
  computeRoomPalaceMapping,
} from '../utils/gridMapping.js'

// 卦名→方位
const PALACE_DIRECTION = {
  '离': '南', '坎': '北', '震': '东', '兑': '西',
  '巽': '东南', '坤': '西南', '艮': '东北', '乾': '西北', '中': '中宫',
}

// 卦名→序号标签
const PALACE_NUMBER = {
  '坎': '①', '坤': '②', '震': '③', '巽': '④',
  '中': '⑤', '乾': '⑥', '兑': '⑦', '艮': '⑧', '离': '⑨',
}

// ===== 房间重要性权重 =====
const ROOM_WEIGHTS = {
  '主卧': 10, '主卧室': 10,
  '客厅': 9, '起居室': 9,
  '次卧': 7, '次卧室': 7, '卧室': 7, '客房': 6,
  '书房': 6, '工作室': 6, '办公': 6,
  '餐厅': 5, '饭厅': 5,
  '厨房': 4,
  '卫生间': 3, '厕所': 3, '洗手间': 3, '浴室': 3,
  '阳台': 3, '露台': 3,
  '玄关': 3, '门厅': 3,
  '储物间': 1, '储藏室': 1, '衣帽间': 2,
  '走廊': 1, '过道': 1,
}

function getRoomWeight(name) {
  if (!name) return 3
  // V2.7.1: 支持合并名称（如"客厅/厨房"），取最大权重
  if (name.includes('/')) {
    const parts = name.split('/')
    return Math.max(...parts.map(p => getRoomWeight(p.trim())))
  }
  // 模糊匹配
  for (const [key, weight] of Object.entries(ROOM_WEIGHTS)) {
    if (name.includes(key) || key.includes(name)) return weight
  }
  return 3
}

// ===== 房间类型分类 =====
function getRoomType(name) {
  if (!name) return 'other'
  // V2.7.1: 支持合并名称（如"客厅/厨房"），返回第一个匹配的类型
  if (name.includes('/')) {
    const parts = name.split('/')
    for (const p of parts) {
      const t = getRoomType(p.trim())
      if (t !== 'other') return t
    }
    return 'other'
  }
  if (/主卧/.test(name)) return 'master_bedroom'
  if (/次卧|卧室|客房/.test(name)) return 'bedroom'
  if (/客厅|起居/.test(name)) return 'living_room'
  if (/书房|办公|工作/.test(name)) return 'study'
  if (/厨房/.test(name)) return 'kitchen'
  if (/卫|厕|洗手|浴/.test(name)) return 'bathroom'
  if (/阳台|露台/.test(name)) return 'balcony'
  if (/餐|饭/.test(name)) return 'dining'
  if (/玄关|门厅/.test(name)) return 'entryway'
  if (/储|藏|衣帽/.test(name)) return 'storage'
  if (/走|过道/.test(name)) return 'corridor'
  return 'other'
}

// ===== 房间-宫位适配评分 =====
function calcRoomPalaceCompat(roomType, heatValue) {
  const isGood = heatValue >= 0.6
  const isBad = heatValue < 0.4

  switch (roomType) {
    case 'master_bedroom':
      if (isGood) return { score: 1.0, note: '主卧占据吉位，大利健康与事业' }
      if (isBad) return { score: 0.15, note: '主卧落入凶位，严重影响睡眠和运势，需重点化解' }
      return { score: 0.55, note: '主卧位于平位，中规中矩' }
    case 'living_room':
      if (isGood) return { score: 0.95, note: '客厅位于吉位，纳气聚财' }
      if (isBad) return { score: 0.2, note: '客厅落入凶位，影响全家运势' }
      return { score: 0.55, note: '' }
    case 'bedroom':
      if (isGood) return { score: 0.85, note: '卧室位于吉位，利于休养' }
      if (isBad) return { score: 0.3, note: '卧室位于凶位，影响睡眠质量' }
      return { score: 0.5, note: '' }
    case 'study':
      if (isGood) return { score: 0.85, note: '书房位于吉位，利于学业事业' }
      if (isBad) return { score: 0.3, note: '书房位于凶位，影响专注力' }
      return { score: 0.5, note: '' }
    case 'kitchen':
      if (isGood) return { score: 0.7, note: '厨房位于吉位' }
      if (isBad) return { score: 0.3, note: '厨房火气加重凶位煞气，需注意通风化解' }
      return { score: 0.55, note: '' }
    case 'bathroom':
      // 卫生间压凶位：以秽制煞，反而是好事
      if (isBad) return { score: 0.7, note: '卫生间压凶位，以秽制煞，反为吉' }
      if (isGood) return { score: 0.35, note: '卫生间占吉位，浪费吉利方位' }
      return { score: 0.5, note: '' }
    case 'balcony':
      if (isGood) return { score: 0.8, note: '阳台位于吉位，采光纳气俱佳' }
      if (isBad) return { score: 0.4, note: '阳台位于凶位' }
      return { score: 0.5, note: '' }
    case 'dining':
      if (isGood) return { score: 0.75, note: '餐厅位于吉位，利于家人和睦' }
      if (isBad) return { score: 0.35, note: '餐厅位于凶位' }
      return { score: 0.5, note: '' }
    case 'storage':
    case 'corridor':
      if (isBad) return { score: 0.6, note: '非活动区压凶位，影响较小' }
      if (isGood) return { score: 0.45, note: '非活动区占吉位，略有浪费' }
      return { score: 0.5, note: '' }
    default:
      if (isGood) return { score: 0.7, note: '' }
      if (isBad) return { score: 0.35, note: '' }
      return { score: 0.5, note: '' }
  }
}

// ===== 房间→宫位映射函数已统一提取到 utils/gridMapping.js =====
// calcRoomsBounds, normalizeRoomCoord, applyGridAdjustment, mapRoomToGridPalaceNormalized
// 均从 gridMapping.js 导入

// ===== 融合分析：综合八宅+飞星判断 =====
function buildFusionInfo(bazhai, feiXing, bazhaiHeat, feiXingHeat) {
  const bGood = bazhaiHeat >= 0.6
  const bBad = bazhaiHeat < 0.4
  const fGood = feiXingHeat >= 0.6
  const fBad = feiXingHeat < 0.4

  const bazhaiName = bazhai?.youxing || ''
  const bazhaiNature = bazhai?.nature || ''
  const feiXingDesc = feiXing?.comboDesc || ''

  // 两套体系一致
  if (bGood && fGood) {
    return {
      tag: '★ 吉位共识',
      tip: `八宅${bazhaiName}吉 + 飞星吉，两派皆认可，大吉之位，宜安床办公`,
      consensus: true,
      bazhaiLabel: bazhaiName,
      feiXingLabel: feiXingDesc || '吉',
    }
  }
  if (bBad && fBad) {
    return {
      tag: '✕ 凶位共识',
      tip: `八宅${bazhaiName}凶 + 飞星凶，两派皆判凶，不宜久居，需重点化解`,
      consensus: true,
      bazhaiLabel: bazhaiName,
      feiXingLabel: feiXingDesc || '凶',
    }
  }

  // 八宅吉 飞星凶
  if (bGood && fBad) {
    return {
      tag: '⚡ 吉凶分歧',
      tip: `八宅判吉（${bazhaiName}${bazhaiNature}），飞星判凶（${feiXingDesc}），以飞星为主——时运不佳时吉位也减力，宜静不宜动`,
      consensus: false,
      bazhaiLabel: `${bazhaiName}吉`,
      feiXingLabel: `${feiXingDesc}凶`,
    }
  }

  // 八宅凶 飞星吉
  if (bBad && fGood) {
    return {
      tag: '⚡ 吉凶分歧',
      tip: `八宅判凶（${bazhaiName}${bazhaiNature}），飞星判吉（${feiXingDesc}），以飞星为主——当运飞星可压制八宅凶性，可用但需留意`,
      consensus: false,
      bazhaiLabel: `${bazhaiName}凶`,
      feiXingLabel: `${feiXingDesc}吉`,
    }
  }

  // 一平一吉
  if ((bGood && !fGood && !fBad) || (fGood && !bGood && !bBad)) {
    return {
      tag: '◇ 偏吉',
      tip: `八宅${bazhaiName}${bazhaiNature} + 飞星${feiXingDesc}，整体偏吉，可用`,
      consensus: true,
      bazhaiLabel: bazhaiName,
      feiXingLabel: feiXingDesc || '平',
    }
  }

  // 一平一凶
  if ((bBad && !fGood && !fBad) || (fBad && !bGood && !bBad)) {
    return {
      tag: '◇ 偏凶',
      tip: `八宅${bazhaiName}${bazhaiNature} + 飞星${feiXingDesc}，整体偏凶，建议化解`,
      consensus: true,
      bazhaiLabel: bazhaiName,
      feiXingLabel: feiXingDesc || '平',
    }
  }

  // 都平
  return {
    tag: '○ 平位',
    tip: `八宅${bazhaiName}${bazhaiNature} + 飞星${feiXingDesc}，吉凶参半，中规中矩`,
    consensus: true,
    bazhaiLabel: bazhaiName,
    feiXingLabel: feiXingDesc || '平',
  }
}

// ===== 八宅游星→优化建议 =====
const BAZHAI_TIPS = {
  '生气': { tag: '旺位宜用', tip: '适宜安床、办公、设主活动区' },
  '天医': { tag: '健康位', tip: '宜安床养身，利于康复休养' },
  '延年': { tag: '长寿位', tip: '宜居卧室，利于人际和合' },
  '伏位': { tag: '安定位', tip: '宜静不宜动，适合书房储物' },
  '祸害': { tag: '小凶·宜化解', tip: '不宜久坐，可放铜器化解' },
  '六煞': { tag: '桃花煞', tip: '易生口舌是非，放五帝钱化解' },
  '五鬼': { tag: '五鬼凶位', tip: '重点化解！宜放铜葫芦或安神位' },
  '绝命': { tag: '大凶·不宜居', tip: '绝命大凶，不宜做卧室或主活动区' },
}

// ===== 飞星组合→优化建议 =====
function getFeiXingTip(comboScore) {
  if (comboScore >= 80) return { tag: '大吉·宜用', tip: '大吉之位，适宜安床办公' }
  if (comboScore >= 65) return { tag: '吉位', tip: '吉利方位，可做主要功能区' }
  if (comboScore >= 50) return { tag: '平位', tip: '吉凶参半，可用但需注意' }
  if (comboScore >= 35) return { tag: '凶位·宜化解', tip: '凶位，宜摆放化煞物品' }
  if (comboScore >= 20) return { tag: '大凶·重点化解', tip: '重点化解！宜放铜器、水晶球' }
  return { tag: '极凶·必须化解', tip: '极凶之位，不宜久居，必须化解' }
}

// ===== 吉凶等级→背景色 =====
function getNatureColor(score, mode) {
  if (mode === 'bazhai') {
    if (score >= 0.8) return 'rgba(45, 106, 45, 0.45)'
    if (score >= 0.6) return 'rgba(45, 106, 45, 0.3)'
    if (score >= 0.5) return 'rgba(139, 115, 85, 0.25)'
    if (score >= 0.3) return 'rgba(180, 50, 50, 0.3)'
    return 'rgba(180, 50, 50, 0.45)'
  }
  // feixing 和 fusion 统一色阶
  if (score >= 0.75) return 'rgba(45, 106, 45, 0.45)'
  if (score >= 0.6) return 'rgba(45, 106, 45, 0.3)'
  if (score >= 0.45) return 'rgba(139, 115, 85, 0.25)'
  if (score >= 0.3) return 'rgba(180, 50, 50, 0.3)'
  return 'rgba(180, 50, 50, 0.45)'
}

function getNatureTagClass(score) {
  if (score >= 0.6) return 'tag-good'
  if (score >= 0.4) return 'tag-neutral'
  return 'tag-bad'
}

// ===== 评分等级 =====
function getScoreLevel(score) {
  if (score >= 85) return '优等户型·吉宅'
  if (score >= 70) return '中等偏上·可优化型户型'
  if (score >= 55) return '中等户型·需重点化解'
  return '偏下户型·建议调整'
}

export default function FloorPlanHeatmap({ floorPlanData, fengshuiResult, onBack }) {
  const [viewMode, setViewMode] = useState('fusion')
  // 放大预览功能已移除
  
  // 获取用户调整后的参数
  const adjustedData = floorPlanData?.adjustedData || {}
  const clickedSide = adjustedData.clickedSide || null
  
  // 九宫格上方朝向
  // 优先使用用户在调整页面选择的方向，其次用AI识别值
  const aiDetectedTopDir = floorPlanData?.floorPlanInfo?.imageTopDirection || null
  const userSelectedDir = adjustedData?.gridTopDirection || null
  const [floorPlanTopDir, setFloorPlanTopDir] = useState(() => {
    return userSelectedDir || aiDetectedTopDir || '北'
  })
  const [showDirPicker, setShowDirPicker] = useState(false)
  const reportRef = useRef(null)

  // 监听用户选择或AI识别数据变化
  React.useEffect(() => {
    const preferred = userSelectedDir || aiDetectedTopDir
    if (preferred) {
      setFloorPlanTopDir(preferred)
    }
  }, [userSelectedDir, aiDetectedTopDir])
  
  // 根据朝向生成九宫格布局（考虑自动校准偏移量）
  const gridOrder = useMemo(() => {
    return generateGridOrder(floorPlanTopDir)
  }, [floorPlanTopDir])

  // V2.8: 纯AI视觉方案——房间宫位完全由AI视觉识别决定，不再用数学映射
  const roomsByPalace = useMemo(() => {
    const rooms = floorPlanData?.rooms || []
    if (rooms.length === 0) return {}

    const map = {}

    rooms.forEach(room => {
      // V2.8: 优先使用AI直接判断的palace字段
      if (room.palace && room.palace !== '中') {
        if (!map[room.palace]) map[room.palace] = []
        map[room.palace].push({ ...room, _isPrimary: true })
        
        // 次要宫位（房间横跨多个宫位时）
        if (room.secondaryPalaces?.length > 0) {
          room.secondaryPalaces.forEach(sp => {
            if (sp !== '中' && sp !== room.palace) {
              if (!map[sp]) map[sp] = []
              map[sp].push({ ...room, _isPrimary: false })
            }
          })
        }
      }
    })
    
    console.log('[V2.8 AI视觉映射]', 
      Object.keys(map).map(p => `${p}(${TRIGRAM_TO_DIR[p]||''}): ${map[p].map(r => `${r.name}${r._isPrimary ? '' : '(次)'}`).join(',')}`).join('; '))
    return map
  }, [floorPlanData])

  // 构建宫位数据映射（含融合分析）
  const palaceMap = useMemo(() => {
    if (!fengshuiResult) return {}

    const bazhaiPalaces = fengshuiResult.palaces || []
    const feiXingPalaces = fengshuiResult.feiXing?.palaces || []

    const bazhaiByTrigram = {}
    bazhaiPalaces.forEach(p => { bazhaiByTrigram[p.trigram] = p })

    const feiXingByPalace = {}
    feiXingPalaces.forEach(p => { feiXingByPalace[p.palace] = p })

    const map = {}
    const allPalaces = ['坎', '坤', '震', '巽', '中', '乾', '兑', '艮', '离']

    allPalaces.forEach(palace => {
      const bazhai = bazhaiByTrigram[palace]
      const feiXing = feiXingByPalace[palace]
      const palaceRooms = roomsByPalace[palace] || []
      // V2.5.2: 区分主房间和次房间（跨宫位场景）
      const primaryRooms = palaceRooms.filter(r => r._isPrimary !== false)
      const secondaryRooms = palaceRooms.filter(r => r._isPrimary === false)
      const primaryNames = primaryRooms.map(r => r.name).filter(Boolean)
      const secondaryNames = secondaryRooms.map(r => r.name).filter(Boolean)
      const roomDisplay = primaryNames.join('·') + (secondaryNames.length > 0 ? ` +${secondaryNames.join('·')}` : '')

      // 八宅热力值
      const bazhaiHeat = bazhai ? scoreToHeatValue(bazhai, 'bazhai') : 0.5
      // 飞星热力值
      const feiXingHeat = feiXing ? scoreToHeatValue(feiXing, 'feixing') : 0.5

      // 融合热力值：加权平均（飞星权重略高，因为更精细）
      const fusionHeat = bazhaiHeat * 0.4 + feiXingHeat * 0.6

      // 根据视图模式选择热力值
      let heatValue
      if (viewMode === 'bazhai') heatValue = bazhaiHeat
      else if (viewMode === 'feixing') heatValue = feiXingHeat
      else heatValue = fusionHeat // 'fusion' 融合模式

      let info = {}
      if (viewMode === 'bazhai' && bazhai) {
        const tipData = BAZHAI_TIPS[bazhai.youxing] || { tag: '', tip: '' }
        info = {
          starName: bazhai.youxing,
          nature: bazhai.nature,
          tag: tipData.tag,
          tip: tipData.tip,
          score: bazhai.score,
        }
      } else if (viewMode === 'feixing' && feiXing) {
        const shanStarInfo = NINE_STARS[feiXing.shanStar]
        const xiangStarInfo = NINE_STARS[feiXing.xiangStar]
        const tipData = getFeiXingTip(feiXing.comboScore)
        info = {
          shanStar: feiXing.shanStar,
          xiangStar: feiXing.xiangStar,
          shanStarName: shanStarInfo?.name || '',
          xiangStarName: xiangStarInfo?.name || '',
          shanStarKeyword: shanStarInfo?.keyword || '',
          xiangStarKeyword: xiangStarInfo?.keyword || '',
          comboNature: feiXing.comboNature,
          comboScore: feiXing.comboScore,
          comboDesc: feiXing.comboDesc,
          tag: tipData.tag,
          tip: tipData.tip,
        }
      } else if (viewMode === 'fusion') {
        // 融合分析：综合八宅+飞星
        info = buildFusionInfo(bazhai, feiXing, bazhaiHeat, feiXingHeat)
      }

      map[palace] = {
        direction: PALACE_DIRECTION[palace],
        number: PALACE_NUMBER[palace],
        room: roomDisplay,
        rooms: palaceRooms,
        heatValue,
        info,
        bazhai,
        feiXing,
        bazhaiHeat,
        feiXingHeat,
      }
    })

    return map
  }, [fengshuiResult, roomsByPalace, viewMode])

  // ===== 户型适配评分（V2.8: 使用AI视觉识别的宫位，主宫位全权重，次宫位30%权重） =====
  const roomAnalysis = useMemo(() => {
    const rooms = floorPlanData?.rooms || []
    if (rooms.length === 0) return { roomScore: 0, details: [], secondaryDetails: [], hasRooms: false }

    let totalWeight = 0
    let weightedScore = 0
    const details = []
    const secondaryDetails = []

    rooms.forEach(room => {
      // V2.8: 直接用AI给的palace字段
      if (!room.palace || room.palace === '中') return
      
      const weight = getRoomWeight(room.name)
      const roomType = getRoomType(room.name)
      
      // 主宫位
      const palaceData = palaceMap[room.palace]
      if (palaceData) {
        totalWeight += weight
        const compat = calcRoomPalaceCompat(roomType, palaceData.heatValue)
        weightedScore += compat.score * weight
        
        details.push({
          roomName: room.name,
          palace: room.palace,
          direction: PALACE_DIRECTION[room.palace],
          note: compat.note,
          compatScore: Math.round(compat.score * 100),
          weight,
          heatValue: palaceData.heatValue,
          isPrimary: true,
        })
      }
      
      // 次要宫位（30%权重）
      if (room.secondaryPalaces?.length > 0) {
        room.secondaryPalaces.forEach(sp => {
          if (sp === '中' || sp === room.palace) return
          const spData = palaceMap[sp]
          if (!spData) return
          
          const effectiveWeight = weight * 0.3
          totalWeight += effectiveWeight
          const compat = calcRoomPalaceCompat(roomType, spData.heatValue)
          weightedScore += compat.score * effectiveWeight
          
          secondaryDetails.push({
            roomName: room.name,
            palace: sp,
            direction: PALACE_DIRECTION[sp],
            note: compat.note,
            compatScore: Math.round(compat.score * 100),
            weight: effectiveWeight,
            heatValue: spData.heatValue,
            isPrimary: false,
          })
        })
      }
    })

    const roomScore = totalWeight > 0 ? Math.round((weightedScore / totalWeight) * 100) : 0
    return { roomScore, details, secondaryDetails, hasRooms: rooms.length > 0 }
  }, [floorPlanData, palaceMap])

  // 综合评分：直接使用主评分，与概览保持一致
  const adjustedScore = useMemo(() => {
    return fengshuiResult?.overall?.score || 0
  }, [fengshuiResult])

  // ===== 分析结论 =====
  const analysis = useMemo(() => {
    if (!palaceMap || !fengshuiResult) return null

    const palaces = Object.entries(palaceMap).filter(([k]) => k !== '中')

    const goodPalaces = palaces
      .filter(([, d]) => d.heatValue >= 0.6)
      .sort((a, b) => b[1].heatValue - a[1].heatValue)

    const badPalaces = palaces
      .filter(([, d]) => d.heatValue < 0.5)
      .sort((a, b) => a[1].heatValue - b[1].heatValue)

    const pattern = fengshuiResult.feiXing?.pattern
    const scoreLevel = getScoreLevel(adjustedScore)

    const optimizeTips = badPalaces.slice(0, 3).map(([palace, d]) => {
      const roomInfo = d.room ? `${d.room}（${d.direction}方）` : `${d.direction}方`
      const tip = d.info.tip || '宜放化煞物品'
      return { palace, roomInfo, tip, heatValue: d.heatValue }
    })

    return { goodPalaces, badPalaces, pattern, scoreLevel, optimizeTips }
  }, [palaceMap, fengshuiResult, adjustedScore])

  // 截图分享
  const handleScreenshot = useCallback(() => {
    if (navigator.share) {
      navigator.share({
        title: '好宅助手 - 户型风水分析报告',
        text: `我的家宅风水评分${adjustedScore}分！${analysis?.scoreLevel}`,
        url: window.location.href,
      }).catch(() => {})
    } else {
      alert('请使用手机截图功能保存报告')
    }
  }, [adjustedScore, analysis])

  if (!fengshuiResult || !analysis) return null

  const pattern = fengshuiResult.feiXing?.pattern
  const hasRooms = roomAnalysis.hasRooms

  return (
    <div className="fengshui-report animate-in" ref={reportRef}>
      {/* ===== 报告头部 ===== */}
      <div className="report-header-section">
        <div className="report-title-row">
          <h1 className="report-main-title">
            {viewMode === 'fusion' ? '户型风水融合分析报告' : viewMode === 'bazhai' ? '户型风水专业分析报告' : '户型九宫飞星融合风水专业分析报告'}
          </h1>
        </div>
        <p className="report-subtitle">
          {viewMode === 'fusion'
            ? '八宅游星 × 玄空飞星 × 吉凶共识 × 分歧说明 × 居住优化'
            : viewMode === 'bazhai'
            ? '坐向四象 · 八宅游星 · 户型适配 · 居住优化建议'
            : '玄空飞星 × 八卦宫位 × 入户纳气 × 户型适配 × 家居优化'
          }
        </p>
      </div>

      {/* ===== 综合评分 ===== */}
      <div className="report-score-section">
        <div className="score-circle-wrapper">
          <div className="score-circle-outer">
            <div className="score-circle-inner">
              <span className="score-number">{adjustedScore}</span>
              <span className="score-unit">分</span>
            </div>
          </div>
          <div className="score-level-text">{analysis.scoreLevel}</div>
        </div>
        <div className="score-breakdown-mini">
          {fengshuiResult.overall?.baZhaiScore && (
            <div className="breakdown-item">
              <span className="breakdown-label">八宅</span>
              <span className="breakdown-value">{fengshuiResult.overall.baZhaiScore}</span>
            </div>
          )}
          {fengshuiResult.overall?.feiXingScore && (
            <div className="breakdown-item">
              <span className="breakdown-label">飞星</span>
              <span className="breakdown-value">{fengshuiResult.overall.feiXingScore}</span>
            </div>
          )}
          {fengshuiResult.overall?.patternScore && (
            <div className="breakdown-item">
              <span className="breakdown-label">格局</span>
              <span className="breakdown-value">{fengshuiResult.overall.patternScore}</span>
            </div>
          )}
          {hasRooms && (
            <div className="breakdown-item">
              <span className="breakdown-label">适配</span>
              <span className="breakdown-value">{roomAnalysis.roomScore}</span>
            </div>
          )}
          <div className="breakdown-item total">
            <span className="breakdown-label">综合</span>
            <span className="breakdown-value accent">{adjustedScore}</span>
          </div>
        </div>
      </div>

      {/* ===== 视图切换 ===== */}
      <div className="report-mode-toggle">
        <button
          className={`mode-btn ${viewMode === 'fusion' ? 'active' : ''}`}
          onClick={() => setViewMode('fusion')}
        >
          融合分析
        </button>
        <button
          className={`mode-btn ${viewMode === 'bazhai' ? 'active' : ''}`}
          onClick={() => setViewMode('bazhai')}
        >
          八宅游星
        </button>
        <button
          className={`mode-btn ${viewMode === 'feixing' ? 'active' : ''}`}
          onClick={() => setViewMode('feixing')}
        >
          九宫飞星
        </button>
      </div>

      {/* ===== 方向选择器 ===== */}
      <div className="dir-selector-section">
        <div className="dir-selector-header" onClick={() => setShowDirPicker(!showDirPicker)}>
          <span className="dir-label">📐 户型图上方朝向</span>
          <span className="dir-current">{floorPlanTopDir}方 ▾</span>
        </div>
        {showDirPicker && (
          <div className="dir-picker-grid">
            {COMPASS_ORDER.map(dir => (
              <button
                key={dir}
                className={`dir-pick-btn ${floorPlanTopDir === dir ? 'active' : ''}`}
                onClick={() => { setFloorPlanTopDir(dir); setShowDirPicker(false) }}
              >
                {dir}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ===== 户型图 + 九宫格叠加 ===== */}
      <div className="report-floorplan-section">
        <div className={`floorplan-grid-container ${!floorPlanData?.preview ? 'no-image' : ''}`}>
          {/* 指北针 */}
          <div className="compass-indicator">
            <div className="compass-arrow" style={{ transform: `rotate(${COMPASS_ORDER.indexOf(floorPlanTopDir) * 45}deg)` }}>
              <span className="compass-n">N</span>
            </div>
          </div>

          {/* V2.5: 用 floorplan-wrapper 包裹图片，与调整页定位方式一致，确保九宫格坐标系和图片一致 */}
          <div className="floorplan-wrapper">
            {floorPlanData?.preview && (
              <img
                src={floorPlanData.preview}
                alt="户型图"
                className="floorplan-preview-img"
              />
            )}
          </div>

          {/* 九宫格叠加层 - V2.5.4: 用百分比定位，避免容器尺寸变化导致偏移 */}
          <div
            className="nine-palace-overlay"
            style={{
              // 优先用百分比值（跨容器尺寸自适应），后备用像素值
              ...(adjustedData?.imageBoundsPct
                ? {
                    left: `${adjustedData.imageBoundsPct.left}%`,
                    top: `${adjustedData.imageBoundsPct.top}%`,
                    width: `${adjustedData.imageBoundsPct.width}%`,
                    height: `${adjustedData.imageBoundsPct.height}%`,
                  }
                : {
                    left: adjustedData?.imageBounds?.left ?? 0,
                    top: adjustedData?.imageBounds?.top ?? 0,
                    width: adjustedData?.imageBounds?.width ?? '100%',
                    height: adjustedData?.imageBounds?.height ?? '100%',
                  }),
              // 缩放偏移也用百分比（相对于九宫格自身尺寸）
              transform: `translate(${adjustedData?.gridOffsetPctX || 0}%, ${adjustedData?.gridOffsetPctY || 0}%) scale(${adjustedData?.gridScaleX || 1}, ${adjustedData?.gridScaleY || 1}) rotate(${adjustedData?.gridAngle || 0}deg)`,
              transformOrigin: '50% 50%',
            }}
          >
            {gridOrder.map((row, ri) => (
              <div key={ri} className="palace-row">
                {row.map(palace => {
                  const data = palaceMap[palace] || {}
                  const bgColor = getNatureColor(data.heatValue || 0.5, viewMode)
                  const tagClass = getNatureTagClass(data.heatValue || 0.5)
                  const isCenter = palace === '中'

                  return (
                    <div
                      key={palace}
                      className={`palace-cell ${isCenter ? 'center-cell' : ''} ${tagClass}`}
                      style={{ backgroundColor: bgColor }}
                    >
                      {!isCenter && (
                        <span className="palace-number">{data.number}</span>
                      )}

                      {data.room && (
                        <div className="palace-room-name">{data.room}</div>
                      )}

                      <div className="palace-direction">
                        {!isCenter && <span className="palace-trigram">{palace}</span>}
                        <span className="palace-dir-text">{data.direction}</span>
                      </div>

                      {viewMode === 'bazhai' && data.info?.starName && (
                        <div className={`palace-star-info ${tagClass}`}>
                          <span className="star-name">{data.info.starName}</span>
                          <span className="star-nature">{data.info.nature}</span>
                        </div>
                      )}

                      {viewMode === 'feixing' && data.info?.shanStar != null && (
                        <div className={`palace-star-info ${tagClass}`}>
                          <div className="feixing-stars">
                            <span className="shan-star">{data.info.shanStar}</span>
                            <span className="star-sep">·</span>
                            <span className="xiang-star">{data.info.xiangStar}</span>
                          </div>
                          <div className="feixing-keyword">
                            {data.info.shanStarKeyword}
                          </div>
                        </div>
                      )}

                      {viewMode === 'fusion' && data.info && !isCenter && (
                        <div className={`palace-fusion-badge ${data.heatValue >= 0.6 ? 'good' : data.heatValue < 0.4 ? 'bad' : data.info.consensus === false ? 'conflict' : 'neutral'}`}>
                          {!data.info.consensus && data.info.tag?.includes('分歧') ? '⚡' : data.heatValue >= 0.6 ? '吉' : data.heatValue < 0.4 ? '凶' : '平'}
                        </div>
                      )}

                      {viewMode !== 'fusion' && data.info?.tag && (
                        <div className={`palace-opt-tag ${tagClass}`}>
                          {data.info.tag}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        {/* 图例 */}
        <div className="report-legend">
          <div className="legend-item"><span className="legend-dot good" />吉位</div>
          <div className="legend-item"><span className="legend-dot neutral" />平位</div>
          <div className="legend-item"><span className="legend-dot bad" />凶位</div>
          {viewMode === 'fusion' && (
            <div className="legend-item"><span className="legend-dot conflict" />分歧</div>
          )}
        </div>
      </div>

      {/* ===== 融合分析详情（融合模式下显示） ===== */}
      {viewMode === 'fusion' && (
        <div className="report-section">
          <div className="section-header">
            <span className="section-icon">☯</span>
            <span className="section-title">融合分析详情</span>
          </div>
          <div className="section-content">
            {Object.entries(palaceMap)
              .filter(([palace]) => palace !== '中')
              .sort(([, a], [, b]) => b.heatValue - a.heatValue)
              .map(([palace, d]) => {
                const info = d.info || {}
                const isGood = d.heatValue >= 0.6
                const isBad = d.heatValue < 0.4
                const isConflict = info.consensus === false
                return (
                  <div key={palace} className={`fusion-detail-card ${isGood ? 'good' : isBad ? 'bad' : 'neutral'}`}>
                    <div className="fdc-header">
                      <span className="fdc-number">{d.number}</span>
                      <span className="fdc-palace">{palace}宫·{d.direction}方</span>
                      {d.room && <span className="fdc-room">{d.room}</span>}
                      <span className={`fdc-tag ${isConflict ? 'conflict' : isGood ? 'good' : isBad ? 'bad' : 'neutral'}`}>
                        {info.tag}
                      </span>
                    </div>
                    <div className="fdc-compare">
                      <span className={`fdc-label ${d.bazhaiHeat >= 0.6 ? 'good' : d.bazhaiHeat < 0.4 ? 'bad' : 'neutral'}`}>
                        八宅：{info.bazhaiLabel}
                      </span>
                      <span className="fdc-sep">|</span>
                      <span className={`fdc-label ${d.feiXingHeat >= 0.6 ? 'good' : d.feiXingHeat < 0.4 ? 'bad' : 'neutral'}`}>
                        飞星：{info.feiXingLabel}
                      </span>
                    </div>
                    {info.tip && <div className="fdc-tip">{info.tip}</div>}
                  </div>
                )
              })}
          </div>
        </div>
      )}

      {/* ===== 户型适配分析（有房间数据时显示） ===== */}
      {hasRooms && roomAnalysis.details.length > 0 && (
        <div className="report-section">
          <div className="section-header">
            <span className="section-icon">🏠</span>
            <span className="section-title">户型适配分析</span>
          </div>
          <div className="section-content">
            <div className="compat-summary">
              户型适配评分 <strong>{roomAnalysis.roomScore}</strong> 分
              {roomAnalysis.roomScore >= 70 ? '，房间布局与风水格局匹配较好' :
               roomAnalysis.roomScore >= 50 ? '，部分房间布局需调整' :
               '，房间布局与风水格局冲突较大，建议重点调整'}
            </div>
            {roomAnalysis.details.map((item, idx) => (
              <div key={idx} className={`compat-item ${item.compatScore >= 60 ? 'good' : item.compatScore >= 40 ? 'neutral' : 'bad'}`}>
                <div className="compat-header">
                  <span className="compat-room">{item.roomName}</span>
                  <span className="compat-pos">{item.direction}方·{item.palace}宫</span>
                  <span className={`compat-score ${item.compatScore >= 60 ? 'good' : item.compatScore >= 40 ? 'neutral' : 'bad'}`}>
                    {item.compatScore}分
                  </span>
                </div>
                <div className="compat-note">{item.note}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== 风水格局判断 ===== */}
      {pattern && (
        <div className="report-section">
          <div className="section-header">
            <span className="section-icon">⛩</span>
            <span className="section-title">风水格局判断</span>
          </div>
          <div className="section-content">
            <div className="pattern-card">
              <div className="pattern-name">{pattern.type}</div>
              <div className="pattern-desc">{pattern.desc}</div>
              <div className="pattern-score">
                格局评分：<span className={pattern.score >= 70 ? 'text-good' : pattern.score >= 40 ? 'text-neutral' : 'text-bad'}>
                  {pattern.score}分
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== 吉位列表 ===== */}
      {analysis.goodPalaces.length > 0 && (
        <div className="report-section">
          <div className="section-header">
            <span className="section-icon">✦</span>
            <span className="section-title">吉位·宜用</span>
          </div>
          <div className="section-content">
            {analysis.goodPalaces.map(([palace, d]) => (
              <div key={palace} className="palace-info-card good">
                <div className="pic-header">
                  <span className="pic-number">{d.number}</span>
                  <span className="pic-room">{d.room || d.direction}</span>
                  <span className="pic-direction">{d.direction}方·{palace}宫</span>
                </div>
                <div className="pic-detail">
                  {viewMode === 'bazhai' && d.info?.starName && (
                    <span className="pic-star">{d.info.starName}（{d.info.nature}）</span>
                  )}
                  {viewMode === 'feixing' && d.info?.shanStarName && (
                    <span className="pic-star">
                      山{d.info.shanStar}{d.info.shanStarName?.slice(0, 2)}·
                      向{d.info.xiangStar}{d.info.xiangStarName?.slice(0, 2)}
                    </span>
                  )}
                </div>
                {d.info?.tip && <div className="pic-tip good">{d.info.tip}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== 凶位列表 ===== */}
      {analysis.badPalaces.length > 0 && (
        <div className="report-section">
          <div className="section-header">
            <span className="section-icon">⚠</span>
            <span className="section-title">凶位·需化解</span>
          </div>
          <div className="section-content">
            {analysis.badPalaces.map(([palace, d]) => (
              <div key={palace} className="palace-info-card bad">
                <div className="pic-header">
                  <span className="pic-number">{d.number}</span>
                  <span className="pic-room">{d.room || d.direction}</span>
                  <span className="pic-direction">{d.direction}方·{palace}宫</span>
                </div>
                <div className="pic-detail">
                  {viewMode === 'bazhai' && d.info?.starName && (
                    <span className="pic-star">{d.info.starName}（{d.info.nature}）</span>
                  )}
                  {viewMode === 'feixing' && d.info?.shanStarName && (
                    <span className="pic-star">
                      山{d.info.shanStar}{d.info.shanStarName?.slice(0, 2)}·
                      向{d.info.xiangStar}{d.info.xiangStarName?.slice(0, 2)}
                      {d.info.comboDesc && ` — ${d.info.comboDesc}`}
                    </span>
                  )}
                </div>
                {d.info?.tip && <div className="pic-tip bad">{d.info.tip}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== 重点优化建议 ===== */}
      {analysis.optimizeTips.length > 0 && (
        <div className="report-section">
          <div className="section-header">
            <span className="section-icon">🛠</span>
            <span className="section-title">重点优化建议</span>
          </div>
          <div className="section-content">
            {analysis.optimizeTips.map((item, idx) => (
              <div key={idx} className="optimize-item">
                <div className="opt-number">{idx + 1}</div>
                <div className="opt-content">
                  <div className="opt-room">{item.roomInfo}</div>
                  <div className="opt-tip">{item.tip}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== 最终结论 ===== */}
      <div className="report-section conclusion-section">
        <div className="section-header">
          <span className="section-icon">📜</span>
          <span className="section-title">最终结论</span>
        </div>
        <div className="section-content">
          <div className="conclusion-text">
            本户型综合评分 <strong>{adjustedScore}分</strong>，属<strong>{analysis.scoreLevel}</strong>。
            {hasRooms && roomAnalysis.roomScore > 0 && (
              <>其中户型适配评分{roomAnalysis.roomScore}分，</>
            )}
            {analysis.goodPalaces.length > 0 && (
              <>吉位集中于{analysis.goodPalaces.map(([, d]) => d.direction).join('、')}方，</>
            )}
            {analysis.badPalaces.length > 0 && (
              <>凶位分布于{analysis.badPalaces.map(([, d]) => d.direction).join('、')}方需重点化解。</>
            )}
            {pattern && <>飞星格局为「{pattern.type}」，{pattern.score >= 70 ? '格局较好' : '格局偏弱，需通过布局调整弥补'}。</>}
            {hasRooms && roomAnalysis.details.some(d => d.compatScore < 40) && (
              <>重点关注：{roomAnalysis.details.filter(d => d.compatScore < 40).map(d => d.roomName).join('、')}位于凶位，对居住品质影响较大。</>
            )}
            {adjustedScore >= 70
              ? '整体而言，通过合理布局可进一步提升居住品质。'
              : '建议结合化解方案进行重点调整，改善居住风水。'
            }
          </div>
        </div>
      </div>

      {/* ===== 印章 + 品牌 ===== */}
      <div className="report-footer">
        <div className="report-seal">
          <div className="seal-text">好宅<br/>助手</div>
        </div>
        <div className="report-brand">
          <div className="brand-name">好宅助手 · AI风水分析</div>
          <div className="brand-date">{new Date().toLocaleDateString('zh-CN')}</div>
        </div>
      </div>

      {/* ===== 操作按钮 ===== */}
      <div className="report-actions">
        <button className="btn-share-report" onClick={handleScreenshot}>
          📤 分享报告
        </button>
        {onBack && (
          <button className="btn-back-report" onClick={onBack}>
            ← 返回结果
          </button>
        )}
      </div>

    </div>
  )
}
