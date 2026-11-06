import { useEffect, useRef, useState } from 'react';
import type { StageApi } from './engine';
import { prefersReducedMotion } from '../../lib/motion';

const TAKE_LABELS = ['NEUTRAL', 'STRUT', 'ROBOT', 'ZOMBIE'];

/**
 * Everything fixed behind and around the homepage: the cyc wall, the canvas, the
 * bottom letterbox bar and the reticle. It reads the scenes from the DOM, so each
 * scene's story lives in markup (data-jitter, data-skeleton, data-state).
 */
export function Stage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const barRef = useRef<HTMLElement>(null);
  const reticleRef = useRef<HTMLDivElement>(null);
  const reticleLabelRef = useRef<HTMLSpanElement>(null);
  const timecodeRef = useRef<HTMLSpanElement>(null);
  const jitterRef = useRef<HTMLSpanElement>(null);
  const stateRef = useRef<HTMLSpanElement>(null);
  const stageRef = useRef<StageApi | null>(null);
  const [take, setTake] = useState(0);

  useEffect(() => {
    let disposed = false;
    let frame = 0;
    const reduce = prefersReducedMotion();
    const scenes = Array.from(document.querySelectorAll<HTMLElement>('[data-scene]'));
    const stageSections = document.getElementById('stage-sections');
    const reel = document.getElementById('end-reel');
    const topBar = document.querySelector<HTMLElement>('.site-bar');
    const bottomBar = barRef.current;

    const stacked = () => window.innerWidth < window.innerHeight;
    const barBase = () => {
      const h = window.innerHeight;
      if (stacked()) return 52;
      return h < 500 ? 40 : Math.min(96, Math.max(52, h * 0.09));
    };

    const update = () => {
      frame = 0;
      const W = window.innerWidth;
      const H = window.innerHeight;
      const y = window.scrollY;

      // The letterbox opens as the film starts.
      const base = barBase();
      const bar = stacked() ? base : Math.max(Math.min(46, base), base - y * 0.09);
      if (topBar) topBar.style.height = `${bar}px`;
      if (bottomBar) bottomBar.style.height = `${bar}px`;
      bottomBar?.classList.toggle('is-away', (reel?.getBoundingClientRect().top ?? H) < H * 0.6);

      const mid = H * 0.62;
      let active = scenes[0];
      for (const scene of scenes) {
        if (scene.getBoundingClientRect().top < mid) active = scene;
      }
      if (!active) return;

      if (stateRef.current) stateRef.current.textContent = active.dataset.state ?? 'RAW';
      const stage = stageRef.current;
      if (!stage) return;

      stage.setScene({
        jitter: Number(active.dataset.jitter ?? 0.6),
        skeleton: Number(active.dataset.skeleton ?? 0),
      });

      if (stacked()) {
        // The copy sits at the foot of the screen; the performer gets what's left above it.
        const copy = active.querySelector<HTMLElement>('[data-stage-text]');
        const copyHeight = copy?.getBoundingClientRect().height ?? H * 0.4;
        const copyTop = H - bar - 22 - copyHeight;
        const scale = Math.min((copyTop - bar - 18) / 2.07, W * 0.56);
        stage.setFraming({
          x: W * 0.5,
          floor: copyTop - 6 - scale * 0.22,
          scale: Math.max(scale, 40),
          visible: scale > 62,
        });
      } else {
        const scale = Math.min((H - bar * 2 - 44) / 2.1, H * 0.38);
        stage.setFraming({
          x: W * (active === scenes[0] ? 0.68 : 0.72),
          floor: H - bar - 18 - scale * 0.22,
          scale,
          visible: true,
        });
      }
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    const onPointer = (event: PointerEvent) => {
      const inReel = (reel?.getBoundingClientRect().top ?? 1e9) < event.clientY;
      stageRef.current?.setLens(event.clientX, event.clientY, inReel ? 0.25 : 1);
      if (event.pointerType !== 'mouse' || reduce) return;
      document.documentElement.classList.add('has-reticle');
      if (reticleRef.current) {
        reticleRef.current.style.transform = `translate(${event.clientX}px, ${event.clientY}px)`;
      }
      if (reticleLabelRef.current) {
        const target = event.target as Element | null;
        reticleLabelRef.current.textContent = target?.closest?.('a, button, summary')
          ? 'OPEN'
          : inReel
            ? ''
            : 'SOLVE';
      }
    };
    const onLeave = () => document.documentElement.classList.remove('has-reticle');

    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    window.addEventListener('pointermove', onPointer, { passive: true });
    window.addEventListener('pointerdown', onPointer, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    update();

    let io: IntersectionObserver | null = null;

    // The engine and the motion data are a separate chunk: copy paints first.
    void import('./engine').then(({ createStage }) => {
      const canvas = canvasRef.current;
      if (disposed || !canvas) return;
      const stage = createStage(canvas, {
        reduce,
        onHud: ({ timecode, jitter }) => {
          if (timecodeRef.current) timecodeRef.current.textContent = timecode;
          if (jitterRef.current) jitterRef.current.textContent = jitter;
        },
      });
      if (!stage) return;
      stageRef.current = stage;
      canvas.classList.add('is-live');
      update();
      if (document.fonts?.ready) void document.fonts.ready.then(() => !disposed && update());

      // Nothing to draw once the end credits fully cover the stage.
      io = new IntersectionObserver(([entry]) => {
        if (entry?.isIntersecting) stage.start();
        else stage.stop();
      });
      if (stageSections) io.observe(stageSections);
      else stage.start();
    });

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('pointermove', onPointer);
      window.removeEventListener('pointerdown', onPointer);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      document.documentElement.classList.remove('has-reticle');
      io?.disconnect();
      stageRef.current?.destroy();
      stageRef.current = null;
    };
  }, []);

  const nextTake = () => {
    const next = (take + 1) % TAKE_LABELS.length;
    setTake(next);
    stageRef.current?.setTake(next);
  };

  return (
    <>
      <div className="cyc" aria-hidden="true" />
      <canvas ref={canvasRef} className="stage-canvas" aria-hidden="true" />

      <aside ref={barRef} className="stage-bar">
        <div className="stage-bar-group" aria-hidden="true">
          <span ref={timecodeRef} className="stage-timecode">00:00:00:00</span>
          <span className="stage-bar-wide">24 FPS</span>
        </div>
        <button type="button" className="take-button" onClick={nextTake}>
          <span className="visually-hidden">Change the performer’s walk. Current take: </span>
          TK {String(take + 1).padStart(2, '0')} {TAKE_LABELS[take]}
          <span className="take-next" aria-hidden="true">NEXT</span>
        </button>
        <div className="stage-bar-group" aria-hidden="true">
          <span className="stage-bar-wide">
            JITTER <span ref={jitterRef}>00.0</span> PX
          </span>
          <span ref={stateRef} className="stage-state">RAW</span>
        </div>
      </aside>

      <div ref={reticleRef} className="reticle" aria-hidden="true">
        <i />
        <i />
        <span ref={reticleLabelRef}>SOLVE</span>
      </div>
    </>
  );
}
