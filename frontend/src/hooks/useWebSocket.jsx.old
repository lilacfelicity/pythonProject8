import { useState, useEffect, useRef, useCallback } from 'react'

export const useWebSocket = (url, token = null) => {
  const [lastMessage, setLastMessage] = useState(null)
  const [readyState, setReadyState] = useState(WebSocket.CONNECTING)
  const ws = useRef(null)
  const reconnectTimeout = useRef(null)
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5

  const connect = useCallback(() => {
    try {
      // Добавляем токен к URL если он есть
      let wsUrl = url
      if (token) {
        const separator = url.includes('?') ? '&' : '?'
        wsUrl = `${url}${separator}token=${token}`
      }

      console.log('Connecting to WebSocket:', wsUrl.replace(/token=[^&]+/, 'token=***'))

      ws.current = new WebSocket(wsUrl)

      ws.current.onopen = () => {
        console.log('WebSocket connected successfully')
        setReadyState(WebSocket.OPEN)
        reconnectAttempts.current = 0

        // Отправляем ping для проверки соединения
        if (ws.current?.readyState === WebSocket.OPEN) {
          ws.current.send(JSON.stringify({
            type: 'get_status',
            timestamp: Date.now()
          }))
        }
      }

      ws.current.onclose = (event) => {
        console.log(`WebSocket disconnected: code=${event.code}, reason=${event.reason}`)
        setReadyState(WebSocket.CLOSED)

        // Reconnect logic с экспоненциальной задержкой
        if (reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000)
          console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current + 1}/${maxReconnectAttempts})`)

          reconnectTimeout.current = setTimeout(() => {
            reconnectAttempts.current++
            connect()
          }, delay)
        } else {
          console.warn('Max reconnection attempts reached')
        }
      }

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error)
        setReadyState(WebSocket.CLOSED)
      }

      ws.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          console.log('WebSocket message received:', message)
          setLastMessage({ data: event.data, timestamp: Date.now() })
        } catch (e) {
          console.warn('Failed to parse WebSocket message:', event.data)
          setLastMessage({ data: event.data, timestamp: Date.now() })
        }
      }
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error)
      setReadyState(WebSocket.CLOSED)
    }
  }, [url, token])

  // Подключение при монтировании и изменении URL/токена
  useEffect(() => {
    if (url) {
      connect()
    }

    // Ping каждые 30 секунд для поддержания соединения
    const pingInterval = setInterval(() => {
      if (ws.current?.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({
          type: 'ping',
          timestamp: Date.now()
        }))
      }
    }, 30000)

    return () => {
      clearInterval(pingInterval)
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current)
      }
      if (ws.current) {
        console.log('Closing WebSocket connection')
        ws.current.close(1000, 'Component unmounting')
      }
    }
  }, [connect])

  const sendMessage = useCallback((message) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      const messageStr = typeof message === 'string' ? message : JSON.stringify(message)
      console.log('Sending WebSocket message:', messageStr)
      ws.current.send(messageStr)
      return true
    } else {
      console.warn('WebSocket is not connected. ReadyState:', ws.current?.readyState)
      return false
    }
  }, [])

  const disconnect = useCallback(() => {
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current)
    }
    reconnectAttempts.current = maxReconnectAttempts // Prevent reconnection

    if (ws.current) {
      ws.current.close(1000, 'Manual disconnect')
    }
  }, [])

  const reconnect = useCallback(() => {
    disconnect()
    setTimeout(() => {
      reconnectAttempts.current = 0
      connect()
    }, 1000)
  }, [connect, disconnect])

  return {
    sendMessage,
    lastMessage,
    readyState,
    disconnect,
    reconnect,
    isConnected: readyState === WebSocket.OPEN,
    isConnecting: readyState === WebSocket.CONNECTING,
    connectionAttempts: reconnectAttempts.current
  }
}