import React from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

const MetricCard = ({
  title,
  value,
  change,
  trend,
  icon: Icon,
  color = 'blue',
  suffix = '',
  loading = false,
  onClick
}) => {
  const colorClasses = {
    blue: {
      bg: 'bg-blue-50',
      icon: 'text-blue-500',
      text: 'text-blue-600',
      border: 'border-blue-200'
    },
    green: {
      bg: 'bg-green-50',
      icon: 'text-green-500',
      text: 'text-green-600',
      border: 'border-green-200'
    },
    red: {
      bg: 'bg-red-50',
      icon: 'text-red-500',
      text: 'text-red-600',
      border: 'border-red-200'
    },
    yellow: {
      bg: 'bg-yellow-50',
      icon: 'text-yellow-500',
      text: 'text-yellow-600',
      border: 'border-yellow-200'
    },
    purple: {
      bg: 'bg-purple-50',
      icon: 'text-purple-500',
      text: 'text-purple-600',
      border: 'border-purple-200'
    },
    pink: {
      bg: 'bg-pink-50',
      icon: 'text-pink-500',
      text: 'text-pink-600',
      border: 'border-pink-200'
    },
    gray: {
      bg: 'bg-gray-50',
      icon: 'text-gray-500',
      text: 'text-gray-600',
      border: 'border-gray-200'
    }
  }

  const colors = colorClasses[color] || colorClasses.blue

  // Определяем отображаемое значение
  const displayValue = () => {
    if (loading) return '...'
    if (value === null || value === undefined) return '--'
    if (typeof value === 'number') {
      // Если это число, форматируем его
      return value.toLocaleString('ru-RU', { maximumFractionDigits: 1 })
    }
    return value
  }

  // Определяем цвет значения в зависимости от наличия данных
  const getValueColor = () => {
    if (loading) return 'text-gray-400'
    if (value === null || value === undefined || value === '--') return 'text-gray-400'
    return 'text-gray-900'
  }

  // Обработка тренда
  const renderTrend = () => {
    if (!trend) return null

    const { direction, value: trendValue } = trend

    let TrendIcon = Minus
    let trendColor = 'text-gray-500'

    if (direction === 'up') {
      TrendIcon = TrendingUp
      trendColor = 'text-green-500'
    } else if (direction === 'down') {
      TrendIcon = TrendingDown
      trendColor = 'text-red-500'
    }

    return (
      <div className="flex items-center mt-1">
        <TrendIcon className={`h-3 w-3 ${trendColor} mr-1`} />
        <span className={`text-xs font-medium ${trendColor}`}>
          {direction === 'stable' ? 'стабильно' : `${trendValue}%`}
        </span>
        <span className="text-xs text-gray-500 ml-1">
          {direction === 'stable' ? '' : 'за период'}
        </span>
      </div>
    )
  }

  // Обработка устаревшего параметра change (для обратной совместимости)
  const renderChange = () => {
    if (change === undefined || change === null) return null

    const isPositiveChange = change >= 0
    const hasChange = change !== undefined && change !== null

    if (!hasChange) return null

    return (
      <div className="flex items-center mt-1">
        {isPositiveChange ? (
          <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
        ) : (
          <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
        )}
        <span className={`text-xs font-medium ${
          isPositiveChange ? 'text-green-600' : 'text-red-600'
        }`}>
          {Math.abs(change)}%
        </span>
        <span className="text-xs text-gray-500 ml-1">
          за период
        </span>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="h-4 bg-gray-200 rounded w-24"></div>
            <div className="h-8 w-8 bg-gray-200 rounded"></div>
          </div>
          <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-20"></div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`bg-white rounded-lg shadow-sm border ${colors.border} p-6 transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:shadow-md hover:scale-105' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600 truncate">
          {title}
        </h3>
        <div className={`p-2 rounded-lg ${colors.bg}`}>
          <Icon className={`h-5 w-5 ${colors.icon}`} />
        </div>
      </div>

      <div className="flex items-end justify-between">
        <div className="flex-1">
          <div className={`text-2xl font-bold ${getValueColor()} transition-all duration-300`}>
            {displayValue()}
            {suffix && value !== null && value !== undefined && value !== '--' && (
              <span className="text-lg text-gray-500 ml-1">{suffix}</span>
            )}
          </div>

          {/* Показываем trend если есть, иначе change для обратной совместимости */}
          {trend ? renderTrend() : renderChange()}

          {/* Показываем статус данных */}
          {value === null || value === undefined || value === '--' ? (
            <div className="text-xs text-gray-400 mt-1">
              Нет данных
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default MetricCard