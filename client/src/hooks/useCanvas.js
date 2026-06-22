import { useRef, useEffect, useCallback } from 'react';
import { CANVAS } from '../utils/constants';

const useCanvas = (canvasRef, gameState, isPlayer1) => {
  const animFrameRef = useRef(null);
  const paddleYRef = useRef(250);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
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

    if (gameState) {
      ctx.fillStyle = '#ff8906';
      ctx.fillRect(
        20,
        gameState.paddle1?.y || 250,
        CANVAS.PADDLE.WIDTH,
        CANVAS.PADDLE.HEIGHT
      );

      ctx.fillStyle = '#f25f4c';
      ctx.fillRect(
        canvas.width - 20 - CANVAS.PADDLE.WIDTH,
        gameState.paddle2?.y || 250,
        CANVAS.PADDLE.WIDTH,
        CANVAS.PADDLE.HEIGHT
      );

      ctx.fillStyle = '#fffffe';
      ctx.beginPath();
      ctx.arc(
        gameState.ball?.x || canvas.width / 2,
        gameState.ball?.y || canvas.height / 2,
        CANVAS.BALL.SIZE / 2,
        0,
        Math.PI * 2
      );
      ctx.fill();

      ctx.shadowColor = '#fffffe';
      ctx.shadowBlur = 15;
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    animFrameRef.current = requestAnimationFrame(draw);
  }, [canvasRef, gameState]);

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(draw);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [draw]);

  const movePaddle = useCallback((direction) => {
    const speed = CANVAS.PADDLE.SPEED;
    if (direction === 'up') {
      paddleYRef.current = Math.max(0, paddleYRef.current - speed);
    } else if (direction === 'down') {
      paddleYRef.current = Math.min(
        CANVAS.HEIGHT - CANVAS.PADDLE.HEIGHT,
        paddleYRef.current + speed
      );
    }
    return paddleYRef.current;
  }, []);

  return { movePaddle, paddleYRef };
};

export default useCanvas;
