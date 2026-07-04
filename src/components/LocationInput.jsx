/**
 * 好宅助手 - GPS定位组件
 * 支持自动定位（逆地理编码自动填入）和手动输入降级
 */

import React, { useState } from 'react'

// 高德API Key
const AMAP_KEY = '775f7d250896654177f15270367a1aa9'

export default function LocationInput({ onLocationSelect, defaultAddress = '' }) {
  const [address, setAddress] = useState(defaultAddress)
  const [locating, setLocating] = useState(false)
  const [locationError, setLocationError] = useState('')
  const [gpsInfo, setGpsInfo] = useState(null) // { lat, lon, accuracy, formattedAddress }

  // 逆地理编码：经纬度 → 地址
  const reverseGeocode = async (latitude, longitude) => {
    try {
      const res = await fetch(
        `https://restapi.amap.com/v3/geocode/regeo?key=${AMAP_KEY}&location=${longitude},${latitude}&extensions=base`
      )
      const data = await res.json()
      if (data.regeocode && data.regeocode.formatted_address) {
        return data.regeocode.formatted_address
      }
      return null
    } catch (e) {
      console.error('逆地理编码失败:', e)
      return null
    }
  }

  // GPS自动定位
  const handleAutoLocate = () => {
    if (!navigator.geolocation) {
      setLocationError('您的浏览器不支持定位功能')
      return
    }

    setLocating(true)
    setLocationError('')
    setGpsInfo(null)

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords
        
        // 逆地理编码获取地址
        const formattedAddress = await reverseGeocode(latitude, longitude)
        
        setLocating(false)
        
        // 保存GPS信息供展示
        setGpsInfo({
          lat: latitude,
          lon: longitude,
          accuracy: Math.round(accuracy),
          formattedAddress,
        })
        
        // 自动填入地址到输入框
        if (formattedAddress) {
          setAddress(formattedAddress)
        }
        
        // 回调
        if (onLocationSelect) {
          onLocationSelect({
            lat: latitude,
            lon: longitude,
            address: formattedAddress || '',
            source: 'gps',
          })
        }
      },
      (error) => {
        setLocating(false)
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError('定位权限被拒绝，请在浏览器设置中允许定位')
            break
          case error.POSITION_UNAVAILABLE:
            setLocationError('无法获取位置信息，请手动输入地址')
            break
          case error.TIMEOUT:
            setLocationError('定位超时，请手动输入地址')
            break
          default:
            setLocationError('定位失败，请手动输入地址')
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 缓存5分钟
      }
    )
  }

  // 手动输入地址
  const handleAddressChange = (e) => {
    setAddress(e.target.value)
    setLocationError('')
    // 手动修改地址时清除GPS信息
    if (gpsInfo) {
      setGpsInfo(null)
    }
  }

  // 地址确认
  const handleAddressSubmit = () => {
    if (!address.trim()) {
      setLocationError('请输入地址')
      return
    }
    
    if (onLocationSelect) {
      onLocationSelect({
        address: address.trim(),
        source: 'manual',
      })
    }
  }

  return (
    <div className="location-input">
      <div className="location-gps-row">
        <button
          className="btn-gps"
          onClick={handleAutoLocate}
          disabled={locating}
        >
          {locating ? (
            <>
              <span className="gps-spinner">⟳</span>
              定位中...
            </>
          ) : (
            <>
              <span className="gps-icon">◎</span>
              自动定位
            </>
          )}
        </button>
      </div>

      {locationError && (
        <div className="location-error">{locationError}</div>
      )}

      {/* GPS定位成功信息 */}
      {gpsInfo && (
        <div className="gps-result-info">
          <div className="gps-success-badge">✓ 定位成功</div>
          <div className="gps-coords">
            经度 {gpsInfo.lon.toFixed(4)}° · 纬度 {gpsInfo.lat.toFixed(4)}°
          </div>
          <div className="gps-accuracy">
            精度 ±{gpsInfo.accuracy}m
            {gpsInfo.accuracy <= 50 ? (
              <span className="accuracy-good"> 精准</span>
            ) : gpsInfo.accuracy <= 200 ? (
              <span className="accuracy-ok"> 一般</span>
            ) : (
              <span className="accuracy-poor"> 偏差较大</span>
            )}
          </div>
        </div>
      )}

      <div className="location-manual">
        <input
          type="text"
          className="input-field"
          placeholder="手动输入城市/区县，如：郑州市金水区"
          value={address}
          onChange={handleAddressChange}
          onKeyDown={(e) => e.key === 'Enter' && handleAddressSubmit()}
        />
        <button 
          className="btn-address-confirm"
          onClick={handleAddressSubmit}
          disabled={!address.trim()}
        >
          确定
        </button>
      </div>

      <p className="location-hint">
        {locating ? '正在获取您的位置...' : gpsInfo ? '定位结果已自动填入，可手动修改' : '点击定位可自动获取地址和经纬度'}
      </p>
    </div>
  )
}
