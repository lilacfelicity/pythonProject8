import React, { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, Calendar, Download, Filter, RefreshCw, Activity, Heart, Droplets, Zap, AlertTriangle, CheckCircle, Eye, Microscope, TestTube, Brain } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'

const Analytics = ({ user }) => {
  const [activeTab, setActiveTab] = useState('overview')
  const [dateRange, setDateRange] = useState('3months')
  const [selectedAnalysis, setSelectedAnalysis] = useState('all')
  const [refreshKey, setRefreshKey] = useState(0)

  // Реальные лабораторные данные Ирины за последние месяцы
  const labData = {
    bloodTests: [
      { date: '2025-05-25', hemoglobin: 138, platelets: 285, leukocytes: 5.8, erythrocytes: 4.6, hematocrit: 42.5, esr: 12 },
      { date: '2025-04-15', hemoglobin: 135, platelets: 290, leukocytes: 6.1, erythrocytes: 4.5, hematocrit: 41.8, esr: 15 },
      { date: '2025-03-20', hemoglobin: 140, platelets: 275, leukocytes: 5.9, erythrocytes: 4.7, hematocrit: 43.2, esr: 10 },
      { date: '2025-02-28', hemoglobin: 137, platelets: 280, leukocytes: 6.0, erythrocytes: 4.6, hematocrit: 42.1, esr: 13 },
      { date: '2025-01-22', hemoglobin: 134, platelets: 295, leukocytes: 6.3, erythrocytes: 4.4, hematocrit: 41.5, esr: 18 },
      { date: '2024-12-18', hemoglobin: 132, platelets: 270, leukocytes: 5.7, erythrocytes: 4.3, hematocrit: 40.8, esr: 16 },
      { date: '2024-11-25', hemoglobin: 136, platelets: 288, leukocytes: 6.2, erythrocytes: 4.5, hematocrit: 42.0, esr: 14 }
    ],
    biochemistry: [
      { date: '2025-05-25', glucose: 4.8, cholesterol: 4.2, hdl: 1.6, ldl: 2.4, triglycerides: 0.9, alt: 22, ast: 28, bilirubin: 15, creatinine: 78, urea: 4.2 },
      { date: '2025-04-15', glucose: 4.9, cholesterol: 4.4, hdl: 1.5, ldl: 2.6, triglycerides: 1.1, alt: 25, ast: 30, bilirubin: 17, creatinine: 80, urea: 4.0 },
      { date: '2025-03-20', glucose: 4.7, cholesterol: 4.1, hdl: 1.7, ldl: 2.2, triglycerides: 0.8, alt: 20, ast: 26, bilirubin: 14, creatinine: 76, urea: 4.5 },
      { date: '2025-02-28', glucose: 5.0, cholesterol: 4.3, hdl: 1.6, ldl: 2.5, triglycerides: 1.0, alt: 23, ast: 29, bilirubin: 16, creatinine: 79, urea: 4.1 },
      { date: '2025-01-22', glucose: 4.9, cholesterol: 4.5, hdl: 1.4, ldl: 2.8, triglycerides: 1.3, alt: 27, ast: 32, bilirubin: 18, creatinine: 82, urea: 4.3 },
      { date: '2024-12-18', glucose: 5.1, cholesterol: 4.6, hdl: 1.3, ldl: 2.9, triglycerides: 1.4, alt: 29, ast: 35, bilirubin: 19, creatinine: 84, urea: 4.6 }
    ],
    hormones: [
      { date: '2025-04-20', tsh: 2.3, t4_free: 12.8, t3_free: 4.1, anti_tpo: 8.5, cortisol: 420, prolactin: 18.5 },
      { date: '2025-01-15', tsh: 2.1, t4_free: 13.2, t3_free: 4.0, anti_tpo: 9.2, cortisol: 390, prolactin: 19.2 },
      { date: '2024-10-20', tsh: 2.5, t4_free: 12.5, t3_free: 4.2, anti_tpo: 8.8, cortisol: 410, prolactin: 17.8 }
    ],
    vitamins: [
      { date: '2025-03-15', vitamin_d: 28.5, vitamin_b12: 312, folate: 8.2, iron: 14.2, ferritin: 45, vitamin_c: 65 },
      { date: '2024-11-20', vitamin_d: 22.1, vitamin_b12: 298, folate: 7.8, iron: 13.8, ferritin: 42, vitamin_c: 58 },
      { date: '2024-08-25', vitamin_d: 19.5, vitamin_b12: 285, folate: 7.5, iron: 13.2, ferritin: 38, vitamin_c: 52 }
    ],
    vitals: [
      { date: '2025-05-27', systolic: 115, diastolic: 72, pulse: 76, spo2: 98, temperature: 36.4, weight: 62.0 },
      { date: '2025-05-26', systolic: 118, diastolic: 75, pulse: 78, spo2: 99, temperature: 36.5, weight: 62.1 },
      { date: '2025-05-25', systolic: 112, diastolic: 70, pulse: 74, spo2: 98, temperature: 36.3, weight: 61.9 },
      { date: '2025-05-24', systolic: 120, diastolic: 78, pulse: 82, spo2: 97, temperature: 36.6, weight: 62.2 },
      { date: '2025-05-23', systolic: 116, diastolic: 73, pulse: 77, spo2: 98, temperature: 36.4, weight: 62.0 },
      { date: '2025-05-22', systolic: 114, diastolic: 71, pulse: 75, spo2: 99, temperature: 36.5, weight: 61.8 },
      { date: '2025-05-21', systolic: 119, diastolic: 76, pulse: 79, spo2: 98, temperature: 36.4, weight: 62.1 }
    ],
    // Дополнительные специальные анализы
    specialTests: [
      {
        date: '2025-02-28',
        name: 'H.pylori тест',
        results: { helicobacter_igg: 'отрицательный', helicobacter_antigen: 'не обнаружен' },
        conclusion: 'H.pylori не выявлена'
      },
      {
        date: '2025-01-20',
        name: 'Аллергопанель',
        results: {
          birch_pollen: 'класс 3 (умеренная)',
          wormwood: 'класс 2 (слабая)',
          dust_mites: 'класс 1 (очень слабая)',
          cat_allergen: 'отрицательный'
        },
        conclusion: 'Подтвержден поллиноз к пыльце березы и полыни'
      }
    ]
  }

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
  ]

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Аналитика здоровья</h1>
          <p className="text-gray-600 mt-1">
            Анализ лабораторных данных и показателей здоровья • {user?.fullName || 'Петрова Ирина Сергеевна'} • 23 года
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="1month">За месяц</option>
            <option value="3months">За 3 месяца</option>
            <option value="6months">За полгода</option>
            <option value="1year">За год</option>
          </select>

          <button
            onClick={handleRefresh}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Обновить</span>
          </button>

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
          value="2 дня назад"
          subtitle="Общий и биохимический анализ крови"
          icon={Calendar}
          color="bg-blue-50 text-blue-600"
        />
        <StatCard
          title="Всего анализов"
          value="24"
          subtitle="За последний год"
          icon={Activity}
          color="bg-green-50 text-green-600"
        />
        <StatCard
          title="Отклонения"
          value="2"
          subtitle="Витамин D ↓, Ферритин ↓"
          icon={AlertTriangle}
          color="bg-orange-50 text-orange-600"
        />
        <StatCard
          title="Нормальные"
          value="22"
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
        {activeTab === 'overview' && (
          <>
            {/* Key Metrics Overview */}
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
                    <Area type="monotone" dataKey="cholesterol" stackId="2" stroke="#F59E0B" fill="#F59E0B" name="Холестерин (ммоль/л)" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Current Values Table */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Актуальные значения (25.05.2025)</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Показатель</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Значение</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Норма</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Статус</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Динамика</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {[
                      { name: 'Гемоглобин', value: 138, key: 'hemoglobin', data: labData.bloodTests },
                      { name: 'Глюкоза', value: 4.8, key: 'glucose', data: labData.biochemistry },
                      { name: 'Холестерин общий', value: 4.2, key: 'cholesterol', data: labData.biochemistry },
                      { name: 'HDL холестерин', value: 1.6, key: 'hdl', data: labData.biochemistry },
                      { name: 'LDL холестерин', value: 2.4, key: 'ldl', data: labData.biochemistry },
                      { name: 'ТТГ', value: 2.3, key: 'tsh', data: labData.hormones }
                    ].map((item) => {
                      const status = getValueStatus(item.value, item.key, true)
                      const range = normalRanges[item.key]
                      const actualRange = (range && range.female) ? range.female : range
                      const trend = calculateTrend(item.data, item.key)

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
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-1">
                              {trend.direction === 'up' && <TrendingUp className="h-4 w-4 text-green-500" />}
                              {trend.direction === 'down' && <TrendingUp className="h-4 w-4 text-red-500 transform rotate-180" />}
                              {trend.direction === 'stable' && <div className="h-4 w-4 bg-gray-400 rounded-full"></div>}
                              <span className={`text-xs ${trend.direction === 'up' ? 'text-green-600' : trend.direction === 'down' ? 'text-red-600' : 'text-gray-600'}`}>
                                {trend.change}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {activeTab === 'blood' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Динамика гемоглобина</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={labData.bloodTests.slice().reverse()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(date) => new Date(date).toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis domain={[120, 160]} />
                  <Tooltip
                    labelFormatter={(date) => new Date(date).toLocaleDateString('ru-RU')}
                    formatter={(value, name) => [`${value} г/л`, name]}
                  />
                  <Line
                    type="monotone"
                    dataKey="hemoglobin"
                    stroke="#EF4444"
                    strokeWidth={3}
                    dot={{ r: 5, fill: '#EF4444' }}
                    name="Гемоглобин"
                  />
                  {/* Линии нормы */}
                  <Line
                    type="monotone"
                    dataKey={() => 120}
                    stroke="#10B981"
                    strokeDasharray="5 5"
                    strokeWidth={1}
                    dot={false}
                    name="Нижняя граница нормы"
                  />
                  <Line
                    type="monotone"
                    dataKey={() => 140}
                    stroke="#10B981"
                    strokeDasharray="5 5"
                    strokeWidth={1}
                    dot={false}
                    name="Верхняя граница нормы"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Количество тромбоцитов</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={labData.bloodTests.slice(-5).reverse()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(date) => new Date(date).toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(date) => new Date(date).toLocaleDateString('ru-RU')}
                    formatter={(value, name) => [`${value} ×10⁹/л`, name]}
                  />
                  <Bar dataKey="platelets" fill="#3B82F6" name="Тромбоциты" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Полная картина крови</h3>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={labData.bloodTests.slice().reverse()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(date) => new Date(date).toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis />
                  <Tooltip labelFormatter={(date) => new Date(date).toLocaleDateString('ru-RU')} />
                  <Legend />
                  <Line type="monotone" dataKey="hemoglobin" stroke="#EF4444" name="Гемоглобин (г/л)" strokeWidth={2} />
                  <Line type="monotone" dataKey="leukocytes" stroke="#3B82F6" name="Лейкоциты (×10⁹/л)" strokeWidth={2} />
                  <Line type="monotone" dataKey="erythrocytes" stroke="#10B981" name="Эритроциты (×10¹²/л)" strokeWidth={2} />
                  <Line type="monotone" dataKey="esr" stroke="#F59E0B" name="СОЭ (мм/ч)" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === 'biochemistry' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Уровень глюкозы</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={labData.biochemistry.slice().reverse()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(date) => new Date(date).toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis domain={[4.0, 6.0]} />
                  <Tooltip
                    labelFormatter={(date) => new Date(date).toLocaleDateString('ru-RU')}
                    formatter={(value, name) => [`${value} ммоль/л`, name]}
                  />
                  <Area
                    type="monotone"
                    dataKey="glucose"
                    stroke="#10B981"
                    fill="#10B981"
                    fillOpacity={0.6}
                    name="Глюкоза"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Липидный профиль</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={labData.biochemistry.slice().reverse()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(date) => new Date(date).toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis />
                  <Tooltip labelFormatter={(date) => new Date(date).toLocaleDateString('ru-RU')} />
                  <Legend />
                  <Line type="monotone" dataKey="cholesterol" stroke="#F59E0B" strokeWidth={2} name="Общий холестерин" />
                  <Line type="monotone" dataKey="hdl" stroke="#10B981" strokeWidth={2} name="HDL (хороший)" />
                  <Line type="monotone" dataKey="ldl" stroke="#EF4444" strokeWidth={2} name="LDL (плохой)" />
                  <Line type="monotone" dataKey="triglycerides" stroke="#8B5CF6" strokeWidth={2} name="Триглицериды" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Печеночные пробы</h3>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={labData.biochemistry.slice(-4).reverse()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(date) => new Date(date).toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis />
                  <Tooltip labelFormatter={(date) => new Date(date).toLocaleDateString('ru-RU')} />
                  <Legend />
                  <Bar dataKey="alt" fill="#3B82F6" name="АЛТ (Ед/л)" />
                  <Bar dataKey="ast" fill="#10B981" name="АСТ (Ед/л)" />
                  <Bar dataKey="bilirubin" fill="#F59E0B" name="Билирубин (мкмоль/л)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === 'hormones' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Гормоны щитовидной железы</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={labData.hormones.slice().reverse()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(date) => new Date(date).toLocaleDateString('ru-RU', { month: 'short' })}
                  />
                  <YAxis />
                  <Tooltip labelFormatter={(date) => new Date(date).toLocaleDateString('ru-RU')} />
                  <Legend />
                  <Line type="monotone" dataKey="tsh" stroke="#3B82F6" strokeWidth={2} name="ТТГ (мЕд/л)" />
                  <Line type="monotone" dataKey="t4_free" stroke="#10B981" strokeWidth={2} name="Т4 свободный (пмоль/л)" />
                  <Line type="monotone" dataKey="t3_free" stroke="#F59E0B" strokeWidth={2} name="Т3 свободный (пмоль/л)" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Другие гормоны</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={labData.hormones.slice().reverse()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(date) => new Date(date).toLocaleDateString('ru-RU', { month: 'short' })}
                  />
                  <YAxis />
                  <Tooltip labelFormatter={(date) => new Date(date).toLocaleDateString('ru-RU')} />
                  <Legend />
                  <Bar dataKey="cortisol" fill="#8B5CF6" name="Кортизол (нмоль/л)" />
                  <Bar dataKey="prolactin" fill="#06B6D4" name="Пролактин (нг/мл)" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Интерпретация гормональных анализов</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2">Щитовидная железа</h4>
                  <div className="text-sm text-green-700 space-y-1">
                    <div>• ТТГ: 2.3 мЕд/л (норма 0.4-4.0)</div>
                    <div>• Т4 свободный: 12.8 пмоль/л (норма 10-25)</div>
                    <div>• Функция не нарушена</div>
                  </div>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Стресс-гормоны</h4>
                  <div className="text-sm text-blue-700 space-y-1">
                    <div>• Кортизол: 420 нмоль/л (норма 250-650)</div>
                    <div>• Пролактин: 18.5 нг/мл (норма 5-25)</div>
                    <div>• Уровень стресса в норме</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'vitamins' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Витамин D</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={labData.vitamins.slice().reverse()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(date) => new Date(date).toLocaleDateString('ru-RU', { month: 'short' })}
                  />
                  <YAxis domain={[15, 35]} />
                  <Tooltip
                    labelFormatter={(date) => new Date(date).toLocaleDateString('ru-RU')}
                    formatter={(value, name) => [`${value} нг/мл`, name]}
                  />
                  <Area
                    type="monotone"
                    dataKey="vitamin_d"
                    stroke="#F59E0B"
                    fill="#F59E0B"
                    fillOpacity={0.6}
                    name="Витамин D"
                  />
                  {/* Линия нормы */}
                  <Area
                    type="monotone"
                    dataKey={() => 30}
                    stroke="#10B981"
                    strokeDasharray="5 5"
                    fill="transparent"
                    name="Норма (>30)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Витамины группы B</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={labData.vitamins.slice().reverse()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(date) => new Date(date).toLocaleDateString('ru-RU', { month: 'short' })}
                  />
                  <YAxis />
                  <Tooltip labelFormatter={(date) => new Date(date).toLocaleDateString('ru-RU')} />
                  <Legend />
                  <Line type="monotone" dataKey="vitamin_b12" stroke="#8B5CF6" strokeWidth={2} name="B12 (пг/мл)" />
                  <Line type="monotone" dataKey="folate" stroke="#06B6D4" strokeWidth={2} name="Фолаты (нг/мл)" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Микроэлементы</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={labData.vitamins.slice().reverse()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(date) => new Date(date).toLocaleDateString('ru-RU', { month: 'short' })}
                  />
                  <YAxis />
                  <Tooltip labelFormatter={(date) => new Date(date).toLocaleDateString('ru-RU')} />
                  <Legend />
                  <Bar dataKey="iron" fill="#EF4444" name="Железо (мкмоль/л)" />
                  <Bar dataKey="ferritin" fill="#F59E0B" name="Ферритин (нг/мл)" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Рекомендации по витаминам</h3>
              <div className="space-y-4">
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-orange-900">Дефицит витамина D</h4>
                      <p className="text-sm text-orange-700 mt-1">
                        Текущий уровень: 28.5 нг/мл (норма >30). Рекомендуется прием 2000 МЕ/день в течение 2-3 месяцев.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-yellow-900">Низкий ферритин</h4>
                      <p className="text-sm text-yellow-700 mt-1">
                        Уровень ферритина: 45 нг/мл (норма для женщин 15-80). В нижней границе нормы. Контроль через 3 месяца.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-green-900">Остальные витамины в норме</h4>
                      <p className="text-sm text-green-700 mt-1">
                        B12, фолаты, железо, витамин C - все показатели в пределах нормальных значений.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'vitals' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Артериальное давление</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={labData.vitals.slice().reverse()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(date) => new Date(date).toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis domain={[60, 140]} />
                  <Tooltip labelFormatter={(date) => new Date(date).toLocaleDateString('ru-RU')} />
                  <Legend />
                  <Line type="monotone" dataKey="systolic" stroke="#EF4444" name="Систолическое" strokeWidth={2} />
                  <Line type="monotone" dataKey="diastolic" stroke="#3B82F6" name="Диастолическое" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Пульс и сатурация</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={labData.vitals.slice().reverse()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(date) => new Date(date).toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis />
                  <Tooltip labelFormatter={(date) => new Date(date).toLocaleDateString('ru-RU')} />
                  <Legend />
                  <Line type="monotone" dataKey="pulse" stroke="#10B981" name="Пульс (уд/мин)" strokeWidth={2} />
                  <Line type="monotone" dataKey="spo2" stroke="#8B5CF6" name="SpO2 (%)" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Вес и температура</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={labData.vitals.slice().reverse()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(date) => new Date(date).toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis yAxisId="left" orientation="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip labelFormatter={(date) => new Date(date).toLocaleDateString('ru-RU')} />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="weight" stroke="#F59E0B" name="Вес (кг)" strokeWidth={2} />
                  <Line yAxisId="right" type="monotone" dataKey="temperature" stroke="#06B6D4" name="Температура (°C)" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Текущие показатели</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">115/72</div>
                  <div className="text-sm text-gray-600">АД (мм рт.ст.)</div>
                  <div className="text-xs text-green-600 mt-1">Оптимальное</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">76</div>
                  <div className="text-sm text-gray-600">Пульс (уд/мин)</div>
                  <div className="text-xs text-green-600 mt-1">Норма</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">98%</div>
                  <div className="text-sm text-gray-600">SpO2</div>
                  <div className="text-xs text-green-600 mt-1">Отлично</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">62.0</div>
                  <div className="text-sm text-gray-600">Вес (кг)</div>
                  <div className="text-xs text-green-600 mt-1">ИМТ 22.0</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'trends' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Сводка трендов</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <TrendCard
                  title="Гемоглобин"
                  value="138 г/л"
                  change="+2.2%"
                  trend="up"
                  status="normal"
                />
                <TrendCard
                  title="Глюкоза"
                  value="4.8 ммоль/л"
                  change="-2.0%"
                  trend="down"
                  status="normal"
                />
                <TrendCard
                  title="Холестерин"
                  value="4.2 ммоль/л"
                  change="-4.5%"
                  trend="down"
                  status="normal"
                />
                <TrendCard
                  title="Витамин D"
                  value="28.5 нг/мл"
                  change="+46.2%"
                  trend="up"
                  status="attention"
                />
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Радарная диаграмма здоровья</h3>
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={[
                  { subject: 'Кровь', A: 85, fullMark: 100 },
                  { subject: 'Биохимия', A: 92, fullMark: 100 },
                  { subject: 'Гормоны', A: 88, fullMark: 100 },
                  { subject: 'Витамины', A: 70, fullMark: 100 },
                  { subject: 'Витальные функции', A: 95, fullMark: 100 },
                  { subject: 'Иммунитет', A: 80, fullMark: 100 }
                ]}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  <Radar name="Текущее состояние" dataKey="A" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Сравнение за периоды</h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={[
                  { period: 'Февраль 2025', hemoglobin: 137, glucose: 5.0, cholesterol: 4.3, vitamin_d: 19.5 },
                  { period: 'Март 2025', hemoglobin: 140, glucose: 4.7, cholesterol: 4.1, vitamin_d: 28.5 },
                  { period: 'Апрель 2025', hemoglobin: 135, glucose: 4.9, cholesterol: 4.4, vitamin_d: 28.5 },
                  { period: 'Май 2025', hemoglobin: 138, glucose: 4.8, cholesterol: 4.2, vitamin_d: 28.5 }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="hemoglobin" fill="#EF4444" name="Гемоглобин" />
                  <Bar dataKey="glucose" fill="#10B981" name="Глюкоза×10" />
                  <Bar dataKey="cholesterol" fill="#F59E0B" name="Холестерин×10" />
                  <Bar dataKey="vitamin_d" fill="#8B5CF6" name="Витамин D" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === 'special' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Специальные анализы</h3>
              <div className="space-y-6">
                {labData.specialTests.map((test, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">{test.name}</h4>
                      <span className="text-sm text-gray-500">{test.date}</span>
                    </div>

                    {test.name === 'H.pylori тест' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-3 bg-green-50 rounded-lg">
                          <div className="text-sm font-medium text-green-900">IgG к H.pylori</div>
                          <div className="text-lg font-bold text-green-700">Отрицательный</div>
                        </div>
                        <div className="p-3 bg-green-50 rounded-lg">
                          <div className="text-sm font-medium text-green-900">Антigen H.pylori</div>
                          <div className="text-lg font-bold text-green-700">Не обнаружен</div>
                        </div>
                      </div>
                    )}

                    {test.name === 'Аллергопанель' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-3 bg-orange-50 rounded-lg">
                          <div className="text-sm font-medium text-orange-900">Пыльца березы</div>
                          <div className="text-lg font-bold text-orange-700">Класс 3 (умеренная)</div>
                        </div>
                        <div className="p-3 bg-yellow-50 rounded-lg">
                          <div className="text-sm font-medium text-yellow-900">Полынь</div>
                          <div className="text-lg font-bold text-yellow-700">Класс 2 (слабая)</div>
                        </div>
                        <div className="p-3 bg-yellow-50 rounded-lg">
                          <div className="text-sm font-medium text-yellow-900">Клещи домашней пыли</div>
                          <div className="text-lg font-bold text-yellow-700">Класс 1 (очень слабая)</div>
                        </div>
                        <div className="p-3 bg-green-50 rounded-lg">
                          <div className="text-sm font-medium text-green-900">Аллерген кошки</div>
                          <div className="text-lg font-bold text-green-700">Отрицательный</div>
                        </div>
                      </div>
                    )}

                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <div className="text-sm font-medium text-blue-900 mb-1">Заключение:</div>
                      <div className="text-sm text-blue-700">{test.conclusion}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Рекомендации врачей</h3>
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-green-900">Гастроэнтеролог</h4>
                      <p className="text-sm text-green-700 mt-1">
                        H.pylori не выявлена. Гастрит носит неинфекционный характер. Продолжить диетотерапию и прием омепразола.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-orange-900">Аллерголог</h4>
                      <p className="text-sm text-orange-700 mt-1">
                        Подтвержен поллиноз к березе и полыни. В период цветения (апрель-сентябрь) прием антигистаминных препаратов.
                      </p>
                    </div>
                  </div>
                </div>
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

const TrendCard = ({ title, value, change, trend, status }) => (
  <div className="border border-gray-200 rounded-lg p-4">
    <div className="flex items-center justify-between mb-2">
      <h4 className="font-medium text-gray-900 text-sm">{title}</h4>
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
        status === 'normal' ? 'bg-green-100 text-green-800' : 
        status === 'attention' ? 'bg-orange-100 text-orange-800' : 'bg-red-100 text-red-800'
      }`}>
        {status === 'normal' ? 'Норма' : status === 'attention' ? 'Внимание' : 'Риск'}
      </span>
    </div>
    <div className="text-xl font-bold text-gray-900 mb-1">{value}</div>
    <div className="flex items-center space-x-1">
      {trend === 'up' && <TrendingUp className="h-3 w-3 text-green-500" />}
      {trend === 'down' && <TrendingUp className="h-3 w-3 text-red-500 transform rotate-180" />}
      <span className={`text-xs font-medium ${
        trend === 'up' ? 'text-green-600' : 'text-red-600'
      }`}>
        {change} за 3 мес
      </span>
    </div>
  </div>
)

export default Analytics