/**
 * 好宅助手 - 户型图热力图渲染器
 * 基于 Canvas 的轻量级热力图，为风水吉凶可视化定制
 * 赛博国风配色：吉位铜金→荧光绿，凶位朱砂红→荧光紫
 */

/**
 * 创建热力图渲染器
 * @param {HTMLCanvasElement} canvas - 目标Canvas元素
 */
export function createHeatmapRenderer(canvas) {
  const ctx = canvas.getContext('2d')

  // 预生成渐变调色板（256色）
  const palette = generatePalette()

  // 离屏Canvas用于绘制灰度热力点
  const shadowCanvas = document.createElement('canvas')
  const shadowCtx = shadowCanvas.getContext('2d')

  /**
   * 生成赛博国风配色调色板
   * 0.0-0.3: 冷色（凶位）荧光紫→朱砂红
   * 0.3-0.5: 中性 青绿
   * 0.5-0.7: 暖色 铜金色
   * 0.7-1.0: 热色（吉位）铜金→荧光绿
   */
  function generatePalette() {
    const canvas2 = document.createElement('canvas')
    canvas2.width = 256
    canvas2.height = 1
    const ctx2 = canvas2.getContext('2d')
    const grad = ctx2.createLinearGradient(0, 0, 256, 0)

    // 凶位：荧光紫→朱砂红
    grad.addColorStop(0.0, 'rgba(155, 89, 182, 0.0)')   // 荧光紫透明
    grad.addColorStop(0.1, 'rgba(155, 89, 182, 0.6)')   // 荧光紫
    grad.addColorStop(0.25, 'rgba(192, 57, 43, 0.8)')   // 朱砂红
    // 中性
    grad.addColorStop(0.4, 'rgba(26, 188, 156, 0.5)')   // 青绿
    // 吉位
    grad.addColorStop(0.55, 'rgba(212, 165, 116, 0.7)') // 铜金色
    grad.addColorStop(0.75, 'rgba(212, 165, 116, 0.9)') // 铜金色浓
    grad.addColorStop(0.9, 'rgba(46, 204, 113, 0.9)')   // 荧光绿
    grad.addColorStop(1.0, 'rgba(46, 204, 113, 1.0)')   // 荧光绿浓

    ctx2.fillStyle = grad
    ctx2.fillRect(0, 0, 256, 1)
    return ctx2.getImageData(0, 0, 256, 1).data
  }

  /**
   * 渲染热力图
   * @param {Array} points - 热力点数据 [{x, y, value, radius?}]
   *   x, y: 0-1的比例坐标
   *   value: 0-1的吉凶值（0=大凶, 1=大吉）
   *   radius: 可选，热力点半径（像素），默认80
   * @param {number} width - Canvas宽度
   * @param {number} height - Canvas高度
   * @param {number} opacity - 整体透明度 0-1
   */
  function render(points, width, height, opacity = 0.65) {
    canvas.width = width
    canvas.height = height
    shadowCanvas.width = width
    shadowCanvas.height = height

    // 清空
    shadowCtx.clearRect(0, 0, width, height)

    // 绘制灰度热力点
    points.forEach(p => {
      const x = p.x * width
      const y = p.y * height
      const r = p.radius || Math.min(width, height) * 0.18
      const intensity = Math.max(0, Math.min(1, p.value))

      const grad = shadowCtx.createRadialGradient(x, y, 0, x, y, r)
      grad.addColorStop(0, `rgba(0,0,0,${intensity})`)
      grad.addColorStop(0.4, `rgba(0,0,0,${intensity * 0.7})`)
      grad.addColorStop(1, 'rgba(0,0,0,0)')

      shadowCtx.fillStyle = grad
      shadowCtx.fillRect(x - r, y - r, r * 2, r * 2)
    })

    // 读取灰度数据，映射到调色板
    const imageData = shadowCtx.getImageData(0, 0, width, height)
    const pixels = imageData.data

    for (let i = 0; i < pixels.length; i += 4) {
      const alpha = pixels[i + 3] // 灰度alpha通道
      if (alpha === 0) {
        pixels[i + 3] = 0 // 完全透明
        continue
      }
      const colorIndex = Math.min(alpha * 2, 255) // alpha→palette index
      const pi = Math.floor(colorIndex) * 4
      pixels[i] = palette[pi]       // R
      pixels[i + 1] = palette[pi + 1] // G
      pixels[i + 2] = palette[pi + 2] // B
      pixels[i + 3] = Math.floor(palette[pi + 3] * opacity) // A
    }

    // 绘制到主Canvas
    ctx.clearRect(0, 0, width, height)
    ctx.putImageData(imageData, 0, 0)
  }

  /**
   * 将热力图渲染为dataURL（用于截图分享）
   */
  function toDataURL(type = 'image/png') {
    return canvas.toDataURL(type)
  }

  return { render, toDataURL }
}

/**
 * 根据八宅/飞星评分计算热力值
 * @param {Object} palaceData - 宫位数据
 * @param {string} mode - 'bazhai' 或 'feixing'
 * @returns {number} 0-1的吉凶值（0=大凶, 1=大吉）
 */
export function scoreToHeatValue(palaceData, mode = 'bazhai') {
  if (mode === 'bazhai') {
    // 八宅评分：直接用评分映射
    // 吉位：生气10→1.0, 天医9→0.9, 延年8→0.8, 伏位7→0.7
    // 凶位：绝命1→0.1, 五鬼3→0.3, 六煞4→0.4, 祸害5→0.5
    const scoreMap = { '生气': 1.0, '天医': 0.9, '延年': 0.8, '伏位': 0.7, '祸害': 0.5, '六煞': 0.4, '五鬼': 0.3, '绝命': 0.1 }
    return scoreMap[palaceData.youXing] || 0.5
  }

  if (mode === 'feixing') {
    // 飞星评分：使用飞星组合评分（comboScore 0-100）直接映射
    if (palaceData.comboScore !== undefined) {
      return Math.max(0, Math.min(1, palaceData.comboScore / 100))
    }
    // 降级：根据组合属性判断
    const natureMap = {
      '大吉': 1.0, '吉': 0.85, '小吉': 0.7,
      '平': 0.5,
      '凶': 0.3, '大凶': 0.1,
    }
    if (palaceData.comboNature) {
      return natureMap[palaceData.comboNature] || 0.5
    }
    return 0.5
  }

  return 0.5
}

/**
 * 八宫方位到九宫格位置映射（上南下北的传统布局）
 * 用于没有上传户型图时的九宫格热力图
 * direction 字段用于标签显示方位名
 */
export const PALACE_POSITION_MAP = {
  '离': { x: 0.5, y: 0.167, direction: '南' },
  '坎': { x: 0.5, y: 0.833, direction: '北' },
  '震': { x: 0.167, y: 0.5, direction: '东' },
  '兑': { x: 0.833, y: 0.5, direction: '西' },
  '巽': { x: 0.167, y: 0.167, direction: '东南' },
  '坤': { x: 0.833, y: 0.167, direction: '西南' },
  '艮': { x: 0.167, y: 0.833, direction: '东北' },
  '乾': { x: 0.833, y: 0.833, direction: '西北' },
  '中宫': { x: 0.5, y: 0.5, direction: '中' },
}

/**
 * 方位名→卦名映射（用于房间方位匹配）
 */
export const DIRECTION_TO_PALACE = {
  '北': '坎', '东北': '艮', '东': '震', '东南': '巽',
  '南': '离', '西南': '坤', '西': '兑', '西北': '乾',
  '中宫': '中', '正北': '坎', '正东': '震', '正南': '离', '正西': '兑',
}
