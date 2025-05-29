import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  Menu, Bell, User, LogOut, Settings, ChevronDown, Heart, Activity,
  LayoutDashboard, FileText, Users, BarChart3, X
} from 'lucide-react'
import Profile from '../Profile.jsx'
import Header from "./Header.jsx";

// Обновленный Sidebar компонент
const Sidebar = ({ mobile, onClose, user }) => {
  const navigation = [
    { name: 'Главная', href: '/main', icon: Activity },
    { name: 'Мониторинг', href: '/dashboard', icon: LayoutDashboard },
    { name: 'История болезни', href: '/history', icon: FileText },
    { name: 'Устройства', href: '/devices', icon: Activity },
    { name: 'Аналитика', href: '/analytics', icon: BarChart3 },
    { name: 'Настройки', href: '/settings', icon: Settings },
  ]

  return (
    <div className="flex flex-col bg-white shadow-xl border-r border-gray-200 w-full">
      {/* Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Heart className="h-8 w-8 text-red-500 animate-pulse" />
          <h1 className="text-xl font-bold bg-gradient-to-r from-red-500 to-blue-600 bg-clip-text text-transparent">
            MedMonitor
          </h1>
        </div>

        {mobile && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* User info */}
      {user && (
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <User className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user.fullName || 'Пользователь'}
              </p>
              <p className="text-xs text-gray-500">
                ID: #{user.id || '1'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              `group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-500 shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <item.icon className="flex-shrink-0 h-5 w-5 mr-3" />
            {item.name}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-200 p-4">
        <div className="text-xs text-gray-500 text-center">
          <p>Medical IoT System</p>
          <p>v2.0.0 DEV</p>
        </div>
      </div>
    </div>
  )
}
export default Sidebar;