import React from 'react'

/**
 * 八宫方位九宫格
 * 传统九宫格布局，中间为宅卦信息
 * 
 * 方位映射到九宫格位置：
 * 东南(0) 南(1) 西南(2)
 * 东(3)   中(4) 西(5)
 * 东北(6) 北(7) 西北(8)
 */
export default function PalaceGrid({ palaces }) {
  // 方位→九宫格位置映射
  const positionToIndex = {
    '东南': 0, '南': 1, '西南': 2,
    '东': 3, '中': 4, '西': 5,
    '东北': 6, '北': 7, '西北': 8,
  }

  // 构建9格数据
  const cells = Array(9).fill(null).map((_, i) => {
    if (i === 4) return { type: 'center', label: '宅' }
    const posName = Object.entries(positionToIndex).find(([_, idx]) => idx === i)?.[0]
    const palace = palaces?.find(p => p.position === posName)
    return palace ? { type: 'palace', data: palace } : { type: 'empty' }
  })

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
            return (
              <div key={i} className={`palace-cell ${natureClass}`}>
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
    </div>
  )
}
