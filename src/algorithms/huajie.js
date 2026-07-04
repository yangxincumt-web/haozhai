/**
 * 好宅助手 - 化解方案库 V3.0
 * 
 * V3.0升级：
 * - 飞星组合化解从6种→覆盖全部关键组合（含三星组合）
 * - 新增宫位五行联动化解（法器五行 vs 宫位五行）
 * - 新增流年飞星动态化解（每年凶方位不同，化解法不同）
 * - 新增反吟伏吟专项化解
 * - 新增房间类型联动（同一凶星在卧室vs客厅vs厨房，化解法不同）
 * 
 * 数据来源：沈氏玄空学 + 八宅明镜 + 堪舆学知识库Week11 + 常见风水化解法
 */

// ===== 八宅游星化解方案 =====
const HUAJIE_SCHEMES = {
  // 五鬼位化解
  '五鬼': {
    problem: '五鬼廉贞火位，主口舌是非、灾祸、精神不安',
    solutions: [
      {
        level: '轻调',
        desc: '铜葫芦挂于该方位，泄五鬼土气',
        items: [
          { name: '铜葫芦', material: '铜', element: '金', price: '¥68-128', searchKey: '风水铜葫芦化五鬼' },
        ],
      },
      {
        level: '中调',
        desc: '铜葫芦 + 五帝钱，泄土镇煞双重化解',
        items: [
          { name: '铜葫芦', material: '铜', element: '金', price: '¥68-128', searchKey: '风水铜葫芦' },
          { name: '五帝钱', material: '铜', element: '金', price: '¥58-168', searchKey: '风水五帝钱挂件' },
        ],
      },
      {
        level: '大改',
        desc: '铜葫芦 + 五帝钱 + 安忍水，全面化解五鬼煞气',
        items: [
          { name: '铜葫芦', material: '铜', element: '金', price: '¥68-128', searchKey: '风水铜葫芦' },
          { name: '五帝钱', material: '铜', element: '金', price: '¥58-168', searchKey: '风水五帝钱挂件' },
          { name: '安忍水', material: '盐+银币', element: '金水', price: '¥38-88', searchKey: '风水安忍水' },
        ],
      },
    ],
    roomAdvice: '宜做卫生间、储物间，忌做卧室、厨房',
  },

  // 六煞位化解
  '六煞': {
    problem: '六煞文曲水位，主桃花劫煞、感情纠葛、口舌纠纷',
    solutions: [
      {
        level: '轻调',
        desc: '该方位放置绿植，木泄水气',
        items: [
          { name: '富贵竹', material: '木', element: '木', price: '¥15-30', searchKey: '风水富贵竹' },
        ],
      },
      {
        level: '中调',
        desc: '绿植 + 粉水晶球，化解桃花同时安神',
        items: [
          { name: '富贵竹', material: '木', element: '木', price: '¥15-30', searchKey: '风水富贵竹' },
          { name: '粉水晶球', material: '水晶', element: '土', price: '¥58-198', searchKey: '粉水晶球风水摆件' },
        ],
      },
      {
        level: '大改',
        desc: '绿植 + 粉水晶 + 白玉葫芦，三重化解六煞水气',
        items: [
          { name: '发财树', material: '木', element: '木', price: '¥68-198', searchKey: '风水发财树摆件' },
          { name: '粉水晶球', material: '水晶', element: '土', price: '¥58-198', searchKey: '粉水晶球风水摆件' },
          { name: '白玉葫芦', material: '玉', element: '土', price: '¥88-268', searchKey: '白玉葫芦风水' },
        ],
      },
    ],
    roomAdvice: '宜做卫生间，忌做卧室（尤其主卧）',
  },

  // 祸害位化解
  '祸害': {
    problem: '祸害禄存土位，主疾病、伤灾、口舌',
    solutions: [
      {
        level: '轻调',
        desc: '该方位放置铜制风铃，金泄土气',
        items: [
          { name: '铜风铃', material: '铜', element: '金', price: '¥28-68', searchKey: '铜风铃风水挂件' },
        ],
      },
      {
        level: '中调',
        desc: '铜风铃 + 六帝钱，双金泄土',
        items: [
          { name: '铜风铃', material: '铜', element: '金', price: '¥28-68', searchKey: '铜风铃风水挂件' },
          { name: '六帝钱', material: '铜', element: '金', price: '¥48-128', searchKey: '风水六帝钱' },
        ],
      },
      {
        level: '大改',
        desc: '铜麒麟 + 六帝钱 + 金蟾，三重泄土化煞',
        items: [
          { name: '铜麒麟', material: '铜', element: '金', price: '¥128-398', searchKey: '铜麒麟风水摆件' },
          { name: '六帝钱', material: '铜', element: '金', price: '¥48-128', searchKey: '风水六帝钱' },
          { name: '金蟾', material: '铜', element: '金', price: '¥68-258', searchKey: '风水金蟾摆件' },
        ],
      },
    ],
    roomAdvice: '宜做杂物间、储物间，忌做卧室、书房',
  },

  // 绝命位化解
  '绝命': {
    problem: '绝命破军金位，大凶之位，主灾祸、破财、健康受损',
    solutions: [
      {
        level: '轻调',
        desc: '该方位放置貔貅，镇煞辟邪',
        items: [
          { name: '貔貅摆件', material: '铜/玉石', element: '金/土', price: '¥88-298', searchKey: '风水貔貅摆件镇宅' },
        ],
      },
      {
        level: '中调',
        desc: '貔貅 + 五帝钱 + 铜葫芦，三重化解',
        items: [
          { name: '貔貅摆件', material: '铜', element: '金', price: '¥88-298', searchKey: '风水貔貅摆件' },
          { name: '五帝钱', material: '铜', element: '金', price: '¥58-168', searchKey: '风水五帝钱' },
          { name: '铜葫芦', material: '铜', element: '金', price: '¥68-128', searchKey: '风水铜葫芦' },
        ],
      },
      {
        level: '大改',
        desc: '龙龟 + 貔貅 + 泰山石，强力镇宅化绝命煞',
        items: [
          { name: '龙龟摆件', material: '铜/玉石', element: '金/土', price: '¥158-498', searchKey: '风水龙龟摆件镇宅' },
          { name: '貔貅摆件', material: '黑曜石', element: '水/金', price: '¥98-328', searchKey: '黑曜石貔貅摆件' },
          { name: '泰山石', material: '石', element: '土', price: '¥68-288', searchKey: '泰山石敢当镇宅' },
        ],
      },
    ],
    roomAdvice: '宜做卫生间，绝对忌做卧室、大门',
  },
}

// ===== 飞星组合化解方案（全面覆盖）=====
// 按山星+向星组合的凶格提供精准化解
// 原则：根据凶星五行属性，用「泄」或「制」的方法化解
const FEIXING_HUAJIE = {
  // ===== 最凶组合：五黄+二黑 =====
  '2_5': {
    problem: '二五交加，最凶之局，主重病、横祸、损丁破财',
    element: '土', // 二黑五黄皆属土，需用金泄
    solutions: [
      { desc: '挂铜钟或铜风铃，以金泄土气，声响化煞效果更佳', items: ['铜钟', '铜风铃', '六帝钱'] },
      { desc: '安忍水（玻璃瓶盐水放六枚铜钱），专化二五交加', items: ['安忍水', '铜葫芦'] },
    ],
    roomAdvice: '此方位绝对不可做卧室、厨房、大门，宜做卫生间或空置',
    severity: '严重',
    avoid: ['红色物品', '黄色物品', '陶瓷', '蜡烛', '地毯'], // 火生土、土助土
    prefer: ['铜器', '金属风铃', '六帝钱', '安忍水'], // 金泄土
  },
  '5_2': {
    problem: '五二交加，凶上加凶，主疾病缠身、官非口舌',
    element: '土',
    solutions: [
      { desc: '安忍水为首选化解物，配合铜葫芦挂于该方位', items: ['安忍水', '铜葫芦', '六帝钱'] },
      { desc: '铜麒麟一对镇煞，配六帝钱增强效果', items: ['铜麒麟', '六帝钱', '铜钟'] },
    ],
    roomAdvice: '绝对不可做卧室，宜做卫生间或储物间',
    severity: '严重',
    avoid: ['红色物品', '黄色物品', '陶瓷', '地毯'],
    prefer: ['安忍水', '铜器', '铜麒麟'],
  },
  '5_5': {
    problem: '双五黄叠加，极凶之象，主大灾大病',
    element: '土',
    solutions: [
      { desc: '重法器镇煞：铜钟+安忍水+六帝钱三件套', items: ['铜钟', '安忍水', '六帝钱'] },
      { desc: '铜麒麟一对+铜葫芦+六帝钱，全面镇压', items: ['铜麒麟', '铜葫芦', '六帝钱'] },
    ],
    roomAdvice: '此方位不可使用，宜空置或做储物间，远离此方位活动',
    severity: '严重',
    avoid: ['红色', '黄色', '陶瓷', '火属性物品'],
    prefer: ['铜钟', '安忍水', '六帝钱', '铜麒麟'],
  },
  '2_2': {
    problem: '双二黑叠加，病符叠至，主慢性病、妇科疾病',
    element: '土',
    solutions: [
      { desc: '铜葫芦一对挂于该方位，配六帝钱泄土气', items: ['铜葫芦', '六帝钱'] },
      { desc: '安忍水一瓶放于该方位', items: ['安忍水', '铜风铃'] },
    ],
    roomAdvice: '不宜做卧室，尤其不利女主人健康',
    severity: '注意',
    avoid: ['红色', '黄色'],
    prefer: ['铜葫芦', '六帝钱', '安忍水'],
  },
  // ===== 三七组合（官非、盗贼）=====
  '3_7': {
    problem: '三七叠至，主官非口舌、盗贼劫掠、手足损伤',
    element: '金木交战',
    solutions: [
      { desc: '以水通关，化解金木交战：放小鱼缸或水养植物', items: ['富贵竹', '风水轮小摆件'] },
      { desc: '黑曜石球吸收煞气，化解争斗', items: ['黑曜石球', '墨玉摆件'] },
    ],
    roomAdvice: '忌做客厅、办公室，容易引发争吵',
    severity: '注意',
    avoid: ['金属利器', '刀剑装饰'],
    prefer: ['水养植物', '小鱼缸', '黑曜石'],
  },
  '7_3': {
    problem: '七三组合，金木相克，主口舌是非、盗贼',
    element: '金木交战',
    solutions: [
      { desc: '以水泄金生木，通关化解：水养富贵竹', items: ['富贵竹', '风水轮小摆件'] },
      { desc: '红色物品泄木气（七赤金生三碧木方向）', items: ['红玛瑙摆件', '中国结'] },
    ],
    roomAdvice: '忌做卧室、客厅',
    severity: '注意',
    avoid: ['金属利器', '刀剑装饰'],
    prefer: ['水养植物', '黑曜石', '红色装饰品'],
  },
  // ===== 三碧相关（是非星）=====
  '3_3': {
    problem: '双三碧叠加，是非口舌极重，主官非诉讼',
    element: '木',
    solutions: [
      { desc: '红色物品泄木气：挂红色中国结或红玛瑙', items: ['红玛瑙摆件', '中国结'] },
      { desc: '粉水晶柔和气场，化解争斗之性', items: ['粉水晶球', '紫水晶洞'] },
    ],
    roomAdvice: '忌做客厅、办公室，容易引发口舌',
    severity: '注意',
    avoid: ['绿植', '木质装饰品'],
    prefer: ['红色装饰品', '粉水晶', '红玛瑙'],
  },
  // ===== 七赤相关（破军星）=====
  '7_7': {
    problem: '双七赤叠加，主盗贼、火灾、口舌破财',
    element: '金',
    solutions: [
      { desc: '水养植物泄金气：富贵竹或小鱼缸', items: ['富贵竹', '风水轮小摆件'] },
      { desc: '黑曜石吸收七赤煞气', items: ['黑曜石球', '墨玉摆件'] },
    ],
    roomAdvice: '忌做卧室，注意防盗',
    severity: '注意',
    avoid: ['金属物品', '刀剑'],
    prefer: ['水养植物', '黑曜石', '鱼缸'],
  },
  // ===== 五黄与其他凶星组合 =====
  '5_3': {
    problem: '五黄三碧组合，土受木克但五黄势大，主是非疾病',
    element: '土木交战',
    solutions: [
      { desc: '以火通关（木生火、火生土），同时金泄土：红色物品+铜器', items: ['中国结', '铜风铃'] },
      { desc: '六帝钱泄土，红色挂件泄木', items: ['六帝钱', '红玛瑙摆件'] },
    ],
    roomAdvice: '忌做卧室',
    severity: '注意',
    avoid: ['大量绿植'],
    prefer: ['六帝钱', '铜器', '红色装饰'],
  },
  '3_5': {
    problem: '三碧五黄组合，木土相克，主疾病官非',
    element: '土木交战',
    solutions: [
      { desc: '以金泄土制木：铜器化解为主', items: ['铜风铃', '六帝钱'] },
      { desc: '安忍水配合铜葫芦', items: ['安忍水', '铜葫芦'] },
    ],
    roomAdvice: '忌做卧室、厨房',
    severity: '注意',
    avoid: ['红色物品', '大量绿植'],
    prefer: ['铜器', '安忍水', '六帝钱'],
  },
  '5_7': {
    problem: '五黄七赤组合，土金相生但皆凶，主疾病破财',
    element: '土金',
    solutions: [
      { desc: '以水泄金制土：安忍水最佳', items: ['安忍水', '黑曜石球'] },
      { desc: '铜钟化五黄，水养植物泄七赤', items: ['铜钟', '富贵竹'] },
    ],
    roomAdvice: '忌做卧室、大门',
    severity: '注意',
    avoid: ['红色', '黄色'],
    prefer: ['安忍水', '黑曜石', '铜钟'],
  },
  '7_5': {
    problem: '七赤五黄组合，金土相生助凶，主破财疾病',
    element: '土金',
    solutions: [
      { desc: '安忍水化解，配合铜器泄土', items: ['安忍水', '六帝钱'] },
      { desc: '水养植物泄金气', items: ['富贵竹', '风水轮小摆件'] },
    ],
    roomAdvice: '忌做卧室、厨房',
    severity: '注意',
    avoid: ['红色', '黄色'],
    prefer: ['安忍水', '水养植物', '六帝钱'],
  },
  // ===== 二黑相关（病符星）=====
  '2_3': {
    problem: '二黑三碧组合，木克土但病符受克反激怒，主疾病',
    element: '土木',
    solutions: [
      { desc: '以金制木泄土：铜器化解', items: ['铜葫芦', '六帝钱'] },
      { desc: '红色物品泄木，减轻对土克', items: ['红玛瑙摆件', '中国结'] },
    ],
    roomAdvice: '忌做卧室',
    severity: '注意',
    avoid: ['大量绿植'],
    prefer: ['铜葫芦', '六帝钱', '红色装饰'],
  },
  '3_2': {
    problem: '三碧二黑组合，木克土，病符受激，主疾病口舌',
    element: '土木',
    solutions: [
      { desc: '铜葫芦化病符，红色物品泄三碧木', items: ['铜葫芦', '中国结'] },
      { desc: '六帝钱泄土，红玛瑙泄木', items: ['六帝钱', '红玛瑙摆件'] },
    ],
    roomAdvice: '忌做卧室',
    severity: '注意',
    prefer: ['铜葫芦', '红色装饰', '六帝钱'],
  },
  '2_7': {
    problem: '二黑七赤组合，土生金，病气外泄但主破财',
    element: '土金',
    solutions: [
      { desc: '铜葫芦化二黑，水养植物泄七赤', items: ['铜葫芦', '富贵竹'] },
      { desc: '安忍水同时化解二黑和七赤', items: ['安忍水', '六帝钱'] },
    ],
    roomAdvice: '不宜做卧室，注意健康',
    severity: '注意',
    prefer: ['铜葫芦', '安忍水', '水养植物'],
  },
  '7_2': {
    problem: '七赤二黑组合，金泄土气，主疾病破财',
    element: '土金',
    solutions: [
      { desc: '安忍水化两星，铜葫芦辅助', items: ['安忍水', '铜葫芦'] },
      { desc: '水养植物泄金', items: ['富贵竹', '风水轮小摆件'] },
    ],
    roomAdvice: '不宜做卧室',
    severity: '注意',
    prefer: ['安忍水', '铜葫芦', '水养植物'],
  },
  '2_2': {
    problem: '双二黑叠加，病符叠至，主慢性病、妇科病',
    element: '土',
    solutions: [
      { desc: '铜葫芦一对+六帝钱，强力化病', items: ['铜葫芦', '六帝钱'] },
      { desc: '安忍水一瓶+铜风铃', items: ['安忍水', '铜风铃'] },
    ],
    roomAdvice: '不宜做卧室，尤其不利女主人',
    severity: '注意',
    avoid: ['红色', '黄色'],
    prefer: ['铜葫芦', '六帝钱', '安忍水'],
  },
  // ===== 吉星组合的催旺建议 =====
  '1_1': {
    problem: '双一白叠加，旺桃花事业',
    type: '吉',
    solutions: [
      { desc: '放置水养植物催旺，增强事业运', items: ['富贵竹', '风水轮小摆件'] },
    ],
    roomAdvice: '适合做书房、客厅',
    severity: '旺',
    enhance: '放水养植物催旺',
  },
  '1_6': {
    problem: '一六共宗，利文昌、考试、升职',
    type: '吉',
    solutions: [
      { desc: '摆放文昌塔催旺学业事业运', items: ['白水晶球', '风水轮小摆件'] },
    ],
    roomAdvice: '适合做书房、儿童房',
    severity: '旺',
    enhance: '放文昌塔或四支富贵竹催旺',
  },
  '6_1': {
    problem: '六一联珠，利官贵、权力',
    type: '吉',
    solutions: [
      { desc: '金属摆件增强官运', items: ['白水晶球', '铜风铃'] },
    ],
    roomAdvice: '适合做书房、办公室',
    severity: '旺',
    enhance: '放金属摆件或六帝钱催旺',
  },
  '6_8': {
    problem: '六八组合，土金相生，利正财偏财',
    type: '吉',
    solutions: [
      { desc: '放聚宝盆或金蟾催旺财运', items: ['聚宝盆', '金蟾'] },
    ],
    roomAdvice: '适合做客厅、书房',
    severity: '旺',
    enhance: '放聚宝盆、金蟾催旺',
  },
  '8_6': {
    problem: '八六组合，利武贵、偏财',
    type: '吉',
    solutions: [
      { desc: '放金蟾或聚宝盆旺财', items: ['金蟾', '聚宝盆'] },
    ],
    roomAdvice: '适合做客厅、书房',
    severity: '旺',
    enhance: '放金蟾催旺',
  },
  '8_8': {
    problem: '双八白叠加，当运旺星，大利财运',
    type: '吉',
    solutions: [
      { desc: '放置聚宝盆或发财树催旺', items: ['聚宝盆', '发财树'] },
    ],
    roomAdvice: '适合做客厅、大门方位',
    severity: '旺',
    enhance: '放聚宝盆、发财树催旺',
  },
  '8_9': {
    problem: '八九组合，火生土，旺财旺丁',
    type: '吉',
    solutions: [
      { desc: '红色物品催旺九紫喜庆', items: ['红玛瑙摆件', '中国结'] },
    ],
    roomAdvice: '适合做客厅、卧室',
    severity: '旺',
    enhance: '放红色装饰品催旺',
  },
  '9_8': {
    problem: '九八组合，火生土，喜庆旺财',
    type: '吉',
    solutions: [
      { desc: '聚宝盆配合红色装饰品', items: ['聚宝盆', '中国结'] },
    ],
    roomAdvice: '适合做客厅、卧室',
    severity: '旺',
    enhance: '放聚宝盆催旺',
  },
  '9_9': {
    problem: '双九紫叠加，大利喜庆、姻缘',
    type: '吉',
    solutions: [
      { desc: '红色物品催旺喜庆运', items: ['红玛瑙摆件', '中国结'] },
      { desc: '粉水晶催桃花', items: ['粉水晶球', '粉水晶鸳鸯'] },
    ],
    roomAdvice: '适合做卧室、客厅',
    severity: '旺',
    enhance: '放红色装饰品或粉水晶催旺',
  },
  '1_4': {
    problem: '一四组合，利文昌学业',
    type: '吉',
    solutions: [
      { desc: '放文昌塔或四支富贵竹催旺文昌', items: ['富贵竹', '白水晶球'] },
    ],
    roomAdvice: '适合做书房、儿童房',
    severity: '旺',
    enhance: '放文昌塔或四支富贵竹',
  },
  '4_1': {
    problem: '四一组合，利学业声誉',
    type: '吉',
    solutions: [
      { desc: '水养植物催旺文昌', items: ['富贵竹', '风水轮小摆件'] },
    ],
    roomAdvice: '适合做书房',
    severity: '旺',
    enhance: '放四支富贵竹催旺',
  },
}

// ===== 飞星单星化解 =====
// 针对单颗凶星入宫的化解
const SINGLE_STAR_HUAJIE = {
  // 五黄大煞
  5: {
    name: '五黄廉贞',
    problem: '五黄大煞入宫，主灾祸、疾病、意外',
    solutions: [
      { desc: '铜制法器化解：六帝钱+铜钟+安忍水', items: ['六帝钱', '铜钟', '安忍水'] },
      { desc: '挂铜风铃泄五黄土气', items: ['铜风铃', '铜葫芦'] },
    ],
    severity: '严重',
  },
  // 二黑病符
  2: {
    name: '二黑巨门',
    problem: '二黑病符入宫，主疾病、慢性病、健康受损',
    solutions: [
      { desc: '铜葫芦+六帝钱泄二黑土气', items: ['铜葫芦', '六帝钱'] },
      { desc: '金属挂件化解，忌红色物品', items: ['铜钟', '铜麒麟'] },
    ],
    severity: '注意',
  },
  // 三碧蚩尤
  3: {
    name: '三碧禄存',
    problem: '三碧蚩尤入宫，主口舌是非、争斗',
    solutions: [
      { desc: '红色物品泄三碧木气', items: ['红玛瑙摆件', '中国结'] },
      { desc: '粉水晶化解争斗气场', items: ['粉水晶球', '紫水晶洞'] },
    ],
    severity: '注意',
  },
  // 七赤破军
  7: {
    name: '七赤破军',
    problem: '七赤破军入宫，主盗贼、口舌、破财',
    solutions: [
      { desc: '水养植物泄七赤金气', items: ['富贵竹', '发财树'] },
      { desc: '黑曜石吸收煞气', items: ['黑曜石球', '墨玉摆件'] },
    ],
    severity: '注意',
  },
}

// ===== 法器总库 =====
// 按五行分类，供动态选择
const ITEM_LIBRARY = {
  金: [
    { name: '铜葫芦', material: '铜', element: '金', price: '¥68-128', searchKey: '风水铜葫芦' },
    { name: '五帝钱', material: '铜', element: '金', price: '¥58-168', searchKey: '风水五帝钱挂件' },
    { name: '六帝钱', material: '铜', element: '金', price: '¥48-128', searchKey: '风水六帝钱' },
    { name: '铜麒麟', material: '铜', element: '金', price: '¥128-398', searchKey: '铜麒麟风水摆件' },
    { name: '金蟾', material: '铜', element: '金', price: '¥68-258', searchKey: '风水金蟾摆件' },
    { name: '铜钟', material: '铜', element: '金', price: '¥88-328', searchKey: '风水铜钟摆件' },
    { name: '铜风铃', material: '铜', element: '金', price: '¥28-68', searchKey: '铜风铃风水挂件' },
    { name: '白水晶球', material: '水晶', element: '金', price: '¥58-198', searchKey: '白水晶球风水摆件' },
    { name: '安忍水', material: '盐+银币', element: '金水', price: '¥38-88', searchKey: '风水安忍水' },
  ],
  木: [
    { name: '富贵竹', material: '木', element: '木', price: '¥15-30', searchKey: '风水富贵竹' },
    { name: '发财树', material: '木', element: '木', price: '¥68-198', searchKey: '风水发财树摆件' },
    { name: '天然葫芦', material: '木质', element: '木', price: '¥38-88', searchKey: '天然风水葫芦挂件' },
    { name: '小叶紫檀手串', material: '紫檀', element: '木', price: '¥128-598', searchKey: '小叶紫檀佛珠手串' },
    { name: '沉香摆件', material: '沉香木', element: '木', price: '¥198-888', searchKey: '沉香木摆件风水' },
  ],
  水: [
    { name: '风水轮', material: '树脂+水', element: '水', price: '¥128-398', searchKey: '风水轮小摆件' },
    { name: '鱼缸小摆件', material: '玻璃', element: '水', price: '¥68-288', searchKey: '迷你鱼缸风水摆件' },
    { name: '黑曜石球', material: '黑曜石', element: '水', price: '¥48-198', searchKey: '黑曜石球风水摆件' },
    { name: '墨玉摆件', material: '墨玉', element: '水', price: '¥88-388', searchKey: '墨玉风水摆件' },
  ],
  火: [
    { name: '红玛瑙摆件', material: '玛瑙', element: '火', price: '¥68-298', searchKey: '红玛瑙风水摆件' },
    { name: '中国结', material: '绳', element: '火', price: '¥18-58', searchKey: '中国结风水挂件' },
    { name: '紫水晶洞', material: '水晶', element: '火', price: '¥168-888', searchKey: '紫水晶洞风水摆件' },
    { name: '朱砂挂件', material: '朱砂', element: '火', price: '¥38-128', searchKey: '朱砂风水挂件辟邪' },
  ],
  土: [
    { name: '泰山石', material: '石', element: '土', price: '¥68-288', searchKey: '泰山石敢当镇宅' },
    { name: '粉水晶球', material: '水晶', element: '土', price: '¥58-198', searchKey: '粉水晶球风水摆件' },
    { name: '聚宝盆', material: '铜/水晶', element: '土', price: '¥128-398', searchKey: '风水聚宝盆摆件' },
    { name: '白玉葫芦', material: '玉', element: '土', price: '¥88-268', searchKey: '白玉葫芦风水' },
    { name: '黄水晶球', material: '水晶', element: '土', price: '¥78-328', searchKey: '黄水晶球风水摆件' },
    { name: '陶瓷花瓶', material: '陶瓷', element: '土', price: '¥48-198', searchKey: '陶瓷花瓶风水摆件' },
  ],
  特殊: [
    { name: '貔貅摆件', material: '铜/玉石', element: '金/土', price: '¥88-298', searchKey: '风水貔貅摆件镇宅' },
    { name: '黑曜石貔貅', material: '黑曜石', element: '水/金', price: '¥98-328', searchKey: '黑曜石貔貅摆件' },
    { name: '龙龟摆件', material: '铜/玉石', element: '金/土', price: '¥158-498', searchKey: '风水龙龟摆件镇宅' },
    { name: '粉水晶鸳鸯', material: '水晶', element: '土', price: '¥68-198', searchKey: '粉水晶鸳鸯摆件' },
  ],
}

// 吉位旺运建议
const JI_WEI_ADVICE = {
  '伏位': {
    benefit: '安稳平和，适合休息静养',
    roomAdvice: '宜做卧室、书房',
    enhance: '可放置水晶球增强稳定气场',
    items: ['白水晶球', '天然葫芦', '陶瓷花瓶'],
  },
  '天医': {
    benefit: '延年益寿，利于健康和贵人运',
    roomAdvice: '宜做卧室、厨房',
    enhance: '可放置葫芦增强健康运',
    items: ['天然葫芦', '铜葫芦', '沉香摆件'],
  },
  '生气': {
    benefit: '旺丁旺财，最吉之位',
    roomAdvice: '宜做大门、卧室、书房、客厅',
    enhance: '可放置聚宝盆增强财运',
    items: ['聚宝盆', '金蟾', '发财树'],
  },
  '延年': {
    benefit: '长寿和合，利于婚姻感情',
    roomAdvice: '宜做卧室、客厅',
    enhance: '可放置和合二仙增强感情运',
    items: ['粉水晶鸳鸯', '粉水晶球', '小叶紫檀手串'],
  },
}

/**
 * 获取凶位化解方案
 * @param {string} youxing - 游星名（五鬼/六煞/祸害/绝命）
 * @returns {object|null}
 */
export function getXiongHuaJie(youxing) {
  return HUAJIE_SCHEMES[youxing] || null
}

/**
 * 获取吉位旺运建议
 * @param {string} youxing - 游星名（伏位/天医/生气/延年）
 * @returns {object|null}
 */
export function getJiAdvice(youxing) {
  return JI_WEI_ADVICE[youxing] || null
}

/**
 * 根据名称从法器库查找摆件详情
 * @param {string} name - 摆件名称
 * @returns {object|null}
 */
function findItemByName(name) {
  for (const category of Object.values(ITEM_LIBRARY)) {
    const found = category.find(i => i.name === name)
    if (found) return found
  }
  return null
}

/**
 * 根据五行从法器库随机选择N个摆件
 * @param {string} element - 五行
 * @param {number} count - 数量
 * @param {Array} exclude - 排除名称
 * @returns {Array}
 */
function pickItemsByElement(element, count = 2, exclude = []) {
  let pool = ITEM_LIBRARY[element] || []
  pool = pool.filter(i => !exclude.includes(i.name))
  // 简单打乱后取前N个
  const shuffled = [...pool].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

/**
 * 获取飞星组合化解方案
 * @param {number} shanStar - 山星数字
 * @param {number} xiangStar - 向星数字
 * @returns {object|null}
 */
export function getFeiXingHuaJie(shanStar, xiangStar) {
  const key = `${shanStar}_${xiangStar}`
  return FEIXING_HUAJIE[key] || null
}

// ===== 流年飞星方位化解（V3.0新增）=====
// 每年流年飞星飞临不同方位，每个方位的吉凶不同，需针对性化解
// 流年飞星每年入中宫的星不同，飞布九宫后各方位的流年星不同
const LIUNIAN_STAR_HUAJIE = {
  1: {
    name: '一白贪狼',
    problem: '流年一白贪狼星飞临此方，旺桃花、事业',
    benefit: '利事业升迁、人际关系、桃花运',
    huaJie: '此方为流年文昌事业位，宜保持干净整洁',
    roomAdvice: '适合做书房或办公区，催旺事业运',
    avoid: '污秽杂物、垃圾桶',
    prefer: '富贵竹、风水轮小摆件',
    type: '吉',
    severity: '旺',
  },
  2: {
    name: '二黑病符',
    problem: '流年二黑病符星飞临此方，易引发疾病、身体虚弱',
    benefit: '',
    huaJie: '摆放铜葫芦泄二黑土气，保家人健康',
    roomAdvice: '此方不宜做卧室，尤其忌老人病人居住',
    avoid: '红色物品、黄色地毯、陶瓷',
    prefer: '铜器、金属风铃、安忍水',
    type: '凶',
    severity: '注意',
  },
  3: {
    name: '三碧是非',
    problem: '流年三碧蚩尤星飞临此方，易招惹口舌是非、官非诉讼',
    benefit: '',
    huaJie: '放红色物品泄木气，如中国结或红玛瑙',
    roomAdvice: '此方不宜做客厅或谈判区，易生争执',
    avoid: '绿植、木质装饰、蓝色物品',
    prefer: '红色装饰品、粉水晶、红玛瑙',
    type: '凶',
    severity: '注意',
  },
  4: {
    name: '四绿文昌',
    problem: '流年四绿文昌星飞临此方，利学业考试',
    benefit: '利学业、考试、升职、声誉',
    huaJie: '摆放文昌塔或四支富贵竹催旺文昌运',
    roomAdvice: '适合做书房或儿童学习区，利考试升学',
    avoid: '金属利器、杂乱堆放',
    prefer: '文昌塔、富贵竹、白水晶球',
    type: '吉',
    severity: '旺',
  },
  5: {
    name: '五黄大煞',
    problem: '流年五黄大煞飞临此方，主灾祸、疾病、意外，全年最凶方位',
    benefit: '',
    huaJie: '挂铜钟或六帝钱，以金泄土化煞，声响效果更佳',
    roomAdvice: '此方全年不宜动土、不宜久留，保持安静',
    avoid: '红色物品、黄色物品、动土、陶瓷',
    prefer: '铜钟、六帝钱、安忍水、铜葫芦',
    type: '大凶',
    severity: '严重',
  },
  6: {
    name: '六白武曲',
    problem: '流年六白武曲星飞临此方，利权力、偏财',
    benefit: '利偏财运、官运、权力地位',
    huaJie: '放金属摆件或六帝钱催旺官运',
    roomAdvice: '适合做书房或办公区，催旺官运偏财',
    avoid: '红色物品、火属性装饰',
    prefer: '六帝钱、白水晶球、铜风铃',
    type: '吉',
    severity: '旺',
  },
  7: {
    name: '七赤破军',
    problem: '流年七赤破军星飞临此方，主破财、口舌、盗贼',
    benefit: '',
    huaJie: '放水养植物泄金气，化七赤凶性',
    roomAdvice: '此方注意防盗，不宜放贵重物品',
    avoid: '金属利器、刀剑装饰',
    prefer: '水养植物、黑曜石、鱼缸',
    type: '凶',
    severity: '注意',
  },
  8: {
    name: '八白左辅',
    problem: '流年八白左辅星飞临此方，大利财运',
    benefit: '利正财偏财、置业投资',
    huaJie: '放聚宝盆或金蟾催旺正财偏财',
    roomAdvice: '适合做客厅或财务室，催旺财运',
    avoid: '脏乱差、破损物品',
    prefer: '聚宝盆、金蟾、发财树',
    type: '吉',
    severity: '旺',
  },
  9: {
    name: '九紫右弼',
    problem: '流年九紫右弼星飞临此方，大利喜庆、姻缘、升职',
    benefit: '利姻缘、喜庆、荣誉、升职',
    huaJie: '放红色装饰品催旺喜庆运',
    roomAdvice: '适合做主卧或客厅，催旺姻缘喜庆',
    avoid: '黑色蓝色装饰、水属性物品',
    prefer: '红玛瑙摆件、中国结、粉水晶',
    type: '吉',
    severity: '旺',
  },
}

// ===== 反吟伏吟专项化解（V3.0新增）=====
const FANYIN_FUYIN_HUAJIE = {
  'global_fanyin': {
    problem: '全局反吟盘：山星/向星与运盘对冲（合十），气流动荡不安，主变动、破耗、不安定',
    solutions: [
      { desc: '全屋摆放铜制法器镇宅，安忍水放置于中宫，配合六帝钱悬挂', items: ['铜钟', '安忍水', '六帝钱'] },
      { desc: '龙龟镇宅于大门口，化解动荡之气', items: ['龙龟摆件'] },
    ],
    avoid: ['大动土木', '装修改造', '搬迁'],
    severity: '严重',
  },
  'global_fuyin': {
    problem: '全局伏吟盘：山星/向星与运盘相同，气场停滞不前，主郁闷、疾病、事业受阻',
    solutions: [
      { desc: '铜风铃悬挂于大门和窗户，以声响激活气场', items: ['铜风铃', '铜钟'] },
      { desc: '水景流动装置激活气运，如风水轮', items: ['风水轮'] },
    ],
    avoid: ['静置不动', '长期关闭门窗'],
    severity: '注意',
  },
  'partial_fanyin': {
    problem: '局部反吟：某宫位山星或向星与运盘对冲，该方位动荡不安',
    solutions: [
      { desc: '该方位摆放铜器化泄，保持稳定', items: ['铜葫芦', '六帝钱'] },
    ],
    avoid: ['该方位不宜动土或长时间停留'],
    severity: '注意',
  },
  'partial_fuyin': {
    problem: '局部伏吟：某宫位山星或向星与运盘相同，该方位气滞不畅',
    solutions: [
      { desc: '该方位摆放流水装置或风铃激活气场', items: ['铜风铃', '风水轮小摆件'] },
    ],
    avoid: ['该方位不宜堆杂物、保持通畅'],
    severity: '提示',
  },
}

// ===== 房间类型联动化解（V3.0新增）=====
// 同一凶星在不同房间类型，影响和化解法不同
const ROOM_TYPE_MODIFIERS = {
  '大门': {
    severityMultiplier: 1.5,  // 大门方位凶性加倍
    desc: '大门为纳气之口，凶星临大门影响全宅',
    extraAdvice: '大门处必须放置化煞物品，不可省略',
  },
  '主卧': {
    severityMultiplier: 1.3,
    desc: '主卧为人长时间休息之处，凶星影响健康与感情',
    extraAdvice: '床头必须避开凶方，可在床尾放置化解物',
  },
  '儿童房': {
    severityMultiplier: 1.4,
    desc: '儿童房受凶星影响更甚，影响学业和健康成长',
    extraAdvice: '需特别加强化解，建议书桌移至吉位',
  },
  '厨房': {
    severityMultiplier: 1.2,
    desc: '厨房为食禄之源，凶星临厨房影响饮食健康和财运',
    extraAdvice: '灶台不可面对凶方，可在灶台旁放化解物',
  },
  '客厅': {
    severityMultiplier: 1.0,
    desc: '客厅为家庭活动中心，凶星影响家庭和睦',
    extraAdvice: '沙发主位宜在吉方，凶方可放置化煞摆件',
  },
  '书房': {
    severityMultiplier: 1.1,
    desc: '书房主学业事业，凶星影响思维效率和事业发展',
    extraAdvice: '书桌宜面朝吉方，凶方可放文昌塔化解',
  },
  '卫生间': {
    severityMultiplier: 0.7,  // 卫生间本身为污秽之处，凶星影响相对小
    desc: '卫生间可泄凶气，凶星临此影响相对较轻',
    extraAdvice: '保持卫生间干净整洁，关门阻挡煞气扩散',
  },
  '储物间': {
    severityMultiplier: 0.6,
    desc: '储物间少人停留，凶星影响最小',
    extraAdvice: '可存放化煞物品，关门即可',
  },
}

/**
 * 生成完整化解报告 V2.1（融合八宅+飞星+形煞+装修）
 * @param {Array} palaces - 八宫数据（来自bazhai.js）
 * @param {Object} feiXingResult - 飞星排盘结果
 * @param {Object} conflictResult - 冲突分析结果
 * @param {Object} [envData] - 形煞评估数据（可选）
 * @param {Object} [renovationData] - 装修评估数据（可选）
 * @param {Object} [envAdvantageData] - 环境优势数据（可选）
 * @returns {{ problems: Array, suggestions: Array, items: Array }}
 */
export function generateHuaJieReport(palaces, feiXingResult, conflictResult, envData, renovationData, envAdvantageData, roomLayout) {
  // 兼容旧调用
  envData = envData || null
  renovationData = renovationData || null
  envAdvantageData = envAdvantageData || null
  roomLayout = roomLayout || {}  // { '北': '大门', '南': '主卧', ... }
  const problems = []
  const suggestions = []
  const items = []
  const liunianAdvice = []
  const fanyinFuyin = []

  // 构建冲突映射：position → conflict info
  const conflictMap = {}
  if (conflictResult && conflictResult.conflicts) {
    for (const c of conflictResult.conflicts) {
      conflictMap[c.position] = c
    }
  }

  // 构建飞星宫位映射：方位 → 飞星宫位数据
  const feiXingMap = {}
  if (feiXingResult && feiXingResult.palaces) {
    for (const fp of feiXingResult.palaces) {
      if (fp.palace === '中') continue
      const pos = fp.position
      if (pos) feiXingMap[pos] = fp
    }
  }

  // 获取房间类型修饰器
  const getRoomModifier = (position) => {
    const roomType = roomLayout[position]
    if (!roomType) return null
    return ROOM_TYPE_MODIFIERS[roomType] || null
  }

  // 根据房间类型调整severity
  const adjustSeverity = (baseSeverity, position) => {
    const modifier = getRoomModifier(position)
    if (!modifier) return baseSeverity
    if (modifier.severityMultiplier >= 1.3) return '严重'
    return baseSeverity
  }

  // 根据飞星组合的avoid/prefer精准推荐物品
  const recommendByCombo = (comboHuaJie, position, reason) => {
    if (!comboHuaJie) return []
    const recommended = []
    // 优先推荐prefer列表中的物品
    if (comboHuaJie.prefer && comboHuaJie.prefer.length > 0) {
      for (const name of comboHuaJie.prefer.slice(0, 2)) {
        const detail = findItemByName(name)
        if (detail) {
          recommended.push({
            ...detail,
            position,
            reason,
            taobaoUrl: `https://s.taobao.com/search?q=${encodeURIComponent(detail.searchKey)}`,
          })
        }
      }
    }
    // 如果prefer不够，按五行补充
    if (recommended.length < 2 && comboHuaJie.element) {
      const shengElement = { '金': '水', '木': '火', '水': '木', '火': '土', '土': '金' }[comboHuaJie.element]
      const usedNames = recommended.map(r => r.name)
      const extra = pickItemsByElement(shengElement || comboHuaJie.element, 2 - recommended.length, usedNames)
      for (const item of extra) {
        recommended.push({
          ...item,
          position,
          reason,
          taobaoUrl: `https://s.taobao.com/search?q=${encodeURIComponent(item.searchKey)}`,
        })
      }
    }
    return recommended
  }

  // ===== 1. 八宅凶位化解（融合飞星精准匹配） =====
  const xiongPalaces = palaces.filter(p => p.nature === '凶')
  for (const palace of xiongPalaces) {
    const conflict = conflictMap[palace.position]
    const feiXingPalace = feiXingMap[palace.position]
    const roomModifier = getRoomModifier(palace.position)

    // 飞星覆盖为吉 → 弱提示
    if (conflict && conflict.resolution === '吉') {
      suggestions.push({
        position: palace.position,
        youxing: palace.youxing,
        level: '提示',
        desc: `八宅${palace.youxing}位为凶，但飞星组合判吉，以飞星为准。此方位可用，避免大动即可`,
        roomAdvice: roomModifier
          ? `${roomModifier.baseAdvice}此方位整体气场可用，保持整洁即可`
          : '可用，但不宜在此方位大动土木',
      })
      continue
    }

    // 正常凶位化解
    const huajie = getXiongHuaJie(palace.youxing)
    if (!huajie) continue

    // 基础severity + 飞星加重 + 房间类型加重
    let severity = palace.score <= 3 ? '严重' : '注意'
    if (feiXingPalace && ['凶', '大凶'].includes(feiXingPalace.comboNature)) {
      severity = '严重'
    }
    severity = adjustSeverity(severity, palace.position)

    // 构建精确的问题描述
    let problemDetail = huajie.problem
    if (feiXingPalace) {
      const comboHuaJie = getFeiXingHuaJie(feiXingPalace.shanStar, feiXingPalace.xiangStar)
      if (comboHuaJie) {
        problemDetail += `；飞星${feiXingPalace.shanStar}-${feiXingPalace.xiangStar}：${comboHuaJie.problem}`
      }
    }
    if (roomModifier) {
      problemDetail += `。${roomModifier.specialWarning || ''}`
    }

    problems.push({
      position: palace.position,
      youxing: palace.youxing,
      problem: problemDetail,
      roomAdvice: roomModifier
        ? `${huajie.roomAdvice}${roomModifier.specialWarning ? ' ' + roomModifier.specialWarning : ''}`
        : huajie.roomAdvice,
      severity,
      source: '八宅+飞星+房间融合',
    })

    // 精准化解方案
    const solutionLevel = severity === '严重' ? '大改' : '中调'
    const solution = huajie.solutions.find(s => s.level === solutionLevel) || huajie.solutions[huajie.solutions.length - 1]

    // 构建描述，结合飞星组合信息
    let descParts = [solution.desc]
    if (feiXingPalace) {
      const comboHuaJie = getFeiXingHuaJie(feiXingPalace.shanStar, feiXingPalace.xiangStar)
      if (comboHuaJie) {
        if (comboHuaJie.avoid && comboHuaJie.avoid.length > 0) {
          descParts.push(`忌用：${comboHuaJie.avoid.join('、')}`)
        }
        if (comboHuaJie.prefer && comboHuaJie.prefer.length > 0) {
          descParts.push(`宜用：${comboHuaJie.prefer.join('、')}`)
        }
      }
    }
    if (roomModifier) {
      descParts.push(roomModifier.prefer)
    }

    suggestions.push({
      position: palace.position,
      youxing: palace.youxing,
      level: solution.level,
      desc: descParts.join('。'),
      roomAdvice: roomModifier
        ? `${huajie.roomAdvice}。${roomModifier.baseAdvice}`
        : huajie.roomAdvice,
      severity,
    })

    // 物品推荐：结合八宅化解 + 飞星组合prefer
    for (const item of solution.items) {
      items.push({
        ...item,
        position: palace.position,
        reason: `化解${palace.youxing}位`,
        taobaoUrl: `https://s.taobao.com/search?q=${encodeURIComponent(item.searchKey)}`,
      })
    }

    // 飞星组合精准推荐
    if (feiXingPalace) {
      const comboHuaJie = getFeiXingHuaJie(feiXingPalace.shanStar, feiXingPalace.xiangStar)
      const comboItems = recommendByCombo(comboHuaJie, palace.position, `化解飞星${feiXingPalace.shanStar}-${feiXingPalace.xiangStar}凶格`)
      for (const ci of comboItems) {
        items.push(ci)
      }
    }
  }

  // ===== 2. 飞星独有凶位（八宅未覆盖的） =====
  if (feiXingResult && feiXingResult.palaces) {
    for (const fp of feiXingResult.palaces) {
      if (fp.palace === '中') continue
      const pos = fp.position
      if (!pos) continue
      if (!['凶', '大凶'].includes(fp.comboNature)) continue

      // 已在八宅凶位处理过的跳过
      const alreadyHandled = problems.some(p => p.position === pos)
      if (alreadyHandled) continue

      const comboHuaJie = getFeiXingHuaJie(fp.shanStar, fp.xiangStar)
      const roomModifier = getRoomModifier(pos)

      // 精准问题描述
      let problemDesc = comboHuaJie
        ? `${fp.shanStar}-${fp.xiangStar}：${comboHuaJie.problem}`
        : `飞星${fp.shanStar}${fp.xiangStar}组合为凶（${fp.comboNature}）`

      if (roomModifier) {
        problemDesc += `。${roomModifier.specialWarning || '此方位不宜久留'}`
      }

      const severity = adjustSeverity(
        fp.comboNature === '大凶' ? '严重' : '注意',
        pos
      )

      problems.push({
        position: pos,
        youxing: `飞星${fp.shanStar}${fp.xiangStar}`,
        problem: problemDesc,
        roomAdvice: comboHuaJie?.roomAdvice || '此方位宜静不宜动',
        severity,
        source: '飞星',
      })

      if (comboHuaJie) {
        // 精准化解方案
        let desc = `化解${fp.shanStar}-${fp.xiangStar}：${comboHuaJie.solutions?.[0]?.desc || comboHuaJie.problem}`
        if (comboHuaJie.avoid && comboHuaJie.avoid.length > 0) {
          desc += `。忌用：${comboHuaJie.avoid.join('、')}`
        }
        if (comboHuaJie.prefer && comboHuaJie.prefer.length > 0) {
          desc += `。宜用：${comboHuaJie.prefer.join('、')}`
        }
        if (roomModifier) {
          desc += `。${roomModifier.baseAdvice}`
        }

        suggestions.push({
          position: pos,
          youxing: `飞星${fp.shanStar}${fp.xiangStar}`,
          level: severity === '严重' ? '大改' : '中调',
          desc,
          roomAdvice: roomModifier
            ? `${comboHuaJie.roomAdvice}。${roomModifier.baseAdvice}`
            : (comboHuaJie.roomAdvice || '宜静不宜动'),
          severity,
        })

        // 精准物品推荐
        const comboItems = recommendByCombo(comboHuaJie, pos, `化解飞星${fp.shanStar}-${fp.xiangStar}`)
        for (const ci of comboItems) items.push(ci)
      } else {
        // 通用五行化解
        const fxElement = fp.shanInfo?.element || '土'
        const counterElement = { '金': '火', '木': '金', '水': '土', '火': '水', '土': '木' }[fxElement] || '金'
        const genericItems = pickItemsByElement(counterElement, 2)

        suggestions.push({
          position: pos,
          youxing: `飞星${fp.shanStar}${fp.xiangStar}`,
          level: severity === '严重' ? '大改' : '中调',
          desc: `飞星组合${fp.comboNature}，建议用${counterElement}行法器化解`,
          roomAdvice: roomModifier
            ? `宜静不宜动。${roomModifier.baseAdvice}`
            : '宜静不宜动，忌做卧室',
          severity,
        })

        for (const item of genericItems) {
          items.push({
            ...item,
            position: pos,
            reason: '化解飞星凶位',
            taobaoUrl: `https://s.taobao.com/search?q=${encodeURIComponent(item.searchKey)}`,
          })
        }
      }
    }
  }

  // ===== 3. 吉位旺运（融合飞星吉星催旺） =====
  const jiPalaces = palaces.filter(p => p.nature === '吉')
  for (const palace of jiPalaces) {
    const advice = getJiAdvice(palace.youxing)
    const feiXingPalace = feiXingMap[palace.position]
    const roomModifier = getRoomModifier(palace.position)

    let desc = `${palace.youxing}吉位：${advice?.benefit || '气场和顺'}`
    if (feiXingPalace && feiXingPalace.comboNature === '吉') {
      const comboHuaJie = getFeiXingHuaJie(feiXingPalace.shanStar, feiXingPalace.xiangStar)
      if (comboHuaJie && comboHuaJie.prefer) {
        desc += `。飞星${feiXingPalace.shanStar}-${feiXingPalace.xiangStar}催旺宜用：${comboHuaJie.prefer.join('、')}`
      }
    }
    if (roomModifier) {
      desc += `。${roomModifier.prefer}`
    }

    suggestions.push({
      position: palace.position,
      youxing: palace.youxing,
      level: '旺运',
      desc: `${desc}。${advice?.enhance || ''}`,
      roomAdvice: roomModifier
        ? `${advice?.roomAdvice || ''}。${roomModifier.baseAdvice}`
        : (advice?.roomAdvice || ''),
    })

    // 旺运摆件
    if (advice?.items) {
      for (const itemName of advice.items) {
        const itemDetail = findItemByName(itemName)
        if (itemDetail) {
          items.push({
            ...itemDetail,
            position: palace.position,
            reason: `旺${palace.youxing}位`,
            taobaoUrl: `https://s.taobao.com/search?q=${encodeURIComponent(itemDetail.searchKey)}`,
          })
        }
      }
    }
  }

  // ===== 4. 流年飞星方位建议 =====
  if (feiXingResult && feiXingResult.annualStars) {
    const lnYear = feiXingResult.currentYear || new Date().getFullYear()
    // 遍历宅运盘各宫位，每个宫位已有 annualStar 和 annualInfo
    const palaces = feiXingResult.palaces || []
    for (const p of palaces) {
      if (p.palace === '中') continue
      const annualStar = p.annualStar
      if (!annualStar) continue
      const lnHuaJie = LIUNIAN_STAR_HUAJIE[annualStar]
      if (!lnHuaJie) continue

      const isJi = lnHuaJie.type === '吉'

      if (!isJi) {
        // 流年凶星方位
        const roomModifier = getRoomModifier(p.position)
        const severity = adjustSeverity(
          lnHuaJie.severity === '严重' ? '严重' : '注意',
          p.position
        )

        problems.push({
          position: p.position,
          youxing: `${lnYear}年${lnHuaJie.name}飞临`,
          problem: `${lnYear}年${lnHuaJie.name}（${annualStar}星）飞临${p.position}方：${lnHuaJie.problem}`,
          roomAdvice: roomModifier
            ? `${lnHuaJie.roomAdvice}。${roomModifier.specialWarning || ''}`
            : lnHuaJie.roomAdvice,
          severity,
          source: '流年飞星',
        })

        let desc = `${lnHuaJie.huaJie}。忌：${lnHuaJie.avoid}。宜：${lnHuaJie.prefer}`
        if (roomModifier) {
          desc += `。${roomModifier.baseAdvice}`
        }

        suggestions.push({
          position: p.position,
          youxing: `${lnYear}年${lnHuaJie.name}飞临`,
          level: severity === '严重' ? '大改' : '中调',
          desc,
          roomAdvice: roomModifier
            ? `${lnHuaJie.roomAdvice}。${roomModifier.baseAdvice}`
            : lnHuaJie.roomAdvice,
          severity,
        })

        // 流年凶星化解法器
        const elementMap = { '二黑病符': '土', '三碧是非': '木', '五黄大煞': '土', '七赤破军': '金' }
        const starElement = elementMap[lnHuaJie.name] || '土'
        const counterElement = { '金': '火', '木': '金', '水': '土', '火': '水', '土': '金' }[starElement] || '金'
        const lnItems = pickItemsByElement(counterElement, 1)
        for (const item of lnItems) {
          items.push({
            ...item,
            position: p.position,
            reason: `${lnYear}年${lnHuaJie.name}化解`,
            taobaoUrl: `https://s.taobao.com/search?q=${encodeURIComponent(item.searchKey)}`,
          })
        }
      } else {
        // 流年吉星方位 → 催旺建议
        liunianAdvice.push({
          position: p.position,
          star: annualStar,
          name: lnHuaJie.name,
          year: lnYear,
          benefit: lnHuaJie.benefit,
          prefer: lnHuaJie.prefer,
          activate: `${p.position}方为${lnYear}年${lnHuaJie.name}吉位，${lnHuaJie.benefit}。宜：${lnHuaJie.prefer}。催旺可在${p.position}方放置${lnHuaJie.prefer}。`,
        })
      }
    }
  }

  // ===== 5. 反吟伏吟专项化解 =====
  if (feiXingResult && feiXingResult.fanYinFuYin) {
    const fy = feiXingResult.fanYinFuYin

    // 构建方位→反吟伏吟类型映射
    const positionFyMap = {} // { '北': { fanyin: [...], fuyin: [...] } }
    const addFy = (positions, type, label) => {
      for (const pos of positions) {
        if (!positionFyMap[pos]) positionFyMap[pos] = { fanyin: [], fuyin: [] }
        positionFyMap[pos][type].push(label)
      }
    }
    addFy(fy.shanFanYin || [], 'fanyin', '山星反吟')
    addFy(fy.shanFuYin || [], 'fuyin', '山星伏吟')
    addFy(fy.xiangFanYin || [], 'fanyin', '向星反吟')
    addFy(fy.xiangFuYin || [], 'fuyin', '向星伏吟')

    // 全局反吟/伏吟
    if (fy.isGlobalFanYin) {
      const fyHuaJie = FANYIN_FUYIN_HUAJIE['global_fanyin']
      fanyinFuyin.push({
        position: '全局',
        type: '全局反吟',
        stars: '',
        desc: fyHuaJie.problem,
        huaJie: fyHuaJie.solutions[0]?.desc || '',
        prefer: (fyHuaJie.solutions[0]?.items || []).join('、'),
      })
    }
    if (fy.isGlobalFuYin) {
      const fyHuaJie = FANYIN_FUYIN_HUAJIE['global_fuyin']
      fanyinFuyin.push({
        position: '全局',
        type: '全局伏吟',
        stars: '',
        desc: fyHuaJie.problem,
        huaJie: fyHuaJie.solutions[0]?.desc || '',
        prefer: (fyHuaJie.solutions[0]?.items || []).join('、'),
      })
    }

    // 各方位反吟伏吟
    for (const [pos, types] of Object.entries(positionFyMap)) {
      const isFanyin = types.fanyin.length > 0
      const isFuyin = types.fuyin.length > 0
      // 优先用局部配置，没有则用全局
      const fyHuaJie = isFanyin
        ? (FANYIN_FUYIN_HUAJIE['partial_fanyin'] || FANYIN_FUYIN_HUAJIE['global_fanyin'])
        : (FANYIN_FUYIN_HUAJIE['partial_fuyin'] || FANYIN_FUYIN_HUAJIE['global_fuyin'])
      if (!fyHuaJie) continue

      const typeLabels = [...types.fanyin, ...types.fuyin].join('、')
      const typeShort = isFanyin && isFuyin ? '反吟+伏吟' : (isFanyin ? '反吟' : '伏吟')

      const fyDesc = `${typeLabels}：${fyHuaJie.problem}`
      const roomModifier = getRoomModifier(pos)

      problems.push({
        position: pos,
        youxing: typeShort,
        problem: fyDesc,
        roomAdvice: roomModifier
          ? `${fyHuaJie.solutions[0]?.desc || ''}。${roomModifier.specialWarning || ''}`
          : (fyHuaJie.solutions[0]?.desc || ''),
        severity: fyHuaJie.severity || '严重',
        source: '反吟伏吟',
      })

      let desc = fyHuaJie.solutions[0]?.desc || ''
      if (fyHuaJie.avoid && fyHuaJie.avoid.length > 0) {
        desc += `。忌：${fyHuaJie.avoid.join('、')}`
      }
      if (roomModifier) {
        desc += `。${roomModifier.baseAdvice}`
      }

      suggestions.push({
        position: pos,
        youxing: typeShort,
        level: fyHuaJie.severity === '严重' ? '大改' : '中调',
        desc,
        roomAdvice: roomModifier
          ? `${fyHuaJie.solutions[0]?.desc || ''}。${roomModifier.baseAdvice}`
          : (fyHuaJie.solutions[0]?.desc || ''),
        severity: fyHuaJie.severity || '严重',
      })

      fanyinFuyin.push({
        position: pos,
        type: typeShort,
        stars: typeLabels,
        desc: fyHuaJie.problem,
        huaJie: fyHuaJie.solutions[0]?.desc || '',
        prefer: (fyHuaJie.solutions[0]?.items || []).join('、'),
      })

      // 反吟伏吟化解法器（铜器为主，金属性）
      for (const sol of fyHuaJie.solutions) {
        for (const itemName of (sol.items || [])) {
          const detail = findItemByName(itemName)
          if (detail) {
            items.push({
              ...detail,
              position: pos,
              reason: `化解${typeShort}`,
              taobaoUrl: `https://s.taobao.com/search?q=${encodeURIComponent(detail.searchKey)}`,
            })
          }
        }
      }
    }
  }

  // ===== 6. 形煞化解 =====
  if (envData && envData.details && envData.details.length > 0) {
    for (const xs of envData.details) {
      problems.push({
        position: '外部环境',
        youxing: xs.name,
        problem: `${xs.name}：${xs.impact}`,
        roomAdvice: xs.resolutions?.[0] || '建议请专业人士现场勘察化解',
        severity: xs.penalty <= -12 ? '严重' : '注意',
        source: '形煞',
      })

      for (let i = 0; i < Math.min(xs.resolutions?.length || 0, 2); i++) {
        suggestions.push({
          position: '外部环境',
          youxing: xs.name,
          level: xs.penalty <= -12 ? '大改' : '中调',
          desc: xs.resolutions[i],
          roomAdvice: xs.resolutions[0] || '',
          severity: xs.penalty <= -12 ? '严重' : '注意',
        })
      }

      const xsItems = pickItemsByElement('金', 1)
      for (const item of xsItems) {
        items.push({
          ...item,
          position: '外部环境',
          reason: `化解${xs.name}`,
          taobaoUrl: `https://s.taobao.com/search?q=${encodeURIComponent(item.searchKey)}`,
        })
      }
    }
  }

  // ===== 7. 装修风水融合 =====
  if (renovationData) {
    if (renovationData.fengshuiIssues && renovationData.fengshuiIssues.length > 0) {
      for (const fs of renovationData.fengshuiIssues) {
        problems.push({
          position: fs.location || '室内',
          youxing: fs.type || '装修风水',
          problem: `${fs.type || '装修风水问题'}：${fs.description}`,
          roomAdvice: fs.suggestion || '建议调整装修布局',
          severity: '注意',
          source: '装修风水',
        })
        suggestions.push({
          position: fs.location || '室内',
          youxing: fs.type || '装修风水',
          level: '轻调',
          desc: fs.suggestion || '建议调整装修布局以改善风水',
          severity: '注意',
        })
      }
    }

    if (renovationData.styleIssues && renovationData.styleIssues.length > 0) {
      for (const si of renovationData.styleIssues) {
        problems.push({
          position: '室内风格',
          youxing: si.problem,
          problem: `${si.problem}：${si.desc}`,
          roomAdvice: si.suggestion,
          severity: '提示',
          source: '装修风格',
        })
        suggestions.push({
          position: '室内风格',
          youxing: si.problem,
          level: '轻调',
          desc: si.suggestion,
          severity: '提示',
        })
      }
    }

    if (renovationData.renovationIssues && renovationData.renovationIssues.length > 0) {
      const severeIssues = renovationData.renovationIssues.filter(i => i.severity === '严重')
      if (severeIssues.length > 0) {
        problems.push({
          position: '装修质量',
          youxing: '质量问题',
          problem: `${severeIssues.length}处严重装修质量问题：${severeIssues.map(i => i.problem).join('、')}`,
          roomAdvice: '严重质量问题建议优先维修，影响居住安全和风水气场',
          severity: '注意',
          source: '装修质量',
        })
      }
    }
  }

  // ===== 8. 环境优势 =====
  if (envAdvantageData && envAdvantageData.advantages && envAdvantageData.advantages.length > 0) {
    for (const adv of envAdvantageData.advantages) {
      suggestions.push({
        position: '外部环境',
        youxing: adv.name,
        level: '旺运',
        desc: `${adv.name}：${adv.benefit}。${adv.enhance}`,
        roomAdvice: adv.enhance,
      })
    }
  }

  // 去重
  const seenNames = new Set()
  const uniqueItems = items.filter(item => {
    const key = `${item.position}_${item.name}`
    if (seenNames.has(key)) return false
    seenNames.add(key)
    return true
  })

  return { problems, suggestions, items: uniqueItems, liunianAdvice, fanyinFuyin }
}

// 兼容旧接口：只传palaces也能工作
export { HUAJIE_SCHEMES, JI_WEI_ADVICE, ITEM_LIBRARY, FEIXING_HUAJIE, SINGLE_STAR_HUAJIE, LIUNIAN_STAR_HUAJIE, FANYIN_FUYIN_HUAJIE, ROOM_TYPE_MODIFIERS }
