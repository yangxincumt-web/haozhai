/**
 * 地理编码工具
 * 封装高德地理编码和逆地理编码API
 */

const AMAP_KEY = '775f7d250896654177f15270367a1aa9'

/**
 * 地址 → 经纬度（地理编码）
 * @param {string} address - 地址文本
 * @returns {{ lat: number, lon: number, name: string } | null}
 */
export async function geocodeAddress(address) {
  try {
    const res = await fetch(
      `https://restapi.amap.com/v3/geocode/geo?key=${AMAP_KEY}&address=${encodeURIComponent(address)}`
    )
    const data = await res.json()
    if (data.geocodes && data.geocodes.length > 0) {
      const [lon, lat] = data.geocodes[0].location.split(',').map(Number)
      return { lat, lon, name: data.geocodes[0].formatted_address }
    }
    return null
  } catch (e) {
    console.error('[geoUtils] 地理编码失败:', e)
    return null
  }
}

/**
 * 经纬度 → 地址（逆地理编码）
 * @param {number} lon
 * @param {number} lat
 * @returns {string|null} 地址文本
 */
export async function reverseGeocode(lon, lat) {
  try {
    const res = await fetch(
      `https://restapi.amap.com/v3/geocode/regeo?key=${AMAP_KEY}&location=${lon},${lat}`
    )
    const data = await res.json()
    if (data.regeocode) {
      return data.regeocode.formatted_address
    }
    return null
  } catch (e) {
    console.error('[geoUtils] 逆地理编码失败:', e)
    return null
  }
}
