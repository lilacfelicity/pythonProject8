import React, {useState} from 'react'
import { Menu, Bell, User } from 'lucide-react'
import Sidebar from './Sidebar.jsx'
import Profile from '../Profile.jsx'
const Header = ({ onToggleSidebar, user, onLogout, onShowProfile }) => {
  const [showUserMenu, setShowUserMenu] = useState(false)
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-4">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <h1 className="text-lg font-semibold text-gray-900">
              Медицинский мониторинг
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button className="relative p-2 text-gray-400 hover:text-gray-600 rounded-md transition-colors">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-400 ring-1 ring-white"></span>
          </button>

          <button className="flex items-center space-x-2 p-2 text-gray-400 hover:text-gray-600 rounded-md transition-colors">
            <User className="h-5 w-5" />
            <span className="hidden sm:block text-sm font-medium text-gray-700">
              Профиль
            </span>
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header