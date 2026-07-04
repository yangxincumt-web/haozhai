/**
 * 好宅助手 - 五行分析与喜用神推算引擎
 * 
 * 基于八字四柱，进行五行分析并推导喜用神
 * 
 * 算法来源：子平八字命理
 * 核心逻辑：
 * 1. 统计八字中五行分布
 * 2. 判断日主强弱（得令/失令/得地/失地/得生/失生）
 * 3. 推导喜用神（强者抑之，弱者扶之）
 */

// 天干地支对应的五行
const WU_XING_MAP = {
  // 天干
  '甲': '木', '乙': '木',
  '丙': '火', '丁': '火',
  '戊': '土', '己': '土',
  '庚': '金', '辛': '金',
  '壬': '水', '癸': '水',
  // 地支
  '子': '水', '丑': '土', '寅': '木', '卯': '木',
  '辰': '土', '巳': '火', '午': '火', '未': '土',
  '申': '金', '酉': '金', '戌': '土', '亥': '水',
}

// 地支藏干（简化版，主要藏干）
const ZHI_CANG_GAN = {
  '子': ['癸'],
  '丑': ['己', '癸', '辛'],
  '寅': ['甲', '丙', '戊'],
  '卯': ['乙'],
  '辰': ['戊', '乙', '癸'],
  '巳': ['丙', '庚', '戊'],
  '午': ['丁', '己'],
  '未': ['己', '丁', '乙'],
  '申': ['庚', '壬', '戊'],
  '酉': ['辛'],
  '戌': ['戊', '辛', '丁'],
  '亥': ['壬', '甲'],
}

// 五行相生
const WU_XING_SHENG = {
  '木': '火', '火': '土', '土': '金', '金': '水', '水': '木'
}

// 五行相克
const WU_XING_KE = {
  '木': '土', '土': '水', '水': '火', '火': '金', '金': '木'
}

// 五行分类
const WU_XING = ['木', '火', '土', '金', '水']

// 月令（五行旺衰）权重
// 寅卯月木旺，巳午月火旺，申酉月金旺，亥子月水旺，辰戌丑未月土旺
const YUE_LING_WU_XING = {
  '寅': '木', '卯': '木',
  '巳': '火', '午': '火',
  '申': '金', '酉': '金',
  '亥': '水', '子': '水',
  '辰': '土', '戌': '土', '丑': '土', '未': '土',
}

// 日干在月令中的强弱状态
const DAY_MASTER_STRENGTH = {
  // 日干: { 得令权重, 失令权重 }
  '甲': { ling: '木', strong: 1.0, weak: 0 },
  '乙': { ling: '木', strong: 1.0, weak: 0 },
  '丙': { ling: '火', strong: 1.0, weak: 0 },
  '丁': { ling: '火', strong: 1.0, weak: 0 },
  '戊': { ling: '土', strong: 1.0, weak: 0 },
  '己': { ling: '土', strong: 1.0, weak: 0 },
  '庚': { ling: '金', strong: 1.0, weak: 0 },
  '辛': { ling: '金', strong: 1.0, weak: 0 },
  '壬': { ling: '水', strong: 1.0, weak: 0 },
  '癸': { ling: '水', strong: 1.0, weak: 0 },
}

/**
 * 统计八字五行分布
 * @param {Object} baZiResult - 四柱八字结果
 * @returns {Object} 五行统计
 */
function countWuXing(baZiResult) {
  const { yearPillar, monthPillar, dayPillar, hourPillar } = baZiResult
  
  // 初始计数
  const count = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 }
  
  // 解析四柱
  const pillars = [
    { gan: yearPillar.charAt(0), zhi: yearPillar.charAt(1) },
    { gan: monthPillar.charAt(0), zhi: monthPillar.charAt(1) },
    { gan: dayPillar.charAt(0), zhi: dayPillar.charAt(1) },
    { gan: hourPillar.charAt(0), zhi: hourPillar.charAt(1) },
  ]
  
  pillars.forEach(p => {
    // 天干
    const ganElement = WU_XING_MAP[p.gan]
    count[ganElement]++
    
    // 地支
    const zhiElement = WU_XING_MAP[p.zhi]
    count[zhiElement]++
    
    // 地支藏干
    const cangGans = ZHI_CANG_GAN[p.zhi] || []
    cangGans.forEach(cg => {
      const cgElement = WU_XING_MAP[cg]
      count[cgElement]++
    })
  })
  
  return count
}

/**
 * 判断日主强弱
 * @param {string} dayMaster - 日干
 * @param {string} monthZhi - 月支
 * @param {Object} wuxingCount - 五行计数
 * @returns {Object} 强弱分析
 */
function analyzeStrength(dayMaster, monthZhi, wuxingCount) {
  const dayElement = WU_XING_MAP[dayMaster]
  const lingElement = YUE_LING_WU_XING[monthZhi]
  
  // 1. 得令判断：日干五行与月令五行相同
  const deLing = dayElement === lingElement
  
  // 2. 得地判断：八字中与日干相同五行数量
  const deDi = wuxingCount[dayElement]
  
  // 3. 得生判断：日干被生（相生）
  const shengElement = WU_XING_SHENG[dayElement]
  const deSheng = wuxingCount[shengElement]
  
  // 4. 计算总分
  let score = 0
  if (deLing) score += 4  // 得令权重最高
  score += deDi * 1      // 得地
  score += deSheng * 1   // 得生
  
  // 5. 泄气（日干被克）
  const keElement = WU_XING_KE[dayElement]
  const xieQi = wuxingCount[keElement] * 0.5
  
  score -= xieQi
  
  // 综合判断
  let strength = '中和'
  if (score >= 6) strength = '强'
  else if (score >= 4) strength = '偏强'
  else if (score >= 2) strength = '偏弱'
  else if (score <= 0) strength = '弱'
  
  return {
    score: Math.round(score * 10) / 10,
    deLing,
    deDi,
    deSheng,
    xieQi: Math.round(xieQi * 10) / 10,
    strength,
    reason: generateStrengthReason(dayMaster, monthZhi, score),
  }
}

/**
 * 生成强弱判断原因
 */
function generateStrengthReason(dayMaster, monthZhi, score) {
  const dayElement = WU_XING_MAP[dayMaster]
  const lingElement = YUE_LING_WU_XING[monthZhi]
  const reasons = []
  
  if (dayElement === lingElement) {
    reasons.push('月令得令')
  }
  
  if (score > 4) {
    reasons.push('身强')
  } else if (score < 2) {
    reasons.push('身弱')
  } else {
    reasons.push('中和平衡')
  }
  
  return reasons.join('，')
}

/**
 * 推导喜用神
 * @param {string} dayMaster - 日干
 * @param {string} strength - 强弱状态
 * @param {Object} wuxingCount - 五行计数
 * @param {Object} strengthInfo - 强弱分析详情
 * @returns {Object} 喜忌神
 */
function deriveXiYongShen(dayMaster, strength, wuxingCount, strengthInfo) {
  const dayElement = WU_XING_MAP[dayMaster]
  
  // 喜用神规则
  let xiYongShen = []  // 喜神
  let yongShen = []    // 用神
  let jiShen = []      // 忌神
  let shenSha = []     // 身煞
  
  if (strength === '强' || strength === '偏强') {
    // 身强：喜克泄（官杀、伤食、财才）
    // 喜克：官杀（金克木）
    const keElement = WU_XING_KE[dayElement] // 克我者
    xiYongShen.push(keElement)
    
    // 喜泄：伤食（我生者）
    const shengElement = WU_XING_SHENG[dayElement] // 我生者
    yongShen.push(shengElement)
    
    // 忌：帮扶（同我者、我克者）
    jiShen.push(dayElement) // 比劫
    const wuKeElement = Object.entries(WU_XING_KE).find(([k, v]) => v === dayElement)?.[0]
    if (wuKeElement) jiShen.push(wuKeElement) // 印枭
  } else if (strength === '弱' || strength === '偏弱') {
    // 身弱：喜生扶（印枭、比劫）
    // 喜生：印枭（生我者）
    const shengMeElement = Object.entries(WU_XING_SHENG).find(([k, v]) => v === dayElement)?.[0]
    if (shengMeElement) xiYongShen.push(shengMeElement)
    
    // 喜扶：比劫（同我者）
    yongShen.push(dayElement)
    
    // 忌：克泄
    const shengElement = WU_XING_SHENG[dayElement]
    const keElement = WU_XING_KE[dayElement]
    jiShen.push(shengElement, keElement)
  } else {
    // 中和：调候为主
    xiYongShen = ['水', '火'] // 调候用神
    yongShen = []
    jiShen = []
  }
  
  // 去重并排序
  xiYongShen = [...new Set(xiYongShen)]
  yongShen = [...new Set(yongShen)]
  jiShen = [...new Set(jiShen)]
  
  return {
    xiYongShen,
    yongShen,
    jiShen,
    shenSha,
  }
}

/**
 * 五行分析主函数
 * @param {Object} baZiResult - 四柱八字结果
 * @returns {Object} 五行分析结果
 */
export function analyzeWuXing(baZiResult) {
  const { yearPillar, monthPillar, dayPillar, hourPillar } = baZiResult
  
  // 1. 提取日主
  const dayMaster = dayPillar.charAt(0)
  const dayMasterElement = WU_XING_MAP[dayMaster]
  const monthZhi = monthPillar.charAt(1)
  
  // 2. 统计五行分布
  const wuxingCount = countWuXing(baZiResult)
  
  // 3. 判断日主强弱
  const strengthInfo = analyzeStrength(dayMaster, monthZhi, wuxingCount)
  
  // 4. 推导喜用神
  const { xiYongShen, yongShen, jiShen } = deriveXiYongShen(
    dayMaster, 
    strengthInfo.strength, 
    wuxingCount, 
    strengthInfo
  )
  
  // 5. 生成五行分布描述
  const wuxingDesc = generateWuXingDesc(wuxingCount, dayMasterElement)
  
  // 6. 命卦计算（从八字推导）
  const mingGua = deriveMingGuaFromBaZi(dayMaster, dayPillar)
  
  return {
    wuxingCount,
    dayMaster,
    dayMasterElement,
    monthZhi,
    strength: strengthInfo.strength,
    strengthScore: strengthInfo.score,
    strengthReason: strengthInfo.reason,
    xiYongShen,
    yongShen,
    jiShen,
    wuxingDesc,
    mingGua,
  }
}

/**
 * 生成五行分布描述
 */
function generateWuXingDesc(count, dayElement) {
  const items = []
  const total = Object.values(count).reduce((a, b) => a + b, 0)
  
  WU_XING.forEach(wx => {
    const val = count[wx]
    const percent = Math.round((val / total) * 100)
    const marker = wx === dayElement ? ' ★' : ''
    items.push(`${wx}: ${val}(${percent}%)${marker}`)
  })
  
  return items.join(' | ')
}

/**
 * 从八字日柱推导命卦（简化版）
 * 使用子平命理：生日天干+出生季节
 */
function deriveMingGuaFromBaZi(dayMaster, dayPillar) {
  // 简化命卦计算：基于八宅派公式
  // 这里用八字日柱结合年份计算
  // 实际上命卦应该用年份计算，但可以从八字获得补充信息
  
  const dayElement = WU_XING_MAP[dayMaster]
  const monthZhi = dayPillar.charAt(1) // 应该是月柱的地支，这里简化
  
  // 返回八字信息供后续命卦计算使用
  return {
    dayMaster,
    dayElement,
    monthZhi,
    note: '命卦建议结合年份+性别计算',
  }
}

/**
 * 五行颜色映射
 */
export const WU_XING_COLORS = {
  '木': '#2ecc71',
  '火': '#e74c3c',
  '土': '#d4a574',
  '金': '#f0c866',
  '水': '#3498db',
}

/**
 * 获取五行相生相克描述
 */
export function getWuXingRelation(e1, e2) {
  if (WU_XING_SHENG[e1] === e2) return '相生'
  if (WU_XING_KE[e1] === e2) return '相克'
  if (WU_XING_SHENG[e2] === e1) return '被生'
  if (WU_XING_KE[e2] === e1) return '被克'
  return '同性'
}

export { WU_XING_MAP, ZHI_CANG_GAN, WU_XING_SHENG, WU_XING_KE, WU_XING }
