import React, { useState, useCallback } from 'react'

// DashScope API配置
const DASHSCOPE_API_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions'
const DASHSCOPE_API_KEY = 'sk-ws-H.REIHDPH.zrek.MEYCIQDHHKh6oAHYgI22hSynqtF9EtXPQne2kcsq3WECeJ00yAIhANNPu4BV1amIb8ne2Gx5Y2wDKNEXERssFpZ_MxSMg44B'
const MODEL_NAME = 'qwen-vl-plus'

// 装修检查表分类
const CHECKLIST_CATEGORIES = [
  {
    id: 'floor',
    name: '地面问题',
    icon: '🏗️',
    items: [
      { id: 'floor_crack', label: '裂缝', desc: '地面有明显裂缝' },
      { id: 'floor_void', label: '空鼓', desc: '敲击有空鼓声' },
      { id: 'floor_sand', label: '起砂', desc: '地面起砂严重' },
      { id: 'floor_uneven', label: '不平整', desc: '有明显高低差' },
    ],
  },
  {
    id: 'wall',
    name: '墙面问题',
    icon: '🧱',
    items: [
      { id: 'wall_crack', label: '裂缝', desc: '墙面有开裂现象' },
      { id: 'wall_leak', label: '渗水', desc: '墙面有水渍渗出' },
      { id: 'wall_mold', label: '发霉', desc: '墙面有霉斑' },
      { id: 'wall_peel', label: '脱落', desc: '涂料或瓷砖脱落' },
      { id: 'wall_color', label: '色差', desc: '墙面有明显色差' },
    ],
  },
  {
    id: 'ceiling',
    name: '天花板',
    icon: '🏠',
    items: [
      { id: 'ceil_crack', label: '裂缝', desc: '天花板有裂缝' },
      { id: 'ceil_leak', label: '渗水', desc: '有水渍或滴水' },
      { id: 'ceil_deform', label: '吊顶变形', desc: '吊顶有变形下沉' },
    ],
  },
  {
    id: 'door',
    name: '门窗',
    icon: '🚪',
    items: [
      { id: 'door_deform', label: '变形', desc: '门框/窗框变形' },
      { id: 'door_seal', label: '密封差', desc: '漏风漏雨' },
      { id: 'door_hardware', label: '五金损坏', desc: '把手/合页损坏' },
      { id: 'door_open', label: '开启困难', desc: '开关不顺畅' },
    ],
  },
  {
    id: 'kitchen',
    name: '厨卫',
    icon: '🚿',
    items: [
      { id: 'kit_leak', label: '渗漏', desc: '水管或防水问题' },
      { id: 'kit_drain', label: '排水不畅', desc: '地漏/马桶不通' },
      { id: 'kit_vent', label: '通风差', desc: '无窗或排风差' },
      { id: 'kit_void', label: '瓷砖空鼓', desc: '敲击有空鼓声' },
    ],
  },
  {
    id: 'electric',
    name: '电气',
    icon: '⚡',
    items: [
      { id: 'elec_old', label: '线路老化', desc: '电线/开关老化' },
      { id: 'elec_outlet', label: '插座不足', desc: '插座数量不够' },
      { id: 'elec_pos', label: '位置不合理', desc: '开关插座位置不便' },
    ],
  },
  {
    id: 'fengshui',
    name: '装修风水问题',
    icon: '☯️',
    items: [
      { id: 'fs_beam', label: '横梁压顶', desc: '床/沙发上方有横梁' },
      { id: 'fs_door', label: '门对门', desc: '房门正对房门' },
      { id: 'fs_pass', label: '穿堂煞', desc: '开门见窗直通' },
      { id: 'fs_kitchen', label: '厨卫居中', desc: '厨房/卫生间在中心' },
      { id: 'fs_stair', label: '楼梯压门', desc: '楼梯正对大门' },
    ],
  },
  {
    id: 'style',
    name: '装修风格风水',
    icon: '🎨',
    items: [
      { id: 'st_darkcolor', label: '大面积深色', desc: '黑/深蓝/深紫为主色调，阴气过重' },
      { id: 'st_redover', label: '红色过多', desc: '大红装饰过多，火气太旺易争吵' },
      { id: 'st_sharp', label: '尖锐装饰多', desc: '大量尖角家具/装饰，煞气暗生' },
      { id: 'st_mirror', label: '镜子过多', desc: '大镜面/玻璃墙过多，气场散乱' },
      { id: 'st_clutter', label: '杂物堆积', desc: '空间拥挤杂乱，气流阻滞' },
      { id: 'st_noplant', label: '缺少绿植', desc: '室内无绿植，生气不足' },
      { id: 'st_broken', label: '破损物品未清', desc: '破碗/破镜/坏电器未清理，破财之象' },
    ],
  },
]

// 装修风格风水建议映射
const STYLE_SUGGESTIONS = {
  st_darkcolor: { suggestion: '增加暖色调照明，搭配米色/浅木色软装平衡阴阳', element: '火' },
  st_redover: { suggestion: '减少红色面积，用木色/绿色系替代，泄火气生木气', element: '木' },
  st_sharp: { suggestion: '用圆弧形家具替代尖角，或用绿植/布艺遮挡尖角', element: '木' },
  st_mirror: { suggestion: '减少大镜面数量，或用纱帘遮挡，卧室镜子勿对床', element: '水' },
  st_clutter: { suggestion: '定期清理杂物，保持气流通道畅通，尤其门口和走廊', element: '土' },
  st_noplant: { suggestion: '在东南方（财位）和客厅添置阔叶绿植，如发财树、龟背竹', element: '木' },
  st_broken: { suggestion: '及时清理破损物品，象征除旧布新、避免破财之象', element: '金' },
}

function getStyleSuggestion(itemId) {
  return STYLE_SUGGESTIONS[itemId]?.suggestion || '建议调整装修风格以改善风水气场'
}

// AI分析prompt
const AI_ANALYSIS_PROMPT = `你是一位专业的风水堪舆师和室内装修质量评估专家。请分析用户上传的家居照片，从以下两个维度进行评估：

1. **装修质量问题**：检查地面、墙面、天花板、门窗、水电、厨卫等部位的损坏、瑕疵或老化情况

2. **风水问题**：检查以下常见风水禁忌：
   - 横梁压顶（床上/沙发上/书桌上方有横梁）
   - 门冲（门对门、门对厕所、门对镜子）
   - 穿堂煞（开门直通窗户或后门）
   - 镜子对床/对门
   - 床头靠窗或无靠
   - 神位/财位布置不当
   - 采光通风问题
   - 色彩五行相克

请以JSON格式返回分析结果，格式如下：
{
  "renovation_issues": [
    {"location": "具体位置", "problem": "问题描述", "severity": "严重程度(严重/中等/轻微)", "suggestion": "处理建议"}
  ],
  "fengshui_issues": [
    {"type": "问题类型", "location": "具体位置", "description": "问题描述", "impact": "影响说明", "suggestion": "化解建议"}
  ],
  "suggestions": ["总体改善建议1", "总体改善建议2"]
}

注意：
- 如果某张照片没有问题，相关数组可以为空
- 请用中文回答
- severity字段只用于装修问题
- 严格返回纯JSON，不要有其他文字`

export default function RenovationAssessment({ onDone, onSkip, onBack }) {
  const [activeTab, setActiveTab] = useState('checklist')
  
  // 检查表勾选状态
  const [checkedItems, setCheckedItems] = useState({})
  
  // AI照片分析状态
  const [photos, setPhotos] = useState([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [aiResult, setAiResult] = useState(null)
  const [analysisError, setAnalysisError] = useState(null)

  // 切换检查项
  const toggleCheckItem = useCallback((itemId) => {
    setCheckedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId],
    }))
  }, [])

  // 处理照片选择
  const handlePhotoSelect = useCallback((e) => {
    const files = Array.from(e.target.files)
    if (files.length > 4) {
      alert('最多只能选择4张照片')
      return
    }
    
    const newPhotos = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      id: Date.now() + Math.random(),
    }))
    
    setPhotos(prev => [...prev, ...newPhotos].slice(0, 4))
    e.target.value = ''
  }, [])

  // 删除照片
  const removePhoto = useCallback((photoId) => {
    setPhotos(prev => {
      const removed = prev.find(p => p.id === photoId)
      if (removed) URL.revokeObjectURL(removed.preview)
      return prev.filter(p => p.id !== photoId)
    })
  }, [])

  // 将图片转为base64
  const getBase64Image = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  // AI分析照片
  const handleAnalyze = useCallback(async () => {
    if (photos.length === 0) {
      alert('请先上传至少1张照片')
      return
    }

    setIsAnalyzing(true)
    setAnalysisError(null)

    try {
      const imageUrls = await Promise.all(photos.map(p => getBase64Image(p.file)))

      const messages = [
        {
          role: 'user',
          content: [
            { type: 'text', text: AI_ANALYSIS_PROMPT },
            ...imageUrls.map(url => ({ type: 'image_url', image_url: { url } })),
          ],
        },
      ]

      const response = await fetch(DASHSCOPE_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${DASHSCOPE_API_KEY}`,
        },
        body: JSON.stringify({
          model: MODEL_NAME,
          messages,
          max_tokens: 2000,
        }),
      })

      if (!response.ok) {
        throw new Error(`API调用失败: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.choices && data.choices[0] && data.choices[0].message) {
        let content = data.choices[0].message.content
        
        let jsonMatch = content.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          try {
            const result = JSON.parse(jsonMatch[0])
            setAiResult(result)
          } catch {
            setAiResult({
              renovation_issues: [],
              fengshui_issues: [],
              suggestions: [content.substring(0, 500)],
              raw_content: content,
            })
          }
        } else {
          setAiResult({
            renovation_issues: [],
            fengshui_issues: [],
            suggestions: [content.substring(0, 500)],
            raw_content: content,
          })
        }
      } else {
        throw new Error('API返回格式异常')
      }
    } catch (error) {
      console.error('AI分析失败:', error)
      setAnalysisError('AI分析失败，请稍后重试。如果持续失败，可能是API调用受限。')
    }

    setIsAnalyzing(false)
  }, [photos])

  // 计算扣分并提交
  const handleSubmit = useCallback(() => {
    // 从检查表提取的问题
    const checklistIssues = []
    const styleIssues = []
    CHECKLIST_CATEGORIES.forEach(cat => {
      cat.items.forEach(item => {
        if (checkedItems[item.id]) {
          if (cat.id === 'style') {
            styleIssues.push({
              location: cat.name,
              problem: item.label,
              desc: item.desc,
              suggestion: getStyleSuggestion(item.id),
              source: 'style',
            })
          } else {
            checklistIssues.push({
              location: cat.name,
              problem: item.label,
              severity: '待确认',
              suggestion: `建议检查${item.label}情况，必要时请专业人员维修`,
              source: 'checklist',
            })
          }
        }
      })
    })

    // AI发现的问题
    const aiRenovationIssues = (aiResult?.renovation_issues || []).map(issue => ({
      ...issue,
      source: 'ai',
    }))
    const aiFengshuiIssues = (aiResult?.fengshui_issues || []).map(issue => ({
      ...issue,
      source: 'ai',
    }))

    // 合并装修问题
    const allRenovationIssues = [...checklistIssues]
    aiRenovationIssues.forEach(aiIssue => {
      const isDuplicate = allRenovationIssues.some(
        ci => ci.location === aiIssue.location && ci.problem === aiIssue.problem
      )
      if (!isDuplicate) allRenovationIssues.push(aiIssue)
    })

    // 计算扣分
    let penalty = 0
    penalty -= Math.min(checklistIssues.length * 1.5, 8)
    aiRenovationIssues.forEach(issue => {
      if (issue.severity === '严重') penalty -= 2
      else if (issue.severity === '中等') penalty -= 1
      else penalty -= 0.5
    })
    aiFengshuiIssues.forEach(() => penalty -= 2)
    styleIssues.forEach(() => penalty -= 1.5)  // 装修风格风水问题各扣1.5分
    penalty = Math.max(Math.round(penalty), -15)

    const result = {
      renovationIssues: allRenovationIssues,
      fengshuiIssues: aiFengshuiIssues,
      styleIssues,  // 新增：装修风格风水问题
      suggestions: aiResult?.suggestions || [],
      penalty,
    }

    if (onDone) onDone(result)
  }, [checkedItems, aiResult, onDone])

  // 统计勾选数量
  const checkedCount = Object.values(checkedItems).filter(Boolean).length
  const hasAnyInput = checkedCount > 0 || aiResult

  return (
    <div className="renovation-assessment-step">
      {/* Tab切换 */}
      <div className="assessment-tabs">
        <button
          className={`tab-btn ${activeTab === 'checklist' ? 'active' : ''}`}
          onClick={() => setActiveTab('checklist')}
        >
          🏠 装修检查表
        </button>
        <button
          className={`tab-btn ${activeTab === 'ai' ? 'active' : ''}`}
          onClick={() => setActiveTab('ai')}
        >
          🔮 AI照片分析
        </button>
      </div>

      {/* 装修检查表 */}
      {activeTab === 'checklist' && (
        <div className="checklist-tab">
          <p className="tab-hint">
            勾选您发现的装修问题，评估对风水评分的影响
          </p>
          
          {CHECKLIST_CATEGORIES.map(category => (
            <div key={category.id} className="check-category">
              <div className="category-header">
                <span className="category-icon">{category.icon}</span>
                <span className="category-name">{category.name}</span>
              </div>
              <div className="check-items">
                {category.items.map(item => (
                  <label key={item.id} className="check-item">
                    <input
                      type="checkbox"
                      checked={!!checkedItems[item.id]}
                      onChange={() => toggleCheckItem(item.id)}
                    />
                    <span className="check-box">
                      {checkedItems[item.id] && '✓'}
                    </span>
                    <div className="check-content">
                      <span className="check-label">{item.label}</span>
                      <span className="check-desc">{item.desc}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          ))}

          {checkedCount > 0 && (
            <div className="check-summary">
              已勾选 {checkedCount} 项问题
            </div>
          )}
        </div>
      )}

      {/* AI照片分析 */}
      {activeTab === 'ai' && (
        <div className="ai-tab">
          <p className="tab-hint">
            上传1-4张家装实景照片，AI将从风水和装修质量两个维度分析
          </p>

          <div className="photo-upload-area">
            <div className="photo-grid">
              {photos.map(photo => (
                <div key={photo.id} className="photo-item">
                  <img src={photo.preview} alt="待分析" />
                  <button className="photo-remove" onClick={() => removePhoto(photo.id)}>
                    ×
                  </button>
                </div>
              ))}
              
              {photos.length < 4 && (
                <label className="photo-add">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoSelect}
                  />
                  <span className="photo-add-icon">+</span>
                  <span className="photo-add-text">
                    {photos.length === 0 ? '上传照片' : '添加更多'}
                  </span>
                </label>
              )}
            </div>
            <p className="photo-hint">支持拍照或相册选择，最多4张</p>
          </div>

          <button
            className={`btn-analyze ${isAnalyzing ? 'loading' : ''}`}
            onClick={handleAnalyze}
            disabled={photos.length === 0 || isAnalyzing}
          >
            {isAnalyzing ? (
              <><span className="loading-spinner" /> AI分析中...</>
            ) : (
              <>🔮 AI分析</>
            )}
          </button>

          {analysisError && (
            <div className="analysis-error">{analysisError}</div>
          )}

          {aiResult && (
            <div className="ai-result">
              <h4 className="ai-result-title">AI分析结果</h4>
              
              {aiResult.renovation_issues?.length > 0 && (
                <div className="result-section">
                  <div className="result-section-title">
                    🔧 装修问题 ({aiResult.renovation_issues.length})
                  </div>
                  {aiResult.renovation_issues.map((issue, idx) => (
                    <div key={idx} className="result-item">
                      <div className="result-item-header">
                        <span className="result-location">{issue.location}</span>
                        <span className={`severity-tag ${issue.severity}`}>{issue.severity}</span>
                      </div>
                      <div className="result-problem">{issue.problem}</div>
                      <div className="result-suggestion">💡 {issue.suggestion}</div>
                    </div>
                  ))}
                </div>
              )}

              {aiResult.fengshui_issues?.length > 0 && (
                <div className="result-section">
                  <div className="result-section-title">
                    ☯️ 风水问题 ({aiResult.fengshui_issues.length})
                  </div>
                  {aiResult.fengshui_issues.map((issue, idx) => (
                    <div key={idx} className="result-item fengshui">
                      <div className="result-item-header">
                        <span className="result-type">{issue.type}</span>
                        <span className="result-location">{issue.location}</span>
                      </div>
                      <div className="result-problem">{issue.description}</div>
                      <div className="result-impact">⚠️ {issue.impact}</div>
                      <div className="result-suggestion">🛡️ {issue.suggestion}</div>
                    </div>
                  ))}
                </div>
              )}

              {aiResult.suggestions?.length > 0 && (
                <div className="result-section">
                  <div className="result-section-title">💡 改善建议</div>
                  {aiResult.suggestions.map((sug, idx) => (
                    <div key={idx} className="suggestion-item">{sug}</div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 操作按钮 */}
      <div className="step-actions">
        <button className="btn-primary" onClick={handleSubmit} disabled={!hasAnyInput}>
          确认并继续
        </button>
        <button className="btn-secondary" onClick={onSkip}>
          跳过，暂不评估
        </button>
      </div>
    </div>
  )
}
