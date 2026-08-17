import { useRef, useState } from "react";

export function Joystick({ onChange }: { onChange: (v: { x: number; y: number }) => void }) {
  const baseRef = useRef<HTMLDivElement>(null);
  const pointerId = useRef<number | null>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });

  const R = 58;

  const move = (clientX: number, clientY: number) => {
    const el = baseRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let dx = clientX - cx;
    let dy = clientY - cy;
    const d = Math.hypot(dx, dy);
    if (d > R) {
      dx = (dx / d) * R;
      dy = (dy / d) * R;
    }
    setKnob({ x: dx, y: dy });
    onChange({ x: dx / R, y: dy / R });
  };

  const end = () => {
    pointerId.current = null;
    setKnob({ x: 0, y: 0 });
    onChange({ x: 0, y: 0 });
  };

  return (
    <div
      ref={baseRef}
      onPointerDown={(e) => {
        pointerId.current = e.pointerId;
        e.currentTarget.setPointerCapture(e.pointerId);
        move(e.clientX, e.clientY);
      }}
      onPointerMove={(e) => {
        if (pointerId.current === e.pointerId) move(e.clientX, e.clientY);
      }}
      onPointerUp={end}
      onPointerCancel={end}
      className="relative h-[150px] w-[150px] touch-none rounded-full border-4 border-primary/40 bg-black/35 backdrop-blur-sm select-none"
      style={{ boxShadow: "0 0 24px rgba(255,120,40,.25)" }}
      aria-label="Movement joystick"
    >
      <div
        className="absolute left-1/2 top-1/2 h-[68px] w-[68px] rounded-full border-2 border-primary bg-gradient-to-b from-primary/90 to-primary/50"
        style={{ transform: `translate(calc(-50% + ${knob.x}px), calc(-50% + ${knob.y}px))` }}
      />
    </div>
  );
}