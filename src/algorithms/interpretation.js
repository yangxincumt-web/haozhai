/**
 * 好宅助手 - 知识解读引擎 V1.0
 * 基于堪舆学知识库Week1-12，将风水知识转化为"说人话"的解读
 * 
 * 数据来源：风水看盘APP/堪舆学知识库.md
 */

// ========== 八宅游年星解读 ==========
// 8个游年星的基础含义 + 各房间类型的具体建议

const YOUXING_BASE = {
  '生气': {
    nature: '大吉',
    element: '木',
    keyword: '财运、活力、生机',
    summary: '生气为贪狼星，主财运亨通、事业兴旺，是八宅中最旺的吉星。此方位气场活跃，适合需要创造力和行动力的空间。',
    colors: ['绿色', '青色', '碧色'],
    items: ['绿植', '木质家具', '流水摆件'],
    avoid: '不宜堆放杂物或设置卫生间，会压制生气磁场。',
    rooms: {
      '大门': '大门开在生气方，家宅纳气最旺，利于全家运势，尤其利财运和事业发展。',
      '主卧': '卧室在生气方，夫妻和睦，精力充沛，利于备孕。',
      '书房': '书房在生气方，思维活跃，利于创意工作和学业进步。',
      '客厅': '客厅在生气方，家庭氛围积极，社交运旺盛，朋友常聚。',
      '厨房': '厨房在生气方，饮食有节，家人身体健康，利于女性运势。',
      '卫生间': '卫生间在生气方，吉气被泄，建议保持干净整洁，放绿植化解。',
    }
  },
  '天医': {
    nature: '大吉',
    element: '土',
    keyword: '健康、长寿、贵人',
    summary: '天医为巨门星，主健康平安、贵人相助。此方位气场稳定温和，是最利于养生的方位。',
    colors: ['黄色', '米色', '咖啡色'],
    items: ['陶瓷摆件', '水晶球', '黄色靠垫'],
    avoid: '不宜设置嘈杂的娱乐设施，天医方需要安静。',
    rooms: {
      '大门': '大门开在天医方，家人少病少灾，容易遇到贵人。',
      '主卧': '卧室在天医方，最利健康。睡眠好、恢复快，特别适合体弱或术后康复的家庭成员。',
      '书房': '书房在天医方，思路清晰，适合需要深度思考的工作。',
      '客厅': '客厅在天医方，家庭和睦，少生口角，老人尤其受益。',
      '厨房': '厨房在天医方，饮食调理得当，家人脾胃健康。',
      '卫生间': '卫生间在天医方，健康气场受损。建议放黄水晶或陶瓷制品稳固土气。',
    }
  },
  '延年': {
    nature: '大吉',
    element: '金',
    keyword: '长寿、和睦、稳定',
    summary: '延年为武曲星，主家庭和睦、关系稳定。此方位气场沉稳，最利于婚姻感情和人际关系。',
    colors: ['白色', '银色', '金色'],
    items: ['铜器', '金属装饰品', '白色花瓶'],
    avoid: '不宜过于单调冷清，适当加入暖色灯光增加温馨感。',
    rooms: {
      '大门': '大门开在延年方，人际关系好，邻居和睦，利于合作。',
      '主卧': '卧室在延年方，夫妻感情稳定长久，婚姻美满。最利新婚夫妻或感情需要稳定的伴侣。',
      '书房': '书房在延年份，专注力强，适合需要耐心和细心的工作。',
      '客厅': '客厅在延年方，家庭关系融洽，适合全家共同活动。',
      '厨房': '厨房在延年方，饮食规律，家人肠胃健康。',
      '卫生间': '卫生间在延年方，影响家庭和睦。保持干燥通风，放铜制品化解。',
    }
  },
  '伏位': {
    nature: '小吉',
    element: '木',
    keyword: '平稳、安定、守成',
    summary: '伏位为辅弼星，主平稳安定。此方位不旺不衰，适合需要安静和稳定的空间，但不适合追求突破。',
    colors: ['绿色', '原木色'],
    items: ['木质书架', '盆栽', '竹制品'],
    avoid: '不宜设置激励性强的元素（如大红大紫的装饰），会打破伏位的平和。',
    rooms: {
      '大门': '大门开在伏位方，家运平稳，不升不降，适合追求安稳的家庭。',
      '主卧': '卧室在伏位方，睡眠质量好，适合老年人或需要静养的人。',
      '书房': '书房在伏位方，心境平和，适合阅读冥想，但缺少冲劲。',
      '客厅': '客厅在伏位方，家庭生活平淡如水，适合不喜欢热闹的家庭。',
      '厨房': '厨房在伏位方，饮食清淡，家人性格温和。',
      '卫生间': '卫生间在伏位方，影响不大，保持整洁即可。',
    }
  },
  '祸害': {
    nature: '凶',
    element: '金',
    keyword: '口舌、争吵、破财',
    summary: '祸害为禄存星，主口舌是非、破财损耗。此方位气场尖锐，容易引发争吵和矛盾。',
    colors: ['蓝色', '黑色'],
    items: ['鱼缸', '流水摆件', '黑色地毯'],
    avoid: '不宜放刀剑等尖锐物品，会加重祸害的凶性。',
    rooms: {
      '大门': '大门开在祸害方，容易有口舌之争，家人不和。建议门内放鱼缸或流水化解。',
      '主卧': '卧室在祸害方，夫妻容易吵架、冷战。建议床头放水杯或蓝色系床品化解。',
      '书房': '书房在祸害方，工作思路容易出错，被人误解。保持桌面整洁，放蓝色文具。',
      '客厅': '客厅在祸害方，家中常有争吵声。建议客厅放圆形装饰品柔化气场。',
      '厨房': '厨房在祸害方，烹饪时容易急躁，饮食不规律。建议厨房用蓝色系餐具。',
      '卫生间': '卫生间在祸害方，凶气被水泄，影响反而减小。但仍需保持清洁。',
    }
  },
  '六煞': {
    nature: '凶',
    element: '水',
    keyword: '烂桃花、淫佚、破财',
    summary: '六煞为文曲星，主桃花劫、情感纠葛。此方位气场散漫，容易引发不当的男女关系和财务损失。',
    colors: ['白色', '金色'],
    items: ['铜葫芦', '金属风铃', '五帝钱'],
    avoid: '不宜放太多水景或暗色装饰，会加重六煞水性。',
    rooms: {
      '大门': '大门开在六煞方，容易招惹烂桃花或不正之人。建议门口放铜葫芦收煞。',
      '主卧': '卧室在六煞方，已婚者容易有感情困扰。建议床头挂五帝钱，用金色系床品。',
      '书房': '书房在六煞方，注意力不集中，容易分心想入非非。书桌放金属文具可收心。',
      '客厅': '客厅在六煞方，社交圈子复杂，容易交到损友。建议客厅放铜制品净化气场。',
      '厨房': '厨房在六煞方，饮食容易出问题（食物中毒、饮食不洁）。注意食品卫生。',
      '卫生间': '卫生间在六煞方，桃花煞被水泄，反而影响较小。',
    }
  },
  '五鬼': {
    nature: '大凶',
    element: '火',
    keyword: '火灾、意外、失火',
    summary: '五鬼为廉贞星，主火灾、意外事故、突发变故。此方位气场躁动，是最需要重视的凶方。',
    colors: ['黄色', '棕色'],
    items: ['陶瓷花瓶', '黄水晶', '石头摆件'],
    avoid: '严禁放红色装饰、蜡烛、暖炉等火属性物品，会引爆五鬼火性。',
    rooms: {
      '大门': '大门开在五鬼方，家中容易出意外事故。必须放陶瓷或黄水晶镇宅。',
      '主卧': '卧室在五鬼方，睡眠质量极差，容易做噩梦、失眠。强烈建议换房间，或在床头放陶瓷化煞。',
      '书房': '书房在五鬼方，工作容易出纰漏，思维混乱。桌上放黄水晶球稳定思维。',
      '客厅': '客厅在五鬼方，家中多有变故，人心惶惶。客厅放大型陶瓷花瓶镇宅。',
      '厨房': '厨房在五鬼方，火灾隐患最大！炉灶远离易燃物，厨房备灭火器，放陶瓷碗柜。',
      '卫生间': '卫生间在五鬼方，火性被水克，反而凶性大减。这是五鬼方最好的用法。',
    }
  },
  '绝命': {
    nature: '大凶',
    element: '金',
    keyword: '绝症、手术、绝后',
    summary: '绝命为破军星，主重大疾病、手术、绝症。此方位气场肃杀，对健康危害最大。',
    colors: ['蓝色', '黑色'],
    items: ['鱼缸', '黑色地毯', '水晶洞'],
    avoid: '严禁放金属锐器、刀剑、镜子对床。',
    rooms: {
      '大门': '大门开在绝命方，家人健康堪忧，容易有重大疾病。门口放鱼缸或黑色地毯化煞。',
      '主卧': '卧室在绝命方，对健康危害最大。床头放水杯或鱼缸，用蓝色系床品。如能换房间最好。',
      '书房': '书房在绝命方，工作压力大，容易焦虑抑郁。书房放流水摆件或养鱼。',
      '客厅': '客厅在绝命方，家运衰败，家人关系冷淡。客厅放大型鱼缸激活生气。',
      '厨房': '厨房在绝命方，家人脾胃容易出问题。厨房用蓝色系厨具，放黑色餐具。',
      '卫生间': '卫生间在绝命方，凶气被水泄，危害减小。但仍需保持干净，放黑色装饰。',
    }
  }
}

// ========== 玄空飞星解读 ==========

const FEIXING_STARS = {
  1: {
    name: '一白贪狼',
    element: '水',
    nature: '吉',
    keyword: '事业、桃花、文昌',
    summary: '一白星为吉星，主事业升迁、人缘桃花。当运时大利文昌和官运。',
    activate: '放鱼缸、流水摆件、蓝色装饰。',
    suppress: '放土属性物品（陶瓷、黄水晶）克制。'
  },
  2: {
    name: '二黑巨门',
    element: '土',
    nature: '凶',
    keyword: '病符、疾病、阴煞',
    summary: '二黑星为病符星，主疾病、手术、阴气重。尤其影响脾胃和呼吸系统。',
    activate: '不建议催旺。',
    suppress: '放铜器、金属风铃、五帝钱。用金泄土，化解病气。'
  },
  3: {
    name: '三碧禄存',
    element: '木',
    nature: '凶',
    keyword: '官非、口舌、争斗',
    summary: '三碧星为是非星，主官司、口角、争吵。容易引发法律纠纷和人际冲突。',
    activate: '不建议催旺。',
    suppress: '放红色装饰、中国结、红灯笼。用火泄木，平息是非。'
  },
  4: {
    name: '四绿文昌',
    element: '木',
    nature: '吉',
    keyword: '学业、考试、名声',
    summary: '四绿星为文昌星，主考试运、学业进步、文艺创作。学生和艺术工作者最喜此星。',
    activate: '放文昌塔、四支富贵竹、蓝色文具。',
    suppress: '放金属物品克制。不建议在学生房放。'
  },
  5: {
    name: '五黄廉贞',
    element: '土',
    nature: '最凶',
    keyword: '瘟疫、意外、血光',
    summary: '五黄星为最凶之星，主瘟疫、重大疾病、血光之灾。每年飞临方位需重点化解。',
    activate: '严禁催旺！',
    suppress: '放铜葫芦、六帝钱、安忍水。用金泄土，保持安静，此方位忌动土、忌红色。'
  },
  6: {
    name: '六白武曲',
    element: '金',
    nature: '吉',
    keyword: '偏财、权力、武职',
    summary: '六白星为偏财星，主意外之财、权柄名望。利于金融投资和管理层。',
    activate: '放金属聚宝盆、铜貔貅、金色装饰。',
    suppress: '放红色物品克制。'
  },
  7: {
    name: '七赤破军',
    element: '金',
    nature: '凶',
    keyword: '盗贼、破财、口舌',
    summary: '七赤星为破军星，主盗贼、破财、手术。在下元九运中为退气星，凶性减弱但仍需注意。',
    activate: '不建议催旺。',
    suppress: '放黑色物品、鱼缸。用水泄金，减少破耗。'
  },
  8: {
    name: '八白左辅',
    element: '土',
    nature: '大吉',
    keyword: '正财、置业、功名',
    summary: '八白星为正财星，在八运中为当令旺星（2004-2023），虽已进入九运但仍有余气。大利财运和置业。',
    activate: '放黄水晶、陶瓷制品、金色装饰。',
    suppress: '放绿色植物克制。不建议压制。'
  },
  9: {
    name: '九紫右弼',
    element: '火',
    nature: '吉',
    keyword: '姻缘、喜庆、光明',
    summary: '九紫星为喜庆星，在九运（2024-2043）中为当令旺星。主姻缘、结婚、添丁、荣誉。',
    activate: '放红色装饰、中国结、紫水晶、九支百合。',
    suppress: '放蓝色或黑色物品克制。不建议压制。'
  }
}

// ========== 飞星组合解读（山星+向星常见组合）==========

const FEIXING_COMBOS = {
  '1-1': { name: '双一白', nature: '吉', desc: '双旺桃花，人缘极佳，但过旺则感情纷扰。' },
  '1-6': { name: '一六联珠', nature: '大吉', desc: '文昌大利，功名显达，利学业考试。' },
  '1-8': { name: '一八同宫', nature: '吉', desc: '财官双美，事业财运兼收。' },
  '2-5': { name: '二五交加', nature: '最凶', desc: '大病大灾之局，必须用重金器化解，此方位不可久留。' },
  '6-8': { name: '六八同宫', nature: '大吉', desc: '正偏财兼收，最利投资理财。' },
  '6-9': { name: '六九同宫', nature: '吉', desc: '火炼秋金，财官双旺，利管理层。' },
  '8-9': { name: '八九同宫', nature: '大吉', desc: '九运最旺组合，丁财两旺，喜气盈门。' },
  '9-9': { name: '双九紫', nature: '大吉', desc: '喜庆重重，利婚嫁添丁。但火气过旺，注意心血管。' },
}

// ========== 主入口函数 ==========

/**
 * 获取游年星解读
 * @param {string} youxing - 游年星名称（生气/天医/延年/伏位/祸害/六煞/五鬼/绝命）
 * @param {string} roomType - 房间类型（大门/主卧/书房/客厅/厨房/卫生间）
 * @returns {Object} 解读内容
 */
export function getYouXingInterpretation(youxing, roomType) {
  const base = YOUXING_BASE[youxing]
  if (!base) return null

  const roomAdvice = base.rooms[roomType] || base.rooms['客厅'] // 默认用客厅的建议
  
  return {
    nature: base.nature,
    element: base.element,
    keyword: base.keyword,
    summary: base.summary,
    roomAdvice,
    colors: base.colors,
    items: base.items,
    avoid: base.avoid,
  }
}

/**
 * 获取飞星解读
 * @param {number} starNum - 飞星数字 1-9
 * @returns {Object} 解读内容
 */
export function getFeiXingInterpretation(starNum) {
  return FEIXING_STARS[starNum] || null
}

/**
 * 获取飞星组合解读
 * @param {number} mountain - 山星数字
 * @param {number} facing - 向星数字
 * @returns {Object} 解读内容
 */
export function getFeiXingCombo(mountain, facing) {
  const key1 = `${mountain}-${facing}`
  const key2 = `${facing}-${mountain}`
  return FEIXING_COMBOS[key1] || FEIXING_COMBOS[key2] || null
}

/**
 * 生成方位解读文本（用于结果页展示）
 * @param {Object} palace - 八宅宫位数据
 * @param {Object} feiXingData - 飞星数据
 * @param {string} roomType - 房间类型
 * @returns {string} 完整解读文本
 */
export function generatePalaceNarrative(palace, feiXingData, roomType) {
  const parts = []
  
  // 八宅解读
  if (palace && palace.youxing) {
    const interp = getYouXingInterpretation(palace.youxing, roomType)
    if (interp) {
      parts.push(`【八宅·${palace.youxing}】${interp.summary}`)
      if (roomType && interp.roomAdvice) {
        parts.push(`${roomType}在此方位：${interp.roomAdvice}`)
      }
    }
  }
  
  // 飞星解读
  if (feiXingData) {
    const mountainStar = feiXingData.mountain
    const facingStar = feiXingData.facing
    if (mountainStar && FEIXING_STARS[mountainStar]) {
      parts.push(`【飞星·山星${mountainStar}】${FEIXING_STARS[mountainStar].summary}`)
    }
    if (facingStar && FEIXING_STARS[facingStar]) {
      parts.push(`【飞星·向星${facingStar}】${FEIXING_STARS[facingStar].summary}`)
    }
    // 组合解读
    if (mountainStar && facingStar) {
      const combo = getFeiXingCombo(mountainStar, facingStar)
      if (combo) {
        parts.push(`【组合·${combo.name}】${combo.desc}`)
      }
    }
  }
  
  return parts.join('\n')
}

// 导出原始数据供组件使用
export { YOUXING_BASE, FEIXING_STARS, FEIXING_COMBOS }
