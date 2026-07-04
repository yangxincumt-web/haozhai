import React, { useState } from 'react'

/**
 * 化解方案面板 V3.0
 * 显示凶位化解建议+飞星化解+吉位旺运+流年建议+反吟伏吟+摆件推荐
 * 支持八宅+飞星+流年+反吟伏吟+房间类型融合后的精准化化解
 */
export default function HuajiePanel({ huajie }) {
  const { problems, suggestions, items, liunianAdvice, fanyinFuyin } = huajie
  const [showLiunian, setShowLiunian] = useState(true)
  const [showFanyin, setShowFanyin] = useState(true)

  // 按严重程度排序：严重在前
  const sortedProblems = [...problems].sort((a, b) => {
    const severityOrder = { '严重': 0, '注意': 1, '提示': 2 }
    return (severityOrder[a.severity] ?? 3) - (severityOrder[b.severity] ?? 3)
  })

  // 凶位化解建议（不含旺运和提示）
  const xiongSuggestions = suggestions.filter(s => s.level !== '旺运' && s.level !== '提示')
  // 弱提示（飞星覆盖后）
  const tipSuggestions = suggestions.filter(s => s.level === '提示')
  // 吉位旺运
  const jiSuggestions = suggestions.filter(s => s.level === '旺运')

  // 获取来源标签颜色
  const getSourceTag = (source) => {
    const tagMap = {
      '飞星': 'feixing',
      '形煞': 'xingsha',
      '装修风水': 'renovation',
      '装修风格': 'style',
      '装修质量': 'renovation',
      '流年飞星': 'liunian',
      '反吟伏吟': 'fanyin',
      '八宅+飞星+房间融合': 'bazhai',
    }
    const cls = tagMap[source] || 'bazhai'
    const label = source?.includes('融合') ? '融合' : (source || '八宅')
    return <span className={`source-tag ${cls}`}>{label}</span>
  }

  return (
    <div className="huajie-list">
      {/* 反吟伏吟警告（最优先显示） */}
      {fanyinFuyin && fanyinFuyin.length > 0 && (
        <>
          <div className="section-header-toggle" onClick={() => setShowFanyin(!showFanyin)}>
            <h3 className="section-title" style={{ color: '#e74c3c', fontSize: 14, margin: 0 }}>
              ⚠️ 反吟伏吟警告（{fanyinFuyin.length}处）
            </h3>
            <span className="toggle-icon">{showFanyin ? '▾' : '▸'}</span>
          </div>
          {showFanyin && fanyinFuyin.map((fy, i) => (
            <div key={i} className="huajie-card fy-card">
              <div className="huajie-card-header">
                <span className="huajie-position">
                  {fy.position}·{fy.type}
                  {fy.stars && <span className="fy-stars"> ({fy.stars})</span>}
                  <span className="source-tag fanyin">{fy.type}</span>
                </span>
                <span className="huajie-severity severe">严重</span>
              </div>
              <p className="huajie-problem">{fy.desc}</p>
              <p className="huajie-solution">🛡️ {fy.huaJie}</p>
              <p className="huajie-prefer">✅ 宜用：{fy.prefer}</p>
            </div>
          ))}
        </>
      )}

      {/* 凶位化解（按严重度排序） */}
      {sortedProblems.map((prob, i) => {
        const suggestion = xiongSuggestions.find(s => s.position === prob.position && s.youxing === prob.youxing)
        const relatedItems = items.filter(it => it.position === prob.position)
        const isFanyin = prob.source === '反吟伏吟'

        // 反吟伏吟已在上方显示，这里跳过
        if (isFanyin) return null

        return (
          <div key={i} className="huajie-card">
            <div className="huajie-card-header">
              <span className="huajie-position">
                {prob.position}·{prob.youxing}
                {getSourceTag(prob.source)}
              </span>
              <span className={`huajie-severity ${prob.severity === '严重' ? 'severe' : 'notice'}`}>
                {prob.severity}
              </span>
            </div>
            <p className="huajie-problem">{prob.problem}</p>
            {suggestion && (
              <>
                <p className="huajie-solution">💡 {suggestion.desc}</p>
                <p className="huajie-room">🏠 {prob.roomAdvice}</p>
              </>
            )}
            {relatedItems.length > 0 && (
              <div className="huajie-items">
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>推荐摆件</p>
                {relatedItems.map((item, j) => (
                  <div key={j} className="huajie-item">
                    <span className="huajie-item-name">{item.name}</span>
                    <span className="huajie-item-material">{item.material}</span>
                    <span className="huajie-item-price">{item.price}</span>
                    <a
                      className="huajie-item-link"
                      href={item.taobaoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      去看看→
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}

      {/* 流年飞星建议 */}
      {liunianAdvice && liunianAdvice.length > 0 && (
        <>
          <div className="section-header-toggle" onClick={() => setShowLiunian(!showLiunian)}>
            <h3 className="section-title" style={{ color: 'var(--ji-color)', fontSize: 14, margin: 0 }}>
              📅 {liunianAdvice[0]?.year || ''}年流年吉位催旺（{liunianAdvice.length}个）
            </h3>
            <span className="toggle-icon">{showLiunian ? '▾' : '▸'}</span>
          </div>
          {showLiunian && liunianAdvice.map((adv, i) => (
            <div key={i} className="huajie-card liunian-card">
              <div className="huajie-card-header">
                <span className="huajie-position">
                  {adv.position}·{adv.name}（{adv.star}星）
                  <span className="source-tag liunian">流年</span>
                </span>
                <span className="huajie-severity" style={{ background: 'var(--ji-color)', color: '#fff' }}>吉</span>
              </div>
              <p className="huajie-benefit">{adv.benefit}</p>
              <p className="huajie-solution">✨ 催旺：{adv.activate}</p>
            </div>
          ))}
        </>
      )}

      {/* 飞星覆盖提示 */}
      {tipSuggestions.length > 0 && (
        <>
          <h3 className="section-title" style={{ marginTop: 16, fontSize: 13, color: 'var(--text-muted)' }}>
            ⚡ 飞星覆盖提示
          </h3>
          {tipSuggestions.map((s, i) => (
            <div key={i} className="huajie-card" style={{ opacity: 0.8, borderLeft: '3px solid var(--text-muted)' }}>
              <div className="huajie-card-header">
                <span className="huajie-position">{s.position}·{s.youxing}</span>
                <span className="huajie-severity" style={{ background: 'var(--text-muted)', color: '#fff' }}>提示</span>
              </div>
              <p className="huajie-solution">💡 {s.desc}</p>
            </div>
          ))}
        </>
      )}

      {/* 吉位旺运 */}
      {jiSuggestions.length > 0 && (
        <>
          <h3 className="section-title" style={{ marginTop: 16, fontSize: 14, color: 'var(--ji-color)' }}>
            ✨ 吉位旺运建议
          </h3>
          {jiSuggestions.map((s, i) => {
            const jiItems = items.filter(it => it.position === s.position)
            return (
              <div key={i} className="ji-advice-card">
                <div className="ji-advice-header">
                  <span className="ji-advice-position">{s.position}·{s.youxing}</span>
                </div>
                <p className="ji-advice-benefit">{s.desc}</p>
                {s.roomAdvice && <p className="huajie-room">🏠 {s.roomAdvice}</p>}
                {jiItems.length > 0 && (
                  <div className="huajie-items" style={{ marginTop: 8 }}>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>旺运摆件</p>
                    {jiItems.map((item, j) => (
                      <div key={j} className="huajie-item">
                        <span className="huajie-item-name">{item.name}</span>
                        <span className="huajie-item-price">{item.price}</span>
                        <a
                          className="huajie-item-link"
                          href={item.taobaoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          去看看→
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </>
      )}
    </div>
  )
}
