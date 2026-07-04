// 八字计算测试脚本
// 将 bazi.js 中的函数复制出来测试

const TIAN_GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
const DI_ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']

// 修复后的月干函数
function getMonthGan(yearGanIndex, monthZhiIndex) {
  const startGan = (yearGanIndex * 2 + 2) % 10
  const offset = (monthZhiIndex - 2 + 12) % 12
  const monthGanIndex = (startGan + offset) % 10
  return TIAN_GAN[monthGanIndex]
}

// 年干
function getYearGan(year) {
  const cycleStart = 1984
  const offset = year - cycleStart
  const ganIndex = ((offset % 60) + 60) % 60
  return TIAN_GAN[ganIndex % 10]
}

// 年支
function getYearZhi(year) {
  const cycleStart = 1984
  const offset = year - cycleStart
  const zhiIndex = ((offset % 60) + 60) % 60
  return DI_ZHI[zhiIndex % 12]
}

// 五虎遁验证表（年干→寅月天干）
const WUHU_TABLE = {
  '甲': '丙', '己': '丙',  // 甲己之年丙作首
  '乙': '戊', '庚': '戊',  // 乙庚之年戊为头
  '丙': '庚', '辛': '庚',  // 丙辛之岁寻庚上
  '丁': '壬', '壬': '壬',  // 丁壬壬寅顺水流
  '戊': '甲', '癸': '甲',  // 戊癸甲寅好追求
}

// 测试月柱计算
console.log('=== 月柱测试 ===\n')

// 测试用例：不同年份、不同月份
const testCases = [
  // { year, monthZhi, monthZhiIndex, expectedMonthGan, desc }
  // 乙卯年(1975) - 丑月
  { year: 1975, monthZhi: '丑', monthZhiIndex: 1, expected: '己丑', desc: '乙卯年丑月(用户反馈case)' },
  // 乙卯年 - 寅月
  { year: 1975, monthZhi: '寅', monthZhiIndex: 2, expected: '戊寅', desc: '乙卯年寅月' },
  // 乙卯年 - 卯月
  { year: 1975, monthZhi: '卯', monthZhiIndex: 3, expected: '己卯', desc: '乙卯年卯月' },
  // 乙巳年(2025) - 寅月
  { year: 2025, monthZhi: '寅', monthZhiIndex: 2, expected: '戊寅', desc: '乙巳年寅月' },
  // 乙巳年(2025) - 午月
  { year: 2025, monthZhi: '午', monthZhiIndex: 6, expected: '壬午', desc: '乙巳年午月' },
  // 乙巳年(2025) - 子月
  { year: 2025, monthZhi: '子', monthZhiIndex: 0, expected: '戊子', desc: '乙巳年子月' },
  // 甲子年(1984) - 寅月
  { year: 1984, monthZhi: '寅', monthZhiIndex: 2, expected: '丙寅', desc: '甲子年寅月' },
  // 甲子年(1984) - 卯月
  { year: 1984, monthZhi: '卯', monthZhiIndex: 3, expected: '丁卯', desc: '甲子年卯月' },
  // 庚午年(1990) - 寅月
  { year: 1990, monthZhi: '寅', monthZhiIndex: 2, expected: '戊寅', desc: '庚午年寅月' },
  // 庚午年(1990) - 午月
  { year: 1990, monthZhi: '午', monthZhiIndex: 6, expected: '壬午', desc: '庚午年午月' },
  // 丙寅年(1986) - 寅月
  { year: 1986, monthZhi: '寅', monthZhiIndex: 2, expected: '庚寅', desc: '丙寅年寅月' },
  // 丁卯年(1987) - 寅月
  { year: 1987, monthZhi: '寅', monthZhiIndex: 2, expected: '壬寅', desc: '丁卯年寅月' },
  // 戊辰年(1988) - 寅月
  { year: 1988, monthZhi: '寅', monthZhiIndex: 2, expected: '甲寅', desc: '戊辰年寅月' },
  // 癸亥年(1983) - 寅月
  { year: 1983, monthZhi: '寅', monthZhiIndex: 2, expected: '甲寅', desc: '癸亥年寅月' },
  // 辛巳年(2001) - 酉月
  { year: 2001, monthZhi: '酉', monthZhiIndex: 9, expected: '丁酉', desc: '辛巳年酉月' },
]

let allPassed = true

testCases.forEach(tc => {
  const yearGan = getYearGan(tc.year)
  const yearGanIndex = TIAN_GAN.indexOf(yearGan)
  const monthGan = getMonthGan(yearGanIndex, tc.monthZhiIndex)
  const monthPillar = monthGan + tc.monthZhi
  
  // 五虎遁验证
  const expectedYinMonthGan = WUHU_TABLE[yearGan]
  const actualYinMonthGan = getMonthGan(yearGanIndex, 2) // 寅月 index=2
  const wuhuCorrect = (actualYinMonthGan === expectedYinMonthGan)
  
  const passed = (monthPillar === tc.expected)
  if (!passed) allPassed = false
  
  console.log(`${passed ? '✅' : '❌'} ${tc.desc}`)
  console.log(`   年: ${yearGan}${getYearZhi(tc.year)}(${tc.year}) | 月柱: ${monthPillar} (期望: ${tc.expected})`)
  if (!wuhuCorrect) {
    console.log(`   ⚠️ 五虎遁验证失败: ${yearGan}年寅月应为${expectedYinMonthGan}寅，实际${actualYinMonthGan}寅`)
  }
  console.log()
})

console.log(allPassed ? '\n✅ 全部通过！' : '\n❌ 存在错误！')

// 额外：验证五虎遁全部10个天干
console.log('\n=== 五虎遁全量验证 ===')
const allWuhuCorrect = TIAN_GAN.every(gan => {
  const idx = TIAN_GAN.indexOf(gan)
  const yinGan = getMonthGan(idx, 2)
  const expected = WUHU_TABLE[gan]
  if (yinGan !== expected) {
    console.log(`❌ ${gan}年寅月应为${expected}，实际${yinGan}`)
    return false
  }
  console.log(`✅ ${gan}年寅月=${yinGan} (五虎遁: ${expected})`)
  return true
})
console.log(allWuhuCorrect ? '\n✅ 五虎遁全部正确' : '\n❌ 五虎遁有误')
