/**
 * 好宅助手 - 八字四柱推算引擎
 * 
 * 基于传统八字命理算法，实现四柱八字推算
 * 
 * 算法要点：
 * 1. 年柱：以立春为界（立春前算上一年）
 * 2. 月柱：以节气定月（非农历月初一）
 * 3. 日柱：使用预计算查表法（1900-2050年）
 * 4. 时柱：日干定旬首，时支定时辰
 * 5. 真太阳时修正：根据出生地经度修正时辰（关键！）
 * 
 * V1.5a 更新：增加真太阳时修正
 * - 北京时间基于东经120°，但各地真太阳时不同
 * - 修正公式：真太阳时 = 北京时间 + (经度 - 120°) × 4分钟/度 + 均时差
 * - 子时跨日场景：真太阳时修正后日期可能变化，影响日柱
 */

// 天干
const TIAN_GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']

// 地支
const DI_ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']

// 月支（节气月）
const YUE_ZHI = ['寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥', '子', '丑']

// 时辰名称（24小时制）
const SHI_CHEN = [
  { name: '子', start: 23, end: 0 },  // 子时 23:00-00:59
  { name: '丑', start: 1, end: 2 },
  { name: '寅', start: 3, end: 4 },
  { name: '卯', start: 5, end: 6 },
  { name: '辰', start: 7, end: 8 },
  { name: '巳', start: 9, end: 10 },
  { name: '午', start: 11, end: 12 },
  { name: '未', start: 13, end: 14 },
  { name: '申', start: 15, end: 16 },
  { name: '酉', start: 17, end: 18 },
  { name: '戌', start: 19, end: 20 },
  { name: '亥', start: 21, end: 22 },
]

/**
 * 均时差（Equation of Time）近似计算
 * 由于地球公转轨道椭圆和自转轴倾斜，真太阳时与平太阳时有差异
 * 最大约 ±16 分钟
 * @param {number} year - 公历年
 * @param {number} month - 公历月
 * @param {number} day - 公历日
 * @returns {number} 均时差（分钟）
 */
function equationOfTime(year, month, day) {
  // 计算年积日（Day of Year）
  const date = new Date(year, month - 1, day)
  const startOfYear = new Date(year, 0, 1)
  const dayOfYear = Math.floor((date - startOfYear) / 86400000) + 1

  // 均时差近似公式（Spencer 1971 简化版）
  const B = (2 * Math.PI / 365) * (dayOfYear - 1)
  const EoT = 229.18 * (
    0.000075 +
    0.001868 * Math.cos(B) -
    0.032077 * Math.sin(B) -
    0.014615 * Math.cos(2 * B) -
    0.04089 * Math.sin(2 * B)
  )
  // 返回分钟数
  return EoT
}

/**
 * 真太阳时修正
 * 
 * 北京时间 = UTC+8，基于东经120°标准时
 * 真太阳时 = 平太阳时 + 均时差
 * 平太阳时 = 北京时间 + (当地经度 - 120°) × 4分钟/度
 * 
 * @param {number} year - 公历年
 * @param {number} month - 公历月
 * @param {number} day - 公历日
 * @param {number} hour - 北京时间小时（0-23）
 * @param {number} minute - 分钟（0-59，默认0）
 * @param {number} lon - 出生地经度（东经为正，如郑州113.65）
 * @returns {{ 
 *   trueYear: number, 
 *   trueMonth: number, 
 *   trueDay: number, 
 *   trueHour: number, 
 *   trueMinute: number,
 *   lngCorrection: number,
 *   eotCorrection: number,
 *   totalCorrection: number
 * }}
 */
function correctToTrueSolarTime(year, month, day, hour, minute = 0, lon = 120) {
  // 1. 经度修正（分钟）
  const lngCorrection = (lon - 120) * 4 // 每度4分钟
  
  // 2. 均时差修正（分钟）
  const eotCorrection = equationOfTime(year, month, day)
  
  // 3. 总修正量（分钟）
  const totalCorrection = lngCorrection + eotCorrection
  
  // 4. 修正后的总分钟数
  const totalMinutes = hour * 60 + minute + totalCorrection
  
  // 5. 处理跨日情况
  let adjustedDate = new Date(year, month - 1, day)
  let adjustedMinutes = totalMinutes
  
  if (adjustedMinutes < 0) {
    // 跨到前一天
    adjustedDate = new Date(adjustedDate.getTime() - 86400000)
    adjustedMinutes += 1440
  } else if (adjustedMinutes >= 1440) {
    // 跨到后一天
    adjustedDate = new Date(adjustedDate.getTime() + 86400000)
    adjustedMinutes -= 1440
  }
  
  const trueHour = Math.floor(adjustedMinutes / 60)
  const trueMinute = Math.round(adjustedMinutes % 60)

  return {
    trueYear: adjustedDate.getFullYear(),
    trueMonth: adjustedDate.getMonth() + 1,
    trueDay: adjustedDate.getDate(),
    trueHour,
    trueMinute,
    lngCorrection: Math.round(lngCorrection * 10) / 10,
    eotCorrection: Math.round(eotCorrection * 10) / 10,
    totalCorrection: Math.round(totalCorrection * 10) / 10,
  }
}

// 节气日期表（每年立春日期，公历）
// 格式：[月, 日]，部分年份有两天差异
const LI_CHUN_DATES = [
  // 1900-1910
  [2, 4], [2, 4], [2, 5], [2, 4], [2, 4], [2, 4], [2, 5], [2, 4], [2, 4], [2, 5], [2, 4],
  // 1911-1920
  [2, 4], [2, 4], [2, 5], [2, 4], [2, 4], [2, 5], [2, 4], [2, 4], [2, 4], [2, 5],
  // 1921-1930
  [2, 4], [2, 4], [2, 4], [2, 5], [2, 4], [2, 4], [2, 4], [2, 5], [2, 4], [2, 4],
  // 1931-1940
  [2, 4], [2, 4], [2, 4], [2, 5], [2, 4], [2, 4], [2, 4], [2, 5], [2, 4], [2, 4],
  // 1941-1950
  [2, 4], [2, 4], [2, 5], [2, 4], [2, 4], [2, 4], [2, 5], [2, 4], [2, 4], [2, 4],
  // 1951-1960
  [2, 5], [2, 4], [2, 4], [2, 4], [2, 5], [2, 4], [2, 4], [2, 4], [2, 5], [2, 4],
  // 1961-1970
  [2, 4], [2, 4], [2, 5], [2, 4], [2, 4], [2, 4], [2, 4], [2, 5], [2, 4], [2, 4],
  // 1971-1980
  [2, 4], [2, 5], [2, 4], [2, 4], [2, 4], [2, 4], [2, 5], [2, 4], [2, 4], [2, 4],
  // 1981-1990
  [2, 4], [2, 5], [2, 4], [2, 4], [2, 4], [2, 4], [2, 5], [2, 4], [2, 4], [2, 4],
  // 1991-2000
  [2, 4], [2, 5], [2, 4], [2, 4], [2, 4], [2, 4], [2, 5], [2, 4], [2, 4], [2, 4],
  // 2001-2010
  [2, 4], [2, 4], [2, 5], [2, 4], [2, 4], [2, 4], [2, 4], [2, 5], [2, 4], [2, 4],
  // 2011-2020
  [2, 4], [2, 4], [2, 5], [2, 4], [2, 4], [2, 4], [2, 4], [2, 5], [2, 4], [2, 4],
  // 2021-2030
  [2, 3], [2, 4], [2, 4], [2, 4], [2, 4], [2, 4], [2, 4], [2, 4], [2, 4], [2, 4],
  // 2031-2040
  [2, 4], [2, 4], [2, 4], [2, 4], [2, 4], [2, 3], [2, 4], [2, 4], [2, 4], [2, 4],
  // 2041-2050
  [2, 4], [2, 3], [2, 4], [2, 4], [2, 4], [2, 4], [2, 4], [2, 4], [2, 3], [2, 4],
]

/**
 * 获取某年立春日期
 * @param {number} year - 公历年份
 * @returns {{ month: number, day: number }}
 */
function getLiChunDate(year) {
  if (year >= 1900 && year <= 2050) {
    return { month: 2, day: LI_CHUN_DATES[year - 1900][1] }
  }
  // 默认值（误差1-2天，在节气交界期需人工确认）
  return { month: 2, day: 4 }
}

/**
 * 判断是否已过立春
 * @param {number} year - 公历年
 * @param {number} month - 公历月
 * @param {number} day - 公历日
 * @returns {boolean}
 */
function isAfterLiChun(year, month, day) {
  const lc = getLiChunDate(year)
  if (month > lc.month) return true
  if (month === lc.month && day >= lc.day) return true
  return false
}

/**
 * 计算年柱天干
 * @param {number} year - 公历年（已按立春调整）
 * @returns {string}
 */
function getYearGan(year) {
  // 以立春为界，甲子年起算
  // 1984年是甲子年
  const cycleStart = 1984
  const offset = year - cycleStart
  const ganIndex = ((offset % 60) + 60) % 60
  return TIAN_GAN[ganIndex % 10]
}

/**
 * 计算年柱地支
 * @param {number} year - 公历年（已按立春调整）
 * @returns {string}
 */
function getYearZhi(year) {
  const cycleStart = 1984
  const offset = year - cycleStart
  const zhiIndex = ((offset % 60) + 60) % 60
  return DI_ZHI[zhiIndex % 12]
}

/**
 * 节气日期表（简化版，用于月柱计算）
 * 每月两个节气：节、气
 */
const JIE_QI_TABLE = {
  // 格式：month: { jie: [day], qi: [day] }
  1: { jie: 5, qi: 20 },   // 小寒 → 大寒
  2: { jie: 3, qi: 18 },   // 立春 → 雨水
  3: { jie: 5, qi: 20 },   // 惊蛰 → 春分
  4: { jie: 4, qi: 20 },   // 清明 → 谷雨
  5: { jie: 5, qi: 21 },   // 立夏 → 小满
  6: { jie: 5, qi: 21 },   // 芒种 → 夏至
  7: { jie: 6, qi: 22 },   // 小暑 → 大暑
  8: { jie: 7, qi: 22 },   // 立秋 → 处暑
  9: { jie: 7, qi: 23 },   // 白露 → 秋分
  10: { jie: 8, qi: 23 },  // 寒露 → 霜降
  11: { jie: 7, qi: 22 },  // 立冬 → 小雪
  12: { jie: 6, qi: 21 },  // 大雪 → 冬至
}

// 节气到月支的映射（以节为界）
const JIE_QI_TO_MONTH_ZHI = [
  { name: '寅', startJie: '立春', startMonth: 2 },
  { name: '卯', startJie: '惊蛰', startMonth: 3 },
  { name: '辰', startJie: '清明', startMonth: 4 },
  { name: '巳', startJie: '立夏', startMonth: 5 },
  { name: '午', startJie: '芒种', startMonth: 6 },
  { name: '未', startJie: '小暑', startMonth: 7 },
  { name: '申', startJie: '立秋', startMonth: 8 },
  { name: '酉', startJie: '白露', startMonth: 9 },
  { name: '戌', startJie: '寒露', startMonth: 10 },
  { name: '亥', startJie: '立冬', startMonth: 11 },
  { name: '子', startJie: '大雪', startMonth: 12 },
  { name: '丑', startJie: '小寒', startMonth: 1 },
]

/**
 * 根据节气确定月支
 * @param {number} year - 公历年
 * @param {number} month - 公历月
 * @param {number} day - 公历日
 * @returns {string}
 */
function getMonthZhi(year, month, day) {
  // 先用简化日期判断
  const table = JIE_QI_TABLE[month]
  let isAfterJie = day >= table.jie

  // 处理节气边界（误差1-2天）
  // 如果接近节气边界，可能需要精确计算
  
  // 如果是这个月的下半月（下半月肯定过了节）
  if (day > 15) {
    isAfterJie = true
  }

  // 确定月支
  let targetMonth = month
  if (!isAfterJie && month > 1) {
    targetMonth = month - 1
  }

  // 映射到月支
  const mapping = [
    { month: 1, zhi: '丑' },
    { month: 2, zhi: '寅' },
    { month: 3, zhi: '卯' },
    { month: 4, zhi: '辰' },
    { month: 5, zhi: '巳' },
    { month: 6, zhi: '午' },
    { month: 7, zhi: '未' },
    { month: 8, zhi: '申' },
    { month: 9, zhi: '酉' },
    { month: 10, zhi: '戌' },
    { month: 11, zhi: '亥' },
    { month: 12, zhi: '子' },
  ]

  return mapping.find(m => m.month === targetMonth).zhi
}

/**
 * 计算月柱天干
 * @param {number} yearGanIndex - 年干索引(0-9)
 * @param {number} monthZhiIndex - 月支索引(0-11)
 * @returns {string}
 */
function getMonthGan(yearGanIndex, monthZhiIndex) {
  // 五虎遁：年干决定月干
  // 甲己之年丙作首：甲年(0)或己年(5)的寅月天干是丙(2)
  // 乙庚之年戊为头：乙年(1)或庚年(6)的寅月天干是戊(4)
  // 丙辛之岁寻庚上：丙年(2)或辛年(7)的寅月天干是庚(6)
  // 丁壬壬寅顺水流：丁年(3)或壬年(8)的寅月天干是壬(8)
  // 戊癸甲寅好追求：戊年(4)或癸年(9)的寅月天干是甲(0)
  
  // 计算寅月(index=2)的天干
  const startGan = (yearGanIndex * 2 + 2) % 10
  
  // 从寅月开始顺推：寅月是起点，偏移量为0
  // 例如：寅月(index=2)偏移0，卯月(index=3)偏移1，辰月(index=4)偏移2...
  const offset = (monthZhiIndex - 2 + 12) % 12
  const monthGanIndex = (startGan + offset) % 10
  
  return TIAN_GAN[monthGanIndex]
}

// 日柱查表法：预计算1900-2050年每天的干支
// 这是最准确的方法，避免了复杂的算法推导
function generateDayPillarTable() {
  const table = {}
  // 1900年1月1日是甲戌日（万年历公认基准）
  // 甲子=0, 甲戌=10（甲+0, 戌=10→0*12+10=10? 不对）
  // 六十甲子表：0甲子 1乙丑 2丙寅 3丁卯 4戊辰 5己巳 6庚午 7辛未 8壬申 9癸酉 10甲戌
  // 基准：1900-01-01 = 10（甲戌）
  const baseYear = 1900
  const baseMonth = 1
  const baseDay = 1
  const baseGanZhiIndex = 10 // 甲戌

  // 计算每天的干支
  for (let year = 1900; year <= 2050; year++) {
    for (let month = 1; month <= 12; month++) {
      const daysInMonth = new Date(year, month, 0).getDate()
      for (let day = 1; day <= daysInMonth; day++) {
        // 计算距离基准日期的天数
        const days = Math.floor((Date.UTC(year, month - 1, day) - Date.UTC(baseYear, baseMonth - 1, baseDay)) / 86400000)
        const gzIndex = (baseGanZhiIndex + days) % 60
        const ganIndex = gzIndex % 10
        const zhiIndex = gzIndex % 12
        const key = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        table[key] = TIAN_GAN[ganIndex] + DI_ZHI[zhiIndex]
      }
    }
  }
  return table
}

const DAY_PILLAR_TABLE = generateDayPillarTable()

/**
 * 获取日柱
 * @param {number} year - 公历年
 * @param {number} month - 公历月
 * @param {number} day - 公历日
 * @returns {string}
 */
function getDayPillar(year, month, day) {
  const key = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  return DAY_PILLAR_TABLE[key] || '甲子' // 默认值
}

/**
 * 获取时柱
 * @param {string} dayGan - 日干
 * @param {number} hour - 小时（0-23）
 * @returns {string}
 */
function getHourPillar(dayGan, hour) {
  // 五鼠遁：日干决定时干
  // 甲己日起子时为甲
  const dayGanIndex = TIAN_GAN.indexOf(dayGan)
  const startGan = (dayGanIndex * 2) % 10

  // 确定时支
  let zhiIndex = Math.floor((hour + 1) / 2) % 12
  if (hour === 23) zhiIndex = 0 // 子时特殊处理

  const ganIndex = (startGan + zhiIndex) % 10
  return TIAN_GAN[ganIndex] + DI_ZHI[zhiIndex]
}

/**
 * 计算四柱八字（V1.5b 真太阳时排盘）
 * 
 * 核心逻辑：输入出生时间（北京时间）+ 出生地经度 → 真太阳时 → 排盘
 * 这是传统八字排盘的正统方法：
 * 1. 用户输入精确出生时间（小时+分钟）
 * 2. 根据出生地经度计算真太阳时（经度修正+均时差）
 * 3. 以真太阳时确定四柱（年/月/日/时柱均基于真太阳时）
 * 
 * @param {number} year - 出生年份（公历）
 * @param {number} month - 出生月份（公历，1-12）
 * @param {number} day - 出生日期（公历，1-31）
 * @param {number} hour - 出生小时（北京时间，0-23）
 * @param {number} [minute=0] - 出生分钟（北京时间，0-59）
 * @param {number} [lon=120] - 出生地经度（东经，默认120=北京时间标准经度）
 * @returns {{ yearPillar: string, monthPillar: string, dayPillar: string, hourPillar: string, adjustedYear: number, lunarMonth: string, solarTimeInfo: object }}
 */
export function calcBaZi(year, month, day, hour, minute = 0, lon = 120) {
  // === 第1步：真太阳时修正 ===
  const solarTime = correctToTrueSolarTime(year, month, day, hour, minute, lon)
  
  // 排盘使用真太阳时（传统正统方法）
  // 用户输入精确出生时间后，真太阳时修正是精确的，不会出现选时辰时的模糊问题
  const useYear = solarTime.trueYear
  const useMonth = solarTime.trueMonth
  const useDay = solarTime.trueDay
  const useHour = solarTime.trueHour

  // 1. 年柱（以立春为界）
  let adjustedYear = useYear
  if (!isAfterLiChun(useYear, useMonth, useDay)) {
    adjustedYear = useYear - 1
  }
  const yearGan = getYearGan(adjustedYear)
  const yearZhi = getYearZhi(adjustedYear)
  const yearPillar = yearGan + yearZhi

  // 2. 月柱（以节气为界）
  const yearGanIndex = TIAN_GAN.indexOf(yearGan)
  const monthZhi = getMonthZhi(useYear, useMonth, useDay)
  const monthZhiIndex = DI_ZHI.indexOf(monthZhi)
  const monthGan = getMonthGan(yearGanIndex, monthZhiIndex)
  const monthPillar = monthGan + monthZhi

  // 3. 日柱（查表法，使用真太阳时日期）
  const dayPillar = getDayPillar(useYear, useMonth, useDay)

  // 4. 时柱（使用真太阳时时间）
  const dayGan = dayPillar.charAt(0)
  const hourPillar = getHourPillar(dayGan, useHour)

  return {
    yearPillar,
    monthPillar,
    dayPillar,
    hourPillar,
    // 额外信息
    adjustedYear, // 调整后的年份（立春年前后）
    lunarMonth: monthZhi + '月', // 节气月
    // 真太阳时修正信息
    solarTimeInfo: {
      originalTime: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
      trueSolarTime: `${useYear}-${String(useMonth).padStart(2, '0')}-${String(useDay).padStart(2, '0')} ${String(useHour).padStart(2, '0')}:${String(solarTime.trueMinute).padStart(2, '0')}`,
      lngCorrection: solarTime.lngCorrection,
      eotCorrection: solarTime.eotCorrection,
      totalCorrection: solarTime.totalCorrection,
      dateChanged: (useYear !== year || useMonth !== month || useDay !== day),
      hourChanged: (useHour !== hour),
      shiChenName: getShiChenName(useHour),
      correctionNote: solarTime.totalCorrection !== 0 
        ? `经度修正${solarTime.lngCorrection > 0 ? '+' : ''}${solarTime.lngCorrection}分钟，均时差${solarTime.eotCorrection > 0 ? '+' : ''}${solarTime.eotCorrection}分钟，合计${solarTime.totalCorrection > 0 ? '+' : ''}${solarTime.totalCorrection}分钟`
        : '无需修正（标准经度）',
    },
  }
}

/**
 * 十二时辰中文名
 */
export const SHI_CHEN_NAMES = [
  { name: '子时', desc: '23:00-00:59', value: 23 },
  { name: '丑时', desc: '01:00-02:59', value: 1 },
  { name: '寅时', desc: '03:00-04:59', value: 3 },
  { name: '卯时', desc: '05:00-06:59', value: 5 },
  { name: '辰时', desc: '07:00-08:59', value: 7 },
  { name: '巳时', desc: '09:00-10:59', value: 9 },
  { name: '午时', desc: '11:00-12:59', value: 11 },
  { name: '未时', desc: '13:00-14:59', value: 13 },
  { name: '申时', desc: '15:00-16:59', value: 15 },
  { name: '酉时', desc: '17:00-18:59', value: 17 },
  { name: '戌时', desc: '19:00-20:59', value: 19 },
  { name: '亥时', desc: '21:00-22:59', value: 21 },
]

/**
 * 获取时辰中文名
 * @param {number} hour - 小时（0-23）
 * @returns {string}
 */
export function getShiChenName(hour) {
  if (hour >= 23 || hour < 1) return '子时'
  if (hour < 3) return '丑时'
  if (hour < 5) return '寅时'
  if (hour < 7) return '卯时'
  if (hour < 9) return '辰时'
  if (hour < 11) return '巳时'
  if (hour < 13) return '午时'
  if (hour < 15) return '未时'
  if (hour < 17) return '申时'
  if (hour < 19) return '酉时'
  if (hour < 21) return '戌时'
  return '亥时'
}

export { TIAN_GAN, DI_ZHI, YUE_ZHI }
