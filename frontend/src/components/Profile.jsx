import React, { useState } from 'react'
import { User, Edit3, Save, X, Phone, Mail, Calendar, Heart, Activity, AlertCircle, Shield, Camera } from 'lucide-react'

const Profile = ({ user, compact = false }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    firstName: user?.profile?.firstName || '',
    lastName: user?.profile?.lastName || '',
    patronymic: user?.profile?.patronymic || '',
    phone: user?.profile?.phone || '',
    email: user?.email || '',
    bloodType: user?.profile?.bloodType || '',
    height: user?.profile?.height || '',
    weight: user?.profile?.weight || '',
    allergies: user?.profile?.allergies || '',
    chronicConditions: user?.profile?.chronicConditions || '',
    emergencyContact: user?.profile?.emergencyContact || ''
  })

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSave = () => {
    console.log('Saving profile data:', formData)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setFormData({
      firstName: user?.profile?.firstName || '',
      lastName: user?.profile?.lastName || '',
      patronymic: user?.profile?.patronymic || '',
      phone: user?.profile?.phone || '',
      email: user?.email || '',
      bloodType: user?.profile?.bloodType || '',
      height: user?.profile?.height || '',
      weight: user?.profile?.weight || '',
      allergies: user?.profile?.allergies || '',
      chronicConditions: user?.profile?.chronicConditions || '',
      emergencyContact: user?.profile?.emergencyContact || ''
    })
    setIsEditing(false)
  }

  if (compact) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Мой профиль</h2>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Edit3 className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-start space-x-4">
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <User className="h-8 w-8 text-white" />
            </div>
            <button className="absolute -bottom-1 -right-1 p-1 bg-white border border-gray-300 rounded-full hover:bg-gray-50 transition-colors">
              <Camera className="h-3 w-3 text-gray-600" />
            </button>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-medium text-gray-900 truncate">
              {user?.fullName || 'Имя не указано'}
            </h3>
            <div className="flex items-center text-sm text-gray-500 mt-1">
              <Calendar className="h-4 w-4 mr-1" />
              <span>{user?.birthDate || 'Дата рождения не указана'} (24 года)</span>
            </div>
            <div className="flex items-center text-sm text-gray-500 mt-1">
              <Heart className="h-4 w-4 mr-1" />
              <span>Группа крови: {user?.profile?.bloodType || 'Не указана'}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-lg font-semibold text-blue-600">{user?.profile?.height || '--'}</div>
            <div className="text-xs text-gray-600">Рост (см)</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-lg font-semibold text-green-600">{user?.profile?.weight || '--'}</div>
            <div className="text-xs text-gray-600">Вес (кг)</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Мой профиль</h1>
          <p className="text-gray-600 mt-1">Управление личными данными и настройками</p>
        </div>

        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Edit3 className="h-4 w-4" />
            <span>Редактировать профиль</span>
          </button>
        ) : (
          <div className="flex space-x-2">
            <button
              onClick={handleSave}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Save className="h-4 w-4" />
              <span>Сохранить</span>
            </button>
            <button
              onClick={handleCancel}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <X className="h-4 w-4" />
              <span>Отмена</span>
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Основная информация</h2>

            <div className="space-y-6">
              <div className="flex items-center space-x-6">
                <div className="relative">
                  <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <User className="h-12 w-12 text-white" />
                  </div>
                  <button className="absolute -bottom-2 -right-2 p-2 bg-white border-2 border-gray-300 rounded-full hover:bg-gray-50 transition-colors shadow-sm">
                    <Camera className="h-4 w-4 text-gray-600" />
                  </button>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900">Фото профиля</h3>
                  <p className="text-sm text-gray-500 mt-1">Загрузите ваше фото для персонализации профиля</p>
                  <button className="mt-2 text-sm text-blue-600 hover:text-blue-700">
                    Изменить фото
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Имя</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <div className="py-2 text-gray-900">{user?.profile?.firstName || 'Не указано'}</div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Фамилия</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <div className="py-2 text-gray-900">{user?.profile?.lastName || 'Не указано'}</div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Отчество</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="patronymic"
                    value={formData.patronymic}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <div className="py-2 text-gray-900">{user?.profile?.patronymic || 'Не указано'}</div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Телефон</label>
                  {isEditing ? (
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <div className="py-2 text-gray-900 flex items-center">
                      <Phone className="h-4 w-4 text-gray-400 mr-2" />
                      {user?.profile?.phone || 'Не указано'}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  {isEditing ? (
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <div className="py-2 text-gray-900 flex items-center">
                      <Mail className="h-4 w-4 text-gray-400 mr-2" />
                      {user?.email || 'Не указано'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 mt-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Медицинская информация</h2>

            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Рост (см)</label>
                  {isEditing ? (
                    <input
                      type="number"
                      name="height"
                      value={formData.height}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <div className="py-2 text-gray-900">{user?.profile?.height || 'Не указано'}</div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Вес (кг)</label>
                  {isEditing ? (
                    <input
                      type="number"
                      name="weight"
                      value={formData.weight}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <div className="py-2 text-gray-900">{user?.profile?.weight || 'Не указано'}</div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Группа крови</label>
                  {isEditing ? (
                    <select
                      name="bloodType"
                      value={formData.bloodType}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Выберите</option>
                      <option value="O(I) Rh-">O(I) Rh-</option>
                      <option value="O(I) Rh+">O(I) Rh+</option>
                      <option value="A(II) Rh-">A(II) Rh-</option>
                      <option value="A(II) Rh+">A(II) Rh+</option>
                      <option value="B(III) Rh-">B(III) Rh-</option>
                      <option value="B(III) Rh+">B(III) Rh+</option>
                      <option value="AB(IV) Rh-">AB(IV) Rh-</option>
                      <option value="AB(IV) Rh+">AB(IV) Rh+</option>
                    </select>
                  ) : (
                    <div className="py-2 text-gray-900 flex items-center">
                      <Heart className="h-4 w-4 text-red-400 mr-2" />
                      {user?.profile?.bloodType || 'Не указано'}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Аллергии</label>
                {isEditing ? (
                  <textarea
                    name="allergies"
                    value={formData.allergies}
                    onChange={handleChange}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Укажите известные аллергии..."
                  />
                ) : (
                  <div className="py-2 text-gray-900 bg-orange-50 p-3 rounded-lg">
                    {user?.profile?.allergies || 'Не указано'}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Хронические заболевания</label>
                {isEditing ? (
                  <textarea
                    name="chronicConditions"
                    value={formData.chronicConditions}
                    onChange={handleChange}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Укажите хронические заболевания..."
                  />
                ) : (
                  <div className="py-2 text-gray-900">
                    {user?.profile?.chronicConditions || 'Не указано'}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Экстренный контакт</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="emergencyContact"
                    value={formData.emergencyContact}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Имя и телефон экстренного контакта"
                  />
                ) : (
                  <div className="py-2 text-gray-900 flex items-center">
                    <AlertCircle className="h-4 w-4 text-red-400 mr-2" />
                    {user?.profile?.emergencyContact || 'Не указано'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Статистика профиля</h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Заполненность профиля</span>
                <span className="text-sm font-medium text-gray-900">85%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full" style={{ width: '85%' }}></div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Последнее обновление</span>
                <span className="text-sm text-gray-500">2 дня назад</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Подключенных устройств</span>
                <span className="text-sm font-medium text-green-600">{user?.devices?.length || 0}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Shield className="h-5 w-5 text-green-500 mr-2" />
              Безопасность
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-900">Двухфакторная аутентификация</div>
                  <div className="text-xs text-gray-500">Дополнительная защита аккаунта</div>
                </div>
                <button className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-full">
                  Включена
                </button>
              </div>

              <button className="w-full text-left text-sm text-gray-600 hover:text-gray-900 py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors">
                История входов в систему
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Быстрые действия</h3>

            <div className="space-y-2">
              <button className="w-full text-left flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <Activity className="h-4 w-4 text-blue-500" />
                <span className="text-sm text-gray-700">Экспорт медицинских данных</span>
              </button>

              <button className="w-full text-left flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <User className="h-4 w-4 text-green-500" />
                <span className="text-sm text-gray-700">Поделиться профилем с врачом</span>
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Информация об аккаунте</h3>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">ID пациента:</span>
                <span className="font-mono text-gray-900">#{user?.id || '12345'}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Дата регистрации:</span>
                <span className="text-gray-900">15.01.2025</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Статус аккаунта:</span>
                <span className="text-green-600 font-medium">Активен</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
export default Profile
