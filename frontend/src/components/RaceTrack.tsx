import React, { useEffect, useRef } from 'react';

interface Participant {
  id: string;
  name: string;
  position: number;
  color: string;
}

interface RaceTrackProps {
  participants: Participant[];
  trackLength: number;
  isLive?: boolean;
}

const RaceTrack: React.FC<RaceTrackProps> = ({ participants, trackLength, isLive }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      // Clear
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw Track Lines
      ctx.strokeStyle = '#333';
      ctx.setLineDash([10, 10]);
      for (let i = 0; i <= participants.length; i++) {
        const y = (canvas.height / participants.length) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // Draw Finish Line
      ctx.strokeStyle = '#e11d48';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(canvas.width - 50, 0);
      ctx.lineTo(canvas.width - 50, canvas.height);
      ctx.stroke();

      // Draw Participants
      participants.forEach((p, index) => {
        const laneHeight = canvas.height / participants.length;
        const y = laneHeight * index + laneHeight / 2;
        const x = (p.position / trackLength) * (canvas.width - 100) + 20;

        // Draw Car (Placeholder Triangle for MVP)
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.moveTo(x + 20, y);
        ctx.lineTo(x - 10, y - 10);
        ctx.lineTo(x - 10, y + 10);
        ctx.closePath();
        ctx.fill();

        // Name
        ctx.fillStyle = 'white';
        ctx.font = '12px Inter';
        ctx.fillText(p.name, x - 10, y - 15);
      });

      requestAnimationFrame(render);
    };

    render();
  }, [participants, trackLength]);

  return (
    <div className="relative w-full h-96 racing-card overflow-hidden">
      {isLive && (
        <div className="absolute top-4 left-4 flex items-center gap-2">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-widest text-red-500">Live Race</span>
        </div>
      )}
      <canvas
        ref={canvasRef}
        width={1000}
        height={400}
        className="w-full h-full object-contain"
      />
    </div>
  );
};

export default RaceTrack;
