import React, { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, Calendar, Download, Filter, RefreshCw, Activity, Heart, Droplets, Zap, AlertTriangle, CheckCircle, Eye, Microscope, TestTube, Brain, ExternalLink, Monitor, Settings } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'
import api from '../services/api'

// Компонент для встраивания Grafana
const GrafanaEmbed = ({ dashboardId, height = "600px", timeRange = "now-24h", refresh, theme = "light", showControls = true, orgId = 1, patient_id }) => {
  const grafanaUrl = import.meta.env.VITE_GRAFANA_URL || 'http://localhost/grafana'
  const embedUrl = `${grafanaUrl}/d/${dashboardId}?orgId=${orgId}&from=${timeRange.replace('now-', 'now-')}&to=now&theme=${theme}&kiosk=tv&refresh=30s&_=${refresh || Date.now()}&var-patient_id=${patient_id}`

  return (
    <div className="w-full bg-white rounded-lg border border-gray-200 overflow-hidden">
      {showControls && (
        <div className="p-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Grafana Dashboard: {dashboardId}
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-gray-500">Live</span>
          </div>
        </div>
      )}
      <iframe
        src={embedUrl}
        width="100%"
        height={height}
        frameBorder="0"
        title={`Grafana Dashboard ${dashboardId}`}
        className="w-full"
        style={{ minHeight: height }}
      />
    </div>
  )
}

const Analytics = ({ user }) => {
  const [activeTab, setActiveTab] = useState('overview')
  const [dateRange, setDateRange] = useState('3months')
  const [selectedAnalysis, setSelectedAnalysis] = useState('all')
  const [refreshKey, setRefreshKey] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  // Состояния для реальных данных
  const [labData, setLabData] = useState({
    bloodTests: [],
    biochemistry: [],
    hormones: [],
    vitamins: [],
    vitals: []
  })
  const [analyticsStats, setAnalyticsStats] = useState({
    totalTests: 0,
    lastTestDate: 'Нет данных',
    abnormalValues: 0,
    normalValues: 0
  })

  // Новые состояния для Grafana
  const [selectedGrafanaDashboard, setSelectedGrafanaDashboard] = useState('medical-overview')
  const [grafanaTimeRange, setGrafanaTimeRange] = useState('now-24h')
  const [grafanaRefreshKey, setGrafanaRefreshKey] = useState(0)

  // Конфигурация Grafana дашбордов
  const grafanaDashboards = [
    {
      id: 'medical-overview',
      name: 'Обзор системы',
      description: 'Общая статистика медицинской системы',
      icon: BarChart3,
      category: 'system'
    },
    {
      id: 'patient-vitals',
      name: 'Показатели пациента',
      description: 'Витальные функции и мониторинг в реальном времени',
      icon: Activity,
      category: 'vitals'
    },
    {
      id: 'lab-analytics',
      name: 'Лабораторная аналитика',
      description: 'Глубокий анализ лабораторных данных',
      icon: TestTube,
      category: 'lab'
    },
    {
      id: 'trends-analytics',
      name: 'Аналитика трендов',
      description: 'Долгосрочные тренды и прогнозы',
      icon: TrendingUp,
      category: 'trends'
    }
  ]

  const grafanaTimeRanges = [
    { value: 'now-1h', label: 'Последний час' },
    { value: 'now-6h', label: 'Последние 6 часов' },
    { value: 'now-24h', label: 'Последние 24 часа' },
    { value: 'now-7d', label: 'Последняя неделя' },
    { value: 'now-30d', label: 'Последний месяц' }
  ]

  // Нормальные диапазоны для анализов
  const normalRanges = {
    hemoglobin: { min: 120, max: 160, unit: 'г/л', female: { min: 120, max: 140 } },
    platelets: { min: 180, max: 320, unit: '×10⁹/л' },
    leukocytes: { min: 4.0, max: 9.0, unit: '×10⁹/л' },
    glucose: { min: 3.9, max: 6.1, unit: 'ммоль/л' },
    cholesterol: { min: 3.0, max: 5.2, unit: 'ммоль/л' },
    hdl: { min: 1.2, max: 1.9, unit: 'ммоль/л', female: { min: 1.3, max: 2.0 } },
    ldl: { min: 1.7, max: 3.5, unit: 'ммоль/л' },
    tsh: { min: 0.4, max: 4.0, unit: 'мЕд/л' },
    vitamin_d: { min: 30, max: 100, unit: 'нг/мл' },
    vitamin_b12: { min: 300, max: 900, unit: 'пг/мл' },
    ferritin: { min: 30, max: 150, unit: 'нг/мл', female: { min: 15, max: 80 } },
    systolic: { min: 90, max: 140, unit: 'мм рт.ст.' },
    diastolic: { min: 60, max: 90, unit: 'мм рт.ст.' },
    alt: { min: 7, max: 56, unit: 'Ед/л', female: { min: 7, max: 45 } },
    ast: { min: 10, max: 40, unit: 'Ед/л', female: { min: 10, max: 35 } }
  }

  const tabs = [
    { id: 'overview', name: 'Обзор', icon: BarChart3 },
    { id: 'blood', name: 'Анализ крови', icon: Droplets },
    { id: 'biochemistry', name: 'Биохимия', icon: TestTube },
    { id: 'hormones', name: 'Гормоны', icon: Brain },
    { id: 'vitamins', name: 'Витамины', icon: Zap },
    { id: 'vitals', name: 'Витальные функции', icon: Heart },
    { id: 'trends', name: 'Тренды', icon: TrendingUp },
    { id: 'special', name: 'Спец. анализы', icon: Microscope },
    { id: 'grafana', name: 'Интерактивные дашборды', icon: Monitor },
  ]

  // Загрузка данных при монтировании компонента
  useEffect(() => {
    loadData()
  }, [])

  // Загрузка данных
  const loadData = async () => {
    setIsLoading(true)
    try {
      console.log('Analytics: Loading data...')

      // Параллельная загрузка всех данных
      const [analyticsData, labResponse, vitalsData] = await Promise.all([
        api.getAnalyticsSummary(365),
        api.getLabData(),
        api.getVitalsHistory(30)
      ])

      // Обновляем статистику
      setAnalyticsStats({
        totalTests: analyticsData.lab_tests_count || 0,
        lastTestDate: analyticsData.last_reading_date || 'Нет данных',
        abnormalValues: analyticsData.anomalies_count || 0,
        normalValues: (analyticsData.total_readings - analyticsData.anomalies_count) || 0
      })

      // Обновляем лабораторные данные
      setLabData({
        bloodTests: labResponse.bloodTests || [],
        biochemistry: labResponse.biochemistry || [],
        hormones: labResponse.hormones || [],
        vitamins: labResponse.vitamins || [],
        vitals: vitalsData.vitals || []
      })

      console.log('Analytics: Data loaded successfully')
    } catch (error) {
      console.error('Analytics: Failed to load data:', error)
      // Используем пустые массивы при ошибке
      setLabData({
        bloodTests: [],
        biochemistry: [],
        hormones: [],
        vitamins: [],
        vitals: []
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Определение статуса значения с учетом пола
  const getValueStatus = (value, parameter, isForFemale = true) => {
    const range = normalRanges[parameter]
    if (!range) return 'normal'

    const actualRange = (isForFemale && range.female) ? range.female : range

    if (value < actualRange.min) return 'low'
    if (value > actualRange.max) return 'high'
    return 'normal'
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'high': return 'text-red-600 bg-red-50'
      case 'low': return 'text-orange-600 bg-orange-50'
      case 'normal': return 'text-green-600 bg-green-50'
      case 'borderline': return 'text-yellow-600 bg-yellow-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  // Цвета для графиков
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316']

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1)
    loadData()
  }

  const handleGrafanaRefresh = () => {
    setGrafanaRefreshKey(prev => prev + 1)
  }

  // Расчет изменений показателей
  const calculateTrend = (data, parameter) => {
    if (data.length < 2) return { change: 0, direction: 'stable' }

    const latest = data[0][parameter]
    const previous = data[1][parameter]
    const change = ((latest - previous) / previous * 100).toFixed(1)

    return {
      change: Math.abs(change),
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'stable'
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Аналитика здоровья</h1>
            <p className="text-gray-600 mt-1">Загрузка данных...</p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Загрузка аналитических данных...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Аналитика здоровья</h1>
          <p className="text-gray-600 mt-1">
            Анализ лабораторных данных и показателей здоровья • {user?.fullName || user?.full_name || 'Пациент'}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {activeTab === 'grafana' ? (
            <>
              <select
                value={grafanaTimeRange}
                onChange={(e) => setGrafanaTimeRange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {grafanaTimeRanges.map(range => (
                  <option key={range.value} value={range.value}>
                    {range.label}
                  </option>
                ))}
              </select>
              <button
                onClick={handleGrafanaRefresh}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Обновить</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleRefresh}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Обновить</span>
              </button>
            </>
          )}

          <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            <Download className="h-4 w-4" />
            <span>Экспорт</span>
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Последний анализ"
          value={analyticsStats.lastTestDate}
          subtitle="Лабораторные исследования"
          icon={Calendar}
          color="bg-blue-50 text-blue-600"
        />
        <StatCard
          title="Всего анализов"
          value={analyticsStats.totalTests}
          subtitle="За последний год"
          icon={Activity}
          color="bg-green-50 text-green-600"
        />
        <StatCard
          title="Отклонения"
          value={analyticsStats.abnormalValues}
          subtitle="Требуют внимания"
          icon={AlertTriangle}
          color="bg-orange-50 text-orange-600"
        />
        <StatCard
          title="Нормальные"
          value={analyticsStats.normalValues}
          subtitle="В пределах нормы"
          icon={CheckCircle}
          color="bg-emerald-50 text-emerald-600"
        />
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.name}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {/* Grafana Tab */}
        {activeTab === 'grafana' && (
          <>
            {/* Dashboard Selector */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {grafanaDashboards.map((dashboard) => {
                const Icon = dashboard.icon
                const isSelected = selectedGrafanaDashboard === dashboard.id

                return (
                  <button
                    key={dashboard.id}
                    onClick={() => setSelectedGrafanaDashboard(dashboard.id)}
                    className={`p-4 border-2 rounded-xl text-left transition-all hover:shadow-md ${
                      isSelected 
                        ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-md scale-105' 
                        : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3 mb-2">
                      <Icon className={`h-6 w-6 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`} />
                      <h3 className={`font-medium ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                        {dashboard.name}
                      </h3>
                    </div>
                    <p className={`text-sm ${isSelected ? 'text-blue-700 opacity-80' : 'text-gray-500'}`}>
                      {dashboard.description}
                    </p>
                  </button>
                )
              })}
            </div>

            {/* Grafana Dashboard */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <GrafanaEmbed
                dashboardId={selectedGrafanaDashboard}
                height="700px"
                timeRange={grafanaTimeRange}
                refresh={grafanaRefreshKey}
                theme="light"
                showControls={true}
                orgId={1}
              />
            </div>
          </>
        )}

        {activeTab === 'overview' && (
          <>
            {/* Мини виджет Grafana в overview */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Интерактивный обзор системы</h3>
                <button
                  onClick={() => setActiveTab('grafana')}
                  className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-700"
                >
                  <Monitor className="h-4 w-4" />
                  <span>Открыть полные дашборды</span>
                </button>
              </div>
              <div className="h-64">
                <GrafanaEmbed
                  dashboardId="medical-overview"
                  height="250px"
                  timeRange="now-24h"
                  refresh={refreshKey}
                  theme="light"
                  showControls={false}
                  orgId={1}
                />
              </div>
            </div>

            {/* Key Metrics Overview */}
            {labData.bloodTests.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Ключевые показатели крови</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={labData.bloodTests.slice().reverse()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(date) => new Date(date).toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' })}
                      />
                      <YAxis />
                      <Tooltip labelFormatter={(date) => new Date(date).toLocaleDateString('ru-RU')} />
                      <Legend />
                      <Line type="monotone" dataKey="hemoglobin" name="Гемоглобин (г/л)" stroke="#EF4444" strokeWidth={2} />
                      <Line type="monotone" dataKey="leukocytes" name="Лейкоциты (×10⁹/л)" stroke="#3B82F6" strokeWidth={2} />
                      <Line type="monotone" dataKey="esr" name="СОЭ (мм/ч)" stroke="#F59E0B" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {labData.biochemistry.length > 0 && (
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Биохимические показатели</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={labData.biochemistry.slice().reverse()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="date"
                          tickFormatter={(date) => new Date(date).toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' })}
                        />
                        <YAxis />
                        <Tooltip labelFormatter={(date) => new Date(date).toLocaleDateString('ru-RU')} />
                        <Legend />
                        <Area type="monotone" dataKey="glucose" stackId="1" stroke="#10B981" fill="#10B981" name="Глюкоза (ммоль/л)" fillOpacity={0.6} />
                        <Area type="monotone" dataKey="alt" stackId="2" stroke="#F59E0B" fill="#F59E0B" name="АЛТ (Ед/л)" fillOpacity={0.6} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            )}

            {/* Current Values Table - только если есть данные */}
            {labData.bloodTests.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">
                    Актуальные значения ({labData.bloodTests[0]?.date || 'Последние данные'})
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Показатель</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Значение</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Норма</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Статус</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {[
                        { name: 'Гемоглобин', value: labData.bloodTests[0]?.hemoglobin, key: 'hemoglobin' },
                        { name: 'Лейкоциты', value: labData.bloodTests[0]?.leukocytes, key: 'leukocytes' },
                        { name: 'Тромбоциты', value: labData.bloodTests[0]?.platelets, key: 'platelets' },
                        ...(labData.biochemistry[0] ? [
                          { name: 'Глюкоза', value: labData.biochemistry[0].glucose, key: 'glucose' },
                          { name: 'АЛТ', value: labData.biochemistry[0].alt, key: 'alt' },
                          { name: 'АСТ', value: labData.biochemistry[0].ast, key: 'ast' }
                        ] : [])
                      ].filter(item => item.value !== null && item.value !== undefined).map((item) => {
                        const status = getValueStatus(item.value, item.key, true)
                        const range = normalRanges[item.key]
                        const actualRange = (range && range.female) ? range.female : range

                        return (
                          <tr key={item.key}>
                            <td className="px-6 py-4 font-medium text-gray-900">{item.name}</td>
                            <td className="px-6 py-4 text-gray-900">
                              {typeof item.value === 'number' ? item.value.toFixed(1) : item.value} {actualRange?.unit || ''}
                            </td>
                            <td className="px-6 py-4 text-gray-500">
                              {actualRange ? `${actualRange.min}-${actualRange.max} ${actualRange.unit}` : 'Н/Д'}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(status)}`}>
                                {status === 'normal' ? 'Норма' : status === 'high' ? 'Выше нормы' : status === 'low' ? 'Ниже нормы' : 'Погранично'}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Сообщение если нет данных */}
            {labData.bloodTests.length === 0 && labData.biochemistry.length === 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                <TestTube className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Нет лабораторных данных</h3>
                <p className="text-gray-500">
                  Данные лабораторных исследований будут отображаться здесь после их загрузки в систему
                </p>
              </div>
            )}
          </>
        )}

        {/* Остальные табы */}
        {(activeTab === 'blood' || activeTab === 'biochemistry' || activeTab === 'hormones' || activeTab === 'vitamins' || activeTab === 'vitals' || activeTab === 'trends' || activeTab === 'special') && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="text-center py-8">
              <div className="text-gray-500">
                <p className="text-lg font-medium mb-2">Раздел "{tabs.find(t => t.id === activeTab)?.name}"</p>
                <p>Подробная аналитика по выбранному разделу</p>
                {labData[activeTab === 'blood' ? 'bloodTests' : activeTab === 'biochemistry' ? 'biochemistry' : activeTab === 'hormones' ? 'hormones' : activeTab === 'vitamins' ? 'vitamins' : 'vitals']?.length === 0 ? (
                  <p className="text-sm mt-2 text-orange-600">Нет данных для отображения</p>
                ) : (
                  <p className="text-sm mt-2 text-green-600">
                    Найдено {labData[activeTab === 'blood' ? 'bloodTests' : activeTab === 'biochemistry' ? 'biochemistry' : activeTab === 'hormones' ? 'hormones' : activeTab === 'vitamins' ? 'vitamins' : 'vitals']?.length || 0} записей
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Вспомогательные компоненты
const StatCard = ({ title, value, subtitle, icon: Icon, color }) => (
  <div className="bg-white rounded-lg border border-gray-200 p-6">
    <div className="flex items-center">
      <div className={`p-2 rounded-lg ${color}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div className="ml-4">
        <p className="text-2xl font-semibold text-gray-900">{value}</p>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-xs text-gray-500">{subtitle}</p>
      </div>
    </div>
  </div>
)

export default Analytics