import React, { useState, useEffect } from 'react'
import { FileText, Calendar, User, Pill, Activity, Download, Filter, Search, Plus } from 'lucide-react'
import api from '../services/api'

const MedicalHistory = ({ user }) => {
  const [activeTab, setActiveTab] = useState('visits')
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState('all')
  const [isLoading, setIsLoading] = useState(true)
  const [medicalData, setMedicalData] = useState({
    visits: [],
    diagnoses: [],
    medications: [],
    labTests: []
  })

  // Загрузка медицинских данных
  useEffect(() => {
    loadMedicalData()
  }, [])

  const loadMedicalData = async () => {
    setIsLoading(true)
    try {
      console.log('MedicalHistory: Loading medical data...')

      // Получаем данные медицинской истории
      const historyData = await api.getMedicalHistoryData()

      // Получаем лабораторные данные
      const labData = await api.getLabData()

      // Преобразуем лабораторные данные в формат для истории
      const labTests = []

      // Добавляем анализы крови
      if (labData.bloodTests && labData.bloodTests.length > 0) {
        labData.bloodTests.forEach(test => {
          labTests.push({
            id: `blood_${test.date}`,
            date: new Date(test.date).toLocaleDateString('ru-RU'),
            name: 'Общий анализ крови',
            doctor: 'Лабораторная служба',
            results: `Гемоглобин: ${test.hemoglobin || 'н/д'} г/л, Лейкоциты: ${test.leukocytes || 'н/д'} ×10⁹/л, Тромбоциты: ${test.platelets || 'н/д'} ×10⁹/л`,
            status: 'completed'
          })
        })
      }

      // Добавляем биохимические анализы
      if (labData.biochemistry && labData.biochemistry.length > 0) {
        labData.biochemistry.forEach(test => {
          labTests.push({
            id: `bio_${test.date}`,
            date: new Date(test.date).toLocaleDateString('ru-RU'),
            name: 'Биохимический анализ крови',
            doctor: 'Лабораторная служба',
            results: `Глюкоза: ${test.glucose || 'н/д'} ммоль/л, АЛТ: ${test.alt || 'н/д'} Ед/л, АСТ: ${test.ast || 'н/д'} Ед/л`,
            status: 'completed'
          })
        })
      }

      // Добавляем анализы на гормоны
      if (labData.hormones && labData.hormones.length > 0) {
        labData.hormones.forEach(test => {
          labTests.push({
            id: `hormones_${test.date}`,
            date: new Date(test.date).toLocaleDateString('ru-RU'),
            name: 'Гормональные исследования',
            doctor: 'Лабораторная служба',
            results: `ТТГ: ${test.tsh || 'н/д'} мЕд/л, Т4 свободный: ${test.t4_free || 'н/д'} пмоль/л`,
            status: 'completed'
          })
        })
      }

      // Добавляем анализы на витамины
      if (labData.vitamins && labData.vitamins.length > 0) {
        labData.vitamins.forEach(test => {
          labTests.push({
            id: `vitamins_${test.date}`,
            date: new Date(test.date).toLocaleDateString('ru-RU'),
            name: 'Анализ витаминов и микроэлементов',
            doctor: 'Лабораторная служба',
            results: `Витамин D: ${test.vitamin_d || 'н/д'} нг/мл, Витамин B12: ${test.vitamin_b12 || 'н/д'} пг/мл, Ферритин: ${test.ferritin || 'н/д'} нг/мл`,
            status: 'completed'
          })
        })
      }

      // Устанавливаем данные (пока используем заглушки для visits, diagnoses, medications)
      setMedicalData({
        visits: [
          {
            id: 1,
            date: "02.05.2025",
            doctor: "Сидорова Анна Владимировна",
            specialty: "Терапевт",
            diagnosis: "Первичный визит",
            notes: "Пациент обратился для профилактического осмотра. Жалоб не предъявляет.",
            status: "completed"
          }
        ],
        diagnoses: [
          {
            id: 1,
            date: "10.02.2025",
            doctor: "Петрова Наталья Ивановна",
            specialty: "Терапевт",
            diagnosis: "Общее наблюдение",
            icd10: "Z00.0",
            status: "active",
            notes: "Пациент под общим наблюдением"
          }
        ],
        medications: [
          {
            id: 1,
            name: "По назначению врача",
            dosage: "По показаниям",
            frequency: "При необходимости",
            startDate: new Date().toLocaleDateString('ru-RU'),
            endDate: null,
            prescribedBy: "Лечащий врач",
            status: "as_needed",
            notes: "Препараты назначаются по мере необходимости"
          }
        ],
        labTests: labTests.sort((a, b) => new Date(b.date.split('.').reverse().join('-')) - new Date(a.date.split('.').reverse().join('-')))
      })

      console.log('MedicalHistory: Medical data loaded successfully')
    } catch (error) {
      console.error('MedicalHistory: Failed to load medical data:', error)
      // Устанавливаем пустые данные при ошибке
      setMedicalData({
        visits: [],
        diagnoses: [],
        medications: [],
        labTests: []
      })
    } finally {
      setIsLoading(false)
    }
  }

  const tabs = [
    { id: 'visits', name: 'Визиты', icon: Calendar, count: medicalData.visits.length },
    { id: 'diagnoses', name: 'Диагнозы', icon: FileText, count: medicalData.diagnoses.length },
    { id: 'medications', name: 'Лекарства', icon: Pill, count: medicalData.medications.length },
    { id: 'analytics', name: 'Анализы', icon: Activity, count: medicalData.labTests.length }
  ]

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'monitoring':
        return 'bg-yellow-100 text-yellow-800'
      case 'resolved':
        return 'bg-blue-100 text-blue-800'
      case 'active':
        return 'bg-red-100 text-red-800'
      case 'chronic':
        return 'bg-purple-100 text-purple-800'
      case 'as_needed':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'completed': return 'Завершено'
      case 'monitoring': return 'Наблюдение'
      case 'resolved': return 'Решено'
      case 'active': return 'Активно'
      case 'chronic': return 'Хронический'
      case 'as_needed': return 'По показаниям'
      default: return status
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">История болезни</h1>
            <p className="text-gray-600 mt-1">Загрузка медицинских данных...</p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Загрузка истории болезни...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">История болезни</h1>
          <p className="text-gray-600 mt-1">
            Полная медицинская карта • {user?.fullName || user?.full_name || 'Пациент'}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Download className="h-4 w-4" />
            <span>Экспорт</span>
          </button>
          <button
            onClick={loadMedicalData}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Обновить</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Поиск по записям..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Все периоды</option>
              <option value="month">За месяц</option>
              <option value="quarter">За квартал</option>
              <option value="year">За год</option>
            </select>
          </div>

          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Filter className="h-4 w-4" />
            <span>Всего записей: {medicalData.visits.length + medicalData.diagnoses.length + medicalData.medications.length + medicalData.labTests.length}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.name}</span>
              <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                {tab.count}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg border border-gray-200">
        {activeTab === 'visits' && (
          <div>
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium">Визиты к врачу</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {medicalData.visits.length > 0 ? medicalData.visits.map((visit) => (
                <div key={visit.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="font-medium text-gray-900">{visit.date}</div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(visit.status)}`}>
                          {getStatusText(visit.status)}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mb-1">
                        <strong>Врач:</strong> {visit.doctor} ({visit.specialty})
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        <strong>Диагноз:</strong> {visit.diagnosis}
                      </div>
                      {visit.notes && (
                        <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
                          <strong>Заметки:</strong> {visit.notes}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )) : (
                <div className="px-6 py-8 text-center text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>Нет записей о визитах к врачу</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'diagnoses' && (
          <div>
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium">Диагнозы</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {medicalData.diagnoses.length > 0 ? medicalData.diagnoses.map((diagnosis) => (
                <div key={diagnosis.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="font-medium text-gray-900">{diagnosis.date}</div>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          МКБ-10: {diagnosis.icd10}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(diagnosis.status)}`}>
                          {getStatusText(diagnosis.status)}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mb-1">
                        <strong>Врач:</strong> {diagnosis.doctor} ({diagnosis.specialty})
                      </div>
                      <div className="text-sm text-gray-900 mb-2 font-medium">
                        {diagnosis.diagnosis}
                      </div>
                      {diagnosis.notes && (
                        <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
                          <strong>Заметки:</strong> {diagnosis.notes}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )) : (
                <div className="px-6 py-8 text-center text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>Нет записей о диагнозах</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'medications' && (
          <div>
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium">Лекарственные препараты</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Препарат</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Дозировка</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Частота</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Врач</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Статус</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {medicalData.medications.length > 0 ? medicalData.medications.map((medication) => (
                    <tr key={medication.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{medication.name}</div>
                        <div className="text-sm text-gray-500">{medication.startDate} - {medication.endDate || 'продолжается'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {medication.dosage}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {medication.frequency}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {medication.prescribedBy}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(medication.status)}`}>
                          {getStatusText(medication.status)}
                        </span>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                        <Pill className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                        <p>Нет записей о назначенных препаратах</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div>
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium">Лабораторные анализы</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {medicalData.labTests.length > 0 ? medicalData.labTests.map((test) => (
                <div key={test.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="font-medium text-gray-900">{test.name}</div>
                        <div className="text-sm text-gray-500">{test.date}</div>
                      </div>
                      <div className="text-sm text-gray-600 mb-1">
                        <strong>Назначил:</strong> {test.doctor}
                      </div>
                      <div className="text-sm text-gray-900 bg-green-50 p-3 rounded-lg">
                        <strong>Результаты:</strong> {test.results}
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(test.status)}`}>
                      {getStatusText(test.status)}
                    </span>
                  </div>
                </div>
              )) : (
                <div className="px-6 py-8 text-center text-gray-500">
                  <Activity className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>Нет результатов лабораторных анализов</p>
                  <p className="text-sm mt-2">Результаты анализов будут отображаться здесь после их загрузки в систему</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MedicalHistory