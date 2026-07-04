import React from 'react'

/**
 * 评分环组件
 * SVG圆环+动画，显示综合评分
 */
export default function ScoreRing({ score, level }) {
  // 根据分数确定颜色
  const getColor = (s) => {
    if (s >= 70) return 'var(--ji-color)'
    if (s >= 50) return 'var(--copper-gold)'
    if (s >= 35) return '#c4982e'
    return 'var(--xiong-color)'
  }

  const color = getColor(score)
  const radius = 45
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  return (
    <div className="score-ring-container">
      <svg className="score-ring-svg" viewBox="0 0 100 100">
        <circle
          className="score-ring-bg"
          cx="50" cy="50" r={radius}
        />
        <circle
          className="score-ring-fill"
          cx="50" cy="50" r={radius}
          stroke={color}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ animation: 'score-fill 1s ease-out forwards' }}
        />
      </svg>
      <div className="score-ring-text">
        <span className="score-number" style={{ color }}>{score}</span>
        <span className="score-level">{level}</span>
      </div>
    </div>
  )
}
