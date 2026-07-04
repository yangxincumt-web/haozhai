/**
 * 好宅助手 - 出生地城市选择组件（二级联动）
 * 
 * 先选省份，再选城市，用于真太阳时修正
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { getAllCities } from '../algorithms/cityData.js'

// 省份排序：直辖市优先，然后按拼音
const MUNICIPALITIES = ['北京', '上海', '天津', '重庆']

export default function BirthCityInput({ value, onChange }) {
  const [selectedProvince, setSelectedProvince] = useState('')
  const [selectedCity, setSelectedCity] = useState(null)

  // 获取所有城市并按省份分组
  const { provinceList, citiesByProvince } = useMemo(() => {
    const allCities = getAllCities()
    const map = {}
    allCities.forEach(city => {
      if (!map[city.province]) {
        map[city.province] = []
      }
      map[city.province].push(city)
    })
    
    // 排序：直辖市在前，其他按名称
    const provinces = Object.keys(map).sort((a, b) => {
      const aIsMunicipality = MUNICIPALITIES.includes(a) ? 0 : 1
      const bIsMunicipality = MUNICIPALITIES.includes(b) ? 0 : 1
      if (aIsMunicipality !== bIsMunicipality) return aIsMunicipality - bIsMunicipality
      return a.localeCompare(b, 'zh-CN')
    })
    
    return { provinceList: provinces, citiesByProvince: map }
  }, [])

  // 当前省份下的城市列表
  const cityList = selectedProvince ? (citiesByProvince[selectedProvince] || []) : []

  // 初始化：如果传入了value（城市名），自动定位省份和城市
  useEffect(() => {
    if (value) {
      const allCities = getAllCities()
      const city = allCities.find(c => c.name === value)
      if (city) {
        setSelectedProvince(city.province)
        setSelectedCity(city)
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // 选择省份
  const handleProvinceChange = useCallback((e) => {
    const province = e.target.value
    setSelectedProvince(province)
    setSelectedCity(null)
    if (onChange) onChange(null)
  }, [onChange])

  // 选择城市
  const handleCityChange = useCallback((e) => {
    const cityName = e.target.value
    if (!cityName) {
      setSelectedCity(null)
      if (onChange) onChange(null)
      return
    }
    const city = cityList.find(c => c.name === cityName)
    if (city) {
      setSelectedCity(city)
      if (onChange) onChange(city)
    }
  }, [cityList, onChange])

  // 计算时差信息
  const getTimeDiffInfo = (lon) => {
    const diffMinutes = (lon - 120) * 4
    const sign = diffMinutes >= 0 ? '+' : ''
    const hours = Math.floor(Math.abs(diffMinutes) / 60)
    const mins = Math.round(Math.abs(diffMinutes) % 60)
    if (hours > 0) {
      return `与北京时差 ${sign}${diffMinutes > 0 ? '' : '-'}${hours}时${mins}分`
    }
    return `与北京时差 ${sign}${Math.round(diffMinutes)}分钟`
  }

  return (
    <div className="birth-city-input">
      <div className="city-select-row">
        {/* 省份选择 */}
        <div className="city-select-group">
          <span className="city-select-icon">🗺️</span>
          <select
            className="select-field province-select"
            value={selectedProvince}
            onChange={handleProvinceChange}
          >
            <option value="">选择省份</option>
            {provinceList.map(province => (
              <option key={province} value={province}>{province}</option>
            ))}
          </select>
        </div>

        {/* 城市选择 */}
        <div className="city-select-group">
          <span className="city-select-icon">📍</span>
          <select
            className="select-field city-select"
            value={selectedCity?.name || ''}
            onChange={handleCityChange}
            disabled={!selectedProvince}
          >
            <option value="">选择城市</option>
            {cityList.map(city => (
              <option key={city.name} value={city.name}>{city.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 选中城市后的信息展示 */}
      {selectedCity && (
        <div className="city-selected-info">
          <div className="city-info-row">
            <span className="city-info-label">经度</span>
            <span className="city-info-value">东经 {selectedCity.lon.toFixed(2)}°</span>
          </div>
          <div className="city-info-row">
            <span className="city-info-label">时差</span>
            <span className="city-info-value time-diff">{getTimeDiffInfo(selectedCity.lon)}</span>
          </div>
        </div>
      )}

      <p className="birth-city-hint">
        {selectedCity 
          ? `已选择出生地，真太阳时将根据${selectedCity.name}经度修正` 
          : '选择出生省份和城市，用于真太阳时修正，确保八字排盘准确'}
      </p>
    </div>
  )
}
