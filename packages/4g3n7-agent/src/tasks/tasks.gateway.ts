import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable } from '@nestjs/common';
import { LoggerService } from '../logging/logger.service';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
})
export class TasksGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly logger: LoggerService) {}

  handleConnection(client: Socket) {
    this.logger.logWebSocketEvent('client_connected', client.id, {
      component: 'TasksGateway',
      method: 'handleConnection',
      metadata: { clientHandshake: client.handshake },
    });
  }

  handleDisconnect(client: Socket) {
    this.logger.logWebSocketEvent('client_disconnected', client.id, {
      component: 'TasksGateway',
      method: 'handleDisconnect',
      metadata: { reason: client.disconnectedReason },
    });
  }

  @SubscribeMessage('join_task')
  handleJoinTask(client: Socket, taskId: string) {
    client.join(`task_${taskId}`);
    this.logger.logWebSocketEvent('join_task', client.id, {
      component: 'TasksGateway',
      method: 'handleJoinTask',
      taskId,
      metadata: { room: `task_${taskId}` },
    });
  }

  @SubscribeMessage('leave_task')
  handleLeaveTask(client: Socket, taskId: string) {
    client.leave(`task_${taskId}`);
    this.logger.logWebSocketEvent('leave_task', client.id, {
      component: 'TasksGateway',
      method: 'handleLeaveTask',
      taskId,
      metadata: { room: `task_${taskId}` },
    });
  }

  emitTaskUpdate(taskId: string, task: any) {
    this.server.to(`task_${taskId}`).emit('task_updated', task);
  }

  emitNewMessage(taskId: string, message: any) {
    this.server.to(`task_${taskId}`).emit('new_message', message);
  }

  emitTaskCreated(task: any) {
    this.server.emit('task_created', task);
  }

  emitTaskDeleted(taskId: string) {
    this.server.emit('task_deleted', taskId);
  }
}
