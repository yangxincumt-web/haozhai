/**
 * 好宅助手 - 形煞评估算法
 * 提供常见形煞定义、影响评估和化解方案
 * V2.1：新增环境优势项（加分项）
 */

// 形煞定义库
export const XINGSHA_TYPES = {
  tianzhan: {
    id: 'tianzhan',
    name: '天斩煞',
    icon: '⚡',
    description: '两栋高楼夹缝对宅',
    severity: 'severe',
    impact: '家人容易发生意外、争吵、血光之灾',
    minDistance: 100, // 最近距离阈值（米）
    penalty: -15,
    resolutions: [
      '在面对天斩煞的窗户或门口悬挂凸面镜',
      '放置阔叶盆栽植物吸收煞气',
      '在门楣上挂山海镇或八卦镜',
      '安装厚窗帘减少直接冲射',
    ],
  },
  luchong: {
    id: 'luchong',
    name: '路冲',
    icon: '🛣️',
    description: '道路直冲家门',
    severity: 'severe',
    impact: '财运不稳、容易破财、口舌是非',
    minDistance: 50,
    penalty: -12,
    resolutions: [
      '在门内放置屏风或玄关阻隔',
      '门口摆放石狮子或大叶盆栽',
      '悬挂珠帘或风铃化解',
      '在门楣挂天官赐福或山海镇',
    ],
  },
  fanigong: {
    id: 'fanigong',
    name: '反弓煞',
    icon: '🏹',
    description: '弧形道路/河流外侧',
    severity: 'moderate',
    impact: '财运外流、家人离心、事业受阻',
    minDistance: 80,
    penalty: -10,
    resolutions: [
      '在反弓方向种植竹林或常青树',
      '挂山海镇或平面镜反射',
      '放置龙龟或铜马化解',
      '安装窗帘减少直冲',
    ],
  },
  jianjiao: {
    id: 'jianjiao',
    name: '尖角煞',
    icon: '🔺',
    description: '建筑尖角对宅',
    severity: 'moderate',
    impact: '健康问题、意外伤害、小人是非',
    minDistance: 60,
    penalty: -8,
    resolutions: [
      '悬挂八卦镜或凸面镜',
      '在尖角方向放置鱼缸或水景',
      '摆放阔叶植物遮挡',
      '在门窗挂珠帘缓解',
    ],
  },
  qiejiao: {
    id: 'qiejiao',
    name: '割脚煞',
    icon: '🛤️',
    description: '紧邻快速路或高架',
    severity: 'moderate',
    impact: '财运反复、事业动荡、感情波动',
    minDistance: 30,
    penalty: -10,
    resolutions: [
      '在靠近快速路一侧放置大型盆栽',
      '安装双层玻璃隔音',
      '挂山海镇或龙龟化解',
      '使用厚实窗帘阻挡',
    ],
  },
  gufeng: {
    id: 'gufeng',
    name: '孤峰煞',
    icon: '🏔️',
    description: '周围无等高建筑，孤零零',
    severity: 'mild',
    impact: '人丁不旺、财运寡薄、孤立无援',
    minDistance: 0, // 特殊：无邻近建筑
    penalty: -6,
    resolutions: [
      '自身加强：种植大树或建造围墙',
      '在屋内多放置圆形装饰品',
      '保持室内温暖明亮',
      '经常邀请亲友来访',
    ],
  },
  baihu: {
    id: 'baihu',
    name: '白虎煞',
    icon: '🐅',
    description: '右侧（白虎位）建筑明显高于本宅',
    severity: 'moderate',
    impact: '小人是非、破财损丁、女性运势受损',
    minDistance: 50,
    heightDiff: 3, // 高度差（米）
    penalty: -8,
    resolutions: [
      '在左侧（青龙位）种植高树或放高柜',
      '在白虎位放置铜鸡或白虎摆件',
      '加强自身运势，多做善事',
      '保持门窗常开，流通气场',
    ],
  },
  chuanxin: {
    id: 'chuanxin',
    name: '穿心煞',
    icon: '➡️',
    description: '道路/走廊/电梯直穿建筑',
    severity: 'severe',
    impact: '严重破财、健康受损、意外频发',
    minDistance: 20,
    penalty: -15,
    resolutions: [
      '在穿心位置设置屏风或玄关',
      '摆放泰山石敢当',
      '放置大叶植物形成屏障',
      '挂山海镇或八卦凸镜',
    ],
  },
}

/**
 * 根据用户勾选的形煞计算影响评分
 * @param {string[]} selectedTypes - 用户勾选的形煞ID数组
 * @returns {object} 包含总分、详细扣分和建议
 */
export function calculateXingshaScore(selectedTypes) {
  if (!selectedTypes || selectedTypes.length === 0) {
    return {
      totalPenalty: 0,
      severity: 'none',
      details: [],
      resolutions: [],
      summary: '未检测到明显形煞，环境气场较为平和。',
    }
  }

  let totalPenalty = 0
  const details = []
  const resolutions = new Set()
  const severityOrder = ['severe', 'moderate', 'mild']
  let maxSeverityIdx = 0

  for (const typeId of selectedTypes) {
    const xingsha = XINGSHA_TYPES[typeId]
    if (xingsha) {
      totalPenalty += xingsha.penalty
      details.push({
        id: typeId,
        name: xingsha.name,
        description: xingsha.description,
        impact: xingsha.impact,
        penalty: xingsha.penalty,
        resolutions: xingsha.resolutions,
      })
      xingsha.resolutions.forEach(r => resolutions.add(r))
      
      const idx = severityOrder.indexOf(xingsha.severity)
      if (idx > maxSeverityIdx) maxSeverityIdx = idx
    }
  }

  // 限制最低分数
  totalPenalty = Math.max(totalPenalty, -25)

  // 生成综合建议
  const summary = generateSummary(details, severityOrder[maxSeverityIdx])

  return {
    totalPenalty,
    severity: severityOrder[maxSeverityIdx],
    details,
    resolutions: Array.from(resolutions),
    summary,
  }
}

/**
 * 生成形煞影响总结
 */
function generateSummary(details, maxSeverity) {
  const count = details.length
  const severeCount = details.filter(d => d.penalty <= -12).length
  
  if (count === 0) {
    return '环境气场平和，无明显形煞干扰。'
  }
  
  if (count === 1) {
    const d = details[0]
    return `检测到${d.name}，${d.impact}。建议：${d.resolutions[0]}`
  }
  
  let summary = `检测到${count}种形煞（${severeCount}种较严重）：`
  details.forEach(d => {
    summary += ` ${d.name}；`
  })
  
  if (maxSeverity === 'severe') {
    summary += ' 情况较严重，建议尽快请专业人士现场勘察化解。'
  } else if (maxSeverity === 'moderate') {
    summary += ' 建议采取基础化解措施，如挂镜、植树等。'
  } else {
    summary += ' 影响较小，可通过简单布置缓解。'
  }
  
  return summary
}

/**
 * 获取形煞列表（用于UI展示）
 */
export function getXingshaList() {
  return Object.values(XINGSHA_TYPES).map(s => ({
    id: s.id,
    name: s.name,
    icon: s.icon,
    description: s.description,
    impact: s.impact,
    severity: s.severity,
  }))
}

// ===== 环境优势项（加分项） =====
export const ENV_ADVANTAGES = {
  mingshui: {
    id: 'mingshui',
    name: '明水环抱',
    icon: '💧',
    description: '门前有河流/湖泊/水池，且呈环抱之势',
    benefit: '旺财聚气，主财运亨通、人丁兴旺',
    bonus: 8,
    enhance: '可在明堂处放置风水轮或鱼缸，加强水气旺财',
  },
  kaoming: {
    id: 'kaoming',
    name: '明堂开阔',
    icon: '🌅',
    description: '门前视野开阔，无遮挡',
    benefit: '前途光明、事业顺遂、贵人运旺',
    bonus: 6,
    enhance: '保持明堂整洁通透，可在窗台放水晶球聚气',
  },
  qinglong: {
    id: 'qinglong',
    name: '青龙高耸',
    icon: '🐉',
    description: '左侧（青龙位）有高楼或山脉，高于白虎位',
    benefit: '贵人相助、事业有成、男丁兴旺',
    bonus: 5,
    enhance: '青龙位可放龙形摆件或高大家具加强气势',
  },
  kaoyou: {
    id: 'kaoyou',
    name: '靠山稳固',
    icon: '🏔️',
    description: '屋后有高楼或山丘作为靠山',
    benefit: '根基稳固、贵人扶持、事业有靠',
    bonus: 5,
    enhance: '坐方宜实不宜虚，可放泰山石加强靠山',
  },
  yushu: {
    id: 'yushu',
    name: '玉带环腰',
    icon: '🌈',
    description: '弧形道路/河流在内侧（环抱本宅）',
    benefit: '聚气生财、事业顺遂、人缘和谐',
    bonus: 7,
    enhance: '可在阳台种植阔叶绿植加强聚气效果',
  },
  lvhua: {
    id: 'lvhua',
    name: '绿化优良',
    icon: '🌳',
    description: '周边绿树成荫，公园或绿地近邻',
    benefit: '生气旺盛、健康长寿、心情舒畅',
    bonus: 3,
    enhance: '室内可放富贵竹、发财树等绿植接引生气',
  },
  caiguang: {
    id: 'caiguang',
    name: '采光充足',
    icon: '☀️',
    description: '日照充足，光线明亮',
    benefit: '阳气充盈、精神饱满、驱散阴邪',
    bonus: 4,
    enhance: '保持窗户通透，可挂水晶帘增强光线折射',
  },
  tongfeng: {
    id: 'tongfeng',
    name: '通风顺畅',
    icon: '🌬️',
    description: '自然通风良好，气流顺畅',
    benefit: '气场流通、浊气不聚、运势畅通',
    bonus: 3,
    enhance: '保持气口通畅，可在进气口挂风铃引吉气',
  },
}

/**
 * 根据用户勾选的优势项计算加分
 * @param {string[]} selectedIds - 用户勾选的优势ID数组
 * @returns {object}
 */
export function calculateEnvAdvantages(selectedIds) {
  if (!selectedIds || selectedIds.length === 0) {
    return {
      totalBonus: 0,
      advantages: [],
      summary: '',
    }
  }

  let totalBonus = 0
  const advantages = []

  for (const id of selectedIds) {
    const adv = ENV_ADVANTAGES[id]
    if (adv) {
      totalBonus += adv.bonus
      advantages.push({
        id: adv.id,
        name: adv.name,
        description: adv.description,
        benefit: adv.benefit,
        bonus: adv.bonus,
        enhance: adv.enhance,
      })
    }
  }

  // 上限15分
  totalBonus = Math.min(totalBonus, 15)

  const summary = advantages.length > 0
    ? `${advantages.length}项环境优势（+${totalBonus}分）：${advantages.map(a => a.name).join('、')}。${advantages[0].benefit}`
    : ''

  return { totalBonus, advantages, summary }
}

/**
 * 获取环境优势列表（用于UI展示）
 */
export function getAdvantageList() {
  return Object.values(ENV_ADVANTAGES).map(a => ({
    id: a.id,
    name: a.name,
    icon: a.icon,
    description: a.description,
    benefit: a.benefit,
    bonus: a.bonus,
  }))
}
