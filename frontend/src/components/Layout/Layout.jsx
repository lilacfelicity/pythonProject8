import React, { useState } from 'react'
import { Home, Activity, User, FileText, BarChart3, Settings, LogOut, Menu, X, Heart, Wifi, WifiOff, ChevronDown, Stethoscope, TrendingUp } from 'lucide-react'

const Layout = ({ children, user, onLogout, currentView, onViewChange }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false)

  const menuItems = [
    { id: 'main', name: 'Главная', icon: Home, description: 'Добро пожаловать и обзор системы' },
    { id: 'dashboard', name: 'Мониторинг', icon: Activity, description: 'Показатели в реальном времени' },
    {
      id: 'analytics',
      name: 'Аналитика',
      icon: BarChart3,
      description: 'Лабораторные данные и интерактивные дашборды',
      isNew: true // Помечаем как обновленный раздел
    },
    { id: 'history', name: 'История', icon: FileText, description: 'Медицинская карта и история болезни' },
    { id: 'profile', name: 'Профиль', icon: User, description: 'Личные данные и настройки' },
    { id: 'devices', name: 'Устройства', icon: Stethoscope, description: 'Подключенные медицинские устройства' },
    { id: 'settings', name: 'Настройки', icon: Settings, description: 'Настройки системы' }
  ]

  const handleMenuClick = (viewId) => {
    onViewChange(viewId)
    setIsMobileMenuOpen(false)
  }

  const handleLogout = () => {
    setIsProfileDropdownOpen(false)
    onLogout()
  }

  const getCurrentPageInfo = () => {
    const currentItem = menuItems.find(item => item.id === currentView)
    return currentItem || { name: 'Система', description: 'Медицинский мониторинг' }
  }

  const currentPageInfo = getCurrentPageInfo()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and brand */}
            <div className="flex items-center">
              <div className="flex items-center space-x-3">
                <Heart className="h-8 w-8 text-red-500" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">MedMonitor</h1>
                  <p className="text-xs text-gray-500 hidden sm:block">Система медицинского мониторинга</p>
                </div>
              </div>
            </div>

            {/* Current page info - показываем на средних экранах */}
            <div className="hidden md:block lg:hidden">
              <div className="text-center">
                <h2 className="text-sm font-medium text-gray-900">{currentPageInfo.name}</h2>
                <p className="text-xs text-gray-500">{currentPageInfo.description}</p>
              </div>
            </div>

            {/* Desktop navigation */}
            <nav className="hidden lg:flex space-x-1">
              {menuItems.map((item) => {
                const Icon = item.icon
                return (
                  <div key={item.id} className="relative">
                    <button
                      onClick={() => handleMenuClick(item.id)}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 group ${
                        currentView === item.id
                          ? 'bg-blue-100 text-blue-700 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.name}</span>
                      {item.isNew && (
                        <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                          NEW
                        </span>
                      )}
                    </button>

                    {/* Tooltip на hover */}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                      {item.description}
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-b-gray-900"></div>
                    </div>
                  </div>
                )
              })}
            </nav>

            {/* Right section */}
            <div className="flex items-center space-x-4">
              {/* Connection status */}
              <div className="hidden sm:flex items-center space-x-2">
                <Wifi className="h-4 w-4 text-green-500" />
                <span className="text-xs text-gray-600">Подключено</span>
              </div>

              {/* User profile dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors group"
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">
                      {user?.profile?.firstName?.charAt(0) || user?.fullName?.charAt(0) || 'П'}
                    </span>
                  </div>
                  <div className="hidden md:block text-left">
                    <div className="text-sm font-medium text-gray-900">
                      {user?.profile?.firstName || user?.fullName || 'Пользователь'}
                    </div>
                    <div className="text-xs text-gray-500">ID: #{user?.id || '1'}</div>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${isProfileDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isProfileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-200">
                      <div className="text-sm font-medium text-gray-900">
                        {user?.fullName || 'Пользователь'}
                      </div>
                      <div className="text-xs text-gray-500">{user?.email}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        Последний вход: {new Date().toLocaleDateString('ru-RU')}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        handleMenuClick('profile')
                        setIsProfileDropdownOpen(false)
                      }}
                      className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <User className="h-4 w-4" />
                      <span>Мой профиль</span>
                    </button>

                    <button
                      onClick={() => {
                        handleMenuClick('settings')
                        setIsProfileDropdownOpen(false)
                      }}
                      className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <Settings className="h-4 w-4" />
                      <span>Настройки</span>
                    </button>

                    <div className="border-t border-gray-200 mt-2 pt-2">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Выйти из системы</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile menu button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-gray-200 shadow-lg">
            <div className="px-2 pt-2 pb-3 space-y-1 max-h-96 overflow-y-auto">
              {menuItems.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.id}
                    onClick={() => handleMenuClick(item.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-3 rounded-md text-base font-medium transition-colors relative ${
                      currentView === item.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    <div className="flex-1 text-left">
                      <div className="flex items-center">
                        <span>{item.name}</span>
                        {item.isNew && (
                          <span className="ml-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                            NEW
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {item.description}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </header>

      {/* Page title breadcrumb - показываем на больших экранах */}
      <div className="hidden lg:block bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center space-x-2 text-sm">
            <span className="text-gray-500">Медицинский мониторинг</span>
            <span className="text-gray-300">/</span>
            <span className="text-gray-900 font-medium">{currentPageInfo.name}</span>
            {currentPageInfo.isNew && (
              <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">
                Обновлено
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">{currentPageInfo.description}</p>
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span>© 2025 MedMonitor System</span>
              <span>•</span>
              <span>Версия 2.0.0</span>
              <span>•</span>
              <span className="flex items-center space-x-1">
                <Heart className="h-3 w-3 text-red-500" />
                <span>Система медицинского мониторинга</span>
              </span>
            </div>
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Система работает</span>
              </div>
              <div className="text-xs text-gray-500">
                Пациент: {user?.fullName || 'Неизвестен'}
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Click outside handler for dropdown */}
      {isProfileDropdownOpen && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setIsProfileDropdownOpen(false)}
        ></div>
      )}
    </div>
  )
}

export default Layout