import React from 'react'

/**
 * 地址输入组件（预留，当前在App.jsx中内联）
 * 后续可扩展为带自动补全的地址选择器
 */
export default function AddressInput({ value, onChange }) {
  return (
    <div className="form-group">
      <label>所在城市<span className="optional">（选填，提高磁偏角精度）</span></label>
      <input
        type="text"
        className="input-field"
        placeholder="如 郑州市金水区"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}
