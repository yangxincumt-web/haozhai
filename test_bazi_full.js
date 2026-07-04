// 八字全面测试脚本 - 对照万年历验证

const TIAN_GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
const DI_ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']

// ===== 从 bazi.js 复制的核心函数（修复后版本）=====

function getYearGan(year) {
  const cycleStart = 1984
  const offset = year - cycleStart
  const ganIndex = ((offset % 60) + 60) % 60
  return TIAN_GAN[ganIndex % 10]
}

function getYearZhi(year) {
  const cycleStart = 1984
  const offset = year - cycleStart
  const zhiIndex = ((offset % 60) + 60) % 60
  return DI_ZHI[zhiIndex % 12]
}

// 修复后的月干函数
function getMonthGan(yearGanIndex, monthZhiIndex) {
  const startGan = (yearGanIndex * 2 + 2) % 10
  const offset = (monthZhiIndex - 2 + 12) % 12
  const monthGanIndex = (startGan + offset) % 10
  return TIAN_GAN[monthGanIndex]
}

// 日柱查表法
function generateDayPillarTable() {
  const table = {}
  const baseYear = 1900, baseMonth = 1, baseDay = 1
  const baseGanZhiIndex = 10 // 甲戌
  for (let year = 1900; year <= 2050; year++) {
    for (let month = 1; month <= 12; month++) {
      const daysInMonth = new Date(year, month, 0).getDate()
      for (let day = 1; day <= daysInMonth; day++) {
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

function getDayPillar(year, month, day) {
  const key = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  return DAY_PILLAR_TABLE[key] || '甲子'
}

// 时柱
function getHourPillar(dayGan, hour) {
  const dayGanIndex = TIAN_GAN.indexOf(dayGan)
  const startGan = (dayGanIndex * 2) % 10
  let zhiIndex = Math.floor((hour + 1) / 2) % 12
  if (hour === 23) zhiIndex = 0
  const ganIndex = (startGan + zhiIndex) % 10
  return TIAN_GAN[ganIndex] + DI_ZHI[zhiIndex]
}

// ===== 测试用例（来自万年历网站的验证数据）=====

const testCases = [
  // 来源: https://www.udtool.com/toolbox/baziwuxing/2025031514.html
  // 2025年3月15日 未时(14:00)
  // 年柱: 乙巳, 月柱: 己卯, 日柱: 癸未, 时柱(未时): 己未
  {
    desc: '2025-03-15 未时 (万年历验证)',
    year: 2025, month: 3, day: 15, hour: 14,
    expectedYear: '乙巳', expectedMonth: '己卯', expectedDay: '癸未', expectedHour: '己未',
    useYear: 2025, // 已过立春
    monthZhi: '卯', monthZhiIndex: 3
  },
  // 2025年3月15日 子时(0:00) → 壬子时
  {
    desc: '2025-03-15 子时 (时柱验证)',
    year: 2025, month: 3, day: 15, hour: 0,
    expectedYear: '乙巳', expectedMonth: '己卯', expectedDay: '癸未', expectedHour: '壬子',
    useYear: 2025,
    monthZhi: '卯', monthZhiIndex: 3
  },
  // 来源: 查字典万年历 1975年1月15日
  // 注意: 1975年1月15日在立春前，所以年柱是甲寅(1974年的干支)
  // 甲寅年 丁丑月
  {
    desc: '1975-01-15 (立春前→甲寅年丁丑月)',
    year: 1975, month: 1, day: 15, hour: 10,
    expectedYear: '甲寅', expectedMonth: '丁丑', expectedDay: null, expectedHour: null,
    useYear: 1974, // 立春前算上一年
    monthZhi: '丑', monthZhiIndex: 1
  },
  // 用户反馈案例: 乙卯年己丑月
  // 乙卯年的丑月 = 1976年1月(小寒后,立春前)
  // 1976年1月15日: 立春前 → 年柱乙卯(1975年干支)
  {
    desc: '1976-01-15 (用户案例: 乙卯年己丑月)',
    year: 1976, month: 1, day: 15, hour: 10,
    expectedYear: '乙卯', expectedMonth: '己丑', expectedDay: null, expectedHour: null,
    useYear: 1975, // 立春前算上一年
    monthZhi: '丑', monthZhiIndex: 1
  },
  // 甲子年 丙寅月 (1984年2月15日, 立春后)
  // 1984年立春是2月4日
  {
    desc: '1984-02-15 (甲子年丙寅月)',
    year: 1984, month: 2, day: 15, hour: 8,
    expectedYear: '甲子', expectedMonth: '丙寅', expectedDay: null, expectedHour: null,
    useYear: 1984,
    monthZhi: '寅', monthZhiIndex: 2
  },
  // 庚午年 壬午月 (1990年6月15日)
  {
    desc: '1990-06-15 (庚午年壬午月)',
    year: 1990, month: 6, day: 15, hour: 14,
    expectedYear: '庚午', expectedMonth: '壬午', expectedDay: null, expectedHour: null,
    useYear: 1990,
    monthZhi: '午', monthZhiIndex: 6
  },
  // 丙寅年 庚寅月 (1986年2月15日, 立春后)
  {
    desc: '1986-02-15 (丙寅年庚寅月)',
    year: 1986, month: 2, day: 15, hour: 10,
    expectedYear: '丙寅', expectedMonth: '庚寅', expectedDay: null, expectedHour: null,
    useYear: 1986,
    monthZhi: '寅', monthZhiIndex: 2
  },
]

console.log('====== 八字全面测试 ======\n')
let allPassed = true

testCases.forEach((tc, i) => {
  console.log(`--- 测试 ${i+1}: ${tc.desc} ---`)
  
  // 年柱
  const yearGan = getYearGan(tc.useYear)
  const yearZhi = getYearZhi(tc.useYear)
  const yearPillar = yearGan + yearZhi
  const yearPass = yearPillar === tc.expectedYear
  if (!yearPass) allPassed = false
  console.log(`  年柱: ${yearPillar} ${yearPass ? '✅' : '❌ 期望:' + tc.expectedYear}`)
  
  // 月柱
  const yearGanIndex = TIAN_GAN.indexOf(yearGan)
  const monthGan = getMonthGan(yearGanIndex, tc.monthZhiIndex)
  const monthPillar = monthGan + tc.monthZhi
  const monthPass = monthPillar === tc.expectedMonth
  if (!monthPass) allPassed = false
  console.log(`  月柱: ${monthPillar} ${monthPass ? '✅' : '❌ 期望:' + tc.expectedMonth}`)
  
  // 日柱
  if (tc.expectedDay) {
    const dayPillar = getDayPillar(tc.year, tc.month, tc.day)
    const dayPass = dayPillar === tc.expectedDay
    if (!dayPass) allPassed = false
    console.log(`  日柱: ${dayPillar} ${dayPass ? '✅' : '❌ 期望:' + tc.expectedDay}`)
    
    // 时柱
    if (tc.expectedHour) {
      const dayGan = dayPillar.charAt(0)
      const hourPillar = getHourPillar(dayGan, tc.hour)
      const hourPass = hourPillar === tc.expectedHour
      if (!hourPass) allPassed = false
      console.log(`  时柱: ${hourPillar} ${hourPass ? '✅' : '❌ 期望:' + tc.expectedHour}`)
    }
  }
  console.log()
})

// ===== 额外验证: 2025全年12个月的月柱 =====
console.log('--- 附加: 2025乙巳年全年月柱验证 ---')
const months2025 = [
  { zhi: '寅', idx: 2, expected: '戊寅' },
  { zhi: '卯', idx: 3, expected: '己卯' },
  { zhi: '辰', idx: 4, expected: '庚辰' },
  { zhi: '巳', idx: 5, expected: '辛巳' },
  { zhi: '午', idx: 6, expected: '壬午' },
  { zhi: '未', idx: 7, expected: '癸未' },
  { zhi: '申', idx: 8, expected: '甲申' },
  { zhi: '酉', idx: 9, expected: '乙酉' },
  { zhi: '戌', idx: 10, expected: '丙戌' },
  { zhi: '亥', idx: 11, expected: '丁亥' },
  { zhi: '子', idx: 0, expected: '戊子' },
  { zhi: '丑', idx: 1, expected: '己丑' },
]
const yearGanIdx2025 = TIAN_GAN.indexOf(getYearGan(2025)) // 乙=1
months2025.forEach(m => {
  const mg = getMonthGan(yearGanIdx2025, m.idx)
  const mp = mg + m.zhi
  const pass = mp === m.expected
  if (!pass) allPassed = false
  console.log(`  ${m.zhi}月: ${mp} ${pass ? '✅' : '❌ 期望:' + m.expected}`)
})

console.log()

// ===== 额外验证: 时柱 (五鼠遁) =====
console.log('--- 附加: 时柱五鼠遁全量验证 ---')
// 以2025-03-15 癸未日为例，验证12个时辰
const dayGan = '癸' // 癸未日
const expectedHours = ['壬子', '癸丑', '甲寅', '乙卯', '丙辰', '丁巳', '戊午', '己未', '庚申', '辛酉', '壬戌', '癸亥']
const hourMap = [
  { h: 0, name: '子' }, { h: 1, name: '丑' }, { h: 3, name: '寅' },
  { h: 5, name: '卯' }, { h: 7, name: '辰' }, { h: 9, name: '巳' },
  { h: 11, name: '午' }, { h: 13, name: '未' }, { h: 15, name: '申' },
  { h: 17, name: '酉' }, { h: 19, name: '戌' }, { h: 21, name: '亥' }
]
hourMap.forEach((hm, i) => {
  const hp = getHourPillar(dayGan, hm.h)
  const pass = hp === expectedHours[i]
  if (!pass) allPassed = false
  console.log(`  ${hm.name}时(${hm.h}:00): ${hp} ${pass ? '✅' : '❌ 期望:' + expectedHours[i]}`)
})

// 子时23点的特殊处理
const hp23 = getHourPillar(dayGan, 23)
const pass23 = hp23 === '壬子'
if (!pass23) allPassed = false
console.log(`  子时(23:00): ${hp23} ${pass23 ? '✅' : '❌ 期望:壬子'}`)

console.log(allPassed ? '\n✅ 全部测试通过！' : '\n❌ 存在错误！')
