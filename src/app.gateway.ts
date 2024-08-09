import {
  ConnectedSocket,
  MessageBody,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SocketService } from './socket/socket.service';
import { OnModuleInit } from '@nestjs/common';

@WebSocketGateway(8001, {
  cors: '*',
})
export class AppGateway implements OnGatewayInit, OnModuleInit {
  @WebSocketServer()
  private readonly server: Server;
  constructor(private readonly socketService: SocketService) {}

  onModuleInit() {
    this.server.emit('confirmation');
  }

  afterInit() {
    this.socketService.server = this.server;
  }

  // Create new event
  // event name
  @SubscribeMessage('test')
  sendMessage(@MessageBody() data: string, @ConnectedSocket() socket: Socket) {
    console.log('new message', data);
    // accept (event, ...args)
    socket.emit('chat', 'Hi, you have new message!');
  }

  // To join a room
  @SubscribeMessage('join-chat-room')
  async joinChatRoom(
    @MessageBody() conversationId: string,
    @ConnectedSocket() socket: Socket,
  ) {
    socket.join(conversationId);
  }
}
