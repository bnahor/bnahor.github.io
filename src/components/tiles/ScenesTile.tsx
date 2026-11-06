import { SignalScope } from '../motion/SignalScope';

/** The work told as scenes: the performer on the stage plays what the copy says. */
export function ScenesTile() {
  return (
    <div id="incident" className="scenes">
      <section className="scene" data-scene data-jitter="0.6" data-skeleton="0">
        <div className="scene-copy" data-stage-text>
          <p className="scene-slug">Cortex AI, 2026</p>
          <h2>A client’s pose stream started jittering.</h2>
          <p>
            It was bad enough to stop their R&amp;D, and the regression had already stalled work
            for about six weeks.
          </p>
        </div>
      </section>

      <section className="scene" data-scene data-jitter="0.5" data-skeleton="1">
        <div className="scene-copy" data-stage-text>
          <p className="scene-slug">The cause</p>
          <h2>I traced it to compounding smoothing.</h2>
          <p>Velocity derivatives were being smoothed on top of already smoothed values.</p>
        </div>
      </section>

      <section className="scene" data-scene data-jitter="0" data-skeleton="1">
        <div className="scene-copy" data-stage-text>
          <p className="scene-slug">Three hours later</p>
          <h2>The reconstruction was stable again.</h2>
          <p>
            Raw-derivative 1-Euro filtering, inter-MCP distance constraints and Jakobsen relaxation
            unblocked 1.5 months of stalled work.
          </p>
        </div>
      </section>

      <section className="scene" data-scene data-jitter="0" data-skeleton="1">
        <div className="scene-copy" data-stage-text>
          <p className="scene-slug">Also at Cortex AI</p>
          <h2>Then every sensor had to agree on the time.</h2>
          <p>
            I built the clock-authority layer for a Vive Tracker and ZED Box stack on Jetson Orin.
            It kept frames, poses and IMU samples aligned for 50+ operators across 1,000+ hours.
          </p>
          <SignalScope />
        </div>
      </section>
    </div>
  );
}
