import React, { useState, useCallback, useEffect, useRef } from 'react'
import { getXingshaList, calculateXingshaScore, getAdvantageList, calculateEnvAdvantages } from '../algorithms/xingsha.js'

// 高德API Key
const AMAP_KEY = '775f7d250896654177f15270367a1aa9'

// POI类型配置
const POI_TYPES = [
  { type: '医院', keyword: '医院', icon: '🏥', color: '#e74c3c' },
  { type: '寺庙', keyword: '寺庙|教堂|道观|清真寺', icon: '⛪', color: '#9b59b6' },
  { type: '加油站', keyword: '加油站', icon: '⛽', color: '#f39c12' },
  { type: '高压电塔', keyword: '高压线|变电站|电塔', icon: '⚡', color: '#e67e22' },
  { type: '垃圾站', keyword: '垃圾处理|垃圾场|垃圾转运站', icon: '🗑️', color: '#7f8c8d' },
  { type: '快速路', keyword: '高速公路|快速路|高架', icon: '🛣️', color: '#3498db' },
]

// 动态加载高德JS API
let amapLoaded = false
let amapLoading = false
const amapCallbacks = []

function loadAmapScript() {
  if (amapLoaded) {
    return Promise.resolve()
  }
  
  return new Promise((resolve, reject) => {
    if (amapLoading) {
      amapCallbacks.push({ resolve, reject })
      return
    }
    
    amapLoading = true
    
    const script = document.createElement('script')
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${AMAP_KEY}&plugin=AMap.PlaceSearch,AMap.Geocoder`
    script.async = true
    script.onload = () => {
      amapLoaded = true
      amapLoading = false
      amapCallbacks.forEach(cb => cb.resolve())
      resolve()
    }
    script.onerror = () => {
      amapLoading = false
      amapCallbacks.forEach(cb => cb.reject(new Error('高德地图加载失败')))
      reject(new Error('高德地图加载失败'))
    }
    document.head.appendChild(script)
  })
}

export default function EnvAnalysis({ lat, lon, onDone, onSkip, onBack }) {
  const [mapReady, setMapReady] = useState(false)
  const [mapError, setMapError] = useState(null)
  const [poiResults, setPoiResults] = useState({})
  const [isSearching, setIsSearching] = useState(false)
  
  // 形煞勾选状态
  const [selectedXingsha, setSelectedXingsha] = useState([])
  const [xingshaResult, setXingshaResult] = useState(null)
  
  // 环境优势勾选状态
  const [selectedAdvantages, setSelectedAdvantages] = useState([])
  const [advantageResult, setAdvantageResult] = useState(null)
  
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)

  // 初始化地图
  useEffect(() => {
    const initMap = async () => {
      try {
        await loadAmapScript()
        setMapReady(true)
      } catch (error) {
        setMapError('地图加载失败，请检查网络连接')
      }
    }
    
    initMap()
  }, [])

  // 渲染地图
  useEffect(() => {
    if (!mapReady || !mapRef.current || !lat || !lon) return
    
    if (mapInstanceRef.current) {
      mapInstanceRef.current.destroy()
    }
    
    const map = new window.AMap.Map(mapRef.current, {
      zoom: 15,
      center: [lon, lat],
      mapStyle: 'amap://styles/darkblue',
    })
    
    mapInstanceRef.current = map
    
    const centerMarker = new window.AMap.Marker({
      position: new window.AMap.LngLat(lon, lat),
      title: '您的位置',
      icon: new window.AMap.Icon({
        size: new window.AMap.Size(32, 32),
        image: 'https://webapi.amap.com/theme/v1.3/markers/n/mark_b.png',
        imageSize: new window.AMap.Size(32, 32),
      }),
    })
    map.add(centerMarker)
    
    searchNearbyPOI(map, lon, lat)
    
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy()
        mapInstanceRef.current = null
      }
    }
  }, [mapReady, lat, lon])

  // 搜索周边POI
  const searchNearbyPOI = useCallback((map, longitude, latitude) => {
    if (!map) return
    
    setIsSearching(true)
    const results = {}
    let completed = 0
    
    POI_TYPES.forEach(poiType => {
      const placeSearch = new window.AMap.PlaceSearch({
        type: poiType.keyword,
        pageSize: 3,
        pageIndex: 1,
      })
      
      placeSearch.searchNearBy(poiType.keyword, [longitude, latitude], 500, (status, result) => {
        if (status === 'complete' && result.poiList && result.poiList.pois) {
          results[poiType.type] = result.poiList.pois.slice(0, 3).map(poi => ({
            name: poi.name,
            address: poi.address,
            distance: Math.round(poi.distance),
          }))
          
          result.poiList.pois.slice(0, 3).forEach(poi => {
            const marker = new window.AMap.Marker({
              position: poi.location,
              title: poi.name,
            })
            map.add(marker)
          })
        }
        
        completed++
        if (completed === POI_TYPES.length) {
          setPoiResults(results)
          setIsSearching(false)
        }
      })
    })
  }, [])

  // 切换形煞勾选
  const toggleXingsha = useCallback((xingshaId) => {
    setSelectedXingsha(prev => {
      if (prev.includes(xingshaId)) {
        return prev.filter(id => id !== xingshaId)
      } else {
        return [...prev, xingshaId]
      }
    })
  }, [])

  // 切换环境优势勾选
  const toggleAdvantage = useCallback((advId) => {
    setSelectedAdvantages(prev => {
      if (prev.includes(advId)) {
        return prev.filter(id => id !== advId)
      } else {
        return [...prev, advId]
      }
    })
  }, [])

  // 提交形煞评估
  const handleSubmit = useCallback(() => {
    let result = null
    if (selectedXingsha.length > 0) {
      result = calculateXingshaScore(selectedXingsha)
    }
    setXingshaResult(result)
    
    // 计算环境优势加分
    let advResult = null
    if (selectedAdvantages.length > 0) {
      advResult = calculateEnvAdvantages(selectedAdvantages)
    }
    setAdvantageResult(advResult)
    
    if (onDone) {
      onDone(result || { totalPenalty: 0, severity: 'none', details: [], resolutions: [], summary: '' }, advResult || { totalBonus: 0, advantages: [], summary: '' })
    }
  }, [selectedXingsha, selectedAdvantages, onDone])

  const xingshaList = getXingshaList()
  const advantageList = getAdvantageList()

  // 渲染形煞严重度图标
  const renderXingshaIcon = (severity) => {
    const colors = {
      severe: '#e74c3c',
      moderate: '#f39c12',
      mild: '#3498db',
    }
    return (
      <span 
        className="severity-dot"
        style={{ backgroundColor: colors[severity] }}
      />
    )
  }

  return (
    <div className="env-analysis-step">
      {/* 高德地图 */}
      <div className="map-section">
        <h4 className="section-subtitle">📍 周边500米环境</h4>
        
        <div 
          ref={mapRef} 
          className="amap-container"
          style={{ height: '250px', borderRadius: '12px', overflow: 'hidden' }}
        />
        
        {mapError && (
          <div className="map-error">{mapError}</div>
        )}
        
        {isSearching && (
          <div className="map-loading">
            <span className="loading-spinner" />
            正在搜索周边设施...
          </div>
        )}

        {/* POI结果列表 */}
        {Object.keys(poiResults).length > 0 && (
          <div className="poi-results">
            {POI_TYPES.map(poiType => {
              const pois = poiResults[poiType.type] || []
              if (pois.length === 0) return null
              
              return (
                <div key={poiType.type} className="poi-category">
                  <div className="poi-category-header">
                    <span className="poi-icon">{poiType.icon}</span>
                    <span className="poi-type">{poiType.type}</span>
                    <span className="poi-count">{pois.length}处</span>
                  </div>
                  {pois.map((poi, idx) => (
                    <div key={idx} className="poi-item">
                      <span className="poi-name">{poi.name}</span>
                      <span className="poi-distance">{poi.distance}m</span>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 形煞评估 */}
      <div className="xingsha-section">
        <h4 className="section-subtitle">☯️ 形煞评估</h4>
        <p className="section-hint">
          根据周边环境，勾选确认存在的形煞
        </p>
        
        <div className="xingsha-list">
          {xingshaList.map(xingsha => (
            <label 
              key={xingsha.id} 
              className={`xingsha-item ${selectedXingsha.includes(xingsha.id) ? 'selected' : ''}`}
            >
              <input
                type="checkbox"
                checked={selectedXingsha.includes(xingsha.id)}
                onChange={() => toggleXingsha(xingsha.id)}
              />
              <div className="xingsha-check">
                {selectedXingsha.includes(xingsha.id) && '✓'}
              </div>
              <div className="xingsha-info">
                <div className="xingsha-header">
                  <span className="xingsha-icon">{xingsha.icon}</span>
                  <span className="xingsha-name">{xingsha.name}</span>
                  {renderXingshaIcon(xingsha.severity)}
                </div>
                <div className="xingsha-desc">{xingsha.description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* 环境优势评估 */}
      <div className="xingsha-section advantage-section">
        <h4 className="section-subtitle">✨ 环境优势</h4>
        <p className="section-hint">
          勾选住宅周边的环境优势，为评分加分
        </p>
        
        <div className="xingsha-list advantage-list">
          {advantageList.map(adv => (
            <label 
              key={adv.id} 
              className={`xingsha-item advantage-item ${selectedAdvantages.includes(adv.id) ? 'selected' : ''}`}
            >
              <input
                type="checkbox"
                checked={selectedAdvantages.includes(adv.id)}
                onChange={() => toggleAdvantage(adv.id)}
              />
              <div className="xingsha-check advantage-check">
                {selectedAdvantages.includes(adv.id) && '✓'}
              </div>
              <div className="xingsha-info">
                <div className="xingsha-header">
                  <span className="xingsha-icon">{adv.icon}</span>
                  <span className="xingsha-name">{adv.name}</span>
                  <span className="bonus-dot">+{adv.bonus}</span>
                </div>
                <div className="xingsha-desc">{adv.description}</div>
                <div className="advantage-benefit">{adv.benefit}</div>
              </div>
            </label>
          ))}
        </div>
        
        {selectedAdvantages.length > 0 && (
          <div className="advantage-summary">
            已选 {selectedAdvantages.length} 项优势，预计加分 +{advantageList.filter(a => selectedAdvantages.includes(a.id)).reduce((s, a) => s + a.bonus, 0)}分
          </div>
        )}
      </div>

      {/* 操作按钮 */}
      <div className="step-actions">
        <button className="btn-primary" onClick={handleSubmit}>
          确认并继续
        </button>
        <button className="btn-secondary" onClick={onSkip}>
          跳过，暂不评估
        </button>
      </div>
    </div>
  )
}
