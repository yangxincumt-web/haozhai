import React, { useState } from 'react'
import { getYouXingInterpretation, FEIXING_STARS, getFeiXingCombo } from '../algorithms/interpretation.js'

/**
 * 八宫方位九宫格 V2.0（解读增强版）
 * 点击方位格展开知识解读
 * 
 * 方位映射到九宫格位置：
 * 东南(0) 南(1) 西南(2)
 * 东(3)   中(4) 西(5)
 * 东北(6) 北(7) 西北(8)
 */
export default function PalaceGrid({ palaces, feiXing, roomLayout }) {
  const [expanded, setExpanded] = useState(null) // 展开的方位名

  // 方位→九宫格位置映射
  const positionToIndex = {
    '东南': 0, '南': 1, '西南': 2,
    '东': 3, '中': 4, '西': 5,
    '东北': 6, '北': 7, '西北': 8,
  }

  // 反查：九宫格位置→方位名
  const indexToPosition = {}
  Object.entries(positionToIndex).forEach(([pos, idx]) => {
    indexToPosition[idx] = pos
  })

  // 构建9格数据
  const cells = Array(9).fill(null).map((_, i) => {
    if (i === 4) return { type: 'center', label: '宅' }
    const posName = indexToPosition[i]
    const palace = palaces?.find(p => p.position === posName)
    return palace ? { type: 'palace', data: palace } : { type: 'empty' }
  })

  // 点击方位格
  const handleCellClick = (position) => {
    setExpanded(expanded === position ? null : position)
  }

  // 获取当前方位的房间类型
  const getRoomType = (position) => {
    if (!roomLayout) return null
    // roomLayout 格式: { '东': '主卧', '南': '客厅', ... }
    return roomLayout[position] || null
  }

  // 获取飞星数据
  const getFeiXingForPosition = (position) => {
    if (!feiXing || !feiXing.palaces) return null
    return feiXing.palaces.find(p => p.position === position) || null
  }

  // 展开区域的解读内容
  const expandedData = (() => {
    if (!expanded) return null
    const palace = palaces?.find(p => p.position === expanded)
    if (!palace) return null

    const roomType = getRoomType(expanded)
    const interp = getYouXingInterpretation(palace.youxing, roomType)
    const fxData = getFeiXingForPosition(expanded)

    return {
      palace,
      roomType,
      interp,
      fxData,
      fxMountainStar: fxData?.mountain ? FEIXING_STARS[fxData.mountain] : null,
      fxFacingStar: fxData?.facing ? FEIXING_STARS[fxData.facing] : null,
      fxCombo: (fxData?.mountain && fxData?.facing) ? getFeiXingCombo(fxData.mountain, fxData.facing) : null,
    }
  })()

  return (
    <div>
      <h3 className="section-title">八宫方位</h3>
      <div className="palace-grid">
        {cells.map((cell, i) => {
          if (cell.type === 'center') {
            return (
              <div key={i} className="palace-cell center-cell">
                <span style={{ fontSize: 18, color: 'var(--copper-gold)' }}>☯</span>
                <span className="palace-trigram">宅</span>
              </div>
            )
          }

          if (cell.type === 'palace') {
            const p = cell.data
            const natureClass = p.nature === '吉' ? 'ji' : 'xiong'
            const isExpanded = expanded === p.position
            return (
              <div 
                key={i} 
                className={`palace-cell ${natureClass}${isExpanded ? ' expanded' : ''}`}
                onClick={() => handleCellClick(p.position)}
                style={{ cursor: 'pointer' }}
              >
                <span className="palace-position">{p.position}</span>
                <span className="palace-youxing">{p.youxing}</span>
                <span className="palace-trigram">{p.trigram}·{p.element}</span>
                <span className="palace-score">{p.score}分</span>
              </div>
            )
          }

          return <div key={i} className="palace-cell" />
        })}
      </div>

      {/* 展开的解读面板 */}
      {expandedData && (
        <div className="palace-interpretation-panel">
          <div className="interp-header">
            <span className={`interp-nature ${expandedData.palace.nature === '吉' ? 'ji' : 'xiong'}`}>
              {expandedData.palace.nature}
            </span>
            <span className="interp-title">
              {expandedData.position} · {expandedData.palace.youxing}位
              {expandedData.roomType && <span className="interp-room">（{expandedData.roomType}）</span>}
            </span>
            <button className="interp-close" onClick={() => setExpanded(null)}>✕</button>
          </div>

          {/* 八宅解读 */}
          {expandedData.interp && (
            <div className="interp-section">
              <div className="interp-label">🏠 八宅解读</div>
              <p className="interp-text">{expandedData.interp.summary}</p>
              {expandedData.roomType && expandedData.interp.roomAdvice && (
                <p className="interp-room-advice">💡 {expandedData.interp.roomAdvice}</p>
              )}
              <div className="interp-tips">
                <span className="interp-tip-label">催旺/化解：</span>
                <span className="interp-tip-items">
                  {expandedData.interp.items?.join('、')}
                </span>
              </div>
              {expandedData.interp.avoid && (
                <div className="interp-avoid">⚠️ {expandedData.interp.avoid}</div>
              )}
            </div>
          )}

          {/* 飞星解读 */}
          {(expandedData.fxMountainStar || expandedData.fxFacingStar) && (
            <div className="interp-section">
              <div className="interp-label">✦ 玄空飞星</div>
              {expandedData.fxMountainStar && (
                <div className="interp-star">
                  <span className="star-badge mountain">山星{expandedData.fxData.mountain}</span>
                  <span className="star-name">{expandedData.fxMountainStar.name}</span>
                  <span className={`star-nature ${expandedData.fxMountainStar.nature === '吉' ? 'ji' : 'xiong'}`}>
                    {expandedData.fxMountainStar.nature}
                  </span>
                </div>
              )}
              {expandedData.fxFacingStar && (
                <div className="interp-star">
                  <span className="star-badge facing">向星{expandedData.fxData.facing}</span>
                  <span className="star-name">{expandedData.fxFacingStar.name}</span>
                  <span className={`star-nature ${expandedData.fxFacingStar.nature === '吉' ? 'ji' : 'xiong'}`}>
                    {expandedData.fxFacingStar.nature}
                  </span>
                </div>
              )}
              {expandedData.fxCombo && (
                <p className="interp-combo">
                  「{expandedData.fxCombo.name}」{expandedData.fxCombo.desc}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* 底部提示 */}
      <p className="palace-hint">点击方位格查看详细解读</p>
    </div>
  )
}
