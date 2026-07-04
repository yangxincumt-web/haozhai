import React, { useState } from 'react'
import { geocodeAddress } from '../utils/geoUtils'
import { detectOrientation } from '../utils/satelliteAI'

/**
 * 远程判向面板
 * 提供两种远程看盘方式：
 * 1. 手动八方位选择（3×3网格）
 * 2. AI卫星图判向（输入地址→卫星图→AI识别朝向）
 */

// 八方位数据
const DIRECTIONS = [
  { name: '西北', angle: 315, row: 0, col: 0 },
  { name: '正北', angle: 0, row: 0, col: 1 },
  { name: '东北', angle: 45, row: 0, col: 2 },
  { name: '正西', angle: 270, row: 1, col: 0 },
  { name: '中心', angle: -1, row: 1, col: 1 },
  { name: '正东', angle: 90, row: 1, col: 2 },
  { name: '西南', angle: 225, row: 2, col: 0 },
  { name: '正南', angle: 180, row: 2, col: 1 },
  { name: '东南', angle: 135, row: 2, col: 2 },
]

export default function RemoteOrientation({ onDone, onBack }) {
  const [mode, setMode] = useState(null) // null | 'manual' | 'ai'
  const [selectedDir, setSelectedDir] = useState(null)
  const [address, setAddress] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiResult, setAiResult] = useState(null)
  const [aiError, setAiError] = useState('')

  // 手动选择方位
  const handleManualSelect = (dir) => {
    if (dir.angle === -1) return // 跳过中心
    setSelectedDir(dir)
  }

  const handleManualConfirm = () => {
    if (selectedDir) {
      onDone(selectedDir.angle, selectedDir.name)
    }
  }

  // AI卫星图判向
  const handleAIDetect = async () => {
    if (!address.trim()) return
    setAiLoading(true)
    setAiError('')
    setAiResult(null)

    try {
      // 1. 地理编码
      const geo = await geocodeAddress(address.trim())
      if (!geo) {
        setAiError('地址解析失败，请输入更具体的地址（如"郑州市金水区正弘城"）')
        setAiLoading(false)
        return
      }

      // 2. AI判向
      const result = await detectOrientation(geo.lon, geo.lat)
      if (!result.success) {
        setAiError(result.error || 'AI判向失败，请重试')
        setAiLoading(false)
        return
      }

      setAiResult({ ...result, geoName: geo.name })
    } catch (e) {
      setAiError('判向出错：' + (e.message || '未知错误'))
    } finally {
      setAiLoading(false)
    }
  }

  const handleAIConfirm = () => {
    if (aiResult) {
      onDone(aiResult.angle, aiResult.direction)
    }
  }

  // 选择模式页面
  if (!mode) {
    return (
      <div className="remote-orientation">
        <div className="remote-header">
          <button className="remote-back-btn" onClick={onBack}>← 返回</button>
          <div className="remote-header-center">
            <h2 className="remote-title">📍 远程看盘</h2>
            <p className="remote-subtitle">不在现场也能看方位</p>
          </div>
        </div>

        <div className="remote-mode-select">
          <button className="remote-mode-btn" onClick={() => setMode('manual')}>
            <span className="mode-icon">🧭</span>
            <span className="mode-name">手动选方位</span>
            <span className="mode-desc">选择房屋八个朝向</span>
          </button>
          <button className="remote-mode-btn" onClick={() => setMode('ai')}>
            <span className="mode-icon">🛰️</span>
            <span className="mode-name">AI卫星图判向</span>
            <span className="mode-desc">输入地址自动识别朝向</span>
          </button>
        </div>
      </div>
    )
  }

  // 手动八方位选择
  if (mode === 'manual') {
    return (
      <div className="remote-orientation">
        <div className="remote-header">
          <button className="remote-back-btn" onClick={() => setMode(null)}>← 返回</button>
          <div className="remote-header-center">
            <h2 className="remote-title">🧭 手动选方位</h2>
            <p className="remote-subtitle">选择房屋主要采光面朝向</p>
          </div>
        </div>

        <div className="manual-grid">
          {DIRECTIONS.map((dir) => (
            <button
              key={dir.name}
              className={`manual-cell ${dir.angle === -1 ? 'center' : ''} ${selectedDir?.name === dir.name ? 'selected' : ''}`}
              onClick={() => handleManualSelect(dir)}
              disabled={dir.angle === -1}
            >
              {dir.angle === -1 ? '🏠' : dir.name}
            </button>
          ))}
        </div>

        {selectedDir && (
          <div className="manual-result">
            <p className="manual-selected">已选择：<strong>{selectedDir.name}</strong>（{selectedDir.angle}°）</p>
            <button className="btn-confirm-heading" onClick={handleManualConfirm}>
              确认朝向
            </button>
          </div>
        )}
      </div>
    )
  }

  // AI卫星图判向
  return (
    <div className="remote-orientation">
      <div className="remote-header">
        <button className="remote-back-btn" onClick={() => setMode(null)}>← 返回</button>
        <div className="remote-header-center">
          <h2 className="remote-title">🛰️ AI卫星图判向</h2>
          <p className="remote-subtitle">输入地址，AI自动识别朝向</p>
        </div>
      </div>

      <div className="ai-input-section">
        <input
          className="ai-address-input"
          type="text"
          placeholder="输入小区名称，如：郑州市正弘城"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAIDetect()}
        />
        <button
          className="btn-confirm-heading ai-detect-btn"
          onClick={handleAIDetect}
          disabled={aiLoading || !address.trim()}
        >
          {aiLoading ? '分析中...' : '🔍 AI判向'}
        </button>
      </div>

      {aiError && (
        <div className="ai-error">{aiError}</div>
      )}

      {aiLoading && (
        <div className="ai-loading">
          <div className="ai-spinner"></div>
          <p>正在分析卫星图...</p>
        </div>
      )}

      {aiResult && !aiLoading && (
        <div className="ai-result">
          {aiResult.satelliteUrl && (
            <div className="satellite-preview">
              <img src={aiResult.satelliteUrl} alt="卫星图" />
            </div>
          )}
          <div className="ai-result-info">
            <p className="ai-direction">
              🏠 朝向：<strong>{aiResult.direction}</strong>
              <span className="ai-angle">（{aiResult.angle}°）</span>
            </p>
            <p className="ai-confidence">
              置信度：{Math.round(aiResult.confidence * 100)}%
            </p>
            {aiResult.note && (
              <p className="ai-note">💡 {aiResult.note}</p>
            )}
          </div>
          <button className="btn-confirm-heading" onClick={handleAIConfirm}>
            确认此朝向
          </button>
        </div>
      )}
    </div>
  )
}
