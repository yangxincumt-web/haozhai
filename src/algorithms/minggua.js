/**
 * 好宅助手 - 命卦计算引擎
 * 根据出生年份和性别计算命卦
 * 
 * 算法来源：八宅派经典公式
 * 男命：(100 - 出生年后两位) % 9
 * 女命：(出生年后两位 - 4) % 9
 * 余数0取9（离卦）
 */

// 八卦编号对应
const GUA_MAP = {
  1: '坎',  // 水，北
  2: '坤',  // 土，西南
  3: '震',  // 木，东
  4: '巽',  // 木，东南
  5: '中',  // 土，中宫（男→坤，女→艮）
  6: '乾',  // 金，西北
  7: '兑',  // 金，西
  8: '艮',  // 土，东北
  9: '离',  // 火，南
}

// 东四命/西四命分类
const EAST_LIFE = ['坎', '震', '巽', '离']  // 东四命
const WEST_LIFE = ['乾', '坤', '艮', '兑']  // 西四命

// 东四宅/西四宅分类
const EAST_HOUSE = ['坎', '震', '巽', '离']  // 东四宅
const WEST_HOUSE = ['乾', '坤', '艮', '兑']  // 西四宅

/**
 * 计算命卦
 * @param {number} birthYear - 出生年份（公历，如1988）
 * @param {'male'|'female'} gender - 性别
 * @returns {{ number: number, name: string, group: 'east'|'west', element: string }}
 */
export function calcMingGua(birthYear, gender) {
  const lastTwo = birthYear % 100
  let remainder

  if (gender === 'male') {
    remainder = (100 - lastTwo) % 9
  } else {
    remainder = (lastTwo - 4) % 9
  }

  // 处理负数取模
  if (remainder < 0) remainder += 9
  // 余数0取9
  if (remainder === 0) remainder = 9
  // 中宫处理：男5→坤(2)，女5→艮(8)
  let guaNumber = remainder
  if (remainder === 5) {
    guaNumber = gender === 'male' ? 2 : 8
  }

  const guaName = GUA_MAP[guaNumber]
  const group = EAST_LIFE.includes(guaName) ? 'east' : 'west'

  // 五行属性
  const elements = {
    '坎': '水', '坤': '土', '震': '木', '巽': '木',
    '乾': '金', '兑': '金', '艮': '土', '离': '火'
  }

  return {
    number: guaNumber,
    name: guaName,
    group,
    groupLabel: group === 'east' ? '东四命' : '西四命',
    element: elements[guaName],
    compatibleHouse: group === 'east' ? '东四宅' : '西四宅',
    compatibleHouseGua: group === 'east' ? EAST_HOUSE : WEST_HOUSE,
  }
}

/**
 * 判断人宅是否匹配
 * @param {string} mingGuaName - 命卦名
 * @param {string} zhaiGuaName - 宅卦名
 * @returns {{ match: boolean, label: string }}
 */
export function checkRenZhaiMatch(mingGuaName, zhaiGuaName) {
  const mingGroup = EAST_LIFE.includes(mingGuaName) ? 'east' : 'west'
  const zhaiGroup = EAST_HOUSE.includes(zhaiGuaName) ? 'east' : 'west'
  const match = mingGroup === zhaiGroup

  return {
    match,
    label: match ? '人宅相配' : '人宅不配',
    description: match
      ? `${mingGuaName}命属${mingGroup === 'east' ? '东' : '西'}四命，${zhaiGuaName}宅属${zhaiGroup === 'east' ? '东' : '西'}四宅，命宅相配，气场和谐`
      : `${mingGuaName}命属${mingGroup === 'east' ? '东' : '西'}四命，${zhaiGuaName}宅属${zhaiGroup === 'east' ? '东' : '西'}四宅，命宅不配，可通过布局调整化解`,
  }
}

export { GUA_MAP, EAST_LIFE, WEST_LIFE, EAST_HOUSE, WEST_HOUSE }
