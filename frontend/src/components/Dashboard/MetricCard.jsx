import React from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown } from 'lucide-react'

const MetricCard = ({
  title,
  value,
  change,
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
      text: 'text-blue-600'
    },
    green: {
      bg: 'bg-green-50',
      icon: 'text-green-500',
      text: 'text-green-600'
    },
    red: {
      bg: 'bg-red-50',
      icon: 'text-red-500',
      text: 'text-red-600'
    },
    yellow: {
      bg: 'bg-yellow-50',
      icon: 'text-yellow-500',
      text: 'text-yellow-600'
    },
    purple: {
      bg: 'bg-purple-50',
      icon: 'text-purple-500',
      text: 'text-purple-600'
    },
    pink: {
      bg: 'bg-pink-50',
      icon: 'text-pink-500',
      text: 'text-pink-600'
    }
  }

  const colors = colorClasses[color] || colorClasses.blue
  const isPositiveChange = change >= 0
  const hasChange = change !== undefined && change !== null

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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${
        onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''
      }`}
      whileHover={onClick ? { scale: 1.02 } : {}}
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
        <div>
          <motion.div
            key={value}
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            className="text-2xl font-bold text-gray-900"
          >
            {typeof value === 'number' ? value.toLocaleString() : value}
            {suffix && <span className="text-lg text-gray-500 ml-1">{suffix}</span>}
          </motion.div>

          {hasChange && (
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
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default MetricCard