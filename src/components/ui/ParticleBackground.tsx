"use client";

import { useEffect, useRef } from "react";

interface Star {
  x: number;
  y: number;
  size: number;
  opacity: number;
  speed: number;
}

interface ShootingStar {
  x: number;
  y: number;
  length: number;
  speed: number;
  opacity: number;
  active: boolean;
  angle: number;
}

export default function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = window.innerWidth;
    let height = window.innerHeight;

    let stars: Star[] = [];
    let shootingStars: ShootingStar[] = [];
    let lastShootingStarTime = performance.now();

    const resizeCanvas = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    const initStars = () => {
      stars = [];
      const count = Math.floor((width * height) / 2500); // Mật độ sao
      for (let i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: Math.random() * 1.5 + 0.5,
          opacity: Math.random(),
          speed: Math.random() * 0.015 + 0.005,
        });
      }
    };

    const spawnShootingStars = () => {
      const numShootingStars = Math.floor(Math.random() * 2) + 1; // 1 đến 2 sao băng
      for (let i = 0; i < numShootingStars; i++) {
        shootingStars.push({
          x: Math.random() * width,
          y: Math.random() * -100 - 50, // Xuất hiện từ ngoài màn hình phía trên
          length: Math.random() * 100 + 50,
          speed: Math.random() * 15 + 10,
          opacity: 1,
          active: true,
          angle: Math.PI / 4 + (Math.random() * 0.2 - 0.1), // Góc chéo khoảng 45 độ, xoay nhẹ
        });
      }
    };

    initStars();

    const render = (timestamp: DOMHighResTimeStamp) => {
      ctx.clearRect(0, 0, width, height);

      // Render sao nhấp nháy
      stars.forEach((star) => {
        star.opacity += star.speed;
        if (star.opacity > 1 || star.opacity < 0.1) {
          star.speed = -star.speed;
        }

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0.1, Math.min(star.opacity, 1))})`;
        ctx.fill();
      });

      // Kiểm tra cứ mỗi 5 giây (5000ms) phóng ra sao băng
      if (timestamp - lastShootingStarTime > 5000) {
        spawnShootingStars();
        lastShootingStarTime = timestamp;
      }

      // Render sao băng
      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const ss = shootingStars[i];
        if (!ss.active) {
          shootingStars.splice(i, 1);
          continue;
        }

        // Di chuyển
        ss.x += Math.cos(ss.angle) * ss.speed;
        ss.y += Math.sin(ss.angle) * ss.speed;

        // Tính đuôi sao băng dựa trên chiều dài và góc
        const tailX = ss.x - Math.cos(ss.angle) * ss.length;
        const tailY = ss.y - Math.sin(ss.angle) * ss.length;

        const gradient = ctx.createLinearGradient(ss.x, ss.y, tailX, tailY);
        gradient.addColorStop(0, `rgba(255, 255, 255, ${ss.opacity})`);
        gradient.addColorStop(1, `rgba(255, 255, 255, 0)`);

        ctx.beginPath();
        ctx.moveTo(ss.x, ss.y);
        ctx.lineTo(tailX, tailY);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = Math.random() * 1 + 1; // Độ dày đuôi
        ctx.stroke();

        // Đầu sao băng sáng 
        ctx.beginPath();
        ctx.arc(ss.x, ss.y, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${ss.opacity})`;
        ctx.shadowBlur = 10;
        ctx.shadowColor = "white";
        ctx.fill();
        ctx.shadowBlur = 0; // Tắt shadow để không ảnh hưởng các vật khác

        // Nếu sao băng bay ra khỏi màn hình
        if (ss.x > width + ss.length || ss.y > height + ss.length || ss.x < -ss.length || ss.y < -ss.length) {
          ss.active = false;
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      aria-hidden="true"
    />
  );
}
