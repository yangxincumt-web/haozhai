/**
 * 好宅助手 - 户型图AI识别工具
 * 基于阿里云通义千问VL模型进行户型图验证和房间数据提取
 * 包含客户端启发式验证作为降级方案
 */

// 阿里云DashScope API（兼容OpenAI格式）
const DASHSCOPE_API = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions'
const DASHSCOPE_KEY = 'sk-ws-H.REIHDPH.zrek.MEYCIQDHHKh6oAHYgI22hSynqtF9EtXPQne2kcsq3WECeJ00yAIhANNPu4BV1amIb8ne2Gx5Y2wDKNEXERssFpZ_MxSMg44B'

// 户型图验证Prompt
const VALIDATE_PROMPT = `你是一个专业的建筑户型图识别专家。请判断这张图片是否为建筑户型图/平面图。

户型图的典型特征：
1. 有墙体线条（通常是粗实线或双线）
2. 有房间区域划分（被墙体围合的空间）
3. 有文字标注（如"卧室"、"客厅"、"卫生间"、面积数字等）
4. 有门窗符号（门的弧线、窗户的细线）
5. 可能有指北针、比例尺、图例

请严格按以下JSON格式返回（不要返回其他内容）：
{
  "isFloorPlan": true/false,
  "confidence": 0.0-1.0,
  "detectedFeatures": ["特征1", "特征2"],
  "reason": "判断理由"
}`

// 房间数据提取Prompt（V2.5.3: 改进指南针识别）
const EXTRACT_PROMPT = `你是一个专业的建筑户型图分析专家。请仔细分析这张户型图，提取所有房间的信息。

【关键步骤】
1. 首先判断这张户型图图片上方代表哪个罗盘方向
   - 寻找图片中的指北针/指南针标志（通常是一个带N字母的箭头或圆形罗盘）
   - 如果图片中有多个指北针，以最大/最清晰的那个为准
   - 指北针的N箭头所指方向就是北方。根据N箭头相对于图片的方向来判断图片上方是什么方向：
     * 如果N指向图片正上方 → 图片上方=北
     * 如果N指向图片右上方 → 图片上方=西南
     * 如果N指向图片左上方 → 图片上方=东北
     * 如果N指向图片正右方 → 图片上方=西
     * 如果N指向图片正左方 → 图片上方=东
   - 如果没有任何指北针标识，中国户型图通常上方为北
2. 仔细观察每个房间在图片中的实际位置，精确标注其中心坐标和尺寸比例

对于每个房间，请识别：
1. 房间名称（如：主卧、次卧、客厅、厨房、卫生间、阳台、书房、餐厅等）
2. 面积（如果图上标注了，单位平方米，没有则填null）
3. 在图片中的精确位置（请仔细观察后标注，这非常重要！）：
   - centerX: 房间中心点的水平位置（0=图片最左边，1=图片最右边）
   - centerY: 房间中心点的垂直位置（0=图片最上边，1=图片最下边）
   - width: 房间水平跨度占图片总宽度的比例（0-1）
   - height: 房间垂直高度占图片总高度的比例（0-1）

注意：
- 坐标标注是核心数据，请务必仔细观察房间在图片中的实际位置后再标注
- 左上角是(0,0)，右下角是(1,1)
- 如果图片上方是北方，那么图片上方的房间centerY值小（北方），图片下方的房间centerY值大（南方）
- 如果图片上方是北方，那么图片左边的房间centerX值小（西方），图片右边的房间centerX值大（东方）

请严格按以下JSON格式返回（不要返回其他内容）：
{
  "imageTopDirection": "北",
  "floorPlanBody": {
    "left": 0.05,
    "top": 0.05,
    "right": 0.95,
    "bottom": 0.75
  },
  "rooms": [
    {
      "name": "主卧",
      "area": 15.3,
      "centerX": 0.75,
      "centerY": 0.3,
      "width": 0.25,
      "height": 0.3
    }
  ],
  "totalArea": 98.6,
  "mainOrientation": "南",
  "floorPlanType": "三室两厅"
}

说明：
- imageTopDirection: 图片上方代表的罗盘方向，必须是以下之一：北、东北、东、东南、南、西南、西、西北
- floorPlanBody: 主户型体的边界（不含阳台、外部走廊等非主结构区域），用0-1的归一化坐标表示。left/top/right/bottom分别是主户型体左/上/右/下边缘在图片中的位置。这个值非常重要，九宫格将覆盖这个区域！
- mainOrientation: 房屋的主要朝向（即阳台/主窗面向的方向）

【房间识别注意事项】
- 严格按图上文字标注识别房间名称，图上写"客厅"就是客厅，写"厨房"就是厨房
- 客厅和厨房是不同的房间，绝不能混淆
- 餐厅和厨房也是不同的房间
- 如果图上没有标注房间名称，根据家具/设施推断（有灶台=厨房，有沙发+茶几=客厅，有餐桌=餐厅，有床=卧室，有马桶+淋浴=卫生间）`

/**
 * 调用通义千问VL API
 */
async function callQwenVL(imageBase64, prompt, apiKey) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30000) // 30秒超时

  try {
    const response = await fetch(DASHSCOPE_API, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'qwen-vl-plus',
        messages: [{
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: imageBase64 } },
            { type: 'text', text: prompt }
          ]
        }],
        temperature: 0.1,
        max_tokens: 1024
      }),
      signal: controller.signal
    })

    if (!response.ok) {
      const errText = await response.text().catch(() => '')
      throw new Error(`API ${response.status}: ${errText.slice(0, 200)}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || ''
    return content
  } finally {
    clearTimeout(timeout)
  }
}

/**
 * 从AI响应中提取JSON
 */
function extractJSON(text) {
  // 尝试直接解析
  try { return JSON.parse(text) } catch (e) { /* continue */ }

  // 尝试从markdown代码块中提取
  const codeMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
  if (codeMatch) {
    try { return JSON.parse(codeMatch[1]) } catch (e2) { /* continue */ }
  }

  // 找第一个{到最后一个}
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start !== -1 && end > start) {
    try { return JSON.parse(text.substring(start, end + 1)) } catch (e3) { /* continue */ }
  }

  return null
}

/**
 * 客户端启发式验证（AI不可用时的降级方案）
 * 通过分析图片的像素分布特征判断是否像户型图
 */
function heuristicValidation(imgElement) {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  // 限制分析尺寸提高性能
  const maxDim = 512
  const scale = Math.min(maxDim / imgElement.naturalWidth, maxDim / imgElement.naturalHeight, 1)
  canvas.width = Math.floor(imgElement.naturalWidth * scale)
  canvas.height = Math.floor(imgElement.naturalHeight * scale)
  ctx.drawImage(imgElement, 0, 0, canvas.width, canvas.height)

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const data = imageData.data
  const totalPixels = data.length / 4

  let whitePixels = 0
  let darkPixels = 0
  let linePixels = 0
  let colorfulPixels = 0

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2]
    const brightness = (r + g + b) / 3
    const saturation = Math.max(r, g, b) - Math.min(r, g, b)

    if (brightness > 240) whitePixels++
    if (brightness < 50) darkPixels++
    if (brightness > 30 && brightness < 100) linePixels++
    if (saturation > 80 && brightness > 80) colorfulPixels++
  }

  const whiteRatio = whitePixels / totalPixels
  const darkRatio = darkPixels / totalPixels
  const lineRatio = linePixels / totalPixels
  const colorfulRatio = colorfulPixels / totalPixels

  // 户型图特征评分
  let score = 0
  const features = []

  // 白色背景占比高（户型图通常是白底黑线）
  if (whiteRatio > 0.4) { score += 0.25; features.push('浅色背景') }
  if (whiteRatio > 0.6) { score += 0.15; features.push('白色背景为主') }

  // 深色像素少（线条细，不像照片那样大面积深色）
  if (darkRatio < 0.15) { score += 0.15; features.push('线条占比合理') }
  if (darkRatio > 0.005 && darkRatio < 0.10) { score += 0.15; features.push('有线条内容') }

  // 有中等灰度像素（标注文字/符号）
  if (lineRatio > 0.01 && lineRatio < 0.25) { score += 0.10; features.push('可能有标注文字') }

  // 彩色像素少（户型图颜色单一，不像照片色彩丰富）
  if (colorfulRatio < 0.3) { score += 0.05; features.push('颜色偏单一') }

  // 宽高比合理
  const aspectRatio = canvas.width / canvas.height
  if (aspectRatio > 0.5 && aspectRatio < 2.5) { score += 0.10; features.push('宽高比合理') }

  // 图片不能太小
  if (imgElement.naturalWidth >= 400 && imgElement.naturalHeight >= 400) {
    score += 0.05; features.push('图片尺寸合理')
  }

  return {
    isFloorPlan: score >= 0.5,
    confidence: Math.min(score, 1),
    detectedFeatures: features,
    reason: score >= 0.5
      ? '图片特征符合户型图（白底线条、标注文字、宽高比合理）'
      : '图片特征不符合户型图，可能为照片或其他类型图片'
  }
}

/**
 * 方位到八宫映射
 */
const ORIENTATION_PALACE_MAP = {
  '北': '坎', '正北': '坎',
  '东北': '艮',
  '东': '震', '正东': '震',
  '东南': '巽',
  '南': '离', '正南': '离',
  '西南': '坤',
  '西': '兑', '正西': '兑',
  '西北': '乾',
  '中': '中宫', '中央': '中宫',
}

function mapOrientationToPalace(orientation) {
  if (!orientation) return null
  return ORIENTATION_PALACE_MAP[orientation] || null
}

/**
 * 前端文件校验（第1层防线）
 */
export function validateFile(file) {
  const errors = []

  // 文件大小：10KB - 10MB
  if (file.size < 10 * 1024) {
    errors.push('图片太小（低于10KB），请上传清晰的户型图')
  }
  if (file.size > 10 * 1024 * 1024) {
    errors.push('图片太大（超过10MB），请压缩后重新上传')
  }

  // 文件格式
  const validTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!validTypes.includes(file.type)) {
    errors.push('仅支持 JPG/PNG/WebP 格式')
  }

  return { valid: errors.length === 0, errors }
}

/**
 * 主入口：验证户型图并提取房间数据
 * @param {string} imageBase64 - base64编码的图片数据（含data:image/xxx;base64,前缀）
 * @param {string} apiKey - DashScope API Key（可选，为空则仅用启发式验证）
 * @param {HTMLImageElement} imgElement - 图片元素（用于降级验证）
 * @returns {Object} { isValid, validationMethod, rooms, floorPlanInfo }
 */
export async function validateAndExtract(imageBase64, apiKey = DASHSCOPE_KEY, imgElement) {
  let validationResult = null
  let extractResult = null
  let usedAI = false

  // 尝试AI验证
  if (apiKey) {
    try {
      const validateResponse = await callQwenVL(imageBase64, VALIDATE_PROMPT, apiKey)
      const parsed = extractJSON(validateResponse)
      if (parsed && typeof parsed.isFloorPlan === 'boolean') {
        validationResult = parsed
        usedAI = true
      }
    } catch (err) {
      console.warn('AI户型图验证失败，降级到启发式验证:', err.message)
    }
  }

  // 降级到启发式验证
  if (!validationResult && imgElement) {
    validationResult = heuristicValidation(imgElement)
  }

  // 验证不通过
  if (!validationResult || !validationResult.isFloorPlan) {
    return {
      isValid: false,
      validationMethod: usedAI ? 'ai' : 'heuristic',
      validationDetail: validationResult,
      rooms: [],
      floorPlanInfo: null,
    }
  }

  // 验证通过：尝试AI提取房间数据
  if (usedAI && apiKey) {
    try {
      const extractResponse = await callQwenVL(imageBase64, EXTRACT_PROMPT, apiKey)
      extractResult = extractJSON(extractResponse)
    } catch (err) {
      console.warn('AI房间提取失败:', err.message)
    }
  }

  // 处理房间数据
  const rooms = (extractResult?.rooms || []).map(room => ({
    ...room,
    // 保留palace映射作为参考（不再作为主要映射依据，V1.8改用坐标归一化算法）
    palace: mapOrientationToPalace(room.orientation),
  })).filter(room => room.name)

  return {
    isValid: true,
    validationMethod: usedAI ? 'ai' : 'heuristic',
    validationDetail: validationResult,
    rooms,
    floorPlanInfo: extractResult ? {
      totalArea: extractResult.totalArea,
      mainOrientation: extractResult.mainOrientation,
      floorPlanType: extractResult.floorPlanType,
      imageTopDirection: extractResult.imageTopDirection || null,
    } : null,
    floorPlanBody: extractResult?.floorPlanBody || null,
  }
}

/**
 * 强制接受上传（用户确认后跳过验证）
 */
export function forceAccept() {
  return {
    isValid: true,
    validationMethod: 'forced',
    validationDetail: {
      isFloorPlan: true,
      confidence: 0,
      reason: '用户强制上传，未经AI验证',
      detectedFeatures: []
    },
    rooms: [],
    floorPlanInfo: null,
    forced: true,
  }
}

export { mapOrientationToPalace, ORIENTATION_PALACE_MAP }

/**
 * V2.8: 纯AI视觉方案——截图已裁剪到九宫格范围，AI直接看图识别每个房间的宫位
 * 完全不用数学映射，信任AI的视觉判断
 */
export async function reanalyzeWithGrid(imageBase64, gridConfig, originalRooms) {
  const compositeBase64 = gridConfig.croppedScreenshot
  if (!compositeBase64) {
    throw new Error('缺少裁剪后的截图')
  }

  console.log('[V2.8] 使用裁剪截图进行AI视觉识别')

  const REANALYZE_PROMPT = `你是一个专业的建筑户型图分析专家。

这张图片显示了一个户型图，上面叠加了九宫格网格。每个格子中标注了宫位名称（坎、艮、震、巽、离、坤、兑、乾）和方位（北、东北、东、东南、南、西南、西、西北），中央标注"中宫"。

【你的任务】
仔细观察图片，识别每个房间，根据九宫格标签判断每个房间属于哪个宫位。

【重要限制——只分析九宫格内的房间！】
- 只识别位于九宫格网格覆盖范围内的房间
- 九宫格外的区域（如阳台、走廊、外部空间）完全忽略，不要识别和返回
- 如果一个房间横跨九宫格内外，只记录它在九宫格内的部分对应的宫位

【识别规则——极其重要！】
1. 逐个区域仔细辨认图上的文字标注，严格按图上写的名称来
2. 客厅和厨房是完全不同的房间！"客厅"就是客厅，"厨房"就是厨房，绝不能混淆
3. 餐厅和厨房也是不同的房间
4. 主卧、次卧、卧室都要分别识别
5. 如果图上某个区域没写文字但可以看到房间轮廓，根据家具/设施推断（有灶台=厨房，有沙发=客厅，有床=卧室，有马桶=卫生间，有餐桌=餐厅）

【宫位判断规则】
- 房间的中心在哪个宫位格子内，它就属于那个宫位
- 如果一个房间横跨两个宫位，中心点所在的宫位是palace，其他覆盖的是secondaryPalaces
- 每个房间单独一条记录，不要把多个房间合并

【返回格式】严格按以下JSON返回（不要返回其他内容）：
{
  "rooms": [
    {"name": "主卧", "palace": "坤", "secondaryPalaces": ["兑"], "area": null},
    {"name": "客厅", "palace": "震", "secondaryPalaces": ["巽"], "area": null},
    {"name": "厨房", "palace": "坎", "secondaryPalaces": [], "area": null}
  ]
}

字段说明：
- name: 房间名称（严格按图上文字标注）
- palace: 主宫位（坎/艮/震/巽/离/坤/兑/乾之一，不要填"中"）
- secondaryPalaces: 次要宫位数组（房间跨多个宫位时填写，否则空数组）
- area: 面积（图上有标注填数字，无标注填null）`

  try {
    const response = await callQwenVL(compositeBase64, REANALYZE_PROMPT, DASHSCOPE_KEY)
    const parsed = extractJSON(response)

    if (!parsed || !parsed.rooms || !Array.isArray(parsed.rooms)) {
      throw new Error('AI返回格式不正确')
    }

    const aiRooms = parsed.rooms.filter(r => r.name && r.palace)
    console.log('[V2.8] AI视觉识别结果:', aiRooms.map(r =>
      r.name + '→' + r.palace + (r.secondaryPalaces?.length ? '+' + r.secondaryPalaces.join(',') : '')
    ).join(', '))

    // 将AI结果映射为应用需要的房间格式
    return aiRooms.map(aiRoom => {
      // 尝试从原始房间列表中匹配面积和坐标
      const orig = originalRooms?.find(r =>
        r.name === aiRoom.name ||
        r.name?.includes(aiRoom.name) ||
        aiRoom.name?.includes(r.name)
      )
      return {
        name: aiRoom.name,
        palace: aiRoom.palace,
        secondaryPalaces: aiRoom.secondaryPalaces || [],
        area: aiRoom.area || orig?.area || null,
        centerX: orig?.centerX || 0.5,
        centerY: orig?.centerY || 0.5,
        width: orig?.width || 0.1,
        height: orig?.height || 0.1,
      }
    })
  } catch (err) {
    console.error('[V2.8] AI视觉识别失败:', err)
    throw err
  }
}
