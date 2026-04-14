import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';

type SubscribePayload = {
  sessionId: string;
};

@WebSocketGateway({
  namespace: '/ai',
  cors: { origin: '*' },
})
export class AiGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(AiGateway.name);
  constructor(private readonly jwtService: JwtService) {}

  handleConnection(client: Socket) {
    const token = this.extractToken(client);
    if (!token) {
      this.logger.warn(`AI WS rejected(no token): ${client.id}`);
      client.emit('ai:error', { message: '未提供 token' });
      client.disconnect(true);
      return;
    }
    try {
      const payload = this.jwtService.verify<{ sub: number; role: string; username: string }>(
        token,
      );
      const role = payload?.role ?? '';
      if (role !== 'teacher' && role !== 'admin') {
        this.logger.warn(`AI WS rejected(role=${role}): ${client.id}`);
        client.emit('ai:error', { message: '仅教师或管理员可连接 AI 实时通道' });
        client.disconnect(true);
        return;
      }
      client.data.user = {
        id: payload.sub,
        role: payload.role,
        username: payload.username,
      };
      this.logger.debug(`AI WS connected: ${client.id} user=${payload.sub}`);
    } catch (e) {
      this.logger.warn(`AI WS rejected(invalid token): ${client.id} err=${(e as Error).message}`);
      client.emit('ai:error', { message: 'token 无效或已过期' });
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`AI WS disconnected: ${client.id}`);
  }

  @SubscribeMessage('ai:subscribe')
  async subscribe(
    @MessageBody() payload: SubscribePayload,
    @ConnectedSocket() client: Socket,
  ) {
    if (!this.hasTeacherPermission(client)) {
      return { ok: false, message: '无权限订阅' };
    }
    const sessionId = (payload?.sessionId ?? '').trim();
    if (!sessionId) {
      return { ok: false, message: 'sessionId 不能为空' };
    }
    await client.join(sessionId);
    return { ok: true, sessionId };
  }

  @SubscribeMessage('ai:unsubscribe')
  async unsubscribe(
    @MessageBody() payload: SubscribePayload,
    @ConnectedSocket() client: Socket,
  ) {
    if (!this.hasTeacherPermission(client)) {
      return { ok: false, message: '无权限取消订阅' };
    }
    const sessionId = (payload?.sessionId ?? '').trim();
    if (!sessionId) {
      return { ok: false, message: 'sessionId 不能为空' };
    }
    await client.leave(sessionId);
    return { ok: true, sessionId };
  }

  emitSessionResult(sessionId: string, data: unknown) {
    if (!sessionId) return;
    this.server.to(sessionId).emit('ai:result', data);
  }

  private extractToken(client: Socket): string | null {
    const authToken = client.handshake.auth?.token;
    if (typeof authToken === 'string' && authToken.trim()) {
      return authToken.replace(/^Bearer\s+/i, '').trim();
    }
    const header = client.handshake.headers?.authorization;
    if (typeof header === 'string' && header.trim()) {
      return header.replace(/^Bearer\s+/i, '').trim();
    }
    return null;
  }

  private hasTeacherPermission(client: Socket): boolean {
    const role = client.data?.user?.role;
    return role === 'teacher' || role === 'admin';
  }
}
