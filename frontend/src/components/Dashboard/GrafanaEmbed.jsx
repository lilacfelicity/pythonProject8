import React, { useState, useEffect, useRef } from 'react'
import { ExternalLink, RefreshCw, AlertCircle, Maximize2, Minimize2 } from 'lucide-react'

const GrafanaEmbed = ({
  dashboardId,
  panelId,
  width = '100%',
  height = '400px',
  timeRange = 'now-1h',
  refresh = 0,
  theme = 'light',
  showControls = true,
  orgId = 1
}) => {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [embedUrl, setEmbedUrl] = useState('')
  const iframeRef = useRef(null)
  const containerRef = useRef(null)

  // Базовый URL Grafana
  const GRAFANA_BASE_URL = import.meta.env.VITE_GRAFANA_URL || 'http://localhost:3001'

  // Построение URL для встраивания
  const buildEmbedUrl = () => {
    if (!dashboardId) return ''

    // Базовый URL для панели
    let url = `${GRAFANA_BASE_URL}/d/${dashboardId}/${dashboardId}`

    // Параметры запроса
    const params = new URLSearchParams({
      'orgId': orgId,
      'from': getFromTimestamp(timeRange),
      'to': 'now',
      'panelId': panelId,
      'theme': theme,
      'kiosk': 'true',
      'refresh': '30s',
      '_t': Date.now() // Принудительное обновление
    })

    return `${url}?${params.toString()}`
  }

  // Конвертация временного диапазона в timestamp
  const getFromTimestamp = (range) => {
    const now = Date.now()
    const ranges = {
      'now-5m': 'now-5m',
      'now-15m': 'now-15m',
      'now-30m': 'now-30m',
      'now-1h': 'now-1h',
      'now-6h': 'now-6h',
      'now-12h': 'now-12h',
      'now-24h': 'now-24h',
      'now-7d': 'now-7d',
      'now-30d': 'now-30d'
    }
    return ranges[range] || 'now-1h'
  }

  // Инициализация URL
  useEffect(() => {
    const url = buildEmbedUrl()
    setEmbedUrl(url)
  }, [dashboardId, panelId, timeRange, theme, orgId])

  // Обновление при изменении refresh prop
  useEffect(() => {
    if (refresh > 0 && embedUrl) {
      setIsLoading(true)
      setHasError(false)
      const newUrl = buildEmbedUrl()
      setEmbedUrl(newUrl)
    }
  }, [refresh])

  // Обработка загрузки iframe
  const handleIframeLoad = () => {
    setIsLoading(false)
    setHasError(false)
  }

  // Обработка ошибок загрузки
  const handleIframeError = () => {
    setIsLoading(false)
    setHasError(true)
  }

  // Обработка полноэкранного режима
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  // Слушатель изменения полноэкранного режима
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  // Открытие в новой вкладке
  const openInNewTab = () => {
    const fullUrl = `${GRAFANA_BASE_URL}/d/${dashboardId}/${dashboardId}?panelId=${panelId}&from=${getFromTimestamp(timeRange)}&to=now&orgId=${orgId}`
    window.open(fullUrl, '_blank')
  }

  // Обновление дашборда
  const refreshDashboard = () => {
    setIsLoading(true)
    setHasError(false)
    const newUrl = buildEmbedUrl()
    setEmbedUrl(newUrl)
  }

  if (hasError) {
    return (
      <div
        ref={containerRef}
        className="flex flex-col items-center justify-center bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg relative"
        style={{ height: isFullscreen ? '100vh' : height }}
      >
        <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Ошибка загрузки дашборда
        </h3>
        <p className="text-sm text-gray-500 mb-4 text-center max-w-sm">
          Не удалось загрузить дашборд Grafana. Проверьте подключение к серверу.
        </p>
        <div className="text-xs text-gray-400 mb-4 font-mono bg-gray-100 p-2 rounded">
          {embedUrl}
        </div>
        <div className="flex space-x-3">
          <button
            onClick={refreshDashboard}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Повторить</span>
          </button>
          <button
            onClick={openInNewTab}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            <span>Открыть в Grafana</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="relative"
      style={{ height: isFullscreen ? '100vh' : 'auto' }}
    >
      {/* Loading overlay */}
      {isLoading && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 z-10 rounded-lg"
          style={{ height: isFullscreen ? '100vh' : height }}
        >
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-sm text-gray-600">Загрузка дашборда Grafana...</p>
          </div>
        </div>
      )}

      {/* Controls */}
      {showControls && (
        <div className="absolute top-2 right-2 z-20 flex space-x-1">
          <button
            onClick={refreshDashboard}
            className="p-1.5 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-md shadow-sm border border-gray-200 text-gray-600 hover:text-gray-900 transition-colors"
            title="Обновить дашборд"
          >
            <RefreshCw className="h-4 w-4" />
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-1.5 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-md shadow-sm border border-gray-200 text-gray-600 hover:text-gray-900 transition-colors"
            title={isFullscreen ? "Выйти из полноэкранного режима" : "Полноэкранный режим"}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>

          <button
            onClick={openInNewTab}
            className="p-1.5 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-md shadow-sm border border-gray-200 text-gray-600 hover:text-gray-900 transition-colors"
            title="Открыть в Grafana"
          >
            <ExternalLink className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Iframe */}
      {embedUrl && (
        <iframe
          ref={iframeRef}
          src={embedUrl}
          width={width}
          height={isFullscreen ? '100vh' : height}
          frameBorder="0"
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          className="rounded-lg w-full"
          allowFullScreen
          sandbox="allow-scripts allow-same-origin allow-forms"
        />
      )}
    </div>
  )
}

export default GrafanaEmbed