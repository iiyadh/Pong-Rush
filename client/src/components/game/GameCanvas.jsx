import { useRef, useEffect } from 'react';
import { CANVAS } from '../../utils/constants';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const PADDLE_HEIGHT = 120;
const PADDLE_WIDTH = 12;
const BALL_SIZE = 12;
const BALL_TRAIL_LENGTH = 8;
const HIT_FEEDBACK_DURATION = 150;

const P1X = PADDLE_WIDTH + 20;
const P2X = CANVAS_WIDTH - PADDLE_WIDTH - 20;

const GameCanvas = ({ gameState, lastHitTime }) => {
  const canvasRef = useRef(null);
  const gameStateRef = useRef(gameState);
  const lastHitTimeRef = useRef(lastHitTime);
  const ballTrailRef = useRef([]);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    lastHitTimeRef.current = lastHitTime;
  }, [lastHitTime]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    const draw = () => {
      const gs = gameStateRef.current;
      const now = performance.now();

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#0f0e17';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const isHitFlash = (now - lastHitTimeRef.current) < HIT_FEEDBACK_DURATION;

      if (isHitFlash) {
        const flashAlpha = 1 - ((now - lastHitTimeRef.current) / HIT_FEEDBACK_DURATION);
        ctx.save();
        const flashProgress = (now - lastHitTimeRef.current) / HIT_FEEDBACK_DURATION;
        const flashScale = 1 + (1 - flashProgress) * 0.08;

        ctx.fillStyle = `rgba(255, 137, 6, ${0.06 * flashAlpha})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.restore();

        ctx.strokeStyle = `rgba(255, 137, 6, ${0.5 * flashAlpha})`;
        ctx.lineWidth = 3;
        ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);
      }

      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 10]);
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2, 0);
      ctx.lineTo(canvas.width / 2, canvas.height);
      ctx.stroke();
      ctx.setLineDash([]);

      if (gs) {
        const drawPaddle = (x, y, color, flash, flashScale) => {
          ctx.fillStyle = color;
          if (flash && isHitFlash) {
            const cx = x + CANVAS.PADDLE.WIDTH / 2;
            const cy = y + CANVAS.PADDLE.HEIGHT / 2;
            ctx.save();
            ctx.translate(cx, cy);
            ctx.scale(flashScale, flashScale);
            ctx.fillRect(-CANVAS.PADDLE.WIDTH / 2, -CANVAS.PADDLE.HEIGHT / 2, CANVAS.PADDLE.WIDTH, CANVAS.PADDLE.HEIGHT);
            ctx.restore();
          } else {
            ctx.fillRect(x, y, CANVAS.PADDLE.WIDTH, CANVAS.PADDLE.HEIGHT);
          }
        };

        const flashProgress = isHitFlash ? (now - lastHitTimeRef.current) / HIT_FEEDBACK_DURATION : 1;
        const flashScale = isHitFlash ? 1 + (1 - flashProgress) * 0.08 : 1;

        drawPaddle(20, gs.paddle1?.y ?? 250, '#ff8906', true, flashScale);
        drawPaddle(
          canvas.width - 20 - CANVAS.PADDLE.WIDTH,
          gs.paddle2?.y ?? 250,
          '#f25f4c',
          true,
          flashScale
        );

        const ballX = gs.ball?.x ?? canvas.width / 2;
        const ballY = gs.ball?.y ?? canvas.height / 2;

        const trail = ballTrailRef.current;
        if (gs.ball?.dx !== 0 || gs.ball?.dy !== 0) {
          trail.push({ x: ballX, y: ballY });
          if (trail.length > BALL_TRAIL_LENGTH) {
            trail.shift();
          }
        } else {
          trail.length = 0;
        }

        for (let i = 0; i < trail.length; i++) {
          const alpha = ((i + 1) / (trail.length + 1)) * 0.35;
          const radius = (CANVAS.BALL.SIZE / 2) * ((i + 1) / (trail.length + 1)) * 0.8;
          ctx.fillStyle = `rgba(255, 255, 254, ${alpha})`;
          ctx.beginPath();
          ctx.arc(trail[i].x, trail[i].y, radius, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.fillStyle = '#fffffe';
        ctx.shadowColor = '#fffffe';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(ballX, ballY, CANVAS.BALL.SIZE / 2, 0, Math.PI * 2);
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
