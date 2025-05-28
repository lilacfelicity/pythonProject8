import React, { useState } from 'react'
import { FileText, Calendar, User, Pill, Activity, Download, Filter, Search, Plus } from 'lucide-react'

const MedicalHistory = ({ user }) => {
  const [activeTab, setActiveTab] = useState('visits')
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState('all')

  // Расширенные тестовые данные
  const medicalData = {
    visits: [
      {
        id: 1,
        date: "02.05.2025",
        doctor: "Сидорова Анна Владимировна",
        specialty: "Терапевт",
        diagnosis: "Первичный визит",
        notes: "Пациентка обратилась для профилактического осмотра. Жалоб не предъявляет.",
        status: "completed"
      },
      {
        id: 2,
        date: "15.10.2024",
        doctor: "Петрова Наталья Ивановна",
        specialty: "Аллерголог",
        diagnosis: "Аллергический ринит",
        notes: "Обострение сезонного аллергического ринита. Назначена поддерживающая терапия.",
        status: "monitoring"
      },
      {
        id: 3,
        date: "12.07.2024",
        doctor: "Сидорова Анна Владимировна",
        specialty: "Терапевт",
        diagnosis: "ОРЗ",
        notes: "Острое респираторное заболевание, легкая форма. Полное выздоровление.",
        status: "resolved"
      }
    ],
    diagnoses: [
      {
        id: 1,
        date: "10.02.2025",
        doctor: "Петрова Наталья Ивановна",
        specialty: "Терапевт",
        diagnosis: "Гипертоническая болезнь 1 степени",
        icd10: "I10",
        status: "active",
        notes: "Поставлен диагноз 'Гипертоническая болезнь 1 степени'. Назначено амбулаторное лечение."
      },
      {
        id: 2,
        date: "16.10.2024",
        doctor: "Петрова Наталья Ивановна",
        specialty: "Аллерголог",
        diagnosis: "Аллергический ринит",
        icd10: "J30.1",
        status: "chronic",
        notes: "Аллергический ринит в стадии ремиссии. Поддерживающая терапия."
      }
    ],
    medications: [
      {
        id: 1,
        name: "Омепразол",
        dosage: "20мг",
        frequency: "1 раз в день утром",
        startDate: "01.03.2025",
        endDate: null,
        prescribedBy: "Петрова Наталья Ивановна",
        status: "active",
        notes: "Принимать за 30 минут до еды"
      },
      {
        id: 2,
        name: "Анальгин",
        dosage: "500мг",
        frequency: "При болях, не более 3 раз в день",
        startDate: "15.02.2025",
        endDate: null,
        prescribedBy: "Сидорова Анна Владимировна",
        status: "as_needed",
        notes: "При головной боли или мышечных болях"
      },
      {
        id: 3,
        name: "Лоратадин",
        dosage: "10мг",
        frequency: "1 раз в день",
        startDate: "10.02.2025",
        endDate: "10.05.2025",
        prescribedBy: "Петрова Наталья Ивановна",
        status: "completed",
        notes: "Курс противоаллергической терапии"
      }
    ],
    labTests: [
      {
        id: 1,
        date: "25.04.2025",
        name: "Общий анализ крови",
        doctor: "Петрова Наталья Ивановна",
        results: "В пределах нормы",
        status: "completed"
      },
      {
        id: 2,
        date: "25.04.2025",
        name: "Биохимический анализ крови",
        doctor: "Петрова Наталья Ивановна",
        results: "Глюкоза 5.2 ммоль/л (норма), холестерин 4.8 ммоль/л (норма)",
        status: "completed"
      }
    ]
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">История болезни</h1>
          <p className="text-gray-600 mt-1">
            Полная медицинская карта • {user?.fullName || 'Пациент'}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Download className="h-4 w-4" />
            <span>Экспорт</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            <Plus className="h-4 w-4" />
            <span>Добавить</span>
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
            <span>Всего записей: {medicalData.visits.length + medicalData.diagnoses.length + medicalData.medications.length}</span>
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
              {medicalData.visits.map((visit) => (
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
              ))}
            </div>
          </div>
        )}

        {activeTab === 'diagnoses' && (
          <div>
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium">Диагнозы</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {medicalData.diagnoses.map((diagnosis) => (
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
              ))}
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
                  {medicalData.medications.map((medication) => (
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
                  ))}
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
              {medicalData.labTests.map((test) => (
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
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MedicalHistory
