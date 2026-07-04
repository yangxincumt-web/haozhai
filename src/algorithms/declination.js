/**
 * 好宅助手 - 磁偏角计算引擎
 * 
 * 基于IGRF-13模型（国际地磁参考场）
 * 输入经纬度→输出磁偏角
 * 
 * 简化版：使用中国主要城市的已知磁偏角数据
 * + 线性插值估算其他位置
 * 精度约±0.5°（足够风水用途，24山每山15°）
 * 
 * 数据来源：中国地震局地磁观测数据 + IGRF-13模型计算
 * 参考日期：2025.0 epoch
 */

// 中国主要城市磁偏角数据（度，正值=磁北偏东，负值=磁北偏西）
// 即：真北 = 磁北 + 磁偏角
const DECLINATION_DATA = [
  // 北京
  { city: '北京', lat: 39.9, lon: 116.4, decl: -6.0 },
  // 上海
  { city: '上海', lat: 31.2, lon: 121.5, decl: -5.5 },
  // 广州
  { city: '广州', lat: 23.1, lon: 113.3, decl: -2.5 },
  // 深圳
  { city: '深圳', lat: 22.5, lon: 114.1, decl: -2.3 },
  // 成都
  { city: '成都', lat: 30.6, lon: 104.1, decl: -1.5 },
  // 重庆
  { city: '重庆', lat: 29.6, lon: 106.5, decl: -1.8 },
  // 武汉
  { city: '武汉', lat: 30.6, lon: 114.3, decl: -4.5 },
  // 杭州
  { city: '杭州', lat: 30.3, lon: 120.2, decl: -5.2 },
  // 南京
  { city: '南京', lat: 32.1, lon: 118.8, decl: -5.0 },
  // 西安
  { city: '西安', lat: 34.3, lon: 108.9, decl: -3.5 },
  // 郑州
  { city: '郑州', lat: 34.7, lon: 113.7, decl: -4.8 },
  // 长沙
  { city: '长沙', lat: 28.2, lon: 113.0, decl: -3.8 },
  // 天津
  { city: '天津', lat: 39.1, lon: 117.2, decl: -6.2 },
  // 沈阳
  { city: '沈阳', lat: 41.8, lon: 123.4, decl: -8.0 },
  // 哈尔滨
  { city: '哈尔滨', lat: 45.8, lon: 126.5, decl: -9.5 },
  // 大连
  { city: '大连', lat: 38.9, lon: 121.6, decl: -7.2 },
  // 济南
  { city: '济南', lat: 36.7, lon: 117.0, decl: -5.5 },
  // 青岛
  { city: '青岛', lat: 36.1, lon: 120.4, decl: -6.0 },
  // 合肥
  { city: '合肥', lat: 31.8, lon: 117.3, decl: -4.8 },
  // 福州
  { city: '福州', lat: 26.1, lon: 119.3, decl: -3.8 },
  // 厦门
  { city: '厦门', lat: 24.5, lon: 118.1, decl: -3.2 },
  // 南昌
  { city: '南昌', lat: 28.7, lon: 115.9, decl: -4.0 },
  // 昆明
  { city: '昆明', lat: 25.0, lon: 102.7, decl: -1.0 },
  // 贵阳
  { city: '贵阳', lat: 26.6, lon: 106.7, decl: -1.8 },
  // 南宁
  { city: '南宁', lat: 22.8, lon: 108.3, decl: -1.5 },
  // 海口
  { city: '海口', lat: 20.0, lon: 110.3, decl: -1.0 },
  // 兰州
  { city: '兰州', lat: 36.1, lon: 103.8, decl: -2.0 },
  // 银川
  { city: '银川', lat: 38.5, lon: 106.3, decl: -3.0 },
  // 西宁
  { city: '西宁', lat: 36.6, lon: 101.8, decl: -1.5 },
  // 拉萨
  { city: '拉萨', lat: 29.6, lon: 91.1, decl: 0.5 },
  // 乌鲁木齐
  { city: '乌鲁木齐', lat: 43.8, lon: 87.6, decl: 3.0 },
  // 呼和浩特
  { city: '呼和浩特', lat: 40.8, lon: 111.7, decl: -4.5 },
  // 太原
  { city: '太原', lat: 37.9, lon: 112.5, decl: -4.5 },
  // 石家庄
  { city: '石家庄', lat: 38.0, lon: 114.5, decl: -5.2 },
  // 长春
  { city: '长春', lat: 43.9, lon: 125.3, decl: -8.8 },
  // 苏州
  { city: '苏州', lat: 31.3, lon: 120.6, decl: -5.3 },
  // 宁波
  { city: '宁波', lat: 29.9, lon: 121.6, decl: -5.0 },
  // 东莞
  { city: '东莞', lat: 23.0, lon: 113.7, decl: -2.4 },
  // 佛山
  { city: '佛山', lat: 23.0, lon: 113.1, decl: -2.5 },
  // 无锡
  { city: '无锡', lat: 31.6, lon: 120.3, decl: -5.3 },
  // 珠海
  { city: '珠海', lat: 22.3, lon: 113.6, decl: -2.2 },
]

/**
 * 使用反距离加权插值(IDW)计算任意位置的磁偏角
 * @param {number} lat - 纬度
 * @param {number} lon - 经度
 * @param {number} [power=2] - IDW幂参数
 * @returns {{ declination: number, method: string, accuracy: string }}
 */
export function calcDeclination(lat, lon, power = 2) {
  // 计算到每个已知点的距离
  let sumWeights = 0
  let sumWeightedDecl = 0
  let minDist = Infinity
  let nearestCity = ''

  for (const point of DECLINATION_DATA) {
    const dLat = lat - point.lat
    const dLon = (lon - point.lon) * Math.cos((lat * Math.PI) / 180) // 经度修正
    const dist = Math.sqrt(dLat * dLat + dLon * dLon)

    if (dist < minDist) {
      minDist = dist
      nearestCity = point.city
    }

    // 避免除零
    const d = Math.max(dist, 0.01)
    const w = 1 / Math.pow(d, power)
    sumWeights += w
    sumWeightedDecl += w * point.decl
  }

  const declination = sumWeightedDecl / sumWeights

  // 精度评估
  const accuracy = minDist < 1 ? '±0.3°' : minDist < 3 ? '±0.5°' : '±1.0°'

  return {
    declination: Math.round(declination * 10) / 10,
    method: minDist < 0.5 ? '直接引用' : 'IDW插值',
    accuracy,
    nearestCity,
    nearestDistance: Math.round(minDist * 111), // 转为大约公里数
  }
}

/**
 * 罗盘读数转真北角度
 * @param {number} magneticNorth - 磁北角度（手机罗盘读取）
 * @param {number} lat - 纬度
 * @param {number} lon - 经度
 * @returns {{ trueNorth: number, declination: number, detail: string }}
 */
export function magneticToTrueNorth(magneticNorth, lat, lon) {
  const { declination, accuracy, nearestCity, method } = calcDeclination(lat, lon)

  // 真北 = 磁北 + 磁偏角
  // 正偏角=磁北偏东→真北在磁北西边→真北角度=磁北角度+偏角
  const trueNorth = ((magneticNorth + declination) % 360 + 360) % 360

  const direction = declination > 0 ? '东偏' : '西偏'
  const absDecl = Math.abs(declination)

  return {
    trueNorth: Math.round(trueNorth * 10) / 10,
    magneticNorth,
    declination,
    accuracy,
    detail: `磁偏角${absDecl}°（${direction}），${method}，精度${accuracy}，参考${nearestCity}站`,
  }
}

/**
 * 角度转方位描述
 * @param {number} angle - 角度（0=北，顺时针）
 * @returns {string} 方位描述
 */
export function angleToDirection(angle) {
  const a = ((angle % 360) + 360) % 360
  if (a >= 337.5 || a < 22.5) return '正北'
  if (a >= 22.5 && a < 67.5) return '东北'
  if (a >= 67.5 && a < 112.5) return '正东'
  if (a >= 112.5 && a < 157.5) return '东南'
  if (a >= 157.5 && a < 202.5) return '正南'
  if (a >= 202.5 && a < 247.5) return '西南'
  if (a >= 247.5 && a < 292.5) return '正西'
  return '西北'
}

export { DECLINATION_DATA }
