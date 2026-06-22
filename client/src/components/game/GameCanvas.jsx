import { useRef, useEffect } from 'react';
import { CANVAS } from '../../utils/constants';

const GameCanvas = ({ gameState }) => {
  const canvasRef = useRef(null);
  const gameStateRef = useRef(gameState);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    const draw = () => {
      const gs = gameStateRef.current;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#0f0e17';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 10]);
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2, 0);
      ctx.lineTo(canvas.width / 2, canvas.height);
      ctx.stroke();
      ctx.setLineDash([]);

      if (gs) {
        ctx.fillStyle = '#ff8906';
        ctx.fillRect(
          20,
          gs.paddle1?.y ?? 250,
          CANVAS.PADDLE.WIDTH,
          CANVAS.PADDLE.HEIGHT
        );

        ctx.fillStyle = '#f25f4c';
        ctx.fillRect(
          canvas.width - 20 - CANVAS.PADDLE.WIDTH,
          gs.paddle2?.y ?? 250,
          CANVAS.PADDLE.WIDTH,
          CANVAS.PADDLE.HEIGHT
        );

        ctx.fillStyle = '#fffffe';
        ctx.shadowColor = '#fffffe';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(
          gs.ball?.x ?? canvas.width / 2,
          gs.ball?.y ?? canvas.height / 2,
          CANVAS.BALL.SIZE / 2,
          0,
          Math.PI * 2
        );
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      requestAnimationFrame(draw);
    };

    const frameId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frameId);
  }, []);

  return (
    <div className="flex justify-center">
      <canvas
        ref={canvasRef}
        width={CANVAS.WIDTH}
        height={CANVAS.HEIGHT}
        className="border border-gray-700 rounded-lg"
      />
    </div>
  );
};

export default GameCanvas;
