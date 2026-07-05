/**
 * 好宅助手 - 户型图上传组件
 * 支持3层校验（前端规则→AI视觉校验→启发式降级）
 * V2.5: 新增上传预览确认步骤，防止误选文件
 */
import React, { useState, useRef, useCallback } from 'react'
import { validateFile, validateAndExtract, forceAccept, reanalyzeWithGrid } from '../utils/floorPlanAI.js'
import FloorPlanAdjuster from './FloorPlanAdjuster.jsx'

// 角度转方位名
const getDirectionName = (angle) => {
  if (angle === null || angle === undefined) return ''
  const a = ((angle % 360) + 360) % 360
  if (a >= 337.5 || a < 22.5) return '正北'
  if (a >= 22.5 && a < 67.5) return '东北'
  if (a >= 67.5 && a < 112.5) return '正东'
  if (a >= 112.5 && a < 157.5) return '东南'
  if (a >= 157.5 && a < 202.5) return '正南'
  if (a >= 202.5 && a < 247.5) return '西南'
  if (a >= 247.5 && a < 292.5) return '正西'
  return '西北'
}

export default function FloorPlanUpload({ onUploadComplete, onBack, magneticHeading }) {
  const [uploadState, setUploadState] = useState('idle') // idle | confirming | uploading | validating | adjusting | done | error
  const [preview, setPreview] = useState(null)
  const [validationResult, setValidationResult] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [dragOver, setDragOver] = useState(false)
  // 调整后的数据
  const [adjustedData, setAdjustedData] = useState(null)
  const [reanalyzing, setReanalyzing] = useState(false)
  const [reanalyzeError, setReanalyzeError] = useState('')
  const fileInputRef = useRef(null)
  const imgRef = useRef(null)

  // V2.5 新增：第1步 - 选择文件后仅显示预览，不立即开始AI识别
  const handleFile = useCallback((file) => {
    setErrorMsg('')

    // 第1层：前端规则校验（文件格式、大小等基础检查）
    const fileCheck = validateFile(file)
    if (!fileCheck.valid) {
      setErrorMsg(fileCheck.errors.join('；'))
      setUploadState('error')
      return
    }

    // 读取并预览，等待用户确认
    setUploadState('confirming')
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target.result)
    }
    reader.onerror = () => {
      setUploadState('error')
      setErrorMsg('文件读取失败')
    }
    reader.readAsDataURL(file)
  }, [])

  // V2.5 新增：第2步 - 用户确认后才开始AI识别
  const handleConfirmUpload = useCallback(() => {
    if (!preview) return
    setUploadState('uploading')

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = async () => {
      imgRef.current = img
      setUploadState('validating')

      try {
        // 第2/3层：AI验证 + 降级启发式
        const result = await validateAndExtract(preview, undefined, img)
        setValidationResult(result)
        console.log('[V2.9.12] AI验证完成, isValid:', result.isValid, 'rooms:', result.rooms?.length)

        if (result.isValid) {
          console.log('[V2.9.12] >>> 进入九宫格调整页 adjusting')
          setAdjustedData(null) // 清除上一次的调整数据，确保重新进入调整页
          setUploadState('adjusting')
        } else {
          setUploadState('error')
          setErrorMsg(
            result.validationDetail?.reason || '图片不太像户型图，请确认是否为户型图/平面图'
          )
        }
      } catch (err) {
        console.error('验证失败:', err)
        setUploadState('error')
        setErrorMsg('验证过程出错，请重试')
      }
    }
    img.onerror = () => {
      setUploadState('error')
      setErrorMsg('图片加载失败')
    }
    img.src = preview
  }, [preview])

  // 点击上传
  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  // 拖拽上传
  const handleDragOver = (e) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = () => {
    setDragOver(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  // 强制上传
  const handleForceAccept = () => {
    const result = forceAccept()
    setValidationResult(result)
    setUploadState('done')
  }

  // 确认使用
  const handleConfirm = () => {
    if (validationResult && onUploadComplete) {
      onUploadComplete({
        preview,
        validation: validationResult,
        rooms: validationResult.rooms || [],
        floorPlanInfo: validationResult.floorPlanInfo,
        imgElement: imgRef.current,
        adjustedData: adjustedData,
      })
    }
  }

  // 处理九宫格调整完成 → V2.9.11: 升级模型+提高合成图分辨率
  const handleAdjustComplete = useCallback(async (adjustment) => {
    setAdjustedData(adjustment)
    
    const screenshot = adjustment.croppedScreenshot
    if (!screenshot) {
      console.warn('[V2.9.11] 无截图，无法AI识别宫位')
      setUploadState('done')
      return
    }
    
    setUploadState('analyzing')
    setReanalyzing(true)
    setReanalyzeError('')
    
    try {
      const originalRooms = validationResult?.rooms || []
      const updatedRooms = await reanalyzeWithGrid(null, { croppedScreenshot: screenshot, gridOrder: adjustment.gridOrder }, originalRooms)
      
      if (updatedRooms && updatedRooms.length > 0) {
        setValidationResult(prev => ({
          ...prev,
          rooms: updatedRooms,
        }))
        console.log('[V2.9.11] AI视觉识别完成:', updatedRooms.map(r => `${r.name}→${r.palace}`).join(', '))
      } else {
        setReanalyzeError('AI未能识别房间宫位，请重试')
      }
    } catch (err) {
      console.error('[V2.9.11] AI识别失败:', err)
      setReanalyzeError('AI识别失败: ' + (err.message || '请重试'))
    }
    
    setReanalyzing(false)
    setUploadState('done')
  }, [validationResult])

  // 跳过调整，直接使用AI数据
  const handleSkipAdjust = useCallback(() => {
    setAdjustedData(null)
    setUploadState('done')
  }, [])

  // 重新选择
  const handleReset = () => {
    setUploadState('idle')
    setPreview(null)
    setValidationResult(null)
    setErrorMsg('')
    setAdjustedData(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="floorplan-upload animate-in">
      {/* 上传区域 */}
      {!preview && (
        <div
          className={`upload-zone ${dragOver ? 'drag-over' : ''} ${uploadState === 'uploading' ? 'loading' : ''}`}
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          <div className="upload-icon">📐</div>
          <div className="upload-text">
            {uploadState === 'uploading' ? '正在读取...' : '点击或拖拽上传户型图'}
          </div>
          <div className="upload-hint">支持 JPG/PNG/WebP，10KB-10MB</div>
        </div>
      )}

      {/* V2.5 新增：预览确认 - 选择文件后先预览，用户确认后再开始AI识别 */}
      {uploadState === 'confirming' && preview && (
        <div className="upload-preview-section">
          <div className="preview-container">
            <img src={preview} alt="户型图预览" className="preview-image" />
          </div>
          <div className="confirm-upload-prompt">
            <p className="confirm-upload-text">请确认这是您要分析的户型图</p>
            <p className="confirm-upload-hint">确认后，AI将自动识别房间和朝向</p>
          </div>
          <div className="upload-actions">
            <button className="btn-secondary" onClick={handleReset}>
              重新选择
            </button>
            <button className="btn-primary btn-glow" onClick={handleConfirmUpload}>
              ✓ 确认，开始AI识别
            </button>
          </div>
          {onBack && (
            <button className="btn-back" onClick={onBack}>
              ← 重新测方位
            </button>
          )}
        </div>
      )}

      {/* 加载/验证状态 */}
      {(uploadState === 'uploading' || uploadState === 'validating') && preview && (
        <div className="upload-validating-overlay">
          <div className="validating-content">
            <div className="validating-spinner">
              <div className="spinner-ring"></div>
              <div className="spinner-icon">🏠</div>
            </div>
            <p className="validating-text">
              {uploadState === 'uploading' ? '正在读取户型图...' : '正在分析户型图...'}
            </p>
            <div className="validating-progress">
              <div className="progress-bar">
                <div className="progress-fill"></div>
              </div>
              <span className="progress-hint">
                {uploadState === 'validating' ? 'AI识别中，请稍候...' : '加载中...'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 九宫格调整界面 */}
      {uploadState === 'adjusting' && preview && validationResult && (
        <FloorPlanAdjuster
          floorPlanPreview={preview}
          magneticHeading={magneticHeading}
          validationResult={validationResult}
          onAdjustComplete={handleAdjustComplete}
          onReset={handleReset}
          onSkip={handleSkipAdjust}
        />
      )}

      {/* V2.8: AI视觉分析中状态 */}
      {uploadState === 'analyzing' && (
        <div className="upload-validating-overlay">
          <div className="validating-content">
            <div className="validating-spinner">
              <div className="spinner-ring"></div>
              <div className="spinner-icon">🔮</div>
            </div>
            <p className="validating-text">AI正在识别每个房间所在的宫位...</p>
            <div className="validating-progress">
              <div className="progress-bar">
                <div className="progress-fill"></div>
              </div>
              <span className="progress-hint">正在分析裁剪后的九宫格截图</span>
            </div>
          </div>
        </div>
      )}

      {/* 预览+验证状态（调整后显示） */}
      {uploadState === 'done' && preview && (
        <div className="upload-preview-section">
          <div className="preview-container">
            <img src={preview} alt="户型图预览" className="preview-image" />
          </div>

          {/* 重新分析中提示 */}
          {reanalyzing && (
            <div className="reanalyzing-overlay">
              <div className="reanalyzing-content">
                <div className="validating-spinner">
                  <div className="spinner-ring"></div>
                  <div className="spinner-icon">🔮</div>
                </div>
                <p className="validating-text">正在匹配房间与九宫格方位...</p>
                <p className="reanalyzing-hint">AI正在识别每个房间所在的宫位，请稍候</p>
              </div>
            </div>
          )}

          {/* 重新分析失败提示 */}
          {reanalyzeError && !reanalyzing && (
            <div className="reanalyze-error-banner">
              ⚠️ {reanalyzeError}
            </div>
          )}

          {/* 验证结果 */}
          {validationResult && !reanalyzing && (
            <div className={`validation-result ${validationResult.isValid ? 'valid' : 'invalid'}`}>
              {/* 调整后信息 */}
              {adjustedData && (
                <div className="adjusted-info">
                  <div className="adjusted-badge">
                    <span className="zuoxiang-tag">☯ {adjustedData.zuoXiang}</span>
                    <span className="adjusted-tag">已校准 {adjustedData.imageRotationOffset}°</span>
                  </div>
                </div>
              )}
              {validationResult.isValid ? (
                <>
                  <div className="validation-badge success">✅ 识别通过</div>
                  <div className="validation-detail">
                    {validationResult.validationMethod === 'ai' && (
                      <span>AI验证通过 · 置信度 {Math.round((validationResult.validationDetail?.confidence || 0) * 100)}%</span>
                    )}
                    {validationResult.validationMethod === 'heuristic' && (
                      <span>启发式验证通过（AI服务暂不可用）</span>
                    )}
                    {validationResult.validationMethod === 'forced' && (
                      <span className="forced-tag">⚠️ 未经AI验证</span>
                    )}
                    {validationResult.rooms.length > 0 && (
                      <span> · 识别到 {validationResult.rooms.length} 个房间</span>
                    )}
                    {validationResult.floorPlanInfo && (
                      <div className="floorplan-info">
                        {validationResult.floorPlanInfo.floorPlanType && (
                          <span>户型：{validationResult.floorPlanInfo.floorPlanType}</span>
                        )}
                        {validationResult.floorPlanInfo.totalArea && (
                          <span> · 面积：{validationResult.floorPlanInfo.totalArea}㎡</span>
                        )}
                      </div>
                    )}
                  </div>
                  {validationResult.rooms.length > 0 && (
                    <div className="room-list">
                      {validationResult.rooms.map((room, idx) => (
                        <span key={idx} className="room-tag">
                          {room.name}
                          {room.area && <span className="room-area">{room.area}㎡</span>}
                          {room.orientation && <span className="room-orient">{room.orientation}</span>}
                        </span>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="validation-badge fail">❌ 识别未通过</div>
                  <div className="validation-detail">{errorMsg}</div>
                  <div className="force-upload-section">
                    <p className="force-hint">
                      如果您确定这是户型图，可以强制上传
                    </p>
                    <button className="btn-force" onClick={handleForceAccept}>
                      强制上传
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* 错误状态 */}
          {uploadState === 'error' && !validationResult && (
            <div className="validation-result invalid">
              <div className="validation-badge fail">❌ 上传失败</div>
              <div className="validation-detail">{errorMsg}</div>
            </div>
          )}

          {/* 操作按钮 */}
          <div className="upload-actions">
            <button className="btn-secondary" onClick={handleReset}>
              重新选择
            </button>
            {validationResult?.isValid && (
              <button className="btn-primary btn-glow" onClick={handleConfirm}>
                确认，下一步
              </button>
            )}
          </div>
          {onBack && (
            <button className="btn-back" onClick={onBack}>
              ← 重新测方位
            </button>
          )}
        </div>
      )}

      {/* 错误状态（无预览时） */}
      {uploadState === 'error' && !preview && (
        <>
          <div className="validation-result invalid">
            <div className="validation-badge fail">❌ 上传失败</div>
            <div className="validation-detail">{errorMsg}</div>
          </div>
          <div className="upload-actions" style={{ marginTop: 16 }}>
            <button className="btn-secondary" onClick={handleReset}>
              重新选择
            </button>
          </div>
        </>
      )}

      {/* 返回按钮（初始上传状态） */}
      {onBack && uploadState === 'idle' && (
        <button className="btn-back" onClick={onBack}>
          ← 重新测方位
        </button>
      )}
    </div>
  )
}
