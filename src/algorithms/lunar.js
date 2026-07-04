/**
 * 好宅助手 - 农历公历互转工具
 * 
 * 基于 lunarInfo 数据表实现 1900-2050 年农历公历互转
 * 数据编码规则：
 *   - 每年用一个 hex 数表示该年农历月大小月排列
 *   - 第 1-4 位：闰月天数（0=29天，1=30天）
 *   - 第 5-16 位：1-12 月大小（1=30天，0=29天）
 *   - 第 17-20 位：闰月月份（0=无闰月）
 * 
 * 参考：寿星万年历算法
 */

// 农历数据表 1900-2050
// 每项编码：0x04bd8 等 hex 值
const LUNAR_INFO = [
  0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, 0x16554, 0x056a0, 0x09ad0, 0x055d2, // 1900-1909
  0x04ae0, 0x0a5b6, 0x0a4d0, 0x0d250, 0x1d255, 0x0b540, 0x0d6a0, 0x0ada2, 0x095b0, 0x14977, // 1910-1919
  0x04970, 0x0a4b0, 0x0b4b5, 0x06a50, 0x06d40, 0x1ab54, 0x02b60, 0x09570, 0x052f2, 0x04970, // 1920-1929
  0x06566, 0x0d4a0, 0x0ea50, 0x06e95, 0x05ad0, 0x02b60, 0x186e3, 0x092e0, 0x1c8d7, 0x0c950, // 1930-1939
  0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0, 0x1a5b4, 0x025d0, 0x092d0, 0x0d2b2, 0x0a950, 0x0b557, // 1940-1949
  0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5b0, 0x14573, 0x052b0, 0x0a9a8, 0x0e950, 0x06aa0, // 1950-1959
  0x0aea6, 0x0ab50, 0x04b60, 0x0aae4, 0x0a570, 0x05260, 0x0f263, 0x0d950, 0x05b57, 0x056a0, // 1960-1969
  0x096d0, 0x04dd5, 0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250, 0x0d558, 0x0b540, 0x0b6a0, 0x195a6, // 1970-1979
  0x095b0, 0x049b0, 0x0a974, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40, 0x0af46, 0x0ab60, 0x09570, // 1980-1989
  0x04af5, 0x04970, 0x064b0, 0x074a3, 0x0ea50, 0x06b58, 0x05ac0, 0x0ab60, 0x096d5, 0x092e0, // 1990-1999
  0x0c960, 0x0d954, 0x0d4a0, 0x0da50, 0x07552, 0x056a0, 0x0abb7, 0x025d0, 0x092d0, 0x0cab5, // 2000-2009
  0x0a950, 0x0b4a0, 0x0baa4, 0x0ad50, 0x055d9, 0x04ba0, 0x0a5b0, 0x15176, 0x052b0, 0x0a930, // 2010-2019
  0x07954, 0x06aa0, 0x0ad50, 0x05b52, 0x04b60, 0x0a6e6, 0x0a4e0, 0x0d260, 0x0ea65, 0x0d530, // 2020-2029
  0x05aa0, 0x076a3, 0x096d0, 0x04afb, 0x04ad0, 0x0a4d0, 0x1d0b6, 0x0d250, 0x0d520, 0x0dd45, // 2030-2039
  0x0b5a0, 0x056d0, 0x055b2, 0x049b0, 0x0a577, 0x0a4b0, 0x0aa50, 0x1b255, 0x06d20, 0x0ada0, // 2040-2049
  0x14b63, // 2050
]

const LUNAR_MONTH_NAMES = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊']
const LUNAR_DAY_NAMES = [
  '初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
  '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
  '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十',
]

/**
 * 获取某年农历总天数
 */
function lunarYearDays(year) {
  let sum = 348
  for (let i = 0x8000; i > 0x8; i >>= 1) {
    sum += (LUNAR_INFO[year - 1900] & i) ? 1 : 0
  }
  return sum + leapDays(year)
}

/**
 * 获取某年闰月天数（0=无闰月）
 */
function leapDays(year) {
  if (leapMonth(year)) {
    return (LUNAR_INFO[year - 1900] & 0x10000) ? 30 : 29
  }
  return 0
}

/**
 * 获取某年闰月月份（0=无闰月）
 */
function leapMonth(year) {
  return LUNAR_INFO[year - 1900] & 0xf
}

/**
 * 获取某年某月天数
 */
function lunarMonthDays(year, month) {
  return (LUNAR_INFO[year - 1900] & (0x10000 >> month)) ? 30 : 29
}

/**
 * 公历 → 农历
 * @param {number} solarYear - 公历年
 * @param {number} solarMonth - 公历月（1-12）
 * @param {number} solarDay - 公历日
 * @returns {{ lunarYear: number, lunarMonth: number, lunarDay: number, isLeapMonth: boolean, lunarMonthName: string, lunarDayName: string }}
 */
export function solarToLunar(solarYear, solarMonth, solarDay) {
  // 参数校验
  if (solarYear < 1900 || solarYear > 2050) {
    return null
  }

  // 计算距离1900年1月31日（农历正月初一）的天数
  const baseDate = new Date(1900, 0, 31)
  const targetDate = new Date(solarYear, solarMonth - 1, solarDay)
  let offset = Math.floor((targetDate - baseDate) / 86400000)

  // 确定农历年
  let lunarYear = 1900
  let yearDays = 0
  for (lunarYear = 1900; lunarYear < 2051 && offset > 0; lunarYear++) {
    yearDays = lunarYearDays(lunarYear)
    offset -= yearDays
  }
  if (offset < 0) {
    offset += yearDays
    lunarYear--
  }

  // 确定闰月
  const leap = leapMonth(lunarYear)
  let isLeapMonth = false

  // 确定农历月
  let lunarMonth = 1
  let monthDays = 0
  for (lunarMonth = 1; lunarMonth < 13 && offset > 0; lunarMonth++) {
    // 闰月
    if (leap > 0 && lunarMonth === (leap + 1) && !isLeapMonth) {
      --lunarMonth
      isLeapMonth = true
      monthDays = leapDays(lunarYear)
    } else {
      monthDays = lunarMonthDays(lunarYear, lunarMonth)
    }

    // 解除闰月标记
    if (isLeapMonth && lunarMonth === (leap + 1)) {
      isLeapMonth = false
    }

    offset -= monthDays
  }

  // offset为0时正好是某月最后一天，需要修正
  if (offset === 0 && leap > 0 && lunarMonth === leap + 1) {
    if (isLeapMonth) {
      isLeapMonth = false
    } else {
      isLeapMonth = true
      --lunarMonth
    }
  }

  if (offset < 0) {
    offset += monthDays
    --lunarMonth
  }

  const lunarDay = offset + 1

  return {
    lunarYear,
    lunarMonth,
    lunarDay,
    isLeapMonth,
    lunarMonthName: (isLeapMonth ? '闰' : '') + LUNAR_MONTH_NAMES[lunarMonth - 1] + '月',
    lunarDayName: LUNAR_DAY_NAMES[lunarDay - 1],
  }
}

/**
 * 农历 → 公历
 * @param {number} lunarYear - 农历年
 * @param {number} lunarMonth - 农历月（1-12）
 * @param {number} lunarDay - 农历日（1-30）
 * @param {boolean} isLeapMonth - 是否闰月
 * @returns {{ solarYear: number, solarMonth: number, solarDay: number } | null}
 */
export function lunarToSolar(lunarYear, lunarMonth, lunarDay, isLeapMonth = false) {
  // 参数校验
  if (lunarYear < 1900 || lunarYear > 2050) return null
  if (lunarMonth < 1 || lunarMonth > 12) return null
  if (lunarDay < 1 || lunarDay > 30) return null

  const leap = leapMonth(lunarYear)

  // 如果指定了闰月但该年无闰月，或闰月月份不匹配
  if (isLeapMonth && leap !== lunarMonth) return null

  // 计算从1900年1月31日到目标日期的天数
  let offset = 0

  // 累加整年天数
  for (let y = 1900; y < lunarYear; y++) {
    offset += lunarYearDays(y)
  }

  // 累加当年月天数
  let isAddedLeap = false
  for (let m = 1; m < lunarMonth; m++) {
    offset += lunarMonthDays(lunarYear, m)
    // 加闰月
    if (leap > 0 && m === leap && !isAddedLeap) {
      offset += leapDays(lunarYear)
      isAddedLeap = true
    }
  }

  // 如果是闰月本身，需要加上闰月前一个月的天数
  if (isLeapMonth) {
    offset += lunarMonthDays(lunarYear, lunarMonth)
  }

  // 加上当月天数
  offset += lunarDay - 1

  // 从1900年1月31日推算公历日期
  // 必须使用UTC计算！本地时间在1900年使用UTC+8:05:57（清朝标准时），
  // 与现代UTC+8差5分57秒，跨日时会导致日期偏移1天
  const baseTime = Date.UTC(1900, 0, 31) // 1900年1月31日 00:00:00 UTC
  const targetTime = baseTime + offset * 86400000
  const targetDate = new Date(targetTime)

  return {
    solarYear: targetDate.getUTCFullYear(),
    solarMonth: targetDate.getUTCMonth() + 1,
    solarDay: targetDate.getUTCDate(),
  }
}

/**
 * 获取某年农历各月信息（用于月份选择器）
 * @param {number} lunarYear - 农历年
 * @returns {Array<{ month: number, name: string, days: number, isLeap: boolean }>}
 */
export function getLunarMonthList(lunarYear) {
  const months = []
  const leap = leapMonth(lunarYear)

  for (let m = 1; m <= 12; m++) {
    months.push({
      month: m,
      name: LUNAR_MONTH_NAMES[m - 1] + '月',
      days: lunarMonthDays(lunarYear, m),
      isLeap: false,
    })
    // 闰月插在对应月份后面
    if (leap === m) {
      months.push({
        month: m,
        name: '闰' + LUNAR_MONTH_NAMES[m - 1] + '月',
        days: leapDays(lunarYear),
        isLeap: true,
      })
    }
  }

  return months
}

/**
 * 获取某年农历某月的天数
 * @param {number} lunarYear - 农历年
 * @param {number} lunarMonth - 农历月
 * @param {boolean} isLeap - 是否闰月
 * @returns {number}
 */
export function getLunarMonthDayCount(lunarYear, lunarMonth, isLeap = false) {
  if (isLeap) {
    return leapDays(lunarYear)
  }
  return lunarMonthDays(lunarYear, lunarMonth)
}

/**
 * 农历日期的中文展示
 */
export function formatLunarDate(lunarYear, lunarMonth, lunarDay, isLeapMonth = false) {
  const monthName = (isLeapMonth ? '闰' : '') + LUNAR_MONTH_NAMES[lunarMonth - 1] + '月'
  const dayName = LUNAR_DAY_NAMES[lunarDay - 1]
  return `${lunarYear}年${monthName}${dayName}`
}

/**
 * 获取农历年份的天干地支（以立春为界的年份）
 */
export function getLunarYearGanZhi(lunarYear) {
  const gan = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
  const zhi = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']
  const ganIndex = (lunarYear - 4) % 10
  const zhiIndex = (lunarYear - 4) % 12
  return gan[ganIndex] + zhi[zhiIndex]
}
