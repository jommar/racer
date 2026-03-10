import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RacesService } from '../modules/races/races.service';
import { UseGuards } from '@nestjs/common';
import { UserRole } from '../modules/auth/user.entity';

@WebSocketGateway({ cors: { origin: '*' } })
export class RacesGateway {
  @WebSocketServer()
  server: Server;

  constructor(private racesService: RacesService) {}

  @SubscribeMessage('joinRace')
  handleJoinRace(@MessageBody('raceId') raceId: string, @ConnectedSocket() client: Socket) {
    client.join(`race_${raceId}`);
    return { status: 'joined', raceId };
  }

  async streamRace(raceId: string) {
    const data = await this.racesService.computeRace(raceId);
    if (!data) return;

    const { frames, results } = data;
    
    // Stream frames to the race room
    for (const frame of frames) {
      this.server.to(`race_${raceId}`).emit('raceFrame', frame);
      // Wait a bit between frames (e.g., 16ms for ~60fps)
      await new Promise((resolve) => setTimeout(resolve, 16));
    }

    this.server.to(`race_${raceId}`).emit('raceFinished', results);
  }
}
