/**
 * 好宅助手 - 八宅排盘引擎
 * 
 * 基于房屋坐向（24山）和户主命卦，计算八宫方位吉凶
 * 算法来源：八宅明镜 + Week11课程内容
 * 
 * 核心逻辑：
 * 1. 坐向→宅卦（8种）
 * 2. 宅卦→游星分布（大游年法）
 * 3. 游星→吉凶属性
 * 4. 命卦×宅卦→人宅匹配
 */

// 24山方位数据
export const MOUNTAINS_24 = [
  { name: '壬', angle: 337.5, trigram: '坎', position: '北' },
  { name: '子', angle: 352.5, trigram: '坎', position: '北' },
  { name: '癸', angle: 7.5, trigram: '坎', position: '北' },
  { name: '丑', angle: 22.5, trigram: '艮', position: '东北' },
  { name: '寅', angle: 37.5, trigram: '艮', position: '东北' },
  { name: '甲', angle: 52.5, trigram: '震', position: '东' },
  { name: '卯', angle: 67.5, trigram: '震', position: '东' },
  { name: '乙', angle: 82.5, trigram: '震', position: '东' },
  { name: '辰', angle: 97.5, trigram: '巽', position: '东南' },
  { name: '巳', angle: 112.5, trigram: '巽', position: '东南' },
  { name: '丙', angle: 127.5, trigram: '离', position: '南' },
  { name: '午', angle: 142.5, trigram: '离', position: '南' },
  { name: '丁', angle: 157.5, trigram: '离', position: '南' },
  { name: '未', angle: 172.5, trigram: '坤', position: '西南' },
  { name: '申', angle: 187.5, trigram: '坤', position: '西南' },
  { name: '庚', angle: 202.5, trigram: '兑', position: '西' },
  { name: '酉', angle: 217.5, trigram: '兑', position: '西' },
  { name: '辛', angle: 232.5, trigram: '兑', position: '西' },
  { name: '戌', angle: 247.5, trigram: '乾', position: '西北' },
  { name: '亥', angle: 262.5, trigram: '乾', position: '西北' },
  { name: '乾', angle: 292.5, trigram: '乾', position: '西北' }, // 注意：乾坤等本身也是山
  { name: '坤', angle: 217.5, trigram: '坤', position: '西南' },
  { name: '艮', angle: 37.5, trigram: '艮', position: '东北' },
  { name: '巽', angle: 127.5, trigram: '巽', position: '东南' },
]

// 八个方位（九宫格对应）
const EIGHT_PALACES = ['北', '西南', '东', '东南', '西北', '西', '东北', '南']

// 方位→八卦映射
const POSITION_TRIGRAM = {
  '北': '坎', '东北': '艮', '东': '震', '东南': '巽',
  '南': '离', '西南': '坤', '西': '兑', '西北': '乾',
}

// 游星定义及吉凶
const YOU_XING = {
  '伏位': { nature: '吉', element: '辅弼', score: 7, desc: '安稳平和，宜做卧室' },
  '天医': { nature: '吉', element: '巨门', score: 9, desc: '治病延年，宜做卧室、厨房' },
  '生气': { nature: '吉', element: '贪狼', score: 10, desc: '旺丁旺财，宜做大门、卧室、书房' },
  '延年': { nature: '吉', element: '武曲', score: 8, desc: '长寿和合，宜做卧室、客厅' },
  '五鬼': { nature: '凶', element: '廉贞', score: 3, desc: '口舌是非，宜做卫生间、储物间' },
  '六煞': { nature: '凶', element: '文曲', score: 4, desc: '桃花劫煞，宜做卫生间' },
  '祸害': { nature: '凶', element: '禄存', score: 5, desc: '疾病伤灾，宜做杂物间' },
  '绝命': { nature: '凶', element: '破军', score: 1, desc: '大凶之位，宜做卫生间、储物间' },
}

// 大游年法：从宅卦推游星分布
// 规则：以宅卦所在方位为伏位，按固定顺序飞布其他游星
// 顺序：伏位→生气→天医→延年→五鬼→六煞→祸害→绝命
const DAYOU_NIAN = {
  '坎': { '坎': '伏位', '艮': '五鬼', '震': '天医', '巽': '生气', '离': '延年', '坤': '绝命', '兑': '祸害', '乾': '六煞' },
  '艮': { '坎': '五鬼', '艮': '伏位', '震': '六煞', '巽': '绝命', '离': '祸害', '坤': '生气', '兑': '延年', '乾': '天医' },
  '震': { '坎': '天医', '艮': '六煞', '震': '伏位', '巽': '延年', '离': '生气', '坤': '祸害', '兑': '绝命', '乾': '五鬼' },
  '巽': { '坎': '生气', '艮': '绝命', '震': '延年', '巽': '伏位', '离': '天医', '坤': '五鬼', '兑': '六煞', '乾': '祸害' },
  '离': { '坎': '延年', '艮': '祸害', '震': '生气', '巽': '天医', '离': '伏位', '坤': '六煞', '兑': '五鬼', '乾': '绝命' },
  '坤': { '坎': '绝命', '艮': '生气', '震': '祸害', '巽': '五鬼', '离': '六煞', '坤': '伏位', '兑': '天医', '乾': '延年' },
  '兑': { '坎': '祸害', '艮': '延年', '震': '绝命', '巽': '六煞', '离': '五鬼', '坤': '天医', '兑': '伏位', '乾': '生气' },
  '乾': { '坎': '六煞', '艮': '天医', '震': '五鬼', '巽': '祸害', '离': '绝命', '坤': '延年', '兑': '生气', '乾': '伏位' },
}

// 宅卦分类
const EAST_HOUSE = ['坎', '震', '巽', '离']
const WEST_HOUSE = ['乾', '坤', '艮', '兑']

/**
 * 五行生克关系判断
 * @param {string} me - 我的五行
 * @param {string} other - 对方五行
 * @returns {string} '生我'|'我生'|'克我'|'我克'|'比和'
 */
function getWuXingRelation(me, other) {
  if (me === other) return '比和'
  const sheng = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' }  // 我生
  const ke = { '木': '土', '火': '金', '土': '水', '金': '木', '水': '火' }     // 我克
  if (sheng[me] === other) return '我生'
  if (sheng[other] === me) return '生我'
  if (ke[me] === other) return '我克'
  if (ke[other] === me) return '克我'
  return '比和'
}

/**
 * 根据朝向角度确定坐向和宅卦
 * @param {number} facingAngle - 朝向角度（真北，0=北，90=东...）
 * @returns {{ facing: string, sitting: string, zhaiGua: string, zhaiGroup: string, detail: string }}
 */
export function angleToZhaiGua(facingAngle) {
  // 规范角度到0-360
  let angle = ((facingAngle % 360) + 360) % 360

  // 确定朝向对应的八卦
  let facingTrigram
  if (angle >= 337.5 || angle < 22.5) facingTrigram = '坎'    // 北
  else if (angle >= 22.5 && angle < 67.5) facingTrigram = '艮'  // 东北
  else if (angle >= 67.5 && angle < 112.5) facingTrigram = '震' // 东
  else if (angle >= 112.5 && angle < 157.5) facingTrigram = '巽' // 东南
  else if (angle >= 157.5 && angle < 202.5) facingTrigram = '离' // 南
  else if (angle >= 202.5 && angle < 247.5) facingTrigram = '坤' // 西南
  else if (angle >= 247.5 && angle < 292.5) facingTrigram = '兑' // 西
  else facingTrigram = '乾'                                      // 西北

  // 朝向→方位名
  const trigramPosition = {
    '坎': '北', '艮': '东北', '震': '东', '巽': '东南',
    '离': '南', '坤': '西南', '兑': '西', '乾': '西北'
  }

  // 坐向=朝向的对宫
  const oppositeTrigram = {
    '坎': '离', '离': '坎', '震': '兑', '兑': '震',
    '乾': '巽', '巽': '乾', '艮': '坤', '坤': '艮'
  }

  const sittingTrigram = oppositeTrigram[facingTrigram]
  const zhaiGroup = EAST_HOUSE.includes(sittingTrigram) ? 'east' : 'west'

  return {
    facing: trigramPosition[facingTrigram],
    facingTrigram,
    sitting: trigramPosition[sittingTrigram],
    sittingTrigram,
    zhaiGua: sittingTrigram,
    zhaiGroup,
    zhaiGroupLabel: zhaiGroup === 'east' ? '东四宅' : '西四宅',
    detail: `坐${trigramPosition[sittingTrigram]}朝${trigramPosition[facingTrigram]}`,
  }
}

/**
 * 八宅排盘 - 核心算法
 * @param {number} facingAngle - 朝向角度（真北）
 * @param {{ number: number, name: string, group: string }} mingGua - 命卦对象
 * @returns {{ zhaiGua, palaces, overall, match }}
 */
export function baZhaiPan(facingAngle, mingGua) {
  const zhai = angleToZhaiGua(facingAngle)
  const zhaiGua = zhai.zhaiGua

  // 计算八宫游星分布
  const distribution = DAYOU_NIAN[zhaiGua]

  const palaces = EIGHT_PALACES.map(position => {
    const trigram = POSITION_TRIGRAM[position]
    const youxing = distribution[trigram]
    const info = YOU_XING[youxing]

    return {
      position,         // 方位：北/东北/东/东南/南/西南/西/西北
      trigram,          // 八卦：坎/艮/震/巽/离/坤/兑/乾
      youxing,          // 游星：伏位/天医/生气/延年/五鬼/六煞/祸害/绝命
      nature: info.nature,   // 吉/凶
      element: info.element, // 星名
      score: info.score,     // 1-10分
      desc: info.desc,       // 描述
    }
  })

  // 人宅匹配
  const match = zhai.zhaiGroup === mingGua.group

  // 统计吉凶位数
  const jiPalaces = palaces.filter(p => p.nature === '吉')
  const xiongPalaces = palaces.filter(p => p.nature === '凶')

  // === 精细化评分 ===
  // 核心思路：不同方位对不同功能房间的重要性不同
  // 大门朝向（朝向方位）最关键，其次是与大门相对的坐方
  
  // 1. 方位重要性权重（大门朝向最关键，坐方次之，四正方位>四维方位）
  const positionWeight = {}
  EIGHT_PALACES.forEach(pos => {
    if (pos === zhai.facing) {
      positionWeight[pos] = 3.0  // 大门朝向：最关键
    } else if (pos === zhai.sitting) {
      positionWeight[pos] = 2.0  // 坐方（靠山位）
    } else {
      // 四正方位（北东南西）比四维方位（东北东南西南西北）更重要
      const isZheng = ['北', '东', '南', '西'].includes(pos)
      positionWeight[pos] = isZheng ? 1.5 : 1.0
    }
  })

  // 2. 游星吉凶权重（生气>延年>天医>伏位，绝命>五鬼>六煞>祸害）
  const youxingWeight = {
    '生气': 1.3,   // 最强吉星
    '延年': 1.15,  // 次强
    '天医': 1.1,   // 中强
    '伏位': 0.9,   // 吉但力量弱
    '祸害': 0.8,   // 小凶
    '六煞': 0.9,   // 中凶
    '五鬼': 1.1,   // 大凶
    '绝命': 1.3,   // 最凶
  }

  // 3. 加权计算基础分
  let totalWeightedScore = 0
  let totalWeight = 0
  palaces.forEach(p => {
    const pw = positionWeight[p.position]
    const yw = youxingWeight[p.youxing]
    const weight = pw * yw
    totalWeightedScore += p.score * weight
    totalWeight += weight
  })
  const weightedAvg = totalWeightedScore / totalWeight  // 1-10 的加权均分

  // 4. 人宅匹配加成/减成
  let finalScore = weightedAvg
  if (match) {
    finalScore = Math.min(10, finalScore * 1.15)  // 匹配+15%
  } else {
    finalScore = finalScore * 0.88  // 不匹配-12%
  }

  // 5. 五行加成：命卦五行与宅卦五行的生克关系
  const trigramElement = {
    '坎': '水', '离': '火', '震': '木', '巽': '木',
    '乾': '金', '兑': '金', '艮': '土', '坤': '土',
  }
  const zhaiElement = trigramElement[zhaiGua]
  const mingElement = trigramElement[mingGua.name]
  
  // 五行生克：生我=加成，我生=小减，克我=减，我克=小减，比和=加成
  const wuxingRelation = getWuXingRelation(mingElement, zhaiElement)
  if (wuxingRelation === '生我') finalScore = Math.min(10, finalScore * 1.08)
  else if (wuxingRelation === '比和') finalScore = Math.min(10, finalScore * 1.04)
  else if (wuxingRelation === '克我') finalScore = finalScore * 0.92
  else if (wuxingRelation === '我生') finalScore = finalScore * 0.97
  else if (wuxingRelation === '我克') finalScore = finalScore * 0.95

  // 6. 大门朝向特别检查：大门落在吉位大幅加分，落在凶位大幅减分
  const facingPalace = palaces.find(p => p.position === zhai.facing)
  if (facingPalace) {
    if (facingPalace.youxing === '生气') finalScore = Math.min(10, finalScore * 1.12)
    else if (facingPalace.youxing === '延年') finalScore = Math.min(10, finalScore * 1.08)
    else if (facingPalace.youxing === '天医') finalScore = Math.min(10, finalScore * 1.06)
    else if (facingPalace.youxing === '绝命') finalScore = finalScore * 0.85
    else if (facingPalace.youxing === '五鬼') finalScore = finalScore * 0.88
    else if (facingPalace.youxing === '六煞') finalScore = finalScore * 0.92
  }

  const overall = {
    score: Math.round(finalScore * 10),  // 转为百分制
    level: finalScore >= 7.5 ? '优' : finalScore >= 6.0 ? '良' : finalScore >= 4.5 ? '中' : '差',
    jiCount: jiPalaces.length,
    xiongCount: xiongPalaces.length,
    match,
    matchLabel: match ? '人宅相配' : '人宅不配',
    wuxingRelation,
  }

  return {
    zhaiGua: zhai,
    mingGua,
    palaces,
    overall,
  }
}

export { YOU_XING, DAYOU_NIAN, EIGHT_PALACES, POSITION_TRIGRAM }
