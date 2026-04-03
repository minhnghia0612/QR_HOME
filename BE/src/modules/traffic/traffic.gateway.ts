import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

function getAllowedOrigins() {
  return [
    'http://localhost:5173',
    'http://localhost:4173',
    process.env.FRONTEND_URL || '',
  ].filter(Boolean);
}

@WebSocketGateway({
  namespace: '/traffic',
  cors: {
    origin: getAllowedOrigins(),
    credentials: true,
  },
})
export class TrafficGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(TrafficGateway.name);

  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    this.logger.debug(`Socket connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Socket disconnected: ${client.id}`);
  }

  @SubscribeMessage('dashboard:subscribe')
  async subscribeDashboard(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { adminId?: string },
  ) {
    const adminId = String(payload?.adminId || '').trim();
    if (!adminId) {
      client.emit('dashboard:subscribed', { ok: false, reason: 'missing_admin_id' });
      return;
    }

    const room = this.getAdminRoom(adminId);
    await client.join(room);
    client.emit('dashboard:subscribed', { ok: true, adminId });
  }

  emitDashboardUpdated(adminId: string, dashboard: unknown) {
    const room = this.getAdminRoom(adminId);
    this.server.to(room).emit('traffic:dashboard-updated', {
      adminId,
      dashboard,
      ts: Date.now(),
    });
  }

  private getAdminRoom(adminId: string) {
    return `admin:${adminId}`;
  }
}
