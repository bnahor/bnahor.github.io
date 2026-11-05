import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';

/**
 * Three capture channels on a scrolling scope. Each one fires a sync pulse
 * every PERIOD seconds, but on its own drifting clock — so for part of every
 * cycle the pulses smear apart, then the clock-authority "locks" and they
 * line up on a shared tick. It is the hero's claim, drawn.
 *
 * Everything is a pure function of time τ, so history scrolls off the left
 * edge exactly as it was drawn instead of being re-simulated per frame.
 */

const CHANNELS = [
  { label: 'CAM', seed: 1.7, rate: 0.83 },
  { label: 'TRK', seed: 4.1, rate: 1.21 },
  { label: 'IMU', seed: 7.3, rate: 0.57 },
] as const;

const PERIOD = 1.1; // s between sync pulses
const CYCLE = 9; // s, drift → lock → hold
const SPEED = 84; // px per second of signal
const MAX_SKEW = 0.2; // s, peak clock offset while drifting

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** Drift envelope over one cycle: rise, hold, collapse to lock, hold locked. */
function driftAmount(tau: number) {
  const p = ((tau % CYCLE) + CYCLE) % CYCLE;
  return smooth(0, 1.6, p) * (1 - smooth(4.4, 5.6, p));
}

function clockOffset(channel: number, tau: number) {
  const c = CHANNELS[channel]!;
  return MAX_SKEW * driftAmount(tau) * Math.sin(c.rate * tau + c.seed);
}

/** Low, smooth background noise — a few incommensurate sines per channel. */
function noise(channel: number, tau: number) {
  const s = CHANNELS[channel]!.seed;
  return (
    0.06 * Math.sin(tau * 7.1 + s) +
    0.04 * Math.sin(tau * 13.7 + s * 2.3) +
    0.025 * Math.sin(tau * 31.3 + s * 5.1)
  );
}

/** Sharp up–down sync spike, ECG-ish, centred on d = 0. */
function pulse(d: number) {
  return Math.exp(-((d / 0.022) ** 2)) - 0.45 * Math.exp(-(((d - 0.04) / 0.03) ** 2));
}

function sample(channel: number, tau: number) {
  const off = clockOffset(channel, tau);
  const k = Math.round((tau - off) / PERIOD);
  const d = tau - (k * PERIOD + clockOffset(channel, k * PERIOD));
  return noise(channel, tau) + pulse(d);
}

export function SignalScope() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const readoutRef = useRef<HTMLSpanElement>(null);
  const stateRef = useRef<HTMLSpanElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    let width = 0;
    let height = 0;
    let frame = 0;
    let visible = true;
    let last = 0;
    let lastReadout = 0;
    // Start mid-drift so the first thing a visitor sees is the lock happening.
    let tau = reduceMotion ? 7 : 2.4;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      const rowH = height / CHANNELS.length;
      const head = width - 18; // newest sample sits just inside the right edge
      const amp = rowH * 0.36;

      // Shared-clock ticks: faint always, bright where the pulses have locked.
      const firstK = Math.floor((tau - head / SPEED) / PERIOD);
      const lastK = Math.floor(tau / PERIOD);
      for (let k = firstK; k <= lastK; k++) {
        const x = head - (tau - k * PERIOD) * SPEED;
        const locked = 1 - driftAmount(k * PERIOD);
        ctx.strokeStyle = `rgba(248, 248, 255, ${0.05 + 0.22 * locked ** 3})`;
        ctx.setLineDash(locked > 0.9 ? [] : [2, 4]);
        ctx.beginPath();
        ctx.moveTo(x + 0.5, 0);
        ctx.lineTo(x + 0.5, height);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      for (let c = 0; c < CHANNELS.length; c++) {
        const mid = rowH * c + rowH * 0.58;

        ctx.strokeStyle = 'rgba(248, 248, 255, 0.07)';
        ctx.beginPath();
        ctx.moveTo(0, mid + 0.5);
        ctx.lineTo(width, mid + 0.5);
        ctx.stroke();

        // Fade the trace in from the left so it reads as history.
        const grad = ctx.createLinearGradient(0, 0, head, 0);
        grad.addColorStop(0, 'rgba(248, 248, 255, 0)');
        grad.addColorStop(0.25, 'rgba(248, 248, 255, 0.5)');
        grad.addColorStop(1, 'rgba(248, 248, 255, 0.95)');
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.25;
        ctx.beginPath();
        for (let x = 0; x <= head; x += 1.5) {
          const y = mid - sample(c, tau - (head - x) / SPEED) * amp;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.lineWidth = 1;

        const headY = mid - sample(c, tau) * amp;
        ctx.fillStyle = '#f8f8ff';
        ctx.shadowColor = 'rgba(248, 248, 255, 0.9)';
        ctx.shadowBlur = 10;
        ctx.fillRect(head - 2.5, headY - 2.5, 5, 5);
        ctx.shadowBlur = 0;
      }
    };

    const updateReadout = () => {
      const offsets = CHANNELS.map((_, c) => clockOffset(c, tau));
      const skew = (Math.max(...offsets) - Math.min(...offsets)) * 1000;
      const locked = skew < 1.5;
      if (readoutRef.current) {
        readoutRef.current.textContent = `${skew.toFixed(1).padStart(5, '0')} ms`;
      }
      if (stateRef.current) {
        stateRef.current.textContent = locked ? 'Locked' : 'Drifting';
        stateRef.current.dataset.locked = String(locked);
      }
    };

    const tick = (now: number) => {
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
      last = now;
      tau += dt;
      draw();
      if (now - lastReadout > 90) {
        updateReadout();
        lastReadout = now;
      }
      frame = requestAnimationFrame(tick);
    };

    const start = () => {
      if (frame || reduceMotion || !visible || document.hidden) return;
      last = 0;
      frame = requestAnimationFrame(tick);
    };
    const stop = () => {
      cancelAnimationFrame(frame);
      frame = 0;
    };

    resize();
    draw();
    updateReadout();

    const ro = new ResizeObserver(() => {
      resize();
      draw();
    });
    ro.observe(canvas);

    // Nothing to animate while the scope is off-screen or the tab is hidden.
    const io = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? true;
      if (visible) start();
      else stop();
    });
    io.observe(canvas);

    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener('visibilitychange', onVisibility);

    start();

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [reduceMotion]);

  return (
    <figure className="scope" role="img" aria-label="Animated signal trace: three capture channels drifting apart, then locking to one clock">
      <div className="scope-labels" aria-hidden="true">
        {CHANNELS.map((c) => (
          <span key={c.label}>{c.label}</span>
        ))}
      </div>
      <canvas ref={canvasRef} className="scope-canvas" aria-hidden="true" />
      <figcaption className="scope-readout" aria-hidden="true">
        <span>Skew</span>
        <span ref={readoutRef} className="scope-skew">
          000.0 ms
        </span>
        <span ref={stateRef} className="scope-state" data-locked="false">
          Drifting
        </span>
      </figcaption>
    </figure>
  );
}
