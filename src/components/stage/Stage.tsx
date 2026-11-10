import { useEffect, useRef, useState } from 'react';
import type { StageApi } from './engine';
import { prefersReducedMotion } from '../../lib/motion';

const TAKE_LABELS = ['Neutral', 'Strut', 'Robot', 'Zombie'];
const HEADER = 56;

/**
 * The fixed backdrop of the homepage: the cyc wall, the canvas and the walk
 * switcher. It reads the scenes from the DOM, so each scene's story lives in
 * markup (data-jitter, data-skeleton).
 */
export function Stage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const takeRef = useRef<HTMLButtonElement>(null);
  const stageRef = useRef<StageApi | null>(null);
  const [take, setTake] = useState(0);

  useEffect(() => {
    let disposed = false;
    let frame = 0;
    const reduce = prefersReducedMotion();
    const scenes = Array.from(document.querySelectorAll<HTMLElement>('[data-scene]'));
    const stageSections = document.getElementById('stage-sections');
    const reel = document.getElementById('end-reel');

    const update = () => {
      frame = 0;
      const W = window.innerWidth;
      const H = window.innerHeight;

      takeRef.current?.classList.toggle('is-away', (reel?.getBoundingClientRect().top ?? H) < H * 0.9);

      const mid = H * 0.62;
      let active = scenes[0];
      for (const scene of scenes) {
        if (scene.getBoundingClientRect().top < mid) active = scene;
      }
      const stage = stageRef.current;
      if (!active || !stage) return;

      stage.setScene({
        jitter: Number(active.dataset.jitter ?? 0.2),
        skeleton: Number(active.dataset.skeleton ?? 0),
      });

      if (W < H) {
        // The copy sits at the foot of the screen; the performer gets what's left above it.
        const copy = active.querySelector<HTMLElement>('[data-stage-text]');
        const copyHeight = copy?.getBoundingClientRect().height ?? H * 0.4;
        const copyTop = H - 24 - copyHeight;
        const scale = Math.min((copyTop - HEADER - 16) / 1.98, W * 0.56);
        stage.setFraming({
          x: W * 0.5,
          floor: copyTop - 10,
          scale: Math.max(scale, 40),
          visible: scale > 62,
        });
      } else {
        const scale = Math.min((H - HEADER - 56) / 1.9, H * 0.42);
        stage.setFraming({
          x: W * (active === scenes[0] ? 0.68 : 0.72),
          floor: H - 40,
          scale,
          visible: true,
        });
      }
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    const onPointer = (event: PointerEvent) => {
      stageRef.current?.setLens(event.clientX, event.clientY);
    };

    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    window.addEventListener('pointermove', onPointer, { passive: true });
    window.addEventListener('pointerdown', onPointer, { passive: true });
    update();

    let io: IntersectionObserver | null = null;

    // The engine and the motion data are a separate chunk: copy paints first.
    void import('./engine').then(({ createStage }) => {
      const canvas = canvasRef.current;
      if (disposed || !canvas) return;
      const stage = createStage(canvas, { reduce });
      if (!stage) return;
      stageRef.current = stage;
      canvas.classList.add('is-live');
      update();
      if (document.fonts?.ready) void document.fonts.ready.then(() => !disposed && update());

      // Nothing to draw once the page has scrolled past the stage.
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
      <button ref={takeRef} type="button" className="take-button" onClick={nextTake}>
        <span className="visually-hidden">Change the figure’s walk. Current walk: </span>
        <span key={take} className="swap">
          {TAKE_LABELS[take]} walk
        </span>
        <span className="take-next" aria-hidden="true">
          Next
        </span>
      </button>
    </>
  );
}
