import { useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { Message, Task } from "@/types";

interface UseWebSocketProps {
  onTaskUpdate?: (task: Task) => void;
  onNewMessage?: (message: Message) => void;
  onTaskCreated?: (task: Task) => void;
  onTaskDeleted?: (taskId: string) => void;
}

export function useWebSocket({
  onTaskUpdate,
  onNewMessage,
  onTaskCreated,
  onTaskDeleted,
}: UseWebSocketProps = {}) {
  const socketRef = useRef<Socket | null>(null);
  const currentTaskIdRef = useRef<string | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 10;
  const healthCheckInterval = useRef<NodeJS.Timeout | null>(null);

  // Exponential backoff for reconnection delays
  const getExponentialBackoff = useCallback((attempt: number) => {
    return Math.min(1000 * Math.pow(2, attempt), 30000); // Max 30 seconds
  }, []);

  const connect = useCallback(() => {
    if (socketRef.current?.connected) {
      return socketRef.current;
    }

    // Connect to the WebSocket server with optimized configuration
    const socket = io({
      path: "/api/proxy/tasks",
      transports: ["websocket", "polling"], // Fallback to polling
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: maxReconnectAttempts,
      reconnectionDelay: getExponentialBackoff(reconnectAttempts.current),
      reconnectionDelayMax: 30000,
      timeout: 20000,
      forceNew: true,
      // Add compression for better performance
      perMessageDeflate: {
        zlibDeflateOptions: {
          level: 3,
        },
      },
    });

    socket.on("connect", () => {
      reconnectAttempts.current = 0; // Reset reconnection attempts on successful connect
      console.log("Connected to WebSocket server");

      // Start health monitoring
      healthCheckInterval.current = setInterval(() => {
        if (socket.connected) {
          socket.emit('ping');
        }
      }, 30000); // Ping every 30 seconds
    });

    socket.on("disconnect", (reason) => {
      reconnectAttempts.current++;
      console.log(`Disconnected from WebSocket server: ${reason}. Attempt ${reconnectAttempts.current}/${maxReconnectAttempts}`);

      // Clear health check interval
      if (healthCheckInterval.current) {
        clearInterval(healthCheckInterval.current);
        healthCheckInterval.current = null;
      }
    });

    socket.on("connect_error", (error) => {
      console.error("WebSocket connection error:", error.message);
    });

    socket.on("task_updated", (task: Task) => {
      onTaskUpdate?.(task);
    });

    socket.on("new_message", (message: Message) => {
      onNewMessage?.(message);
    });

    socket.on("task_created", (task: Task) => {
      onTaskCreated?.(task);
    });

    socket.on("task_deleted", (taskId: string) => {
      onTaskDeleted?.(taskId);
    });

    // Add pong response for health checks
    socket.on("pong", () => {
      // Connection is alive
    });

    socketRef.current = socket;
    return socket;
  }, [getExponentialBackoff, onTaskUpdate, onNewMessage, onTaskCreated, onTaskDeleted]);

  const joinTask = useCallback(
    (taskId: string) => {
      const socket = socketRef.current || connect();
      if (currentTaskIdRef.current) {
        socket.emit("leave_task", currentTaskIdRef.current);
      }
      socket.emit("join_task", taskId);
      currentTaskIdRef.current = taskId;
      console.log(`Joined task room: ${taskId}`);
    },
    [connect],
  );

  const leaveTask = useCallback(() => {
    const socket = socketRef.current;
    if (socket && currentTaskIdRef.current) {
      socket.emit("leave_task", currentTaskIdRef.current);
      console.log(`Left task room: ${currentTaskIdRef.current}`);
      currentTaskIdRef.current = null;
    }
  }, []);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      // Clear health check interval
      if (healthCheckInterval.current) {
        clearInterval(healthCheckInterval.current);
        healthCheckInterval.current = null;
      }

      // Remove all event listeners to prevent memory leaks
      socketRef.current.off('connect');
      socketRef.current.off('disconnect');
      socketRef.current.off('connect_error');
      socketRef.current.off('task_updated');
      socketRef.current.off('new_message');
      socketRef.current.off('task_created');
      socketRef.current.off('task_deleted');
      socketRef.current.off('pong');

      socketRef.current.disconnect();
      socketRef.current = null;
      currentTaskIdRef.current = null;
    }
  }, []);

  // Initialize connection on mount
  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    socket: socketRef.current,
    joinTask,
    leaveTask,
    disconnect,
    isConnected: socketRef.current?.connected || false,
  };
}
