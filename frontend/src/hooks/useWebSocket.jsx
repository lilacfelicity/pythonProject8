import { useState, useEffect, useRef, useCallback } from 'react'

export const useWebSocket = (url) => {
  const [lastMessage, setLastMessage] = useState(null)
  const [readyState, setReadyState] = useState(WebSocket.CONNECTING)
  const ws = useRef(null)
  const reconnectTimeout = useRef(null)
  const reconnectAttempts = useRef(0)

  const connect = useCallback(() => {
    try {
      ws.current = new WebSocket(url)

      ws.current.onopen = () => {
        console.log('WebSocket connected')
        setReadyState(WebSocket.OPEN)
        reconnectAttempts.current = 0
      }

      ws.current.onclose = () => {
        console.log('WebSocket disconnected')
        setReadyState(WebSocket.CLOSED)

        // Reconnect logic
        if (reconnectAttempts.current < 5) {
          const timeout = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000)
          reconnectTimeout.current = setTimeout(() => {
            reconnectAttempts.current++
            connect()
          }, timeout)
        }
      }

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error)
        setReadyState(WebSocket.CLOSED)
      }

      ws.current.onmessage = (event) => {
        setLastMessage(event)
      }
    } catch (error) {
      console.error('Failed to connect WebSocket:', error)
    }
  }, [url])

  useEffect(() => {
    connect()

    // Send ping every 30 seconds to keep connection alive
    const pingInterval = setInterval(() => {
      if (ws.current?.readyState === WebSocket.OPEN) {
        ws.current.send('ping')
      }
    }, 30000)

    return () => {
      clearInterval(pingInterval)
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current)
      }
      if (ws.current) {
        ws.current.close()
      }
    }
  }, [connect])

  const sendMessage = useCallback((message) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(message)
    }
  }, [])

  return {
    sendMessage,
    lastMessage,
    readyState
  }
}