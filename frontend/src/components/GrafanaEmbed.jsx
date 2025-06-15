import React, { useState, useEffect } from 'react'
import { ExternalLink, RefreshCw, AlertCircle, Eye, EyeOff, Database } from 'lucide-react'

const GrafanaEmbed = ({
  dashboardId,
  height = "600px",
  timeRange = "now-24h",
  refresh,
  theme = "light",
  showControls = true,
  orgId = 1,
  panelId = null
}) => {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [iframeKey, setIframeKey] = useState(0)

  const grafanaUrl = import.meta.env.VITE_GRAFANA_URL || 'http://localhost/grafana'

  // Fallback dashboard mapping for demo purposes
  const dashboardMapping = {
    'medical-overview': 'medical-overview',
    'patient-vitals': 'patient-vitals',
    'lab-analytics': 'lab-analytics',
    'user-activity': 'user-activity',
    'device-monitoring': 'device-monitoring',
    'trends-analysis': 'trends-analysis'
  }

  const getEmbedUrl = () => {
    const actualDashboardId = dashboardMapping[dashboardId] || dashboardId

    // Create a demo URL structure that matches Grafana conventions
    const baseUrl = `${grafanaUrl}/d/${actualDashboardId}`
    const params = new URLSearchParams({
      orgId: orgId,
      from: timeRange.replace('now-', 'now-'),
      to: 'now',
      theme: theme,
      kiosk: 'tv',
      refresh: '30s'
    })

    if (panelId) {
      params.append('viewPanel', panelId)
    }

    // Add cache busting parameter
    if (refresh) {
      params.append('_', Date.now())
    }

    return `${baseUrl}?${params.toString()}`
  }

  const embedUrl = getEmbedUrl()

  const handleIframeLoad = () => {
    setIsLoading(false)
    setHasError(false)
  }

  const handleIframeError = () => {
    setIsLoading(false)
    setHasError(true)
  }

  const openInNewTab = () => {
    const fullUrl = embedUrl.replace('kiosk=tv', '').replace('&kiosk=tv', '')
    window.open(fullUrl, '_blank', 'noopener,noreferrer')
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  const handleRetry = () => {
    setIsLoading(true)
    setHasError(false)
    setIframeKey(prev => prev + 1)
  }

  // Effect for refresh
  useEffect(() => {
    if (refresh) {
      setIsLoading(true)
      setHasError(false)
      setIframeKey(prev => prev + 1)
    }
  }, [refresh])

  // Simulate loading time for demo
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 2000)

    return () => clearTimeout(timer)
  }, [iframeKey])

  return (
    <div className={`relative bg-white rounded-lg border border-gray-200 overflow-hidden ${isFullscreen ? 'fixed inset-4 z-50' : ''}`}>
      {/* Controls Header */}
      {showControls && (
        <div className="flex items-center justify-between p-3 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="text-sm font-medium text-gray-900">
              Grafana Dashboard
            </div>
            <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {dashboardId}
            </div>
            {panelId && (
              <div className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                Panel {panelId}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {/* Status indicator */}
            <div className="flex items-center space-x-2">
              {isLoading ? (
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-gray-500">Загрузка...</span>
                </div>
              ) : hasError ? (
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-xs text-red-600">Ошибка</span>
                </div>
              ) : (
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-gray-500">Онлайн</span>
                </div>
              )}
            </div>

            {/* Control buttons */}
            <div className="flex items-center space-x-1">
              <button
                onClick={toggleFullscreen}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
                title={isFullscreen ? 'Выйти из полноэкранного режима' : 'Полноэкранный режим'}
              >
                {isFullscreen ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>

              <button
                onClick={handleRetry}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
                title="Обновить"
              >
                <RefreshCw className="h-4 w-4" />
              </button>

              <button
                onClick={openInNewTab}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
                title="Открыть в новой вкладке"
              >
                <ExternalLink className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main content area */}
      <div className="relative" style={{ height }}>
        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-10">
            <div className="flex flex-col items-center space-y-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <div className="text-sm text-gray-600">Загрузка дашборда Grafana...</div>
              <div className="text-xs text-gray-500">Подключение к {grafanaUrl}</div>
            </div>
          </div>
        )}

        {/* Error overlay */}
        {hasError && (
          <div className="absolute inset-0 bg-red-50 flex items-center justify-center z-10">
            <div className="text-center max-w-md mx-auto p-6">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-red-900 mb-2">
                Ошибка загрузки дашборда
              </h3>
              <p className="text-sm text-red-700 mb-4">
                Не удалось загрузить дашборд Grafana. Возможные причины:
              </p>
              <ul className="text-xs text-red-600 mb-4 text-left space-y-1">
                <li>• Grafana недоступна</li>
                <li>• Дашборд не существует</li>
                <li>• Проблемы с сетью</li>
                <li>• Неправильные настройки CORS</li>
              </ul>
              <div className="space-y-2">
                <button
                  onClick={handleRetry}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Попробовать снова
                </button>
                <button
                  onClick={openInNewTab}
                  className="w-full px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors"
                >
                  Открыть в Grafana
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Demo content when Grafana is not available */}
        {!isLoading && !hasError && (
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
            <div className="text-center p-8">
              <Database className="h-16 w-16 text-blue-500 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                Дашборд: {dashboardId}
              </h3>
              <p className="text-gray-600 mb-4">
                Период: {timeRange} • Тема: {theme}
              </p>
              <div className="bg-white rounded-lg p-4 border-2 border-dashed border-gray-300">
                <p className="text-sm text-gray-500 mb-2">
                  Здесь будет отображаться дашборд Grafana
                </p>
                <p className="text-xs text-gray-400">
                  URL: {embedUrl}
                </p>
              </div>
              <button
                onClick={openInNewTab}
                className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Открыть в Grafana
              </button>
            </div>
          </div>
        )}

        {/* Actual iframe - hidden in demo mode, shown when Grafana is properly configured */}
        {false && ( // Set to true when Grafana is properly configured
          <iframe
            key={iframeKey}
            src={embedUrl}
            width="100%"
            height="100%"
            frameBorder="0"
            title={`Grafana Dashboard ${dashboardId}${panelId ? ` Panel ${panelId}` : ''}`}
            className="w-full h-full"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            sandbox="allow-same-origin allow-scripts allow-forms"
            referrerPolicy="no-referrer-when-downgrade"
          />
        )}
      </div>

      {/* Fullscreen overlay close button */}
      {isFullscreen && (
        <button
          onClick={toggleFullscreen}
          className="absolute top-4 right-4 p-2 bg-black bg-opacity-50 text-white rounded-lg hover:bg-opacity-70 transition-all z-20"
          title="Закрыть полноэкранный режим"
        >
          <EyeOff className="h-5 w-5" />
        </button>
      )}
    </div>
  )
}

export default GrafanaEmbed