/**
 * 好宅助手 - 玄空飞星排盘引擎 V2.0
 * 
 * 算法来源：沈氏玄空学 + 堪舆学知识库Week3/Week11
 * 
 * V2.0升级：
 * 1. 宅运盘（natal）用建造年份确定元运，不再用当前年份
 * 2. 流年飞星叠加在宅运盘上，显示动态吉凶
 * 3. 新增反吟伏吟检测
 * 4. 新增三星组合分析（运星+山星+向星）
 * 
 * 核心逻辑：
 * 1. 根据建造年份确定元运（非当前年份）
 * 2. 根据坐向24山排山星盘和向星盘
 * 3. 山星/向星按"阳顺阴逆"原则飞布
 * 4. 判断四大格局（旺山旺向/双星会坐/双星会向/上山下水）
 * 5. 各宫位组合吉凶分析
 * 6. 叠加流年飞星，分析当年吉凶方位
 */

// ===== 九宫洛书飞布路径 =====
// 洛书轨迹：中→乾(西北)→兑(西)→艮(东北)→离(南)→坎(北)→坤(西南)→震(东)→巽(东南)
const LUOSHU_PATH = ['中', '乾', '兑', '艮', '离', '坎', '坤', '震', '巽']

// 宫位→方位映射
const PALACE_POSITION = {
  '中': '中宫',
  '乾': '西北', '兑': '西', '艮': '东北', '离': '南',
  '坎': '北', '坤': '西南', '震': '东', '巽': '东南',
}

// 方位→宫位映射
const POSITION_PALACE = {
  '北': '坎', '东北': '艮', '东': '震', '东南': '巽',
  '南': '离', '西南': '坤', '西': '兑', '西北': '乾',
}

// 宫位→洛书数
const PALACE_NUMBER = {
  '坎': 1, '坤': 2, '震': 3, '巽': 4, '中': 5,
  '乾': 6, '兑': 7, '艮': 8, '离': 9,
}

// 洛书数→宫位
const NUMBER_PALACE = {
  1: '坎', 2: '坤', 3: '震', 4: '巽', 5: '中',
  6: '乾', 7: '兑', 8: '艮', 9: '离',
}

// 宫位→五行
const PALACE_ELEMENT = {
  '坎': '水', '坤': '土', '震': '木', '巽': '木', '中': '土',
  '乾': '金', '兑': '金', '艮': '土', '离': '火',
}

// ===== 九星属性 =====
export const NINE_STARS = {
  1: { name: '一白贪狼', element: '水', nature: '吉', desc: '事业·文昌·桃花', keyword: '事业运' },
  2: { name: '二黑巨门', element: '土', nature: '凶', desc: '病符·阴煞·脾胃', keyword: '病符' },
  3: { name: '三碧禄存', element: '木', nature: '凶', desc: '官非·口舌·争斗', keyword: '是非' },
  4: { name: '四绿文曲', element: '木', nature: '吉', desc: '文昌·学业·声誉', keyword: '文昌' },
  5: { name: '五黄廉贞', element: '土', nature: '大凶', desc: '灾煞·意外·血光', keyword: '灾煞' },
  6: { name: '六白武曲', element: '金', nature: '吉', desc: '偏财·权柄·名望', keyword: '偏财' },
  7: { name: '七赤破军', element: '金', nature: '凶', desc: '盗损·口舌·手术', keyword: '损耗' },
  8: { name: '八白左辅', element: '土', nature: '吉', desc: '正财·置产·喜庆', keyword: '正财' },
  9: { name: '九紫右弼', element: '火', nature: '吉', desc: '姻缘·喜庆·荣誉', keyword: '喜庆' },
}

// ===== 24山系统 =====

// 每个宫位包含3个山，分别属于地元龙、天元龙、人元龙
const PALACE_MOUNTAINS = {
  '坎': ['壬', '子', '癸'],  // 地/天/人
  '坤': ['未', '坤', '申'],
  '震': ['甲', '卯', '乙'],
  '巽': ['辰', '巽', '巳'],
  '乾': ['戌', '乾', '亥'],
  '兑': ['庚', '酉', '辛'],
  '艮': ['丑', '艮', '寅'],
  '离': ['丙', '午', '丁'],
}

// 山→所在宫位
const MOUNTAIN_PALACE = {}
Object.entries(PALACE_MOUNTAINS).forEach(([palace, mountains]) => {
  mountains.forEach(m => { MOUNTAIN_PALACE[m] = palace })
})

// 山→元龙类型: 0=地元龙, 1=天元龙, 2=人元龙
const MOUNTAIN_YUANLONG = {}
Object.entries(PALACE_MOUNTAINS).forEach(([palace, mountains]) => {
  mountains.forEach((m, idx) => { MOUNTAIN_YUANLONG[m] = idx })
})

// 元龙阴阳属性
// 天元龙: 乾坤艮巽=阳, 子午卯酉=阴
// 地元龙: 甲庚丙壬=阳, 辰戌丑未=阴
// 人元龙: 寅申巳亥=阳, 乙辛丁癸=阴
const YANG_MOUNTAINS = ['乾', '坤', '艮', '巽', '甲', '庚', '丙', '壬', '寅', '申', '巳', '亥']
const YIN_MOUNTAINS = ['子', '午', '卯', '酉', '辰', '戌', '丑', '未', '乙', '辛', '丁', '癸']

// 24山角度范围（每个山15°）
const MOUNTAIN_24_DATA = [
  { name: '壬', startAngle: 337.5, endAngle: 352.5 },
  { name: '子', startAngle: 352.5, endAngle: 7.5 },
  { name: '癸', startAngle: 7.5, endAngle: 22.5 },
  { name: '丑', startAngle: 22.5, endAngle: 37.5 },
  { name: '艮', startAngle: 37.5, endAngle: 52.5 },
  { name: '寅', startAngle: 52.5, endAngle: 67.5 },
  { name: '甲', startAngle: 67.5, endAngle: 82.5 },
  { name: '卯', startAngle: 82.5, endAngle: 97.5 },
  { name: '乙', startAngle: 97.5, endAngle: 112.5 },
  { name: '辰', startAngle: 112.5, endAngle: 127.5 },
  { name: '巽', startAngle: 127.5, endAngle: 142.5 },
  { name: '巳', startAngle: 142.5, endAngle: 157.5 },
  { name: '丙', startAngle: 157.5, endAngle: 172.5 },
  { name: '午', startAngle: 172.5, endAngle: 187.5 },
  { name: '丁', startAngle: 187.5, endAngle: 202.5 },
  { name: '未', startAngle: 202.5, endAngle: 217.5 },
  { name: '坤', startAngle: 217.5, endAngle: 232.5 },
  { name: '申', startAngle: 232.5, endAngle: 247.5 },
  { name: '庚', startAngle: 247.5, endAngle: 262.5 },
  { name: '酉', startAngle: 262.5, endAngle: 277.5 },
  { name: '辛', startAngle: 277.5, endAngle: 292.5 },
  { name: '戌', startAngle: 292.5, endAngle: 307.5 },
  { name: '乾', startAngle: 307.5, endAngle: 322.5 },
  { name: '亥', startAngle: 322.5, endAngle: 337.5 },
]

// ===== 元运系统 =====

/**
 * 根据年份确定元运
 * @param {number} year
 * @returns {number} 运数 1-9
 */
export function getPeriod(year) {
  if (year >= 1864 && year <= 1883) return 1
  if (year >= 1884 && year <= 1903) return 2
  if (year >= 1904 && year <= 1923) return 3
  if (year >= 1924 && year <= 1943) return 4
  if (year >= 1944 && year <= 1963) return 5
  if (year >= 1964 && year <= 1983) return 6
  if (year >= 1984 && year <= 2003) return 7
  if (year >= 2004 && year <= 2023) return 8
  if (year >= 2024 && year <= 2043) return 9
  // 超出范围默认九运
  return 9
}

// ===== 核心排盘算法 =====

/**
 * 根据角度确定24山
 * @param {number} angle - 真北角度
 * @returns {{ name: string, palace: string, yuanLong: number, isYang: boolean }}
 */
export function angleToMountain24(angle) {
  let a = ((angle % 360) + 360) % 360

  for (const m of MOUNTAIN_24_DATA) {
    let inRange = false
    if (m.startAngle < m.endAngle) {
      inRange = a >= m.startAngle && a < m.endAngle
    } else {
      // 跨0度的情况（如子山352.5-7.5）
      inRange = a >= m.startAngle || a < m.endAngle
    }
    if (inRange) {
      return {
        name: m.name,
        palace: MOUNTAIN_PALACE[m.name],
        yuanLong: MOUNTAIN_YUANLONG[m.name],
        isYang: YANG_MOUNTAINS.includes(m.name),
      }
    }
  }

  // 默认返回子山
  return { name: '子', palace: '坎', yuanLong: 1, isYang: false }
}

/**
 * 运星飞布（所有运星顺飞入九宫）
 * @param {number} period - 元运数 1-9
 * @returns {Object} { 宫位名: 运星数 }
 */
function flyPeriodStars(period) {
  const result = {}
  // 运星入中宫
  result['中'] = period

  // 按洛书路径顺飞
  for (let i = 1; i < LUOSHU_PATH.length; i++) {
    const star = ((period - 1 + i) % 9) + 1
    result[LUOSHU_PATH[i]] = star
  }

  return result
}

/**
 * 山星/向星飞布
 * @param {number} centerStar - 入中宫的星数
 * @param {boolean} isYang - 阳=顺飞, 阴=逆飞
 * @returns {Object} { 宫位名: 星数 }
 */
function flyStars(centerStar, isYang) {
  const result = {}
  result['中'] = centerStar

  for (let i = 1; i < LUOSHU_PATH.length; i++) {
    let star
    if (isYang) {
      // 顺飞：递增
      star = ((centerStar - 1 + i) % 9) + 1
    } else {
      // 逆飞：递减
      star = ((centerStar - 1 - i) % 9 + 9) % 9 + 1
    }
    result[LUOSHU_PATH[i]] = star
  }

  return result
}

/**
 * 判断星数在某元龙下的阴阳
 * @param {number} starNum - 星数 1-9
 * @param {number} yuanLong - 元龙类型 0=地/1=天/2=人
 * @returns {boolean} true=阳(顺飞), false=阴(逆飞)
 */
function isMountainYang(starNum, yuanLong) {
  // 特殊处理5黄：5黄无对应山，按坐山/朝山自身元龙决定
  // 5黄在中宫，取同一元龙下中宫对应的"山"
  // 中宫无山，故5黄的阴阳沿用原始坐/朝山的元龙阴阳
  // 天元龙中宫→阴，地元龙中宫→阴，人元龙中宫→阴
  // 简化处理：5黄一律按阴处理（最保守）
  if (starNum === 5) return false

  const palace = NUMBER_PALACE[starNum]
  const mountains = PALACE_MOUNTAINS[palace]
  const mountain = mountains[yuanLong]
  return YANG_MOUNTAINS.includes(mountain)
}

/**
 * 玄空飞星排盘 - 核心函数 V2.0
 * @param {number} facingAngle - 朝向角度（真北）
 * @param {number} buildYear - 建造年份（用于确定元运，非当前年份）
 * @param {number} currentYear - 当前年份（用于流年飞星叠加，默认取当年）
 * @returns {Object} 飞星排盘结果（含宅运盘+流年叠加）
 */
export function feiXingPan(facingAngle, buildYear, currentYear = new Date().getFullYear()) {
  // Step 1: 确定元运（用建造年份，不是当前年份！）
  const period = getPeriod(buildYear)

  // Step 2: 确定坐向24山
  const facingMountain = angleToMountain24(facingAngle)
  // 坐山 = 朝向的对宫
  const sittingAngle = (facingAngle + 180) % 360
  const sittingMountain = angleToMountain24(sittingAngle)

  // Step 3: 排运星盘
  const yunXingPan = flyPeriodStars(period)

  // Step 4: 确定山星和向星入中宫的星数
  const shanXingCenter = yunXingPan[sittingMountain.palace]
  const xiangXingCenter = yunXingPan[facingMountain.palace]

  // Step 5: 确定山星和向星的顺逆
  // 山星顺逆：看坐山所在元龙，运星对应宫位中同一元龙的山之阴阳
  const shanIsYang = isMountainYang(shanXingCenter, sittingMountain.yuanLong)
  // 向星顺逆：看朝山所在元龙
  const xiangIsYang = isMountainYang(xiangXingCenter, facingMountain.yuanLong)

  // Step 6: 排山星盘和向星盘
  const shanXingPan = flyStars(shanXingCenter, shanIsYang)
  const xiangXingPan = flyStars(xiangXingCenter, xiangIsYang)

  // Step 7: 组合九宫数据
  const palaces = LUOSHU_PATH.map((palace, idx) => {
    const yunStar = yunXingPan[palace]
    const shanStar = shanXingPan[palace]
    const xiangStar = xiangXingPan[palace]
    const position = PALACE_POSITION[palace]

    // 判断该宫位的组合吉凶
    const analysis = analyzePalace(shanStar, xiangStar, yunStar, period, palace)

    return {
      palace,        // 宫位名：坎/坤/震/巽/中/乾/兑/艮/离
      position,      // 方位：北/西南/东/东南/中宫/西北/西/东北/南
      yunStar,       // 运星
      shanStar,      // 山星
      xiangStar,     // 向星
      ...analysis,
    }
  })

  // Step 8: 判断四大格局
  const pattern = judgePattern(shanXingCenter, xiangXingCenter, sittingMountain.palace, facingMountain.palace, period)

  // Step 9: 当运旺衰分析
  const prosperity = analyzeProsperity(palaces, period)

  // Step 10: 流年飞星叠加（V2.0新增）
  const annualPeriod = getPeriod(currentYear)
  const annualCenterStar = calcAnnualStar(currentYear)
  const annualStars = flyAnnualStars(annualCenterStar)
  
  // 叠加流年飞星到各宫位
  const palacesWithAnnual = palaces.map(p => {
    if (p.palace === '中') return { ...p, annualStar: annualStars['中'] }
    const annualStarNum = annualStars[p.palace]
    const annualInfo = NINE_STARS[annualStarNum]
    
    // 三星组合分析（运星+山星+向星+流年星）
    const threeStarAnalysis = analyzeThreeStarCombo(p.yunStar, p.shanStar, p.xiangStar, annualStarNum, period)
    
    // 综合吉凶：宅运盘70% + 流年30%
    const annualInfluence = annualInfo.nature === '吉' ? 5 : annualInfo.nature === '大凶' ? -8 : annualInfo.nature === '凶' ? -4 : 2
    const adjustedScore = Math.max(5, Math.min(98, p.comboScore + annualInfluence))
    
    return {
      ...p,
      annualStar: annualStarNum,
      annualInfo,
      adjustedScore,
      threeStarAnalysis,
    }
  })

  // Step 11: 反吟伏吟检测（V2.0新增）
  const fanYinFuYin = detectFanYinFuYin(palaces, yunXingPan, shanXingPan, xiangXingPan)

  return {
    period,
    periodLabel: `${period}运（${getPeriodRange(period)}）`,
    buildYear,
    currentYear,
    annualPeriod,
    facingMountain,
    sittingMountain,
    facingLabel: `${sittingMountain.name}山${facingMountain.name}向`,
    yunXingPan,
    shanXingPan,
    xiangXingPan,
    palaces: palacesWithAnnual,
    pattern,
    prosperity,
    annualStars,
    annualCenterStar,
    fanYinFuYin,
    summary: generateFeiXingSummary(palacesWithAnnual, pattern, period),
  }
}

/**
 * 获取元运年份范围
 */
function getPeriodRange(period) {
  const ranges = {
    1: '1864-1883', 2: '1884-1903', 3: '1904-1923',
    4: '1924-1943', 5: '1944-1963', 6: '1964-1983',
    7: '1984-2003', 8: '2004-2023', 9: '2024-2043',
  }
  return ranges[period] || '2024-2043'
}

/**
 * 分析单个宫位组合吉凶
 */
function analyzePalace(shanStar, xiangStar, yunStar, period, palace) {
  const shanInfo = NINE_STARS[shanStar]
  const xiangInfo = NINE_STARS[xiangStar]
  const yunInfo = NINE_STARS[yunStar]

  // 五行生克分析（山星与向星的组合）
  const shanElement = shanInfo.element
  const xiangElement = xiangInfo.element
  const relation = getWuXingRelation(shanElement, xiangElement)

  // 判断组合吉凶
  let comboNature = '平'
  let comboDesc = ''
  let comboScore = 50

  // 当运旺星加分
  const isShanWang = shanStar === period
  const isXiangWang = xiangStar === period
  const isShanSheng = isShengQiStar(shanStar, period)
  const isXiangSheng = isShengQiStar(xiangStar, period)

  // 基础吉凶判断（V2.5.3：拉大分差，提高区分度）
  if (shanInfo.nature === '吉' && xiangInfo.nature === '吉') {
    comboNature = '吉'
    comboScore = 85
    comboDesc = '双吉组合，大吉之位'
  } else if (shanInfo.nature === '大凶' || xiangInfo.nature === '大凶') {
    comboNature = '大凶'
    comboScore = 10
    comboDesc = '含凶星组合，需重点化解'
  } else if (shanInfo.nature === '凶' && xiangInfo.nature === '凶') {
    comboNature = '凶'
    comboScore = 15
    comboDesc = '双凶组合，大凶之位'
  } else if (shanInfo.nature === '吉' || xiangInfo.nature === '吉') {
    comboNature = '小吉'
    comboScore = 55
    comboDesc = '一吉一凶，吉凶参半'
  } else {
    comboNature = '平'
    comboScore = 40
    comboDesc = '吉凶不明显'
  }

  // 旺星加成
  if (isShanWang && isXiangWang) {
    comboScore = Math.min(95, comboScore + 25)
    comboDesc = '双星当旺，大吉大利'
    comboNature = '大吉'
  } else if (isShanWang) {
    comboScore = Math.min(90, comboScore + 15)
    comboDesc += '，山星当旺旺丁'
  } else if (isXiangWang) {
    comboScore = Math.min(90, comboScore + 15)
    comboDesc += '，向星当旺旺财'
  }

  // 生气星（当运下一运）加成
  if (isShanSheng) comboScore = Math.min(85, comboScore + 8)
  if (isXiangSheng) comboScore = Math.min(85, comboScore + 8)

  // 五行生克调整
  if (relation === '生我') comboScore = Math.min(90, comboScore + 5)
  else if (relation === '克我') comboScore = Math.max(10, comboScore - 8)
  else if (relation === '我克') comboScore = Math.max(10, comboScore - 3)

  // 特殊组合：凶星叠加
  if (shanStar === 5 && xiangStar === 2) {
    comboNature = '大凶'
    comboScore = 10
    comboDesc = '二五交加，损主伤丁'
  } else if (shanStar === 2 && xiangStar === 5) {
    comboNature = '大凶'
    comboScore = 12
    comboDesc = '五二组合，疾病缠身'
  } else if (shanStar === 3 && xiangStar === 7) {
    comboScore = Math.max(15, comboScore - 10)
    comboDesc += '，三七组合防盗贼'
  } else if (shanStar === 7 && xiangStar === 3) {
    comboScore = Math.max(15, comboScore - 10)
    comboDesc += '，七三组合防口舌'
  } else if (shanStar === 6 && xiangStar === 8) {
    comboScore = Math.min(88, comboScore + 5)
    comboDesc += '，六八组合旺偏财'
  } else if (shanStar === 8 && xiangStar === 6) {
    comboScore = Math.min(88, comboScore + 5)
    comboDesc += '，八六组合利武贵'
  } else if (shanStar === 1 && xiangStar === 6) {
    comboScore = Math.min(85, comboScore + 5)
    comboDesc += '，一六组合催官贵'
  } else if (shanStar === 1 && xiangStar === 4) {
    comboScore = Math.min(85, comboScore + 5)
    comboDesc += '，一四组合利文昌'
  }

  // 宫位五行与星五行的关系
  const palaceElement = PALACE_ELEMENT[palace]
  const shanPalaceRelation = getWuXingRelation(shanElement, palaceElement)
  const xiangPalaceRelation = getWuXingRelation(xiangElement, palaceElement)

  // 星受宫克则减分
  if (shanPalaceRelation === '克我') comboScore = Math.max(10, comboScore - 3)
  if (xiangPalaceRelation === '克我') comboScore = Math.max(10, comboScore - 3)

  return {
    shanInfo,
    xiangInfo,
    yunInfo,
    comboNature,
    comboScore: Math.round(comboScore),
    comboDesc,
    wuxingRelation: relation,
    isShanWang,
    isXiangWang,
    shanPalaceRelation,
    xiangPalaceRelation,
  }
}

/**
 * 判断是否为生气星（当运的下一运）
 */
function isShengQiStar(star, period) {
  const nextPeriod = (period % 9) + 1
  return star === nextPeriod
}

/**
 * 五行生克关系
 */
function getWuXingRelation(me, other) {
  if (me === other) return '比和'
  const sheng = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' }
  const ke = { '木': '土', '火': '金', '土': '水', '金': '木', '水': '火' }
  if (sheng[me] === other) return '我生'
  if (sheng[other] === me) return '生我'
  if (ke[me] === other) return '我克'
  if (ke[other] === me) return '克我'
  return '比和'
}

/**
 * 判断四大格局
 * 旺山旺向：山星和向星分别当旺于坐方和朝方
 * 双星会坐：山星和向星同到坐方
 * 双星会向：山星和向星同到朝方
 * 上山下水：山星到朝方，向星到坐方（大凶）
 */
function judgePattern(shanXingCenter, xiangXingCenter, sittingPalace, facingPalace, period) {
  // 检查山星和向星在坐方和朝方的情况
  // 注意：这里直接用入中宫的星来判断格局
  // 山星=入中宫数，坐方=坐山宫位
  // 旺山旺向：山星=当运数在坐方宫位，向星=当运数在朝方宫位
  // 但实际上，格局判断是看山星和向星各自飞到了哪里

  // 重新计算：山星飞布后，山星在坐方宫位的数是什么
  // 向星飞布后，向星在朝方宫位的数是什么
  // 旺山旺向：山星当旺(=period)飞到坐方，向星当旺(=period)飞到朝方

  // 山星盘
  const shanIsYang = isMountainYang(shanXingCenter, 1) // 简化，用天元龙
  const shanPan = flyStars(shanXingCenter, shanIsYang)
  const xiangIsYang = isMountainYang(xiangXingCenter, 1)
  const xiangPan = flyStars(xiangXingCenter, xiangIsYang)

  // 坐方宫位的山星数
  const shanAtSitting = shanPan[sittingPalace]
  // 朝方宫位的向星数
  const xiangAtFacing = xiangPan[facingPalace]
  // 坐方宫位的向星数
  const xiangAtSitting = xiangPan[sittingPalace]
  // 朝方宫位的山星数
  const shanAtFacing = shanPan[facingPalace]

  let patternType = ''
  let patternDesc = ''
  let patternScore = 40

  if (shanAtSitting === period && xiangAtFacing === period) {
    patternType = '旺山旺向'
    patternDesc = '丁财两旺，大吉格局。山星旺丁到坐方，向星旺财到朝方。'
    patternScore = 95
  } else if (shanAtSitting === period && xiangAtSitting === period) {
    patternType = '双星会坐'
    patternDesc = '旺丁不旺财。山星向星同到坐方，人丁旺但财运弱。'
    patternScore = 72
  } else if (shanAtFacing === period && xiangAtFacing === period) {
    patternType = '双星会向'
    patternDesc = '旺财不旺丁。山星向星同到朝方，财运旺但人丁弱。'
    patternScore = 72
  } else if (shanAtFacing === period && xiangAtSitting === period) {
    // 这种情况实际不会出现（山星和向星不可能同时在对方宫位当旺）
    // 真正的上山下水是：山星跑到朝方（水方），向星跑到坐方（山方）
    patternType = '上山下水'
    patternDesc = '损财伤丁，大凶格局。山星到向（落水），向星到坐（上山）。'
    patternScore = 15
  } else {
    // 更通用的上山下水判断
    // 山星飞到朝方宫位 = 山星上山（本该在坐方却到了朝方）→ 实际是"下水"
    // 向星飞到坐方宫位 = 向星下水（本该在朝方却到了坐方）→ 实际是"上山"
    const shanGoesToFacing = shanPan[facingPalace]
    const xiangGoesToSitting = xiangPan[sittingPalace]

    // 简化判断：如果山星不在坐方当旺，且向星不在朝方当旺
    if (shanAtSitting !== period && xiangAtFacing !== period) {
      patternType = '衰败格局'
      patternDesc = '山星向星均不当旺，需靠化解布局调整。'
      patternScore = 35
    } else if (shanAtSitting === period) {
      patternType = '旺山衰向'
      patternDesc = '旺丁不旺财。山星当旺在坐方，但向星未旺。'
      patternScore = 62
    } else {
      patternType = '衰山旺向'
      patternDesc = '旺财不旺丁。向星当旺在朝方，但山星未旺。'
      patternScore = 62
    }
  }

  return {
    type: patternType,
    desc: patternDesc,
    score: patternScore,
    shanAtSitting,
    xiangAtFacing,
  }
}

/**
 * 当运旺衰分析
 */
function analyzeProsperity(palaces, period) {
  const wangPalaces = []   // 旺位
  const shengPalaces = []  // 生气位
  const shuaiPalaces = []  // 衰位
  const siPalaces = []     // 死位
  const shaPalaces = []    // 煞位

  // 当运旺星
  const wangStar = period
  // 生气星（下一运）
  const shengStar = (period % 9) + 1
  // 退气星（上一运）
  const shuaiStar = ((period - 2 + 9) % 9) + 1
  // 死气星（上上运）
  const siStar1 = ((period - 3 + 9) % 9) + 1
  const siStar2 = ((period - 4 + 9) % 9) + 1
  // 煞星（克当运五行之星）

  palaces.forEach(p => {
    if (p.palace === '中') return

    const position = p.position

    if (p.shanStar === wangStar || p.xiangStar === wangStar) {
      wangPalaces.push(position)
    }
    if (p.shanStar === shengStar || p.xiangStar === shengStar) {
      shengPalaces.push(position)
    }
  })

  return {
    wangStar,
    shengStar,
    wangPalaces,
    shengPalaces,
    summary: `当运${wangStar}紫星旺于${wangPalaces.join('、') || '无'}，生气${shengStar}紫星旺于${shengPalaces.join('、') || '无'}`,
  }
}

/**
 * 生成飞星总结文案
 */
function generateFeiXingSummary(palaces, pattern, period) {
  let text = `当前为${period}运，`
  text += `格局：${pattern.type}。`
  text += pattern.desc

  // 吉位推荐
  const jiPalaces = palaces.filter(p => p.palace !== '中' && p.comboScore >= 70)
  const xiongPalaces = palaces.filter(p => p.palace !== '中' && p.comboScore <= 35)

  if (jiPalaces.length > 0) {
    text += `吉位推荐：${jiPalaces.map(p => `${p.position}（${p.shanStar}${p.xiangStar}组合）`).join('、')}。`
  }
  if (xiongPalaces.length > 0) {
    text += `需化解：${xiongPalaces.map(p => `${p.position}（${p.shanStar}${p.xiangStar}组合）`).join('、')}。`
  }

  return text
}

/**
 * 流年飞星排盘
 * @param {number} year - 年份
 * @param {'male'|'female'} gender - 性别
 * @returns {Object} 流年飞星盘
 */
export function liuNianFeiXing(year, gender = 'male') {
  // 确定三元
  let yuanStart
  if (year >= 1864 && year <= 1923) yuanStart = 1      // 上元
  else if (year >= 1924 && year <= 1983) yuanStart = 4  // 中元
  else if (year >= 1984 && year <= 2043) yuanStart = 7  // 下元
  else yuanStart = 7

  // 计算年支序数
  const yearGanZhiOffset = (year - 4) % 60  // 甲子年=0
  const yearZhi = (yearGanZhiOffset % 12)    // 子=0

  // 确定入中星
  let centerStar
  if (gender === 'male') {
    centerStar = ((yuanStart - 1 + yearZhi) % 9) + 1
  } else {
    // 女命：上元起5，中元起2，下元起8（逆推）
    const femaleStart = yuanStart === 1 ? 5 : yuanStart === 4 ? 2 : 8
    centerStar = ((femaleStart - 1 - yearZhi) % 9 + 9) % 9 + 1
  }

  // 飞布九宫
  const pan = flyStars(centerStar, true) // 流年飞星一律顺飞

  const result = LUOSHU_PATH.map(palace => {
    const star = pan[palace]
    const info = NINE_STARS[star]
    return {
      palace,
      position: PALACE_POSITION[palace],
      star,
      ...info,
    }
  })

  return {
    year,
    gender,
    centerStar,
    centerStarName: NINE_STARS[centerStar].name,
    palaces: result,
    summary: `${year}年${gender === 'male' ? '男' : '女'}命，${NINE_STARS[centerStar].name}入中宫`,
  }
}

// ===== V2.0 新增函数 =====

/**
 * 计算流年飞星入中宫的数字
 * 公式：男命（上元甲子年起1，中元甲子年起4，下元甲子年起7，逐年递减）
 * @param {number} year - 年份
 * @returns {number} 入中宫的星数
 */
export function calcAnnualStar(year) {
  // 确定三元
  let yuanStart
  if (year >= 1864 && year <= 1923) yuanStart = 1      // 上元
  else if (year >= 1924 && year <= 1983) yuanStart = 4  // 中元
  else if (year >= 1984 && year <= 2043) yuanStart = 7  // 下元
  else yuanStart = 7

  // 计算年支序数（子=0）
  const yearGanZhiOffset = (year - 4) % 60
  const yearZhi = yearGanZhiOffset % 12

  // 男命公式：上元从1开始递减
  return ((yuanStart - 1 - yearZhi) % 9 + 9) % 9 + 1
}

/**
 * 流年飞星飞布九宫（顺飞）
 * @param {number} centerStar - 入中宫的星数
 * @returns {Object} { 宫位名: 星数 }
 */
export function flyAnnualStars(centerStar) {
  const result = {}
  result['中'] = centerStar
  
  for (let i = 1; i < LUOSHU_PATH.length; i++) {
    const star = ((centerStar - 1 + i) % 9) + 1
    result[LUOSHU_PATH[i]] = star
  }
  
  return result
}

/**
 * 三星组合分析（运星+山星+向星+流年星）
 * @param {number} yunStar - 运星
 * @param {number} shanStar - 山星
 * @param {number} xiangStar - 向星
 * @param {number} annualStar - 流年星
 * @param {number} period - 元运
 * @returns {Object} 组合分析结果
 */
export function analyzeThreeStarCombo(yunStar, shanStar, xiangStar, annualStar, period) {
  const combos = []
  
  // 检查运星+山星+流年组合
  if (yunStar === period && shanStar === period && annualStar === period) {
    combos.push({ type: '三吉会聚', level: '大吉', desc: '运星、山星、流年星同时当旺，大吉之象' })
  }
  
  // 检查双星会聚
  if (shanStar === period && annualStar === period) {
    combos.push({ type: '山星流年双旺', level: '吉', desc: '山星与流年星同时当旺，旺丁' })
  }
  if (xiangStar === period && annualStar === period) {
    combos.push({ type: '向星流年双旺', level: '吉', desc: '向星与流年星同时当旺，旺财' })
  }
  
  // 检查凶星叠加
  if ((shanStar === 5 || shanStar === 2) && (xiangStar === 5 || xiangStar === 2) && annualStar === 5) {
    combos.push({ type: '凶星汇聚', level: '大凶', desc: '二五黄汇聚，灾病之象，须化解' })
  }
  
  if (combos.length === 0) {
    return { level: '平', desc: '无明显特殊组合' }
  }
  
  // 取最高级别
  const bestCombo = combos.reduce((best, c) => {
    const levels = { '大吉': 4, '吉': 3, '平': 2, '凶': 1, '大凶': 0 }
    return (levels[c.level] || 2) > (levels[best.level] || 2) ? c : best
  }, combos[0])
  
  return bestCombo
}

/**
 * 反吟伏吟检测
 * 伏吟：飞星与运星数字相同（不动）
 * 反吟：飞星与运星数字相加为10（对冲）
 * @param {Array} palaces - 宫位数组
 * @param {Object} yunXingPan - 运星盘
 * @param {Object} shanXingPan - 山星盘
 * @param {Object} xiangXingPan - 向星盘
 * @returns {Object} 反吟伏吟检测结果
 */
export function detectFanYinFuYin(palaces, yunXingPan, shanXingPan, xiangXingPan) {
  const results = {
    shanFanYin: [],    // 山星反吟
    shanFuYin: [],     // 山星伏吟
    xiangFanYin: [],   // 向星反吟
    xiangFuYin: [],    // 向星伏吟
    warnings: [],
  }
  
  palaces.forEach(p => {
    if (p.palace === '中') return
    
    const yunStar = yunXingPan[p.palace]
    const shanStar = shanXingPan[p.palace]
    const xiangStar = xiangXingPan[p.palace]
    
    // 山星检测
    if (shanStar === yunStar) {
      results.shanFuYin.push(p.position)
      results.warnings.push(`${p.position}方山星伏吟（${shanStar}=${yunStar}），气滞不动，宜静不宜动`)
    }
    if (shanStar + yunStar === 10 && shanStar !== yunStar) {
      results.shanFanYin.push(p.position)
      results.warnings.push(`${p.position}方山星反吟（${shanStar}+${yunStar}=10），动荡不安，须谨慎`)
    }
    
    // 向星检测
    if (xiangStar === yunStar) {
      results.xiangFuYin.push(p.position)
      results.warnings.push(`${p.position}方向星伏吟（${xiangStar}=${yunStar}），财气停滞`)
    }
    if (xiangStar + yunStar === 10 && xiangStar !== yunStar) {
      results.xiangFanYin.push(p.position)
      results.warnings.push(`${p.position}方向星反吟（${xiangStar}+${yunStar}=10），财运动荡`)
    }
  })
  
  // 判断全局反吟伏吟
  results.isGlobalFanYin = results.shanFanYin.length >= 6 || results.xiangFanYin.length >= 6
  results.isGlobalFuYin = results.shanFuYin.length >= 6 || results.xiangFuYin.length >= 6
  
  if (results.isGlobalFanYin) {
    results.warnings.unshift('【全局反吟】整盘反吟，大凶之象，宜保守不宜冒进')
  }
  if (results.isGlobalFuYin) {
    results.warnings.unshift('【全局伏吟】整盘伏吟，气机停滞，发展受限')
  }
  
  return results
}
