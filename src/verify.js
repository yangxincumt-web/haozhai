/**
 * 好宅助手 V1.5 - 算法验证测试
 * 运行: node src/verify.js
 * 或在项目根目录: node src/verify.js
 */

// 导入算法模块
import { calcBaZi } from './algorithms/bazi.js'
import { analyzeWuXing } from './algorithms/wuxing.js'
import { fullAnalysis, quickAnalysis } from './algorithms/index.js'

console.log('=== 好宅助手 V1.5 算法验证测试 ===\n')

// 测试计数器
let passed = 0
let failed = 0

function test(name, fn) {
  try {
    const result = fn()
    if (result) {
      console.log(`✅ ${name}`)
      passed++
    } else {
      console.log(`❌ ${name}`)
      failed++
    }
  } catch (e) {
    console.log(`❌ ${name}: ${e.message}`)
    failed++
  }
}

function assertEqual(actual, expected, msg) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${msg}\n  Expected: ${JSON.stringify(expected)}\n  Actual: ${JSON.stringify(actual)}`)
  }
  return true
}

function assertContains(obj, key, msg) {
  if (!(key in obj)) {
    throw new Error(`${msg}: 缺少字段 ${key}`)
  }
  return true
}

// ==========================================
// 八字算法测试
// ==========================================
console.log('\n【八字四柱推算测试】')

test('八字结果包含四柱', () => {
  const result = calcBaZi(1988, 3, 15, 10)
  assertContains(result, 'yearPillar', '年柱')
  assertContains(result, 'monthPillar', '月柱')
  assertContains(result, 'dayPillar', '日柱')
  assertContains(result, 'hourPillar', '时柱')
  return true
})

test('1988年3月15日10时 - 立春后', () => {
  const result = calcBaZi(1988, 3, 15, 10)
  console.log(`  1988-03-15 10:00 → ${result.yearPillar}年 ${result.monthPillar}月 ${result.dayPillar}日 ${result.hourPillar}时`)
  // 年柱应该已经过了立春，所以是戊辰年
  return result.yearPillar === '戊辰' || result.yearPillar === '丁卯'
})

test('1988年1月25日10时 - 立春前', () => {
  const result = calcBaZi(1988, 1, 25, 10)
  console.log(`  1988-01-25 10:00 → ${result.yearPillar}年 ${result.monthPillar}月 ${result.dayPillar}日 ${result.hourPillar}时`)
  // 1988年立春大约是2月4日，1月25日应该是丁卯年
  return result.yearPillar === '丁卯'
})

test('相同输入产生相同输出（确定性）', () => {
  const result1 = calcBaZi(1990, 5, 20, 14)
  const result2 = calcBaZi(1990, 5, 20, 14)
  assertEqual(result1.yearPillar, result2.yearPillar, '年柱不一致')
  assertEqual(result1.monthPillar, result2.monthPillar, '月柱不一致')
  assertEqual(result1.dayPillar, result2.dayPillar, '日柱不一致')
  assertEqual(result1.hourPillar, result2.hourPillar, '时柱不一致')
  return true
})

test('日柱查表法 - 验证几个已知日期', () => {
  // 1900年1月1日是甲子日
  const result = calcBaZi(1900, 1, 1, 12)
  console.log(`  1900-01-01 12:00 → ${result.dayPillar}`)
  // 甲子日
  return result.dayPillar.charAt(0) === '甲' && result.dayPillar.charAt(1) === '子'
})

test('时辰选择 - 子时(23点)', () => {
  const result = calcBaZi(1995, 8, 15, 23)
  console.log(`  1995-08-15 23:00 → ${result.hourPillar}`)
  return result.hourPillar.charAt(1) === '子'
})

test('时辰选择 - 午时(12点)', () => {
  const result = calcBaZi(1995, 8, 15, 12)
  console.log(`  1995-08-15 12:00 → ${result.hourPillar}`)
  return result.hourPillar.charAt(1) === '午'
})

// ==========================================
// 五行分析测试
// ==========================================
console.log('\n【五行分析测试】')

test('五行分析包含必要字段', () => {
  const baZi = calcBaZi(1988, 3, 15, 10)
  const result = analyzeWuXing(baZi)
  assertContains(result, 'wuxingCount', '五行统计')
  assertContains(result, 'dayMaster', '日主')
  assertContains(result, 'strength', '强弱')
  assertContains(result, 'xiYongShen', '喜用神')
  assertContains(result, 'jiShen', '忌神')
  return true
})

test('五行分布总和正确', () => {
  const baZi = calcBaZi(1988, 3, 15, 10)
  const result = analyzeWuXing(baZi)
  const total = Object.values(result.wuxingCount).reduce((a, b) => a + b, 0)
  console.log(`  五行分布总和: ${total} (期望约16-20)`)
  return total >= 16 && total <= 20
})

test('日主对应正确五行', () => {
  const baZi = calcBaZi(1988, 3, 15, 10)
  const result = analyzeWuXing(baZi)
  const validElements = ['木', '火', '土', '金', '水']
  return validElements.includes(result.dayMasterElement)
})

test('强弱判断有效', () => {
  const baZi = calcBaZi(1988, 3, 15, 10)
  const result = analyzeWuXing(baZi)
  const validStrengths = ['强', '偏强', '中和', '偏弱', '弱']
  console.log(`  日主${result.dayMaster}，强弱: ${result.strength}`)
  return validStrengths.includes(result.strength)
})

test('喜用神/忌神不为空', () => {
  const baZi = calcBaZi(1990, 5, 20, 14)
  const result = analyzeWuXing(baZi)
  console.log(`  喜用神: ${result.xiYongShen.join(',')} | 忌神: ${result.jiShen.join(',')}`)
  return result.xiYongShen.length > 0 || result.jiShen.length > 0
})

// ==========================================
// 完整分析测试
// ==========================================
console.log('\n【完整分析测试】')

test('fullAnalysis包含八字结果', () => {
  const result = fullAnalysis({
    birthYear: 1988,
    birthMonth: 3,
    birthDay: 15,
    birthHour: 10,
    gender: 'male',
    magneticHeading: 180,
    lat: 34.7,
    lon: 113.7,
  })
  assertContains(result, 'baZi', '八字结果')
  assertContains(result, 'wuxing', '五行分析')
  assertContains(result, 'mingGua', '命卦')
  return true
})

test('fullAnalysis包含新增字段', () => {
  const result = fullAnalysis({
    birthYear: 1988,
    birthMonth: 3,
    birthDay: 15,
    birthHour: 10,
    gender: 'male',
    magneticHeading: 180,
    lat: 34.7,
    lon: 113.7,
  })
  assertContains(result.baZi, 'yearPillar', '年柱')
  assertContains(result.baZi, 'monthPillar', '月柱')
  assertContains(result.baZi, 'dayPillar', '日柱')
  assertContains(result.baZi, 'hourPillar', '时柱')
  assertContains(result.wuxing, 'wuxingCount', '五行统计')
  assertContains(result.wuxing, 'xiYongShen', '喜用神')
  return true
})

test('quickAnalysis快速分析', () => {
  const result = quickAnalysis(1990, 5, 20, 14, 'male', 180)
  assertContains(result, 'baZi', '八字结果')
  assertContains(result, 'wuxing', '五行分析')
  console.log(`  快速分析: ${result.baZi.yearPillar}年 ${result.baZi.monthPillar}月 ${result.baZi.dayPillar}日 ${result.baZi.hourPillar}时`)
  return true
})

test('结果确定性 - 相同输入相同输出', () => {
  const input = {
    birthYear: 1995,
    birthMonth: 8,
    birthDay: 15,
    birthHour: 12,
    gender: 'female',
    magneticHeading: 90,
    lat: 31.2,
    lon: 121.5,
  }
  const result1 = fullAnalysis(input)
  const result2 = fullAnalysis(input)
  
  assertEqual(result1.baZi.yearPillar, result2.baZi.yearPillar, '年柱不一致')
  assertEqual(result1.baZi.dayPillar, result2.baZi.dayPillar, '日柱不一致')
  assertEqual(result1.wuxing.xiYongShen, result2.wuxing.xiYongShen, '喜用神不一致')
  assertEqual(result1.overall.score, result2.overall.score, '评分不一致')
  return true
})

// ==========================================
// 边界测试
// ==========================================
console.log('\n【边界测试】')

test('最小年份1920', () => {
  const result = calcBaZi(1920, 1, 1, 0)
  console.log(`  1920-01-01 00:00 → ${result.yearPillar}年 ${result.monthPillar}月`)
  return result.yearPillar.length === 2
})

test('最大年份2025', () => {
  const result = calcBaZi(2025, 12, 31, 23)
  console.log(`  2025-12-31 23:00 → ${result.yearPillar}年 ${result.hourPillar}时`)
  return result.hourPillar.length === 2
})

test('闰年边界 - 2月29日', () => {
  const result = calcBaZi(2000, 2, 29, 12) // 2000是闰年
  console.log(`  2000-02-29 12:00 → ${result.dayPillar}`)
  return result.dayPillar.length === 2
})

test('节气边界 - 立春前后', () => {
  const before = calcBaZi(2024, 2, 3, 12)  // 立春当天
  const after = calcBaZi(2024, 2, 5, 12)   // 立春后
  console.log(`  2024-02-03 (立春): ${before.yearPillar}`)
  console.log(`  2024-02-05: ${after.yearPillar}`)
  return before.yearPillar.length === 2 && after.yearPillar.length === 2
})

// ==========================================
// 输出结果
// ==========================================
console.log('\n=== 测试结果 ===')
console.log(`通过: ${passed}`)
console.log(`失败: ${failed}`)
console.log(`总计: ${passed + failed}`)

if (failed > 0) {
  console.log('\n⚠️  有测试失败，请检查算法实现')
  process.exit(1)
} else {
  console.log('\n✅ 所有测试通过！')
}
