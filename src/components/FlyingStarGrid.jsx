import React from 'react'
import { NINE_STARS } from '../algorithms/feixing.js'

/**
 * 飞星九宫格组件
 * 显示运星、山星、向星三盘组合
 * 
 * 传统飞星盘格式（每个宫位）：
 * ┌─────────┐
 * │  运星   │
 * │ 山星 向星│
 * └─────────┘
 */
export default function FlyingStarGrid({ feiXingResult }) {
  if (!feiXingResult) return null

  const { palaces, pattern, period, facingLabel, prosperity, buildYear, currentYear, annualStars, fanYinFuYin } = feiXingResult

  // 九宫格排列顺序（按传统方位，上南下北左东右西）
  // 实际显示：从左到右，从上到下
  // 巽(东南) 离(南) 坤(西南)
  // 震(东)   中宫   兑(西)
  // 艮(东北) 坎(北) 乾(西北)
  const gridOrder = [
    ['巽', '离', '坤'],
    ['震', '中', '兑'],
    ['艮', '坎', '乾'],
  ]

  // 获取宫位数据
  const getPalaceData = (palaceName) => {
    return palaces.find(p => p.palace === palaceName)
  }

  // 星数对应的颜色
  const getStarColor = (starNum, isWang = false) => {
    if (isWang) return '#c23a2a' // 当旺红色高亮
    const colors = {
      1: '#2980b9', // 水-蓝
      2: '#a67c3d', // 土-黄
      3: '#1a9a55', // 木-绿
      4: '#158045', // 木-深绿
      5: '#c23a2a', // 土-红（五黄特殊）
      6: '#c4982e', // 金-金
      7: '#d35400', // 金-橙
      8: '#a67c3d', // 土-黄
      9: '#c23a2a', // 火-红
    }
    return colors[starNum] || '#999'
  }

  // 组合吉凶底色
  const getComboBg = (score) => {
    if (score >= 75) return 'rgba(46, 204, 113, 0.12)'  // 吉-绿底
    if (score >= 55) return 'rgba(241, 196, 15, 0.08)'   // 平-黄底
    if (score >= 35) return 'rgba(230, 126, 34, 0.10)'   // 小凶-橙底
    return 'rgba(231, 76, 60, 0.12)'                      // 大凶-红底
  }

  // 组合吉凶边框
  const getComboBorder = (score) => {
    if (score >= 75) return '1px solid rgba(46, 204, 113, 0.3)'
    if (score >= 55) return '1px solid rgba(241, 196, 15, 0.2)'
    if (score >= 35) return '1px solid rgba(230, 126, 34, 0.25)'
    return '1px solid rgba(231, 76, 60, 0.3)'
  }

  return (
    <div className="feixing-section">
      <h3 className="section-title">
        玄空飞星盘
        <span className="feixing-period-badge">{period}运</span>
        {buildYear && <span className="feixing-period-badge" style={{marginLeft: '6px'}}>建於{buildYear}年</span>}
      </h3>

      {/* 反吟伏吟警告（V2.0新增） */}
      {fanYinFuYin && fanYinFuYin.warnings && fanYinFuYin.warnings.length > 0 && (
        <div className="fanyin-fuyin-warnings">
          {fanYinFuYin.warnings.map((w, i) => (
            <div key={i} className={`fanyin-warning ${w.includes('全局') ? 'global' : 'local'}`}>
              ⚠️ {w}
            </div>
          ))}
        </div>
      )}

      {/* 格局信息 */}
      <div className="pattern-card">
        <div className="pattern-type">{pattern.type}</div>
        <div className="pattern-desc">{pattern.desc}</div>
        <div className="pattern-meta">
          <span className="pattern-label">{facingLabel}</span>
          <span className="pattern-score">格局分：{pattern.score}</span>
        </div>
      </div>

      {/* 九宫飞星图 */}
      <div className="feixing-grid">
        {/* 方位标注 */}
        <div className="feixing-direction-label top">南</div>
        <div className="feixing-direction-label bottom">北</div>
        <div className="feixing-direction-label left">东</div>
        <div className="feixing-direction-label right">西</div>

        <div className="feixing-grid-inner">
          {gridOrder.map((row, rowIdx) => (
            <div key={rowIdx} className="feixing-row">
              {row.map((palaceName, colIdx) => {
                const data = getPalaceData(palaceName)
                if (!data) return <div key={colIdx} className="feixing-cell empty" />

                const isCenter = palaceName === '中'

                return (
                  <div
                    key={palaceName}
                    className={`feixing-cell ${isCenter ? 'center' : ''} ${data.comboNature}`}
                    style={{
                      background: getComboBg(data.comboScore),
                      border: getComboBorder(data.comboScore),
                    }}
                  >
                    {/* 方位标签 */}
                    <div className="cell-position">{data.position}</div>

                    {/* 运星（小字，左上） */}
                    <div
                      className="cell-yunstar"
                      style={{ color: getStarColor(data.yunStar, data.yunStar === period) }}
                    >
                      {data.yunStar}
                    </div>

                    {/* 山星（左下）和向星（右下） */}
                    <div className="cell-stars">
                      <span
                        className="cell-shanstar"
                        style={{ color: getStarColor(data.shanStar, data.isShanWang) }}
                      >
                        {data.shanStar}
                      </span>
                      <span className="cell-star-separator">·</span>
                      <span
                        className="cell-xiangstar"
                        style={{ color: getStarColor(data.xiangStar, data.isXiangWang) }}
                      >
                        {data.xiangStar}
                      </span>
                    </div>

                    {/* 组合简评 */}
                    <div className="cell-combo">{data.comboNature}</div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* 图例说明 */}
      <div className="feixing-legend">
        <div className="legend-item">
          <span className="legend-num yun">运</span>
          <span>元运星（{period}运={period}入中）</span>
        </div>
        <div className="legend-item">
          <span className="legend-num shan">山</span>
          <span>山星（管人丁健康）</span>
        </div>
        <div className="legend-item">
          <span className="legend-num xiang">向</span>
          <span>向星（管财运事业）</span>
        </div>
        {annualStars && (
          <div className="legend-item">
            <span className="legend-num" style={{color: '#8e44ad'}}>年</span>
            <span>流年飞星（{currentYear}年，{NINE_STARS[feiXingResult.annualCenterStar]?.name || ''}入中）</span>
          </div>
        )}
        <div className="legend-item">
          <span className="legend-wang">红</span>
          <span>当旺星</span>
        </div>
      </div>

      {/* 各宫位详细分析 */}
      <div className="feixing-details">
        <h4 className="detail-title">各方位飞星详解</h4>
        {palaces.filter(p => p.palace !== '中').sort((a, b) => (b.adjustedScore || b.comboScore) - (a.adjustedScore || a.comboScore)).map(p => (
          <div key={p.palace} className={`feixing-detail-card ${p.comboNature}`}>
            <div className="detail-header">
              <span className="detail-position">{p.position}</span>
              <span className={`detail-nature ${p.comboNature}`}>{p.comboNature}</span>
              <span className="detail-score">{p.adjustedScore || p.comboScore}分</span>
            </div>
            <div className="detail-stars-row">
              <span className="detail-star-label">运星</span>
              <span className="detail-star-value">{p.yunStar}·{p.yunInfo.name}</span>
              <span className="detail-star-label">山星</span>
              <span className="detail-star-value">{p.shanStar}·{p.shanInfo.name}</span>
              <span className="detail-star-label">向星</span>
              <span className="detail-star-value">{p.xiangStar}·{p.xiangInfo.name}</span>
            </div>
            {/* 流年星（V2.0新增） */}
            {p.annualInfo && (
              <div className="detail-stars-row" style={{marginTop: '4px'}}>
                <span className="detail-star-label">流年</span>
                <span className="detail-star-value" style={{color: getStarColor(p.annualStar, p.annualStar === period)}}>{p.annualStar}·{p.annualInfo.name}</span>
              </div>
            )}
            <div className="detail-desc">{p.comboDesc}</div>
            {/* 三星组合提示（V2.0新增） */}
            {p.threeStarAnalysis && p.threeStarAnalysis.level !== '平' && (
              <div className="detail-three-star" style={{marginTop: '4px', fontSize: '13px', color: p.threeStarAnalysis.level === '大吉' ? '#2ecc71' : p.threeStarAnalysis.level === '吉' ? '#27ae60' : p.threeStarAnalysis.level === '大凶' ? '#e74c3c' : '#e67e22'}}>
                ✦ {p.threeStarAnalysis.type}：{p.threeStarAnalysis.desc}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
