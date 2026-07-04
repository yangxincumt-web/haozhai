/**
 * 卫星图AI判向核心逻辑
 * 使用高德Static Map API获取卫星图 + DashScope VL模型识别建筑朝向
 */

const AMAP_KEY = '775f7d250896654177f15270367a1aa9'
const DASHSCOPE_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions'
const DASHSCOPE_KEY = 'sk-ws-H.REIHDPH.zrek.MEYCIQDHHKh6oAHYgI22hSynqtF9EtXPQne2kcsq3WECeJ00yAIhANNPu4BV1amIb8ne2Gx5Y2wDKNEXERssFpZ_MxSMg44B'

// 方位 → 角度映射（角度=从正北顺时针）
const DIRECTION_TO_ANGLE = {
  '北': 0, '正北': 0,
  '东北': 45,
  '东': 90, '正东': 90,
  '东南': 135,
  '南': 180, '正南': 180,
  '西南': 225,
  '西': 270, '正西': 270,
  '西北': 315,
}

/**
 * 方位名 → 角度
 */
export function directionToAngle(direction) {
  if (!direction) return null

  // 精确匹配
  if (DIRECTION_TO_ANGLE[direction] !== undefined) {
    return DIRECTION_TO_ANGLE[direction]
  }

  // 模糊匹配：包含关系
  const lower = direction.replace(/偏|略|微/g, '')
  for (const [key, angle] of Object.entries(DIRECTION_TO_ANGLE)) {
    if (key.length >= 2 && lower.includes(key)) {
      return angle
    }
  }

  // 偏角匹配：如"南偏东10°"
  const biasMatch = direction.match(/(北|南|东|西)[偏]?(东|南|西|北)\s*(\d+)/)
  if (biasMatch) {
    const base = DIRECTION_TO_ANGLE[biasMatch[1]] ?? 0
    const offset = parseInt(biasMatch[3]) || 0
    // 判断偏转方向
    const biasDir = biasMatch[2]
    if ((biasMatch[1] === '南' && biasDir === '东') ||
        (biasMatch[1] === '东' && biasDir === '南') ||
        (biasMatch[1] === '北' && biasDir === '西') ||
        (biasMatch[1] === '西' && biasDir === '北')) {
      return (base - offset + 360) % 360
    }
    return (base + offset) % 360
  }

  return null
}

/**
 * 获取高德卫星图URL
 * @param {number} lon - 经度
 * @param {number} lat - 纬度
 * @param {number} zoom - 缩放级别（默认17）
 * @returns {string} 卫星图URL
 */
export function getSatelliteUrl(lon, lat, zoom = 17) {
  return `https://restapi.amap.com/v3/staticmap?location=${lon},${lat}&zoom=${zoom}&size=640*640&scale=2&traffic=0&key=${AMAP_KEY}`
}

/**
 * VL分析卫星图的prompt
 */
const ORIENTATION_PROMPT = `你是一位专业的建筑朝向分析专家。请分析这张卫星图中建筑群的主要朝向。

分析要点：
1. 识别图中主要建筑群的排列方向
2. 根据建筑的长轴方向判断主要采光面朝向
3. 住宅建筑通常主采光面朝南或南偏东/西

请严格按以下JSON格式返回（不要返回其他内容）：
{
  "buildings": [
    {"direction": "朝向描述", "confidence": 0.0-1.0}
  ],
  "overallDirection": "综合朝向（如：南偏东15°/正南/东南等）",
  "overallConfidence": 0.0-1.0,
  "note": "补充说明（如有）"
}`

/**
 * 使用DashScope VL模型识别卫星图中的建筑朝向
 * @param {string} imageUrl - 卫星图URL
 * @returns {Promise<{success: boolean, direction?: string, angle?: number, confidence?: number, satelliteUrl?: string, buildings?: Array, note?: string, error?: string}>}
 */
export async function detectOrientation(lon, lat) {
  const satelliteUrl = getSatelliteUrl(lon, lat)

  try {
    // 1. 获取卫星图
    const imgResp = await fetch(satelliteUrl)
    if (!imgResp.ok) {
      return { success: false, error: '卫星图获取失败' }
    }

    // 2. 转base64
    const blob = await imgResp.blob()
    const base64 = await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })

    // 3. 调用DashScope VL
    const response = await fetch(DASHSCOPE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DASHSCOPE_KEY}`,
      },
      body: JSON.stringify({
        model: 'qwen-vl-plus',
        messages: [{
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: base64 } },
            { type: 'text', text: ORIENTATION_PROMPT },
          ],
        }],
        temperature: 0.1,
        max_tokens: 500,
      }),
    })

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      return { success: false, error: 'AI未返回分析结果' }
    }

    // 4. 解析JSON
    let parsed
    try {
      // 尝试从返回文本中提取JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0])
      }
    } catch (e) {
      console.error('[satelliteAI] JSON解析失败:', e, content)
      return { success: false, error: 'AI返回格式异常' }
    }

    if (!parsed || !parsed.overallDirection) {
      return { success: false, error: '未能识别建筑朝向' }
    }

    const angle = directionToAngle(parsed.overallDirection)
    return {
      success: true,
      direction: parsed.overallDirection,
      angle: angle !== null ? angle : 180,
      confidence: parsed.overallConfidence || 0.7,
      satelliteUrl,
      buildings: parsed.buildings || [],
      note: parsed.note || '',
    }
  } catch (e) {
    console.error('[satelliteAI] 判向失败:', e)
    return { success: false, error: 'AI判向出错：' + (e.message || '未知错误') }
  }
}
