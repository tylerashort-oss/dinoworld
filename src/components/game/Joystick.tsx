import { useRef, useState } from "react";

/**
 * Large, floating touch joystick.
 * The whole bottom-left corner is a touch zone: wherever the thumb lands, the
 * stick re-centres there so a slightly-off tap still moves the hero.
 */
export function Joystick({
  onChange,
  size = 210,
}: {
  onChange: (v: { x: number; y: number }) => void;
  size?: number;
}) {
  const zoneRef = useRef<HTMLDivElement>(null);
  const pointerId = useRef<number | null>(null);
  const origin = useRef({ x: 0, y: 0 });
  const [center, setCenter] = useState<{ x: number; y: number } | null>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });

  const R = size * 0.42;
  const knobSize = size * 0.44;
  const zone = Math.round(size * 1.7);

  const move = (clientX: number, clientY: number) => {
    let dx = clientX - origin.current.x;
    let dy = clientY - origin.current.y;
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
    setCenter(null);
    onChange({ x: 0, y: 0 });
  };

  return (
    <div
      ref={zoneRef}
      onPointerDown={(e) => {
        if (pointerId.current !== null) return;
        pointerId.current = e.pointerId;
        e.currentTarget.setPointerCapture(e.pointerId);
        const rect = e.currentTarget.getBoundingClientRect();
        // keep the stick fully inside the zone
        const half = size / 2;
        const cx = Math.min(Math.max(e.clientX, rect.left + half), rect.right - half);
        const cy = Math.min(Math.max(e.clientY, rect.top + half), rect.bottom - half);
        origin.current = { x: cx, y: cy };
        setCenter({ x: cx - rect.left, y: cy - rect.top });
        move(e.clientX, e.clientY);
      }}
      onPointerMove={(e) => {
        if (pointerId.current === e.pointerId) move(e.clientX, e.clientY);
      }}
      onPointerUp={end}
      onPointerCancel={end}
      onPointerLeave={(e) => {
        if (pointerId.current === e.pointerId) end();
      }}
      className="relative touch-none select-none"
      style={{ width: zone, height: zone }}
      aria-label="Movement joystick"
    >
      {/* resting stick, shown until the player grabs it */}
      <div
        className="pointer-events-none absolute rounded-full border-4 border-primary/40 bg-black/35 backdrop-blur-sm"
        style={{
          width: size,
          height: size,
          left: center ? center.x - size / 2 : 0,
          bottom: center ? undefined : 0,
          top: center ? center.y - size / 2 : undefined,
          boxShadow: "0 0 28px rgba(255,120,40,.25)",
          transition: center ? "none" : "left .12s ease, top .12s ease",
        }}
      >
        <div
          className="absolute left-1/2 top-1/2 rounded-full border-2 border-primary bg-gradient-to-b from-primary/90 to-primary/50"
          style={{
            width: knobSize,
            height: knobSize,
            transform: `translate(calc(-50% + ${knob.x}px), calc(-50% + ${knob.y}px))`,
          }}
        />
      </div>
    </div>
  );
}
