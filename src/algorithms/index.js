/**
 * 好宅助手 - 主引擎入口 V1.5B
 * 整合命卦、八宅、磁偏角、化解、八字、五行、飞星七大引擎
 * 对外统一API
 */

import { calcMingGua, checkRenZhaiMatch } from './minggua.js'
import { baZhaiPan, angleToZhaiGua } from './bazhai.js'
import { magneticToTrueNorth, calcDeclination, angleToDirection } from './declination.js'
import { generateHuaJieReport } from './huajie.js'
import { calcBaZi, SHI_CHEN_NAMES, getShiChenName } from './bazi.js'
import { analyzeWuXing, WU_XING_COLORS } from './wuxing.js'
import { feiXingPan, liuNianFeiXing, NINE_STARS, getPeriod } from './feixing.js'

/**
 * 完整看盘流程 V2.0
 * @param {Object} input
 * @param {number} input.birthYear - 出生年份
 * @param {number} input.birthMonth - 出生月份（1-12）
 * @param {number} input.birthDay - 出生日期（1-31）
 * @param {number} input.birthHour - 出生时辰（小时，0-23）
 * @param {'male'|'female'} input.gender - 性别
 * @param {number} input.magneticHeading - 手机罗盘磁北角度
 * @param {number} input.lat - 纬度
 * @param {number} input.lon - 经度
 * @param {number} input.buildYear - 房屋建造年份（用于确定元运，V2.0新增）
 * @returns {Object} 完整看盘结果
 */
export function fullAnalysis(input) {
  const { birthYear, birthMonth, birthDay, birthHour, birthMinute = 0, gender, magneticHeading, lat, lon, buildYear } = input

  // Step 1: 磁偏角校准 → 真北角度
  const compassResult = magneticToTrueNorth(magneticHeading, lat, lon)

  // Step 2: 八字四柱推算（V1.5b：传入出生时间+出生地经度，用真太阳时排盘）
  const baZiResult = calcBaZi(birthYear, birthMonth, birthDay, birthHour, birthMinute, lon)

  // Step 3: 五行分析
  const wuxingResult = analyzeWuXing(baZiResult)

  // Step 4: 命卦计算（V1.5：从八字+年份综合判断）
  const mingGua = calcMingGuaV15(birthYear, gender, baZiResult)

  // Step 5: 八宅排盘
  const panResult = baZhaiPan(compassResult.trueNorth, mingGua)

  // Step 6: 玄空飞星排盘（V2.0：使用建造年份确定元运）
  const currentYear = new Date().getFullYear()
  const effectiveBuildYear = buildYear || currentYear  // 兼容旧版本
  const feiXingResult = feiXingPan(compassResult.trueNorth, effectiveBuildYear, currentYear)

  // Step 7: 流年飞星（V1.5B新增）
  const liuNianResult = liuNianFeiXing(currentYear, gender)

  // Step 8: 算法冲突解决（V1.5B新增）
  const conflictResult = resolveConflicts(panResult.palaces, feiXingResult)

  // Step 9: 综合评分（融合八宅+飞星）
  // 注意：环境/装修/户型维度在App.jsx中二次计算时融入
  const combinedScore = calcCombinedScore(panResult.overall, feiXingResult, conflictResult, null, null, null, null)

  // Step 10: 人宅匹配
  const matchResult = checkRenZhaiMatch(mingGua.name, panResult.zhaiGua.zhaiGua)

  // Step 11: 化解方案（融合飞星+冲突信息+形煞+装修）
  const huajieResult = generateHuaJieReport(panResult.palaces, feiXingResult, conflictResult)

  // Step 12: 生成总结（传入综合评分而非八宅评分）
  const summary = generateSummary(panResult, matchResult, huajieResult, baZiResult, wuxingResult, feiXingResult, conflictResult, combinedScore)

  return {
    input: { birthYear, birthMonth, birthDay, birthHour, gender, lat, lon, magneticHeading },
    compass: compassResult,
    baZi: baZiResult,
    wuxing: wuxingResult,
    mingGua,
    zhaiGua: panResult.zhaiGua,
    palaces: panResult.palaces,
    overall: combinedScore,
    match: matchResult,
    feiXing: feiXingResult,
    liuNian: liuNianResult,
    conflicts: conflictResult,
    huajie: huajieResult,
    summary,
  }
}

/**
 * V1.5 命卦计算（整合八字信息）
 * @param {number} birthYear - 出生年份
 * @param {'male'|'female'} gender - 性别
 * @param {Object} baZiResult - 八字结果
 * @returns {Object} 命卦信息
 */
function calcMingGuaV15(birthYear, gender, baZiResult) {
  // 基础命卦（年份+性别）
  const baseMingGua = calcMingGua(birthYear, gender)

  // 如果八字分析成功，可以补充信息
  // 注意：传统命卦只用年份，这里结合八字提供更丰富的信息
  const { dayMaster, dayMasterElement, monthZhi } = baZiResult

  return {
    ...baseMingGua,
    // 八字补充信息
    baZiInfo: {
      dayMaster,
      dayElement: dayMasterElement,
      monthZhi,
      note: '命卦基于八宅派公式（年份+性别），八字日主供参考',
    },
  }
}

/**
 * 算法冲突解决 V1.5B
 * 当八宅和飞星结论冲突时，按"飞星>八宅"优先级裁决
 * @param {Array} baZhaiPalaces - 八宅方位结果
 * @param {Object} feiXingResult - 飞星排盘结果
 * @returns {Object} 冲突分析结果
 */
function resolveConflicts(baZhaiPalaces, feiXingResult) {
  const conflicts = []
  const agreements = []

  // 方位→宫位映射
  const positionToPalace = {
    '北': '坎', '东北': '艮', '东': '震', '东南': '巽',
    '南': '离', '西南': '坤', '西': '兑', '西北': '乾',
  }

  baZhaiPalaces.forEach(bz => {
    const palaceName = positionToPalace[bz.position]
    if (!palaceName) return

    const fxPalace = feiXingResult.palaces.find(p => p.palace === palaceName)
    if (!fxPalace) return

    const baZhaiNature = bz.nature  // 吉/凶
    const feiXingNature = fxPalace.comboNature  // 吉/小吉/平/凶/大凶/大吉

    // 统一到吉/凶/平三档
    const bzLevel = baZhaiNature === '吉' ? '吉' : '凶'
    let fxLevel = '平'
    if (['吉', '大吉'].includes(feiXingNature)) fxLevel = '吉'
    else if (['凶', '大凶'].includes(feiXingNature)) fxLevel = '凶'

    if (bzLevel !== fxLevel && bzLevel !== '平' && fxLevel !== '平') {
      // 冲突：八宅和飞星结论不一致
      conflicts.push({
        position: bz.position,
        baZhai: bz.youxing,
        baZhaiNature: bzLevel,
        feiXing: `${fxPalace.shanStar}${fxPalace.xiangStar}`,
        feiXingNature: fxLevel,
        resolution: fxLevel,  // 飞星优先
        resolutionSource: '飞星',
        reason: `八宅${bz.youxing}为${bzLevel}，飞星${fxPalace.shanStar}${fxPalace.xiangStar}组合为${fxLevel}，以飞星为准`,
      })
    } else {
      agreements.push({
        position: bz.position,
        nature: bzLevel === fxLevel ? bzLevel : (bzLevel === '平' ? fxLevel : bzLevel),
      })
    }
  })

  return {
    conflicts,
    agreements,
    conflictCount: conflicts.length,
    agreementCount: agreements.length,
    rule: '飞星判吉凶，八宅判宜忌',
    summary: conflicts.length > 0
      ? `${conflicts.length}处冲突：${conflicts.map(c => c.position).join('、')}，以飞星为准`
      : '八宅与飞星结论一致，无冲突',
  }
}

/**
 * 综合评分（融合八宅+飞星+形煞+装修+户型+环境优势）
 * 
 * 评分架构 V2.5.4：
 * - 基础风水分（八宅+飞星）经曲线映射（32+base*0.77），占总分70%
 * - 环境评估分（形煞+环境优势）base60+调节*2.5，占总分15%
 * - 装修评估分（装修质量+风格风水）base85+扣分*3，占总分10%
 * - 户型评估分（户型图AI识别问题）base70+加成，占总分5%
 * - 综合分区间[40, 98]：好房90+，中等65-75，差房40-55
 * 
 * 环境评估未做时，其权重回归基础风水；装修/户型同理
 */
function calcCombinedScore(baZhaiOverall, feiXingResult, conflictResult, envData, renovationData, envAdvantageData, floorPlanData) {
  // ===== 1. 基础风水分 =====
  const bzScore = baZhaiOverall.score

  // 飞星宫位分：加权平均（坐方/朝向权重大）
  const fxPalaces = feiXingResult.palaces.filter(p => p.palace !== '中')
  const facing = feiXingResult.facingMountain.palace
  const sitting = feiXingResult.sittingMountain.palace

  let fxWeightedSum = 0
  let fxTotalWeight = 0
  fxPalaces.forEach(p => {
    let w = 1.0
    if (p.palace === sitting) w = 2.0
    else if (p.palace === facing) w = 1.8
    else w = 0.7
    fxWeightedSum += p.comboScore * w
    fxTotalWeight += w
  })
  const fxWeightedAvg = fxWeightedSum / fxTotalWeight

  // 格局分
  const patternScore = feiXingResult.pattern.score

  // 基础风水分 = 八宅40% + 飞星宫位35% + 飞星格局25%
  let fengshuiBase = bzScore * 0.40 + fxWeightedAvg * 0.35 + patternScore * 0.25

  // 冲突惩罚：每处冲突扣3分
  fengshuiBase -= conflictResult.conflictCount * 3

  // 线性映射：抬升基础分，拉开风水分差距
  fengshuiBase = 32 + fengshuiBase * 0.77
  fengshuiBase = Math.max(40, Math.min(98, fengshuiBase))

  // ===== 2. 环境评估分 =====
  let envScore = 60  // 默认（未评估时，权重回归风水不影响）
  let hasEnv = false
  if (envData || envAdvantageData) {
    hasEnv = true
    const envPenalty = envData?.totalPenalty || 0
    const envBonus = envAdvantageData?.totalBonus || 0
    envScore = 65 + (envPenalty + envBonus) * 2.2  // -15→65-33=32, +8→65+17.6=83
    envScore = Math.max(25, Math.min(95, envScore))
  }

  // ===== 3. 装修评估分 =====
  let renovationScore = 60  // 默认（未评估时）
  let hasRenovation = false
  if (renovationData) {
    hasRenovation = true
    const renPenalty = renovationData.penalty || 0
    renovationScore = 88 + renPenalty * 2.5  // -15→88-37.5=50.5, -5→88-12.5=75.5
    renovationScore = Math.max(30, Math.min(92, renovationScore))
  }

  // ===== 4. 户型评估分 =====
  let floorPlanScore = 60  // 默认（未评估时）
  let hasFloorPlan = false
  if (floorPlanData) {
    hasFloorPlan = true
    const fpInfo = floorPlanData.validation?.floorPlanInfo
    const rooms = floorPlanData.validation?.rooms || []
    
    floorPlanScore = 75
    
    const roomCount = rooms.length
    if (roomCount >= 3 && roomCount <= 5) {
      floorPlanScore += 10
    } else if (roomCount > 0 && roomCount < 3) {
      floorPlanScore -= 5
    }
    
    if (fpInfo?.floorPlanType) {
      floorPlanScore += 5
    }
    
    floorPlanScore = Math.max(30, Math.min(90, floorPlanScore))
  }

  // ===== 5. 综合加权 =====
  const fengshuiWeight = 0.70
  let envWeight = hasEnv ? 0.15 : 0
  let renWeight = hasRenovation ? 0.10 : 0
  let fpWeight = hasFloorPlan ? 0.05 : 0
  
  const totalExtra = envWeight + renWeight + fpWeight
  const actualFengshuiWeight = fengshuiWeight + (1 - fengshuiWeight - totalExtra)
  
  let combined = fengshuiBase * actualFengshuiWeight
    + envScore * envWeight
    + renovationScore * renWeight
    + floorPlanScore * fpWeight

  // ===== 6. S曲线拉伸：拉大最终评分区分度 =====
  // tanh函数：低分压到40+，高分推到90+
  // 原始combined典型范围[58, 86]，中位约72
  const tanhCenter = 72
  const tanhSpread = 8
  const tanhBase = 70
  const tanhRange = 28  // 映射后范围[42, 98]
  const x = (combined - tanhCenter) / tanhSpread
  const tanhX = (Math.exp(x) - Math.exp(-x)) / (Math.exp(x) + Math.exp(-x))
  combined = tanhBase + tanhRange * tanhX
  combined = Math.max(40, Math.min(98, combined))

  const score = Math.round(combined)
  const level = score >= 85 ? '优' : score >= 70 ? '良' : score >= 55 ? '中' : '差'

  return {
    score,
    level,
    baZhaiScore: Math.round(bzScore),
    feiXingScore: Math.round(fxWeightedAvg),
    patternScore: Math.round(patternScore),
    envScore: hasEnv ? Math.round(envScore) : null,
    renovationScore: hasRenovation ? Math.round(renovationScore) : null,
    floorPlanScore: hasFloorPlan ? Math.round(floorPlanScore) : null,
    jiCount: baZhaiOverall.jiCount,
    xiongCount: baZhaiOverall.xiongCount,
    match: baZhaiOverall.match,
    matchLabel: baZhaiOverall.matchLabel,
    wuxingRelation: baZhaiOverall.wuxingRelation,
  }
}

/**
 * 生成总结文案 V1.5B
 */
function generateSummary(panResult, matchResult, huajieResult, baZiResult, wuxingResult, feiXingResult, conflictResult, combinedScore) {
  const { zhaiGua } = panResult
  const { problems, items } = huajieResult
  const { yearPillar, monthPillar, dayPillar, hourPillar } = baZiResult
  const { dayMaster, strength, xiYongShen } = wuxingResult

  let text = `您的八字：${yearPillar}年 ${monthPillar}月 ${dayPillar}日 ${hourPillar}时`
  text += `，日主${dayMaster}（${strength}）。`
  text += `住宅${zhaiGua.detail}，属于${zhaiGua.zhaiGroupLabel}。`

  // 飞星信息
  if (feiXingResult) {
    text += `玄空飞星${feiXingResult.period}运，格局：${feiXingResult.pattern.type}。`
  }

  text += `综合评分${combinedScore.score}分（${combinedScore.level}），`
  text += `吉位${combinedScore.jiCount}个、凶位${combinedScore.xiongCount}个。`
  text += matchResult.match ? '命宅相配，气场和谐。' : '命宅不配，建议通过布局调整化解。'

  if (xiYongShen.length > 0) {
    text += `喜用神：${xiYongShen.join('、')}。`
  }

  // 算法冲突提示
  if (conflictResult && conflictResult.conflictCount > 0) {
    text += `八宅与飞星有${conflictResult.conflictCount}处冲突（${conflictResult.conflicts.map(c => c.position).join('、')}），以飞星为准。`
  }

  if (problems.length > 0) {
    text += `需注意的方位：${problems.map(p => `${p.position}${p.youxing}位`).join('、')}。`
    text += `推荐使用${items.slice(0, 3).map(i => i.name).join('、')}等摆件化解调整。`
  }

  return text
}

/**
 * 快速看盘（只需要出生日期+朝向角度，不经过罗盘）
 * 用于测试和快速预览
 */
export function quickAnalysis(birthYear, birthMonth, birthDay, birthHour, gender, facingAngle) {
  // 简化版：使用默认磁偏角
  const defaultLat = 34.7
  const defaultLon = 113.7

  // 计算八字
  const baZiResult = calcBaZi(birthYear, birthMonth, birthDay, birthHour)

  // 五行分析
  const wuxingResult = analyzeWuXing(baZiResult)

  // 命卦
  const mingGua = calcMingGuaV15(birthYear, gender, baZiResult)

  // 八宅
  const panResult = baZhaiPan(facingAngle, mingGua)
  const matchResult = checkRenZhaiMatch(mingGua.name, panResult.zhaiGua.zhaiGua)
  const huajieResult = generateHuaJieReport(panResult.palaces)
  const summary = generateSummary(panResult, matchResult, huajieResult, baZiResult, wuxingResult)

  return {
    baZi: baZiResult,
    wuxing: wuxingResult,
    mingGua,
    zhaiGua: panResult.zhaiGua,
    palaces: panResult.palaces,
    overall: panResult.overall,
    match: matchResult,
    huajie: huajieResult,
    summary,
  }
}

// 导出所有模块
export { 
  calcMingGua, 
  checkRenZhaiMatch, 
  baZhaiPan, 
  angleToZhaiGua, 
  magneticToTrueNorth, 
  calcDeclination, 
  angleToDirection, 
  generateHuaJieReport,
  calcBaZi,
  analyzeWuXing,
  SHI_CHEN_NAMES,
  getShiChenName,
  WU_XING_COLORS,
  feiXingPan,
  liuNianFeiXing,
  NINE_STARS,
  getPeriod,
  calcCombinedScore,
}
