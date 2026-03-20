import { useEffect, useRef } from 'react';

interface Props {
  onBack: () => void;
}

export default function UnderConstruction({ onBack }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let W = window.innerWidth;
    let H = window.innerHeight;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    type DrawItem =
      | { kind: 'atom'; x: number; y: number; z: number; d: number; s: 'A' | 'B' }
      | { kind: 'bp'; ax: number; bx: number; y: number; z: number; d: number; ci: number };

    const bpPalette: [number, number, number][] = [
      [167, 243, 208],
      [153, 246, 228],
      [110, 231, 183],
      [94, 234, 212],
    ];

    const draw = (ts: number) => {
      const t = ts / 1000;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, W, H);

      const cx = W / 2;
      const R = Math.min(W * 0.18, 100);
      const spacing = 20;
      const perTurn = 10;
      const n = Math.ceil(H / spacing) + 4;
      const y0 = (H - (n - 1) * spacing) / 2;
      const rotSpeed = 0.4;

      // Backbone lines (drawn flat, before depth sort)
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.lineWidth = 2;

      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const ang = (i / perTurn) * Math.PI * 2 + t * rotSpeed;
        const x = cx + R * Math.cos(ang);
        const y = y0 + i * spacing;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.15)';
      ctx.stroke();

      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const ang = (i / perTurn) * Math.PI * 2 + t * rotSpeed;
        const x = cx - R * Math.cos(ang);
        const y = y0 + i * spacing;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.strokeStyle = 'rgba(20, 184, 166, 0.15)';
      ctx.stroke();

      // Build atoms + base pairs
      const items: DrawItem[] = [];
      for (let i = 0; i < n; i++) {
        const y = y0 + i * spacing;
        const ang = (i / perTurn) * Math.PI * 2 + t * rotSpeed;
        const cos = Math.cos(ang), sin = Math.sin(ang);
        const ax = cx + R * cos, az = R * sin;
        const bx = cx - R * cos, bz = -az;

        items.push({ kind: 'atom', x: ax, y, z: az, d: (az + R) / (2 * R), s: 'A' });
        items.push({ kind: 'atom', x: bx, y, z: bz, d: (bz + R) / (2 * R), s: 'B' });
        items.push({ kind: 'bp', ax, bx, y, z: az, d: (az + R) / (2 * R), ci: i % 4 });
      }

      // Painter's algorithm — far first
      items.sort((a, b) => a.z - b.z);

      for (const item of items) {
        if (item.kind === 'atom') {
          const r = 3 + item.d * 7;
          const alpha = 0.15 + item.d * 0.7;
          ctx.beginPath();
          ctx.arc(item.x, item.y, r, 0, Math.PI * 2);
          ctx.fillStyle =
            item.s === 'A'
              ? `rgba(52, 211, 153, ${alpha.toFixed(2)})`
              : `rgba(20, 184, 166, ${alpha.toFixed(2)})`;
          ctx.fill();
        } else {
          const alpha = 0.08 + item.d * 0.28;
          const [cr, cg, cb] = bpPalette[item.ci];
          ctx.beginPath();
          ctx.moveTo(item.ax, item.y);
          ctx.lineTo(item.bx, item.y);
          ctx.strokeStyle = `rgba(${cr}, ${cg}, ${cb}, ${alpha.toFixed(2)})`;
          ctx.lineWidth = 1 + item.d * 2.5;
          ctx.stroke();
        }
      }

      // Soft white radial vignette so the center text stays readable
      const vig = ctx.createRadialGradient(cx, H / 2, H * 0.05, cx, H / 2, H * 0.42);
      vig.addColorStop(0, 'rgba(255,255,255,0.92)');
      vig.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, W, H);

      animId = requestAnimationFrame(draw);
    };

    animId = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-white">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      <div className="relative z-10 flex flex-col items-center justify-center h-full px-6 text-center">
        <div className="mb-6 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
          Coming Soon
        </div>

        <h1 className="text-5xl md:text-7xl font-light text-gray-900 tracking-tight mb-4">
          Under Construction
        </h1>

        <p className="text-base md:text-lg text-gray-500 mb-10 max-w-sm">
          This page is on its way. Check back soon.
        </p>

        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 transition-colors duration-200 cursor-pointer"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5" />
            <path d="M12 19l-7-7 7-7" />
          </svg>
          Go Back
        </button>
      </div>
    </div>
  );
}
