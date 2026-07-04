/**
 * 好宅助手 - 算法验证脚本
 * 用经典案例验证算法正确性
 * 
 * 运行方式：node verify.js
 */

// 直接导入（Node.js需用import，这里用简单的复制方式）
// 在实际项目中会用Vite打包，这里直接内联核心算法验证

import { calcMingGua, checkRenZhaiMatch } from './minggua.js'
import { baZhaiPan, angleToZhaiGua } from './bazhai.js'
import { calcDeclination, magneticToTrueNorth } from './declination.js'
import { generateHuaJieReport } from './huajie.js'
import { quickAnalysis } from './index.js'

let passCount = 0
let failCount = 0

function assert(condition, testName) {
  if (condition) {
    console.log(`  ✅ ${testName}`)
    passCount++
  } else {
    console.log(`  ❌ ${testName}`)
    failCount++
  }
}

// ========== 命卦计算验证 ==========
console.log('\n【命卦计算验证】')

// 案例1：1988年男性
const mg1 = calcMingGua(1988, 'male')
assert(mg1.name === '震', `1988年男命应为震卦，实际=${mg1.name}`)
assert(mg1.group === 'east', `震卦应为东四命，实际=${mg1.groupLabel}`)

// 案例2：1988年女性 → (88-4)%9=84%9=3 → 震卦
const mg2 = calcMingGua(1988, 'female')
assert(mg2.name === '震', `1988年女命应为震卦，实际=${mg2.name}`)
assert(mg2.group === 'east', `震卦应为东四命，实际=${mg2.groupLabel}`)

// 案例3：1990年男性 → (100-90)%9=10%9=1 → 坎卦
const mg3 = calcMingGua(1990, 'male')
assert(mg3.name === '坎', `1990年男命应为坎卦，实际=${mg3.name}`)
assert(mg3.group === 'east', `坎卦应为东四命，实际=${mg3.groupLabel}`)

// 案例4：1990年女性 → (90-4)%9=86%9=5 → 中宫5→艮8
const mg4 = calcMingGua(1990, 'female')
assert(mg4.name === '艮', `1990年女命(余数5→艮)应为艮卦，实际=${mg4.name}`)
assert(mg4.group === 'west', `艮卦应为西四命，实际=${mg4.groupLabel}`)

// 案例5：2000年男性 → (100-0)%9=100%9=1 → 坎卦
const mg5 = calcMingGua(2000, 'male')
assert(mg5.name === '坎', `2000年男命应为坎卦，实际=${mg5.name}`)
assert(mg5.group === 'east', `坎卦应为东四命，实际=${mg5.groupLabel}`)

// 案例6：中宫5的处理 - 1979年男性 → (100-79)%9=21%9=3 → 震卦（非5）
// 用一个确认为5的：1959年男性 → (100-59)%9=41%9=5 → 坤2
const mg6 = calcMingGua(1959, 'male')
assert(mg6.name === '坤', `1959年男命(余数5→坤)应为坤卦，实际=${mg6.name}`)

// 案例7：中宫5的处理 - 1990年女性 → (90-4)%9=86%9=5 → 艮8
// 已在案例4验证，增加：1968年女性 → (68-4)%9=64%9=1 → 坎
const mg7 = calcMingGua(1968, 'female')
assert(mg7.name === '坎', `1968年女命应为坎卦，实际=${mg7.name}`)


// ========== 八宅排盘验证 ==========
console.log('\n【八宅排盘验证】')

// 案例1：坐北朝南（坎宅）
// 朝向=南(180°)→坐=北→宅卦=坎
const zg1 = angleToZhaiGua(180)
assert(zg1.zhaiGua === '坎', `朝南应为坎宅，实际=${zg1.zhaiGua}`)
assert(zg1.zhaiGroup === 'east', `坎宅为东四宅`)

// 案例2：坐南朝北（离宅）
// 朝向=北(0°)→坐=南→宅卦=离
const zg2 = angleToZhaiGua(0)
assert(zg2.zhaiGua === '离', `朝北应为离宅，实际=${zg2.zhaiGua}`)

// 案例3：坐东朝西（震宅）
// 朝向=西(270°)→坐=东→宅卦=震
const zg3 = angleToZhaiGua(270)
assert(zg3.zhaiGua === '震', `朝西应为震宅，实际=${zg3.zhaiGua}`)

// 案例4：坐西北朝东南（乾宅）
// 朝向=东南(135°)→坐=西北→宅卦=乾
const zg4 = angleToZhaiGua(135)
assert(zg4.zhaiGua === '乾', `朝东南应为乾宅，实际=${zg4.zhaiGua}`)

// 坎宅排盘验证（经典案例）
// 坎宅：坎伏位、艮五鬼、震天医、巽生气、离延年、坤绝命、兑祸害、乾六煞
const pan1 = baZhaiPan(180, calcMingGua(1990, 'male'))  // 离命+坎宅
const kanDistribution = {}
pan1.palaces.forEach(p => { kanDistribution[p.position] = p.youxing })
assert(kanDistribution['北'] === '伏位', `坎宅北=伏位，实际=${kanDistribution['北']}`)
assert(kanDistribution['南'] === '延年', `坎宅南=延年，实际=${kanDistribution['南']}`)
assert(kanDistribution['东'] === '天医', `坎宅东=天医，实际=${kanDistribution['东']}`)
assert(kanDistribution['东南'] === '生气', `坎宅东南=生气，实际=${kanDistribution['东南']}`)
assert(kanDistribution['东北'] === '五鬼', `坎宅东北=五鬼，实际=${kanDistribution['东北']}`)
assert(kanDistribution['西南'] === '绝命', `坎宅西南=绝命，实际=${kanDistribution['西南']}`)
assert(kanDistribution['西'] === '祸害', `坎宅西=祸害，实际=${kanDistribution['西']}`)
assert(kanDistribution['西北'] === '六煞', `坎宅西北=六煞，实际=${kanDistribution['西北']}`)

// 人宅匹配验证：离命+坎宅=东四命+东四宅=匹配
assert(pan1.overall.match === true, `离命+坎宅应匹配`)


// ========== 磁偏角验证 ==========
console.log('\n【磁偏角验证】')

// 郑州磁偏角约-4.8°
const declZZ = calcDeclination(34.7, 113.7)
assert(Math.abs(declZZ.declination - (-4.8)) < 1.0, `郑州磁偏角应约-4.8°，实际=${declZZ.declination}°`)

// 北京磁偏角约-6.0°
const declBJ = calcDeclination(39.9, 116.4)
assert(Math.abs(declBJ.declination - (-6.0)) < 1.0, `北京磁偏角应约-6.0°，实际=${declBJ.declination}°`)

// 磁北转真北验证
// 郑州磁北0°→真北=0+(-4.8)=355.2°
const m2t = magneticToTrueNorth(0, 34.7, 113.7)
assert(Math.abs(m2t.trueNorth - 355.2) < 1.0, `郑州磁北0°→真北应约355.2°，实际=${m2t.trueNorth}°`)


// ========== 化解方案验证 ==========
console.log('\n【化解方案验证】')

// 坎宅的凶位应该有化解方案
const huajie1 = generateHuaJieReport(pan1.palaces)
assert(huajie1.problems.length === 4, `坎宅应有4个凶位问题，实际=${huajie1.problems.length}`)
assert(huajie1.items.length > 0, `应有摆件推荐，实际=${huajie1.items.length}个`)
assert(huajie1.suggestions.length === 8, `应有8个建议（4凶+4吉），实际=${huajie1.suggestions.length}`)

// 五鬼位应有铜葫芦推荐
const wugui = huajie1.items.find(i => i.reason.includes('五鬼'))
assert(wugui !== undefined, `五鬼位应有摆件推荐`)
assert(wugui.name.includes('葫芦'), `五鬼位应推荐铜葫芦，实际=${wugui.name}`)


// ========== 完整流程验证 ==========
console.log('\n【完整流程验证】')

const full = quickAnalysis(1988, 'male', 180)  // 1988男+朝南
assert(full.mingGua.name === '震', `命卦=震`)
assert(full.zhaiGua.zhaiGua === '坎', `宅卦=坎`)
assert(full.overall.score > 0, `评分>0，实际=${full.overall.score}`)
assert(full.summary.length > 50, `总结文案应>50字`)
assert(full.huajie.items.length > 0, `应有摆件推荐`)

console.log(`\n总结文案：${full.summary}`)


// ========== 最终统计 ==========
console.log(`\n${'='.repeat(40)}`)
console.log(`验证完成：✅ ${passCount} 通过 / ❌ ${failCount} 失败`)
if (failCount > 0) {
  console.log('⚠️ 有验证未通过，请检查算法！')
  process.exit(1)
} else {
  console.log('🎉 所有验证通过，算法正确！')
}
