import React, { useState, useCallback, useMemo } from 'react'
import { fullAnalysis, calcCombinedScore } from './algorithms/index.js'
import { generateHuaJieReport } from './algorithms/huajie.js'
import { computeRoomPalaceMapping, TRIGRAM_TO_DIR } from './utils/gridMapping.js'
import { SHI_CHEN_NAMES } from './algorithms/bazi.js'
import { lunarToSolar, getLunarMonthList, getLunarMonthDayCount, formatLunarDate } from './algorithms/lunar.js'
import Compass from './components/Compass.jsx'
import ScoreRing from './components/ScoreRing.jsx'
import PalaceGrid from './components/PalaceGrid.jsx'
import HuajiePanel from './components/HuajiePanel.jsx'
import LocationInput from './components/LocationInput.jsx'
import BirthCityInput from './components/BirthCityInput.jsx'
import FlyingStarGrid from './components/FlyingStarGrid.jsx'
import FloorPlanUpload from './components/FloorPlanUpload.jsx'
import FloorPlanHeatmap from './components/FloorPlanHeatmap.jsx'
// V2 新增组件
import RenovationAssessment from './components/RenovationAssessment.jsx'
import EnvAnalysis from './components/EnvAnalysis.jsx'
import SharePoster from './components/SharePoster.jsx'
import './App.css'

// 高德API Key
const AMAP_KEY = '775f7d250896654177f15270367a1aa9'

// 步骤枚举
const STEPS = {
  WELCOME: 0,
  BIRTH: 1,
  COMPASS: 2,
  FLOORPLAN: 3,
  RENOVATION: 4,
  ENVIRONMENT: 5,
  RESULT: 6,
}

export default function App() {
  const [step, setStep] = useState(STEPS.WELCOME)
  
  // 出生信息（V1.5b扩展）
  const [birthName, setBirthName] = useState('') // 姓名（选填）
  const [birthYear, setBirthYear] = useState('')
  const [birthMonth, setBirthMonth] = useState('')
  const [birthDay, setBirthDay] = useState('')
  const [birthHour, setBirthHour] = useState(12) // 默认中午
  const [birthMinute, setBirthMinute] = useState(0) // 出生分钟
  const [gender, setGender] = useState('male')
  
  // 日历类型：solar=公历, lunar=农历（默认农历，八字排盘用农历）
  const [calendarType, setCalendarType] = useState('lunar')
  // 农历专用字段
  const [lunarMonth, setLunarMonth] = useState(1)
  const [lunarDay, setLunarDay] = useState(1)
  const [lunarIsLeap, setLunarIsLeap] = useState(false)
  
  // 农历月份列表（根据年份动态生成）
  const lunarMonthList = useMemo(() => {
    const y = parseInt(birthYear)
    if (!y || y < 1900 || y > 2050) {
      // 返回默认12个月
      return ['正月','二月','三月','四月','五月','六月','七月','八月','九月','十月','冬月','腊月'].map((n, i) => ({
        month: i + 1, name: n, days: 30, isLeap: false
      }))
    }
    return getLunarMonthList(y)
  }, [birthYear])
  
  // 农历当月天数（根据选中的月份和是否闰月动态计算）
  const lunarDayCount = useMemo(() => {
    const y = parseInt(birthYear)
    if (!y || y < 1900 || y > 2050) return 30
    return getLunarMonthDayCount(y, lunarMonth, lunarIsLeap)
  }, [birthYear, lunarMonth, lunarIsLeap])
  
  // 农历日期中文展示
  const lunarDateDisplay = useMemo(() => {
    const y = parseInt(birthYear)
    if (!y || y < 1900 || y > 2050) return ''
    return formatLunarDate(y, lunarMonth, lunarDay, lunarIsLeap)
  }, [birthYear, lunarMonth, lunarDay, lunarIsLeap])
  
  // 出生地（用于真太阳时修正）
  const [birthCity, setBirthCity] = useState(null) // { name, province, lon, lat }
  
  // 位置信息（用于罗盘磁偏角）
  const [address, setAddress] = useState('')
  const [lat, setLat] = useState(null)
  const [lon, setLon] = useState(null)

  // 房屋信息（V2.0新增）
  const [buildYear, setBuildYear] = useState('')  // 建造年份，用于玄空飞星元运判定
  
  // 罗盘
  const [magneticHeading, setMagneticHeading] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showHuajie, setShowHuajie] = useState(false)
  const [shared, setShared] = useState(false)

  // 户型图相关状态
  const [floorPlanData, setFloorPlanData] = useState(null) // { preview, validation, rooms, floorPlanInfo, imgElement }
  const [showHeatmap, setShowHeatmap] = useState(false) // 是否显示热力图

  // V2新增状态
  const [renovationPenalty, setRenovationPenalty] = useState(0) // 装修评估扣分
  const [xingshaPenalty, setXingshaPenalty] = useState(0) // 形煞评估扣分
  const [renovationData, setRenovationData] = useState(null) // 装修评估完整数据
  const [envData, setEnvData] = useState(null) // 形煞评估完整数据
  const [envAdvantageData, setEnvAdvantageData] = useState(null) // 环境优势加分数据
  const [showPoster, setShowPoster] = useState(false) // 是否显示海报
  const [activeResultTab, setActiveResultTab] = useState('overview') // 结果页Tab

  // 地址→经纬度（高德地理编码）
  const geocodeAddress = useCallback(async (addr) => {
    try {
      const res = await fetch(
        `https://restapi.amap.com/v3/geocode/geo?key=${AMAP_KEY}&address=${encodeURIComponent(addr)}`
      )
      const data = await res.json()
      if (data.geocodes && data.geocodes.length > 0) {
        const [lo, la] = data.geocodes[0].location.split(',').map(Number)
        setLat(la)
        setLon(lo)
        return { lat: la, lon: lo }
      }
      return null
    } catch (e) {
      console.error('地理编码失败:', e)
      return null
    }
  }, [])

  // 位置选择回调
  const handleLocationSelect = useCallback((locationData) => {
    if (locationData.source === 'gps') {
      setLat(locationData.lat)
      setLon(locationData.lon)
      // GPS定位后也更新地址（逆地理编码结果）
      if (locationData.address) {
        setAddress(locationData.address)
      }
    } else {
      setAddress(locationData.address)
    }
  }, [])

  // 开始看盘
  const handleStart = () => {
    setStep(STEPS.BIRTH)
  }

  // 提交出生信息
  const handleSubmitBirth = async () => {
    // 验证年份
    const year = parseInt(birthYear)
    if (!year || year < 1920 || year > 2025) {
      alert('请输入有效的出生年份（1920-2025）')
      return
    }

    // 验证出生地
    if (!birthCity) {
      alert('请选择出生城市，用于真太阳时修正确保排盘准确')
      return
    }

    // 验证出生时间
    const hour = parseInt(birthHour)
    const minute = parseInt(birthMinute)
    if (isNaN(hour) || hour < 0 || hour > 23) {
      alert('请输入有效的出生小时（0-23）')
      return
    }
    if (isNaN(minute) || minute < 0 || minute > 59) {
      alert('请输入有效的出生分钟（0-59）')
      return
    }

    let solarYear, solarMonth, solarDay

    if (calendarType === 'lunar') {
      // 农历转公历
      const solar = lunarToSolar(year, lunarMonth, lunarDay, lunarIsLeap)
      if (!solar) {
        alert('农历日期转换失败，请检查日期是否有效（如闰月是否正确）')
        return
      }
      solarYear = solar.solarYear
      solarMonth = solar.solarMonth
      solarDay = solar.solarDay
      // 更新公历字段（用于后续计算，腊月等可能跨年到次年1月）
      setBirthYear(solarYear)
      setBirthMonth(solarMonth)
      setBirthDay(solarDay)
    } else {
      solarMonth = parseInt(birthMonth)
      solarDay = parseInt(birthDay)
      if (!solarMonth || solarMonth < 1 || solarMonth > 12) {
        alert('请输入有效的出生月份（1-12）')
        return
      }
      if (!solarDay || solarDay < 1 || solarDay > 31) {
        alert('请输入有效的出生日期（1-31）')
        return
      }
    }
    
    // 如果有地址，进行地理编码
    if (address && !lat && !lon) {
      const geo = await geocodeAddress(address)
      if (!geo) {
        alert('地址解析失败，请尝试更具体的地址（如"郑州市金水区"）')
        return
      }
    }
    
    setStep(STEPS.COMPASS)
  }

  // 罗盘完成 → 进入户型图上传步骤
  const handleCompassDone = useCallback((heading) => {
    setMagneticHeading(heading)
    setStep(STEPS.FLOORPLAN)
  }, [])

  // 重新看盘
  const handleReset = () => {
    setStep(STEPS.WELCOME)
    setResult(null)
    setMagneticHeading(null)
    setShowHuajie(false)
    setShared(false)
    setFloorPlanData(null)
    setShowHeatmap(false)
    setRenovationData(null)
    setRenovationPenalty(0)
    setEnvData(null)
    setEnvAdvantageData(null)
    setXingshaPenalty(0)
    setShowPoster(false)
  }

  // 计算风水分析结果
  const computeAndShowResult = useCallback((hasFloorPlan) => {
    setLoading(true)
    const useLat = lat || birthCity?.lat || 34.7
    const birthLon = birthCity?.lon || 120

    try {
      const analysisResult = fullAnalysis({
        birthYear: parseInt(birthYear),
        birthMonth: parseInt(birthMonth),
        birthDay: parseInt(birthDay),
        birthHour: parseInt(birthHour),
        birthMinute: parseInt(birthMinute),
        gender,
        magneticHeading,
        lat: useLat,
        lon: birthLon,
        buildYear: buildYear ? parseInt(buildYear) : undefined,
      })

      // 融合形煞+装修+环境优势+户型图，重新计算综合评分
      if (envData || renovationData || envAdvantageData || floorPlanData) {
        // V2.8: 优先使用AI视觉识别的palace字段，完全不用数学映射
        const adjustedData = floorPlanData?.adjustedData
        const rooms = floorPlanData?.validation?.rooms || floorPlanData?.rooms || []
        const roomLayout = {}
        
        // 检查是否有直接palace字段（V2.8: AI视觉识别生成的）
        const hasDirectPalace = rooms.some(r => r.palace && r.palace !== '中')
        
        if (hasDirectPalace) {
          // 使用AI视觉识别的直接宫位映射
          rooms.forEach(room => {
            if (room.palace && room.palace !== '中' && room.name) {
              const direction = TRIGRAM_TO_DIR[room.palace] || ''
              if (direction) {
                // V2.8: 支持合并名称拆分（如"客厅/厨房"→分别在对应方向显示）
                const names = room.name.includes('/') 
                  ? room.name.split('/').map(n => n.trim()) 
                  : [room.name]
                names.forEach(n => {
                  if (!roomLayout[direction]) {
                    roomLayout[direction] = n
                  } else if (!roomLayout[direction].includes(n)) {
                    roomLayout[direction] = roomLayout[direction] + '、' + n
                  }
                })
              }
            }
          })
          console.log('[V2.8] AI视觉宫位映射:', Object.entries(roomLayout).map(([d,n]) => `${d}:${n}`).join(', '))
        } else if (rooms.length > 0 && adjustedData?.gridTopDirection) {
          // 【后备】使用数学映射
          const palaceMapping = computeRoomPalaceMapping(rooms, adjustedData)
          Object.entries(palaceMapping).forEach(([roomName, { palace, direction }]) => {
            if (palace !== '中') {
              if (!roomLayout[direction]) {
                roomLayout[direction] = roomName
              } else {
                roomLayout[direction] = roomLayout[direction] + '、' + roomName
              }
            }
          })
        } else if (rooms.length > 0) {
          // 【回退】使用AI识别的方位
          for (const room of rooms) {
            if (room.orientation && room.name) {
              const normalizedOri = room.orientation.replace(/^正/, '')
              roomLayout[normalizedOri] = room.name
            }
          }
        }

        const fusedHuajie = generateHuaJieReport(
          analysisResult.palaces,
          analysisResult.feiXing,
          analysisResult.conflicts,
          envData,
          renovationData,
          envAdvantageData,
          roomLayout,
        )
        analysisResult.huajie = fusedHuajie

        // 重新计算综合评分（纳入所有维度）
        const recalculated = calcCombinedScore(
          analysisResult.palaces ? { score: analysisResult.overall.baZhaiScore, jiCount: analysisResult.overall.jiCount, xiongCount: analysisResult.overall.xiongCount, match: analysisResult.overall.match, matchLabel: analysisResult.overall.matchLabel, wuxingRelation: analysisResult.overall.wuxingRelation } : analysisResult.overall,
          analysisResult.feiXing,
          analysisResult.conflicts,
          envData,
          renovationData,
          envAdvantageData,
          floorPlanData,
        )
        analysisResult.overall = recalculated
      }

      setResult(analysisResult)
      setStep(STEPS.RESULT)
    } catch (e) {
      console.error('分析失败:', e)
      alert('分析失败，请重试')
    }
    setLoading(false)
  }, [birthYear, birthMonth, birthDay, birthHour, birthMinute, gender, magneticHeading, lat, lon, birthCity, envData, renovationData, envAdvantageData])

  // 户型图上传完成 → 进入装修评估步骤
  const handleFloorPlanComplete = useCallback((data) => {
    // 将 adjustedData 也存入 floorPlanData
    setFloorPlanData(data)
    setStep(STEPS.RENOVATION)
  }, [])

  // 跳过户型图 → 进入装修评估步骤
  const handleSkipFloorPlan = useCallback(() => {
    setFloorPlanData(null)
    setStep(STEPS.RENOVATION)
  }, [])

  // 装修评估完成 → 进入环境分析步骤
  const handleRenovationDone = useCallback((data) => {
    setRenovationData(data)
    setStep(STEPS.ENVIRONMENT)
  }, [])

  // 跳过装修评估 → 进入环境分析步骤
  const handleSkipRenovation = useCallback(() => {
    setRenovationData(null)
    setRenovationPenalty(0)
    setStep(STEPS.ENVIRONMENT)
  }, [])

  // 环境分析完成 → 计算结果
  const handleEnvDone = useCallback((data, advData) => {
    setEnvData(data)
    setEnvAdvantageData(advData || null)
    computeAndShowResult(!!floorPlanData)
  }, [computeAndShowResult, floorPlanData])

  // 跳过环境分析 → 计算结果
  const handleSkipEnv = useCallback(() => {
    setEnvData(null)
    setEnvAdvantageData(null)
    setXingshaPenalty(0)
    computeAndShowResult(!!floorPlanData)
  }, [computeAndShowResult, floorPlanData])

  // 分享解锁 - 先尝试系统分享，失败则直接解锁（不强制用户必须分享）
  const handleShare = () => {
    const shareText = `我刚用好宅助手分析家宅，评分${result?.overall?.score}分！八字：${result?.baZi?.yearPillar}年${result?.baZi?.monthPillar}月${result?.baZi?.dayPillar}日${result?.baZi?.hourPillar}时`
    const shareUrl = window.location.href

    if (navigator.share) {
      navigator.share({
        title: '好宅助手 - 八字风水分析',
        text: shareText,
        url: shareUrl,
      }).then(() => setShared(true)).catch(() => {
        // 用户取消分享也直接解锁，不卡住用户
        setShared(true)
      })
    } else {
      // 无系统分享能力时，尝试复制到剪贴板后直接解锁
      const fullText = shareText + ' ' + shareUrl
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(fullText).catch(() => {})
      }
      setShared(true)
    }
  }

  return (
    <div className="app">
      {/* 背景粒子层 */}
      <div className="bg-particles" />

      {/* 顶部栏 */}
      <header className="header">
        <div className="logo">
          <span className="logo-icon">☯</span>
          <span className="logo-text">好宅助手</span>
          <span className="version-badge">V2.0</span>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="main">
        {/* 欢迎页 */}
        {step === STEPS.WELCOME && (
          <div className="welcome animate-in">
            <div className="welcome-badge">赛博国风 · 八字风水</div>
            <h1 className="welcome-title">
              3秒看家宅
              <br />
              <span className="gradient-text">八字·五行·命卦·化解</span>
            </h1>
            <p className="welcome-desc">
              基于八宅明镜+玄空飞星+八字命理+真北校准<br />
              精准定位吉凶方位，给出化解建议
            </p>
            <button className="btn-primary btn-glow" onClick={handleStart}>
              开始看盘
            </button>
            <div className="welcome-features">
              <div className="feature-item">
                <span className="feature-icon">📖</span>
                <span>八字四柱推算</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">⭐</span>
                <span>玄空飞星排盘</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">⚖️</span>
                <span>五行分析·喜用神</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🧭</span>
                <span>手机罗盘·GPS定位</span>
              </div>
            </div>
          </div>
        )}

        {/* 出生信息输入 V1.5 */}
        {step === STEPS.BIRTH && (
          <div className="birth-form animate-in">
            <h2 className="step-title">
              <span className="step-num">01</span>
              出生信息录入
            </h2>
            <p className="step-desc">用于计算八字和命卦，确定您与住宅的匹配度</p>

            {/* 出生日期 */}
            <div className="form-section">
              <label className="form-section-title">出生日期</label>
              {/* 公历/农历切换 */}
              <div className="calendar-type-toggle">
                <button
                  className={`toggle-btn ${calendarType === 'solar' ? 'active' : ''}`}
                  onClick={() => setCalendarType('solar')}
                >
                  公历
                </button>
                <button
                  className={`toggle-btn ${calendarType === 'lunar' ? 'active' : ''}`}
                  onClick={() => setCalendarType('lunar')}
                >
                  农历
                </button>
              </div>

              {calendarType === 'solar' ? (
                /* 公历输入 */
                <div className="birth-date-row">
                  <input
                    type="number"
                    className="input-field birth-input-year"
                    placeholder="年"
                    min="1920"
                    max="2025"
                    value={birthYear}
                    onChange={(e) => setBirthYear(e.target.value)}
                  />
                  <input
                    type="number"
                    className="input-field birth-input-month"
                    placeholder="月"
                    min="1"
                    max="12"
                    value={birthMonth}
                    onChange={(e) => setBirthMonth(e.target.value)}
                  />
                  <input
                    type="number"
                    className="input-field birth-input-day"
                    placeholder="日"
                    min="1"
                    max="31"
                    value={birthDay}
                    onChange={(e) => setBirthDay(e.target.value)}
                  />
                </div>
              ) : (
                /* 农历输入 */
                <div className="lunar-date-section">
                  <div className="birth-date-row">
                    <input
                      type="number"
                      className="input-field birth-input-year"
                      placeholder="年"
                      min="1920"
                      max="2025"
                      value={birthYear}
                      onChange={(e) => {
                        setBirthYear(e.target.value)
                        setLunarIsLeap(false) // 年份变化时重置闰月
                      }}
                    />
                    <select
                      className="input-field birth-select-month"
                      value={`${lunarMonth}-${lunarIsLeap ? '1' : '0'}`}
                      onChange={(e) => {
                        const [m, leap] = e.target.value.split('-')
                        setLunarMonth(parseInt(m))
                        setLunarIsLeap(leap === '1')
                        // 日期超出新月天数时修正
                        const newIsLeap = leap === '1'
                        const maxDay = getLunarMonthDayCount(parseInt(birthYear) || 2000, parseInt(m), newIsLeap)
                        if (lunarDay > maxDay) setLunarDay(maxDay)
                      }}
                    >
                      {lunarMonthList.map((m) => (
                        <option key={`${m.month}-${m.isLeap}`} value={`${m.month}-${m.isLeap ? '1' : '0'}`}>
                          {m.name}（{m.days}天）
                        </option>
                      ))}
                    </select>
                    <select
                      className="input-field birth-select-day"
                      value={lunarDay}
                      onChange={(e) => setLunarDay(parseInt(e.target.value))}
                    >
                      {Array.from({ length: lunarDayCount }, (_, i) => i + 1).map((d) => (
                        <option key={d} value={d}>
                          {['初一','初二','初三','初四','初五','初六','初七','初八','初九','初十',
                            '十一','十二','十三','十四','十五','十六','十七','十八','十九','二十',
                            '廿一','廿二','廿三','廿四','廿五','廿六','廿七','廿八','廿九','三十'][d - 1]}
                        </option>
                      ))}
                    </select>
                  </div>
                  {lunarDateDisplay && (
                    <div className="lunar-date-preview">
                      📅 {lunarDateDisplay}
                    </div>
                  )}
                  <p className="lunar-hint">
                    农历日期将自动转换为公历后进行排盘计算
                  </p>
                </div>
              )}
            </div>

            {/* 姓名（选填） */}
            <div className="form-section">
              <label className="form-section-title">姓名<span className="optional">（选填，用于保存记录）</span></label>
              <input
                type="text"
                className="input-field input-name"
                placeholder="请输入姓名"
                value={birthName}
                onChange={(e) => setBirthName(e.target.value)}
              />
            </div>

            {/* 出生时间 */}
            <div className="form-section">
              <label className="form-section-title">出生时间<span className="required-mark"> *</span><span className="optional">（北京时间，将根据出生地换算真太阳时排盘）</span></label>
              <div className="birth-time-row">
                <select
                  className="input-field birth-select-time"
                  value={birthHour}
                  onChange={(e) => setBirthHour(parseInt(e.target.value))}
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>{String(i).padStart(2, '0')}时</option>
                  ))}
                </select>
                <span className="time-separator">:</span>
                <select
                  className="input-field birth-select-time"
                  value={birthMinute}
                  onChange={(e) => setBirthMinute(parseInt(e.target.value))}
                >
                  {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => (
                    <option key={m} value={m}>{String(m).padStart(2, '0')}分</option>
                  ))}
                </select>
              </div>
              <p className="time-hint">
                💡 输入精确出生时间后，系统将根据出生地经度自动换算真太阳时，精准确定时辰
              </p>
            </div>

            {/* 性别 */}
            <div className="form-section">
              <label className="form-section-title">性别</label>
              <div className="gender-toggle">
                <button
                  className={`toggle-btn ${gender === 'male' ? 'active' : ''}`}
                  onClick={() => setGender('male')}
                >
                  男
                </button>
                <button
                  className={`toggle-btn ${gender === 'female' ? 'active' : ''}`}
                  onClick={() => setGender('female')}
                >
                  女
                </button>
              </div>
            </div>

            {/* 出生地（真太阳时修正） */}
            <div className="form-section">
              <label className="form-section-title">出生地<span className="required-mark"> *</span><span className="optional">（精确到市，用于真太阳时修正）</span></label>
              <BirthCityInput
                onChange={(city) => setBirthCity(city)}
              />
            </div>

            {/* 位置信息（用于罗盘磁偏角） */}
            <div className="form-section">
              <label className="form-section-title">当前位置<span className="optional">（选填，提高罗盘磁偏角精度）</span></label>
              <LocationInput 
                onLocationSelect={handleLocationSelect}
                defaultAddress={address}
              />
            </div>

            {/* 房屋建造年份（V2.0新增，用于玄空飞星元运判定） */}
            <div className="form-section">
              <label className="form-section-title">房屋建造年份<span className="optional">（选填，用于玄空飞星元运排盘）</span></label>
              <input
                type="number"
                className="input-field"
                placeholder="如：2020（不确定可留空）"
                min="1920"
                max="2030"
                value={buildYear}
                onChange={(e) => setBuildYear(e.target.value)}
              />
              <p className="lunar-hint">
                💡 建造年份决定元运（八运/九运），直接影响飞星盘。老宅未翻新则填建成年份，近期翻新过可填翻新年份。
              </p>
            </div>

            <button className="btn-primary" onClick={handleSubmitBirth}>
              下一步：测量朝向
            </button>
            <button className="btn-back" onClick={() => setStep(STEPS.WELCOME)}>
              ← 返回首页
            </button>
          </div>
        )}

        {/* 罗盘测量 */}
        {step === STEPS.COMPASS && (
          <div className="compass-step animate-in">
            <h2 className="step-title">
              <span className="step-num">02</span>
              测量房屋朝向
            </h2>
            <p className="step-desc">
              站在阳台或主窗前，手机水平朝外
            </p>
            <Compass onDone={handleCompassDone} />
            <button className="btn-back" onClick={() => setStep(STEPS.BIRTH)}>
              ← 返回修改出生信息
            </button>
          </div>
        )}

        {/* 户型图上传（测完方位后） */}
        {step === STEPS.FLOORPLAN && (
          <div className="floorplan-step animate-in">
            <h2 className="step-title">
              <span className="step-num">03</span>
              上传户型图
            </h2>
            <p className="step-desc">
              上传户型图可获得更精准的风水评分和布局分析
            </p>
            <FloorPlanUpload
              onUploadComplete={handleFloorPlanComplete}
              onBack={() => setStep(STEPS.COMPASS)}
              magneticHeading={magneticHeading}
            />
            {!floorPlanData && (
              <button className="btn-secondary skip-floorplan-btn" onClick={handleSkipFloorPlan}>
                跳过，下一步
              </button>
            )}
          </div>
        )}

        {/* 装修现状评估（V2步骤） */}
        {step === STEPS.RENOVATION && (
          <div className="renovation-step animate-in">
            <h2 className="step-title">
              <span className="step-num">04</span>
              装修现状评估
            </h2>
            <p className="step-desc">
              评估装修质量和风水问题，影响综合评分
            </p>
            <RenovationAssessment
              onDone={handleRenovationDone}
              onSkip={handleSkipRenovation}
              onBack={() => setStep(STEPS.FLOORPLAN)}
            />
            <button className="btn-back" onClick={() => setStep(STEPS.FLOORPLAN)}>
              ← 返回上一步
            </button>
          </div>
        )}

        {/* 小区周边环境（V2步骤） */}
        {step === STEPS.ENVIRONMENT && (
          <div className="env-step animate-in">
            <h2 className="step-title">
              <span className="step-num">05</span>
              小区周边环境
            </h2>
            <p className="step-desc">
              评估周边形煞影响，让分析更全面
            </p>
            <EnvAnalysis
              lat={lat || birthCity?.lat}
              lon={lon || birthCity?.lon}
              onDone={handleEnvDone}
              onSkip={handleSkipEnv}
            />
            <button className="btn-back" onClick={() => setStep(STEPS.RENOVATION)}>
              ← 返回上一步
            </button>
          </div>
        )}

        {/* 加载中 */}
        {loading && (
          <div className="loading-screen">
            <div className="loading-spinner" />
            <p>正在排盘…</p>
          </div>
        )}

        {/* 结果页 V2.3 - Tab化重构 */}
        {step === STEPS.RESULT && result && (
          <div className="result animate-in">
            <h2 className="step-title">
              <span className="step-num">✦</span>
              看盘结果
            </h2>

            {/* Tab导航 */}
            <div className="result-tabs">
              <button 
                className={`result-tab ${activeResultTab === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveResultTab('overview')}
              >
                概览
              </button>
              <button 
                className={`result-tab ${activeResultTab === 'pro' ? 'active' : ''}`}
                onClick={() => shared ? setActiveResultTab('pro') : null}
              >
                {shared ? '专业' : '🔒 专业'}
              </button>
              <button 
                className={`result-tab ${activeResultTab === 'resolve' ? 'active' : ''}`}
                onClick={() => shared ? setActiveResultTab('resolve') : null}
              >
                {shared ? '化解' : '🔒 化解'}
              </button>
            </div>

            {/* ===== 概览Tab ===== */}
            {activeResultTab === 'overview' && (
              <div className="tab-content animate-in">
                {/* 核心结论 - 评分环+一句话解读 */}
                <div className="result-hero">
                  <div className="hero-score">
                    <ScoreRing score={result.overall.score} level={result.overall.level} />
                  </div>
                  <div className="hero-info">
                    <div className="hero-verdict">{result.overall.level}</div>
                    <div className="hero-meta">
                      <span className="hero-tag zhai">{result.zhaiGua.detail}</span>
                      <span className="hero-tag ming">{result.mingGua.name}{result.mingGua.groupLabel}</span>
                      <span className={`hero-tag match ${result.match.match ? 'good' : 'bad'}`}>{result.match.label}</span>
                    </div>
                    <div className="hero-detail-row">
                      <span className="hero-detail-label">朝向</span>
                      <span className="hero-detail-value">{result.compass.detail}</span>
                    </div>
                    <div className="hero-detail-row">
                      <span className="hero-detail-label">吉/凶位</span>
                      <span className="hero-detail-value">
                        <span className="good-count">{result.overall.jiCount}吉</span> / 
                        <span className="bad-count">{result.overall.xiongCount}凶</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* 白话解读 */}
                <div className="plain-speak-card">
                  <span className="plain-speak-icon">💬</span>
                  <p className="plain-speak-text">
                    你是{result.wuxing.dayMasterElement}命{result.wuxing.strength}，喜{result.wuxing.xiYongShen.join('、')}，忌{result.wuxing.jiShen.join('、')}
                    {result.match.match ? '，人宅相配为吉' : '，人宅不配需注意化解'}
                  </p>
                </div>

                {/* 八宫方位图 */}
                <PalaceGrid palaces={result.palaces} />

                {/* 关键发现 - 精简总结 */}
                <div className="summary-card">
                  <p className="summary-text">{result.summary}</p>
                </div>

                {/* 快速问题提示（如果有形煞或装修问题） */}
                {(envData?.details?.length > 0 || renovationData?.renovationIssues?.length > 0) && (
                  <div className="quick-alerts">
                    {envData?.details?.length > 0 && (
                      <div className="quick-alert xingsha">
                        <span className="quick-alert-dot" />
                        <span>检测到{envData.details.length}项形煞影响</span>
                      </div>
                    )}
                    {renovationData?.renovationIssues?.length > 0 && (
                      <div className="quick-alert renovation">
                        <span className="quick-alert-dot" />
                        <span>发现{renovationData.renovationIssues.length}个装修问题</span>
                      </div>
                    )}
                    {!shared && (
                      <p className="quick-alert-hint">分享解锁查看详细分析和化解方案</p>
                    )}
                  </div>
                )}

                {/* 分享解锁引导 */}
                {!shared && (
                  <div className="professional-lock-compact">
                    <div className="lock-preview-tags">
                      <span className="lock-preview-tag">五行详解</span>
                      <span className="lock-preview-tag">飞星排盘</span>
                      <span className="lock-preview-tag">化解方案</span>
                    </div>
                    <button className="btn-share-compact" onClick={handleShare}>
                      🔗 分享解锁完整报告
                    </button>
                  </div>
                )}

                {/* 已分享则显示切换提示 */}
                {shared && (
                  <div className="tab-switch-hint">
                    👆 点击「专业」查看八字五行·飞星排盘，点击「化解」查看化解方案
                  </div>
                )}
              </div>
            )}

            {/* ===== 专业Tab ===== */}
            {activeResultTab === 'pro' && (
              <div className="tab-content animate-in">
                {!shared ? (
                  <div className="professional-lock">
                    <div className="lock-icon">🔓</div>
                    <p className="lock-title">解锁专业深度分析</p>
                    <p className="lock-desc">五行详解 · 飞星排盘 · 评分明细 · 户型热力图</p>
                    <button className="btn-share" onClick={handleShare}>
                      🔗 分享解锁完整方案
                    </button>
                  </div>
                ) : (
                  <>
                    {/* 四柱八字 + 白话解读 */}
                    <div className="bazi-card">
                      <div className="bazi-title">四柱八字</div>
                      <div className="bazi-pillars">
                        <div className="bazi-pillar">
                          <span className="bazi-label">年柱</span>
                          <span className="bazi-value">{result.baZi.yearPillar}</span>
                        </div>
                        <div className="bazi-pillar">
                          <span className="bazi-label">月柱</span>
                          <span className="bazi-value">{result.baZi.monthPillar}</span>
                        </div>
                        <div className="bazi-pillar">
                          <span className="bazi-label">日柱</span>
                          <span className="bazi-value accent">{result.baZi.dayPillar}</span>
                        </div>
                        <div className="bazi-pillar">
                          <span className="bazi-label">时柱</span>
                          <span className="bazi-value">{result.baZi.hourPillar}</span>
                        </div>
                      </div>
                      <div className="bazi-plain-lang">
                        💬 {result.wuxing.dayMasterElement}命{result.wuxing.strength}，生于{result.baZi.monthPillar}月，喜用{result.wuxing.xiYongShen.join('、')}，忌{result.wuxing.jiShen.join('、')}
                      </div>
                      {result.baZi.solarTimeInfo && (
                        <div className="solar-time-info">
                          <div className="solar-time-badge">☀️ 真太阳时排盘</div>
                          <div className="solar-time-detail">
                            北京时间 {result.baZi.solarTimeInfo.originalTime.slice(11)} → 真太阳时 {result.baZi.solarTimeInfo.trueSolarTime.slice(11)}（{result.baZi.solarTimeInfo.shiChenName}）
                          </div>
                          <div className="solar-time-detail">
                            {result.baZi.solarTimeInfo.correctionNote}
                          </div>
                          {result.baZi.solarTimeInfo.dateChanged && (
                            <div className="solar-time-warning">
                              ⚠️ 修正后日期变化：{result.baZi.solarTimeInfo.trueSolarTime.slice(0, 10)}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* 五行分析 */}
                    <div className="wuxing-card">
                      <div className="wuxing-title">五行分析</div>
                      <div className="wuxing-info">
                        <div className="wuxing-row">
                          <span className="wuxing-label">日主</span>
                          <span className="wuxing-value">{result.wuxing.dayMaster}（{result.wuxing.dayMasterElement}）</span>
                        </div>
                        <div className="wuxing-row">
                          <span className="wuxing-label">强弱</span>
                          <span className={`wuxing-value ${result.wuxing.strength.includes('强') ? 'strong' : 'weak'}`}>
                            {result.wuxing.strength}
                          </span>
                        </div>
                      </div>
                      
                      <div className="wuxing-distribution">
                        {Object.entries(result.wuxing.wuxingCount).map(([wx, count]) => {
                          const colors = { '木': '#2ecc71', '火': '#e74c3c', '土': '#d4a574', '金': '#f0c866', '水': '#3498db' }
                          const isDayElement = wx === result.wuxing.dayMasterElement
                          return (
                            <div key={wx} className={`wuxing-bar-item ${isDayElement ? 'highlight' : ''}`}>
                              <span className="wuxing-bar-label">{wx}</span>
                              <div className="wuxing-bar">
                                <div className="wuxing-bar-fill" style={{ width: `${Math.min(count * 20, 100)}%`, backgroundColor: colors[wx] }} />
                              </div>
                              <span className="wuxing-bar-count">{count}</span>
                            </div>
                          )
                        })}
                      </div>

                      <div className="xi-yong-section">
                        <div className="xi-yong-row">
                          <span className="xi-yong-label">喜用神</span>
                          <span className="xi-yong-value good">{result.wuxing.xiYongShen.join('、')}</span>
                        </div>
                        {result.wuxing.yongShen.length > 0 && (
                          <div className="xi-yong-row">
                            <span className="xi-yong-label">用神</span>
                            <span className="xi-yong-value">{result.wuxing.yongShen.join('、')}</span>
                          </div>
                        )}
                        <div className="xi-yong-row">
                          <span className="xi-yong-label">忌神</span>
                          <span className="xi-yong-value bad">{result.wuxing.jiShen.join('、')}</span>
                        </div>
                      </div>
                    </div>

                    {/* 玄空飞星盘 */}
                    {result.feiXing && <FlyingStarGrid feiXingResult={result.feiXing} />}

                    {/* 朝向与形煞综合分析 */}
                    <div className="orientation-xingsha-section">
                      <h3 className="section-title">🧭 朝向与形煞分析</h3>
                      <div className="orientation-info">
                        <span className="orientation-detail">{result.compass.detail}</span>
                        <span className="orientation-zhai"> · {result.zhaiGua.detail}</span>
                      </div>
                      {envData && envData.details && envData.details.length > 0 ? (
                        <div className="xingsha-summary">
                          <div className="xingsha-overview">
                            检测到 {envData.details.length} 项形煞影响
                            {envData.totalPenalty !== 0 && <span className="penalty-tag">影响评分 {envData.totalPenalty}分</span>}
                          </div>
                          <div className="xingsha-list-compact">
                            {envData.details.map((xs, idx) => (
                              <div key={idx} className="xingsha-compact-item">
                                <span className={`xingsha-severity-dot ${xs.severity}`} />
                                <span className="xingsha-name">{xs.name}</span>
                                <span className="xingsha-impact">{xs.impact}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="xingsha-summary good">
                          ✅ 未检测到明显形煞影响，周边环境良好
                        </div>
                      )}
                      {/* 环境优势 */}
                      {envAdvantageData && envAdvantageData.advantages && envAdvantageData.advantages.length > 0 && (
                        <div className="advantage-summary-result">
                          <div className="advantage-overview">
                            ✨ {envAdvantageData.advantages.length}项环境优势
                            {envAdvantageData.totalBonus > 0 && <span className="bonus-tag">+{envAdvantageData.totalBonus}分</span>}
                          </div>
                          <div className="advantage-list-compact">
                            {envAdvantageData.advantages.map((adv, idx) => (
                              <div key={idx} className="advantage-compact-item">
                                <span className="advantage-icon">{adv.icon || ''}</span>
                                <span className="advantage-name">{adv.name}</span>
                                <span className="advantage-benefit">{adv.benefit}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 装修与户型综合分析 */}
                    {(renovationData || floorPlanData) && (
                      <div className="renovation-floorplan-section">
                        <h3 className="section-title">🏠 装修与户型分析</h3>
                        {floorPlanData?.validation?.floorPlanInfo && (
                          <div className="floorplan-summary-info">
                            {floorPlanData.validation.floorPlanInfo.floorPlanType && (
                              <span>户型：{floorPlanData.validation.floorPlanInfo.floorPlanType}</span>
                            )}
                            {floorPlanData.validation.floorPlanInfo.totalArea && (
                              <span> · 面积：{floorPlanData.validation.floorPlanInfo.totalArea}㎡</span>
                            )}
                            {floorPlanData.validation.rooms.length > 0 && (
                              <div className="room-tags-inline">
                                {floorPlanData.validation.rooms.map((r, i) => (
                                  <span key={i} className="room-tag-inline">{r.name}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                        {renovationData ? (
                          <div className="renovation-summary">
                            <div className="renovation-overview">
                              发现 {renovationData.renovationIssues.length} 个装修问题
                              {renovationData.fengshuiIssues.length > 0 && `、${renovationData.fengshuiIssues.length} 个风水问题`}
                              {renovationData.styleIssues?.length > 0 && `、${renovationData.styleIssues.length} 个风格风水问题`}
                              {renovationData.penalty !== 0 && <span className="penalty-tag">影响评分 {renovationData.penalty}分</span>}
                            </div>
                            {renovationData.renovationIssues.length > 0 && (
                              <div className="issue-list">
                                {renovationData.renovationIssues.slice(0, 5).map((issue, idx) => (
                                  <div key={idx} className="issue-item">
                                    <span className="issue-location">{issue.location}</span>
                                    <span className="issue-problem">{issue.problem}</span>
                                  </div>
                                ))}
                                {renovationData.renovationIssues.length > 5 && (
                                  <div className="issue-more">还有 {renovationData.renovationIssues.length - 5} 项，详见化解方案</div>
                                )}
                              </div>
                            )}
                            {renovationData.fengshuiIssues.length > 0 && (
                              <div className="fengshui-issue-list">
                                {renovationData.fengshuiIssues.slice(0, 3).map((issue, idx) => (
                                  <div key={`fs-${idx}`} className="issue-item fengshui">
                                    <span className="issue-type">☯ {issue.type}</span>
                                    <span className="issue-impact">{issue.impact}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                            {renovationData.styleIssues && renovationData.styleIssues.length > 0 && (
                              <div className="style-issue-list">
                                <div className="style-issue-header">🎨 装修风格风水</div>
                                {renovationData.styleIssues.slice(0, 4).map((si, idx) => (
                                  <div key={`sty-${idx}`} className="issue-item style">
                                    <span className="issue-type">🎨 {si.problem}</span>
                                    <span className="issue-impact">{si.desc}</span>
                                  </div>
                                ))}
                                {renovationData.styleIssues.length > 4 && (
                                  <div className="issue-more">还有 {renovationData.styleIssues.length - 4} 项，详见化解方案</div>
                                )}
                              </div>
                            )}
                          </div>
                        ) : floorPlanData ? (
                          <div className="renovation-summary">
                            <div className="renovation-overview">户型图已上传，未评估装修状况</div>
                          </div>
                        ) : null}
                      </div>
                    )}

                    {/* 算法冲突 */}
                    {result.conflicts && result.conflicts.conflictCount > 0 && (
                      <div className="conflict-section">
                        <h3 className="section-title">
                          ⚖️ 八宅·飞星对比
                          <span className="conflict-rule">飞星判吉凶，八宅判宜忌</span>
                        </h3>
                        <div className="conflict-cards">
                          {result.conflicts.conflicts.map((c, idx) => (
                            <div key={idx} className="conflict-card">
                              <div className="conflict-position">{c.position}</div>
                              <div className="conflict-comparison">
                                <span className="conflict-source bazhai">八宅: {c.baZhai}({c.baZhaiNature})</span>
                                <span className="conflict-vs">VS</span>
                                <span className="conflict-source feixing">飞星: {c.feiXing}({c.feiXingNature})</span>
                              </div>
                              <div className="conflict-resolution">→ 以飞星为准：{c.resolution}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 综合评分说明 */}
                    <div className="score-explanation">
                      <h4 className="breakdown-title">综合评分说明</h4>
                      <p className="score-explain-text">
                        综合评分融合八宅命卦（30%）、玄空飞星宫位（35%）、飞星格局（35%）三维度计算，
                        {result.conflicts && result.conflicts.conflictCount > 0 && `已处理${result.conflicts.conflictCount}处八宅与飞星冲突（以飞星为准），`}
                        得出最终评分 <strong>{result.overall.score}分（{result.overall.level}）</strong>
                      </p>
                    </div>

                    {/* 户型图风水热力图 */}
                    {floorPlanData && (
                      <div className="floorplan-section">
                        <h3 className="section-title">🔥 户型图风水热力图</h3>
                        <FloorPlanHeatmap
                          floorPlanData={floorPlanData}
                          fengshuiResult={result}
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ===== 化解Tab ===== */}
            {activeResultTab === 'resolve' && (
              <div className="tab-content animate-in">
                {!shared ? (
                  <div className="professional-lock">
                    <div className="lock-icon">🔓</div>
                    <p className="lock-title">解锁化解方案</p>
                    <p className="lock-desc">综合化解方案 · 装修改善建议 · 形煞化解</p>
                    <button className="btn-share" onClick={handleShare}>
                      🔗 分享解锁完整方案
                    </button>
                  </div>
                ) : (
                  <div className="huajie-section">
                    <h3 className="section-title">🛡️ 综合化解方案</h3>
                    <HuajiePanel huajie={result.huajie} />
                    {renovationData && renovationData.suggestions && renovationData.suggestions.length > 0 && (
                      <div className="extra-huajie">
                        <h4 className="sub-section-title">🔧 装修改善建议</h4>
                        {renovationData.suggestions.map((sug, idx) => (
                          <div key={idx} className="huajie-card">
                            <p className="huajie-solution">💡 {sug}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    {renovationData && renovationData.fengshuiIssues && renovationData.fengshuiIssues.length > 0 && (
                      <div className="extra-huajie">
                        <h4 className="sub-section-title">☯️ 装修风水化解</h4>
                        {renovationData.fengshuiIssues.map((issue, idx) => (
                          <div key={idx} className="huajie-card">
                            <div className="huajie-card-header">
                              <span className="huajie-position">{issue.type} · {issue.location}</span>
                            </div>
                            <p className="huajie-problem">{issue.description}</p>
                            <p className="huajie-solution">🛡️ {issue.suggestion}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    {envData && envData.details && envData.details.length > 0 && (
                      <div className="extra-huajie">
                        <h4 className="sub-section-title">🏠 形煞化解</h4>
                        {envData.details
                          .slice()
                          .sort((a, b) => Math.abs(b.penalty) - Math.abs(a.penalty))
                          .map((d, idx) => (
                          <div key={idx} className="huajie-card">
                            <div className="huajie-card-header">
                              <span className="huajie-position">{d.name}</span>
                              <span className={`huajie-severity ${Math.abs(d.penalty) >= 12 ? 'severe' : 'notice'}`}>
                                扣{Math.abs(d.penalty)}分
                              </span>
                            </div>
                            <p className="huajie-problem">{d.impact}</p>
                            {d.resolutions && d.resolutions.map((r, ri) => (
                              <p key={ri} className="huajie-solution">🛡️ {r}</p>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 操作按钮 */}
            <div className="result-actions">
              <button className="btn-secondary btn-glow-new" onClick={() => setShowPoster(true)}>
                🖼️ 生成分享海报
              </button>
              <button className="btn-secondary" onClick={handleReset}>
                重新看盘
              </button>
            </div>

            {/* 免责声明 */}
            <p className="disclaimer">
              本工具基于传统八宅派、玄空飞星理论和八字命理提供居住环境参考建议，不构成任何承诺或保证。
            </p>

            {/* V2 分享海报模态框 */}
            {showPoster && (
              <SharePoster
                result={result}
                renovationPenalty={renovationPenalty}
                xingshaPenalty={xingshaPenalty}
                envData={envData}
                renovationData={renovationData}
                envAdvantageData={envAdvantageData}
                onClose={() => setShowPoster(false)}
              />
            )}
          </div>
        )}
      </main>
    </div>
  )
}
