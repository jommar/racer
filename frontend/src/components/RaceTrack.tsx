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

    let animationFrameId: number;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw Asphalt Base
      ctx.fillStyle = '#111';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw Lane Dividers
      ctx.strokeStyle = '#222';
      ctx.setLineDash([20, 20]);
      ctx.lineWidth = 1;
      const laneCount = Math.min(participants.length, 10); // Visual lanes limit
      for (let i = 1; i < laneCount; i++) {
        const y = (canvas.height / laneCount) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // Draw Start/Finish Lines
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 8;
      ctx.beginPath(); ctx.moveTo(40, 0); ctx.lineTo(40, canvas.height); ctx.stroke();
      
      ctx.strokeStyle = '#e11d48'; // Finish Line
      ctx.beginPath(); ctx.moveTo(canvas.width - 60, 0); ctx.lineTo(canvas.width - 60, canvas.height); ctx.stroke();

      // Draw Participants (Optimized Loop)
      for (let i = 0; i < participants.length; i++) {
        const p = participants[i];
        const laneIndex = i % laneCount;
        const laneHeight = canvas.height / laneCount;
        const y = laneHeight * laneIndex + laneHeight / 2;
        const x = (p.position / trackLength) * (canvas.width - 120) + 40;

        // Draw Car Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.beginPath();
        ctx.ellipse(x, y + 8, 15, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Draw Car Body (Simplified SVG-like path for performance)
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = p.color;
        
        ctx.beginPath();
        ctx.roundRect(x - 15, y - 8, 30, 16, 4);
        ctx.fill();
        
        // Cockpit
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.beginPath();
        ctx.roundRect(x, y - 5, 8, 10, 2);
        ctx.fill();

        ctx.shadowBlur = 0; // Reset shadow for next car

        // Label for top 5 only to avoid clutter
        if (participants.length < 10 || i < 5) {
          ctx.fillStyle = 'white';
          ctx.font = 'bold 10px Inter';
          ctx.textAlign = 'center';
          ctx.fillText(p.name, x, y - 12);
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
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
