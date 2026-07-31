import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  OffthreadVideo,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {experiment, gpuTimeline} from "./data";

const C = {
  ink: "#06090E",
  panel: "#0D141F",
  panel2: "#121D2A",
  line: "#26394E",
  white: "#F5F8FC",
  muted: "#91A2B5",
  cyan: "#40E9E0",
  yellow: "#FFD33D",
  green: "#55E68D",
  red: "#FF5964",
  blue: "#4C8DFF",
};

const sans = "Inter, ui-sans-serif, system-ui, -apple-system, sans-serif";
const mono = "ui-monospace, SFMono-Regular, Menlo, monospace";

const Grid: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        opacity: 0.25,
        backgroundImage:
          "linear-gradient(rgba(255,255,255,.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.045) 1px, transparent 1px)",
        backgroundSize: "54px 54px",
        backgroundPosition: `${frame * -0.18}px ${frame * 0.08}px`,
      }}
    />
  );
};

const Scan: React.FC = () => {
  const frame = useCurrentFrame();
  const y = interpolate(frame % 180, [0, 179], [-80, 1160]);
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: y,
        height: 2,
        background: "linear-gradient(90deg, transparent, rgba(64,233,224,.45), transparent)",
        boxShadow: "0 0 22px rgba(64,233,224,.28)",
      }}
    />
  );
};

const Base: React.FC<
  React.PropsWithChildren<{kicker?: string; title?: string; subtitle?: string}>
> = ({children, kicker, title, subtitle}) => {
  const frame = useCurrentFrame();
  const inP = spring({frame, fps: 60, config: {damping: 18, stiffness: 115}});
  return (
    <AbsoluteFill style={{backgroundColor: C.ink, color: C.white, fontFamily: sans}}>
      <Grid />
      <Scan />
      {(kicker || title) && (
        <div
          style={{
            position: "absolute",
            left: 68,
            right: 68,
            top: 42,
            zIndex: 10,
            opacity: inP,
            transform: `translateY(${(1 - inP) * 24}px)`,
          }}
        >
          {kicker ? (
            <div
              style={{
                fontFamily: mono,
                color: C.cyan,
                fontSize: 18,
                letterSpacing: 4,
                fontWeight: 800,
                marginBottom: 10,
              }}
            >
              {kicker}
            </div>
          ) : null}
          {title ? (
            <div style={{fontSize: 52, lineHeight: 1, fontWeight: 900, letterSpacing: -1.8}}>
              {title}
            </div>
          ) : null}
          {subtitle ? (
            <div style={{fontSize: 21, color: C.muted, marginTop: 13}}>{subtitle}</div>
          ) : null}
        </div>
      )}
      {children}
    </AbsoluteFill>
  );
};

const Tag: React.FC<{children: React.ReactNode; color?: string}> = ({
  children,
  color = C.cyan,
}) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      height: 36,
      padding: "0 12px",
      border: `1px solid ${color}`,
      backgroundColor: "rgba(6,9,14,.82)",
      color,
      fontFamily: mono,
      fontSize: 14,
      letterSpacing: 1.2,
      fontWeight: 850,
    }}
  >
    {children}
  </div>
);

const Stat: React.FC<{value: string; label: string; color?: string}> = ({
  value,
  label,
  color = C.cyan,
}) => (
  <div
    style={{
      minWidth: 0,
      padding: "22px 24px",
      background: "linear-gradient(145deg, rgba(18,29,42,.98), rgba(9,14,22,.98))",
      border: `1px solid ${C.line}`,
      borderTop: `4px solid ${color}`,
    }}
  >
    <div style={{fontFamily: mono, fontSize: 42, lineHeight: 1, fontWeight: 900, color}}>{value}</div>
    <div
      style={{
        fontFamily: mono,
        fontSize: 14,
        color: C.muted,
        lineHeight: 1.35,
        letterSpacing: 1.2,
        marginTop: 12,
      }}
    >
      {label}
    </div>
  </div>
);

const MediaFrame: React.FC<
  React.PropsWithChildren<{
    label: string;
    note?: string;
    x: number;
    y: number;
    width: number;
    height: number;
    color?: string;
  }>
> = ({children, label, note, x, y, width, height, color = C.cyan}) => {
  const frame = useCurrentFrame();
  const p = spring({frame, fps: 60, config: {damping: 18, stiffness: 100}});
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width,
        height,
        overflow: "hidden",
        backgroundColor: C.panel,
        border: `1px solid ${C.line}`,
        boxShadow: "0 24px 90px rgba(0,0,0,.45)",
        opacity: p,
        transform: `translateY(${(1 - p) * 26}px) scale(${0.98 + p * 0.02})`,
      }}
    >
      {children}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          minHeight: 58,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 18,
          padding: "10px 14px",
          backgroundColor: "rgba(6,9,14,.92)",
          borderTop: `2px solid ${color}`,
        }}
      >
        <div style={{fontFamily: mono, fontWeight: 850, fontSize: 16, letterSpacing: 1}}>
          {label}
        </div>
        {note ? (
          <div style={{fontFamily: mono, color: C.muted, fontSize: 12, textAlign: "right"}}>
            {note}
          </div>
        ) : null}
      </div>
    </div>
  );
};

const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const p = spring({frame, fps, config: {damping: 16, stiffness: 95}});
  const underline = interpolate(frame, [60, 150], [0, 1030], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  return (
    <Base>
      <AbsoluteFill style={{opacity: 0.34}}>
        <OffthreadVideo
          src={staticFile("media/agent-progress.mp4")}
          muted
          style={{width: "100%", height: "100%", objectFit: "cover"}}
        />
      </AbsoluteFill>
      <AbsoluteFill style={{background: "linear-gradient(90deg, rgba(6,9,14,.98) 0%, rgba(6,9,14,.82) 55%, rgba(6,9,14,.46) 100%)"}} />
      <div
        style={{
          position: "absolute",
          left: 104,
          top: 164,
          opacity: p,
          transform: `translateY(${(1 - p) * 34}px)`,
        }}
      >
        <div style={{fontFamily: mono, color: C.cyan, letterSpacing: 5, fontSize: 22, fontWeight: 800}}>
          LOCAL MODEL · REAL CODE · ALL FAILURES KEPT
        </div>
        <div style={{fontSize: 101, lineHeight: 0.94, fontWeight: 950, letterSpacing: -5, marginTop: 26}}>
          CAN 27B
          <br />
          SURVIVE THE
          <br />
          GAUNTLET?
        </div>
        <div style={{height: 8, width: underline, backgroundColor: C.yellow, marginTop: 30}} />
      </div>
      <div style={{position: "absolute", right: 68, bottom: 54, display: "flex", gap: 10}}>
        <Tag>QWEN3.6-27B</Tag>
        <Tag color={C.yellow}>PI 0.83</Tag>
        <Tag color={C.green}>24 × 3090</Tag>
      </div>
    </Base>
  );
};

const Rules: React.FC = () => {
  const frame = useCurrentFrame();
  const rows = [
    ["01", "Simple, reusable prompts", "No game-specific answer hidden in the brief"],
    ["02", "Qwen owns every game-source edit", "Codex only orchestrates, captures, and scores"],
    ["03", "Independent browser gates", "Self-reported tests never decide a pass"],
    ["04", "Failure is a result", "No cherry-picking, no retroactive AAA claim"],
  ];
  return (
    <Base kicker="EXPERIMENT CONTRACT" title="How we know it was Qwen—not the orchestrator">
      <div style={{position: "absolute", left: 66, right: 66, top: 178, bottom: 58, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14}}>
        {rows.map(([number, title, detail], index) => {
          const p = spring({frame: frame - index * 8, fps: 60, config: {damping: 18, stiffness: 115}});
          return (
            <div
              key={number}
              style={{
                padding: "28px 30px",
                backgroundColor: C.panel,
                border: `1px solid ${C.line}`,
                display: "grid",
                gridTemplateColumns: "70px 1fr",
                alignItems: "center",
                opacity: p,
                transform: `translateY(${(1 - p) * 22}px)`,
              }}
            >
              <div style={{fontFamily: mono, color: C.yellow, fontSize: 29, fontWeight: 900}}>{number}</div>
              <div>
                <div style={{fontSize: 28, fontWeight: 850}}>{title}</div>
                <div style={{fontFamily: mono, fontSize: 14, color: C.muted, marginTop: 9}}>{detail}</div>
              </div>
            </div>
          );
        })}
      </div>
    </Base>
  );
};

const Baseline: React.FC = () => (
  <Base kicker="EMPTY WORKSPACE · FROZEN PROMPT" title="The one-shot baseline failed. Repeatedly.">
    <MediaFrame label="12 FRESH VMS · 12 RETAINED OUTCOMES" note="INT4 · 40 MIN MAX" x={54} y={170} width={1265} height={820} color={C.red}>
      <Img
        src={staticFile("media/baseline-grid.png")}
        style={{width: "100%", height: "100%", objectFit: "cover"}}
      />
    </MediaFrame>
    <div style={{position: "absolute", left: 1360, right: 54, top: 204, display: "grid", gap: 16}}>
      <Stat value={experiment.baseline} label="EXTERNALLY COMPLETE" color={C.red} />
      <Stat value={experiment.baselineBoot} label="BOOT-CLEAN" color={C.yellow} />
      <Stat value="12-IMAGE" label="COMMON API CEILING" color={C.red} />
      <div style={{fontSize: 23, color: C.muted, lineHeight: 1.45, padding: "12px 4px"}}>
        Attractive screenshots often hid dead imports, truncated JavaScript, false tests, and broken state.
      </div>
    </div>
  </Base>
);

const FirstAha: React.FC = () => (
  <Base kicker="FIRST A-HA" title="Less visual thrashing helped repair—not generation">
    <MediaFrame label="FIXED-STEP GAMEPLAY" note="OFFLINE VIRTUAL TIME · 1080P60" x={60} y={184} width={1130} height={760} color={C.green}>
      <OffthreadVideo
        src={staticFile("media/kart-fixed.mp4")}
        muted
        startFrom={120}
        style={{width: "100%", height: "100%", objectFit: "cover"}}
      />
    </MediaFrame>
    <div style={{position: "absolute", left: 1230, right: 58, top: 205}}>
      <div style={{fontFamily: mono, fontSize: 17, color: C.muted, lineHeight: 1.7}}>
        SAME PARENT
        <br />
        SAME MODEL
        <br />
        SAME CORE REQUEST
      </div>
      <div style={{fontSize: 42, fontWeight: 900, lineHeight: 1.08, marginTop: 30}}>
        Inspect text first.
        <br />
        Budget screenshots.
        <br />
        Keep context compact.
      </div>
      <div style={{height: 4, backgroundColor: C.green, margin: "34px 0 24px"}} />
      <Stat value={experiment.boundedFinal} label="INT4 TEXT-FIRST COMPLETION RATE" color={C.green} />
      <div style={{fontSize: 20, color: C.muted, lineHeight: 1.45, marginTop: 22}}>
        Reliability scaffold—not a kart-specific hint.
      </div>
    </div>
  </Base>
);

const ExtensionAudit: React.FC = () => (
  <Base
    kicker="TAIL REPLICATION · FRESH EMPTY WORKSPACES"
    title="The trick did not transfer—and Qwen caught our bad score"
  >
    <MediaFrame
      label="8 FRESH TEXT-FIRST GENERATION ARMS"
      note="FROZEN 45-SECOND GATE"
      x={54}
      y={182}
      width={1240}
      height={720}
      color={C.red}
    >
      <Img
        src={staticFile("media/extension-grid.png")}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          backgroundColor: C.ink,
        }}
      />
    </MediaFrame>
    <div style={{position: "absolute", left: 1335, right: 54, top: 185, display: "grid", gap: 14}}>
      <Stat value={experiment.generationExtension} label="CORRECTED COMPLETIONS" color={C.red} />
      <Stat value={experiment.generationBoot} label="BOOT-CLEAN" color={C.yellow} />
      <Stat value={experiment.criticCalibration} label="QWEN · ALWAYS-FAIL BASELINE 8/8" color={C.yellow} />
      <div style={{fontSize: 20, color: C.muted, lineHeight: 1.42, marginTop: 4}}>
        Frozen text scoring said 1/8. But the phrase was hidden in the menu.
        At 45.16s: racing, lap 3/3, finished false. Qwen said FAIL at 95%.
        The post-hoc visibility audit agreed. But all eight labels were FAIL,
        so this cohort cannot calibrate success selection.
      </div>
    </div>
    <div
      style={{
        position: "absolute",
        left: 54,
        right: 54,
        bottom: 38,
        fontFamily: mono,
        color: C.yellow,
        fontSize: 16,
        textAlign: "center",
        letterSpacing: 0.8,
      }}
    >
      CONTROLLER EVALUATOR WAS WRONG · ORIGINAL METRIC + CORRECTION BOTH RETAINED
    </div>
  </Base>
);

const Grounded: React.FC = () => (
  <Base kicker="GAUNTLET MECHANISM" title="Fresh critics helped only when the evidence was causal">
    <MediaFrame label="ARENA REPAIR" note="3 → 2 → 0 ENEMIES · REAL SCORE PROGRESSION" x={55} y={177} width={1185} height={790} color={C.green}>
      <OffthreadVideo
        src={staticFile("media/arena-grounded.mp4")}
        muted
        startFrom={660}
        style={{width: "100%", height: "100%", objectFit: "cover"}}
      />
    </MediaFrame>
    <div style={{position: "absolute", left: 1282, right: 56, top: 190}}>
      <div style={{fontFamily: mono, color: C.yellow, fontSize: 15, letterSpacing: 2}}>QWEN CRITIC FOUND:</div>
      <div style={{fontSize: 35, fontWeight: 900, lineHeight: 1.18, marginTop: 16}}>
        Demo fired before it aimed.
      </div>
      <div style={{fontSize: 20, color: C.muted, lineHeight: 1.45, marginTop: 18}}>
        The next fresh Qwen builder received only that diagnosis. The external replay then observed actual enemy and score progression.
      </div>
      <div style={{display: "grid", gap: 14, marginTop: 30}}>
        <Stat value="~42K" label="CRITIC TOKENS" color={C.cyan} />
        <Stat value="1 EDIT" label="SOURCE REPAIR" color={C.green} />
        <Stat value={experiment.grounded} label="PASS / PARTIAL / FAIL · GROUNDED HANDOFFS" color={C.yellow} />
      </div>
    </div>
  </Base>
);

const Breadth: React.FC = () => (
  <Base kicker="NOT OVERFIT TO ONE GAME" title="Same stack. Short brief changed. Quality did not transfer cleanly.">
    <MediaFrame label="KART · ARENA · PLATFORMER" note="COMMON PROMPT SKELETON" x={60} y={185} width={1190} height={790} color={C.yellow}>
      <Img src={staticFile("media/treatment-grid.png")} style={{width: "100%", height: "100%", objectFit: "cover"}} />
    </MediaFrame>
    <div style={{position: "absolute", left: 1290, right: 58, top: 210}}>
      <Stat value="3 GENRES" label="DISTINCT ARTIFACTS" color={C.cyan} />
      <div style={{fontSize: 31, fontWeight: 900, lineHeight: 1.2, marginTop: 28}}>
        Breadth: yes.
        <br />
        Dependability: no.
      </div>
      <div style={{fontSize: 21, color: C.muted, lineHeight: 1.5, marginTop: 22}}>
        {experiment.transfer}. A human could swap the brief and get a different game—but not reliably similar quality.
      </div>
      <div style={{height: 4, backgroundColor: C.yellow, margin: "30px 0"}} />
      <div style={{fontFamily: mono, color: C.yellow, fontSize: 17, lineHeight: 1.6}}>
        MULTIPLAYER GATE: NOT REACHED
        <br />
        AAA CLAIM: NOT SUPPORTED
      </div>
    </div>
  </Base>
);

const Motion: React.FC = () => (
  <Base kicker="PUBLIC SKILLS + FRAME-BY-FRAME QA" title="A still can look fine while the game is physically wrong">
    <MediaFrame label="PLAIN" note="MATCHED PARENT + PROMPT" x={54} y={180} width={884} height={760} color={C.yellow}>
      <OffthreadVideo
        src={staticFile("media/skill-plain-fixed.mp4")}
        muted
        startFrom={120}
        style={{width: "100%", height: "100%", objectFit: "cover"}}
      />
    </MediaFrame>
    <MediaFrame label="PUBLIC SKILL PACK AVAILABLE" note="PINNED · DECLARED TREATMENT" x={982} y={180} width={884} height={760} color={C.red}>
      <OffthreadVideo
        src={staticFile("media/skill-pack-fixed.mp4")}
        muted
        startFrom={120}
        style={{width: "100%", height: "100%", objectFit: "cover"}}
      />
    </MediaFrame>
    <div style={{position: "absolute", left: 64, right: 64, bottom: 40, display: "flex", justifyContent: "space-between", alignItems: "center"}}>
      <div style={{fontFamily: mono, color: C.red, fontSize: 17, fontWeight: 850}}>
        OVEREXPOSURE · BARRIER CLUTTER · CLIPPING · WONKY MOTION
      </div>
      <div style={{fontFamily: mono, color: C.muted, fontSize: 15}}>
        {experiment.skillResult} · {experiment.motionResult}
      </div>
    </div>
  </Base>
);

const TemporalAha: React.FC = () => {
  const frame = useCurrentFrame();
  const rows = [
    ["PLAIN R1", "FOUND WOBBLE", "PROPOSED X", C.red],
    ["PLAIN R2", "CAMERA BUG", "DIFFERENT DEFECT", C.yellow],
    ["SKILL-AVAILABLE R1", "FOUND WOBBLE", "PROPOSED Y", C.green],
    ["SKILL-AVAILABLE R2", "FOUND WOBBLE", "PROPOSED Y", C.green],
  ] as const;
  const arrow = interpolate(frame, [70, 210], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <Base
      kicker="THE TEMPORAL A-HA"
      title="The useful loop was disagreement + a cheap executable check"
      subtitle="No prompt mentioned wheels, rotation axes, or the human-observed defect."
    >
      <div style={{position: "absolute", left: 62, top: 202, width: 720, display: "grid", gap: 12}}>
        {rows.map(([label, diagnosis, repair, color], index) => {
          const p = spring({frame: frame - index * 8, fps: 60, config: {damping: 18, stiffness: 110}});
          return (
            <div
              key={label}
              style={{
                display: "grid",
                gridTemplateColumns: "210px 1fr 180px",
                gap: 16,
                alignItems: "center",
                padding: "20px 22px",
                backgroundColor: C.panel,
                border: `1px solid ${C.line}`,
                borderLeft: `5px solid ${color}`,
                opacity: p,
                transform: `translateX(${(1 - p) * -20}px)`,
              }}
            >
              <div style={{fontFamily: mono, fontSize: 15, color, fontWeight: 900}}>{label}</div>
              <div style={{fontSize: 20, fontWeight: 850}}>{diagnosis}</div>
              <div style={{fontFamily: mono, fontSize: 14, color: C.muted, textAlign: "right"}}>{repair}</div>
            </div>
          );
        })}
      </div>
      <svg width="850" height="540" style={{position: "absolute", left: 815, top: 235}}>
        <defs>
          <marker id="temporal-arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto">
            <path d="M0,0 L0,6 L9,3 z" fill={C.cyan} />
          </marker>
        </defs>
        <line x1={35} y1={255} x2={145 + 75 * arrow} y2={255} stroke={C.cyan} strokeWidth={6} markerEnd="url(#temporal-arrow)" />
        <circle cx={350} cy={255} r={112} fill={C.panel2} stroke={C.line} strokeWidth={3} />
        <ellipse cx={350} cy={255} rx={62} ry={112} fill="none" stroke={C.white} strokeWidth={12} />
        <line x1={350} y1={95} x2={350} y2={415} stroke={C.green} strokeWidth={7} />
        <path d="M300 177 Q350 125 400 177" fill="none" stroke={C.yellow} strokeWidth={8} markerEnd="url(#temporal-arrow)" />
        <text x={350} y={470} textAnchor="middle" fill={C.green} fontFamily={mono} fontSize={30} fontWeight={900}>ROTATION.Y</text>
        <line x1={500} y1={255} x2={650 + 75 * arrow} y2={255} stroke={C.cyan} strokeWidth={6} markerEnd="url(#temporal-arrow)" />
        <rect x={692} y={185} width={150} height={140} fill={C.panel} stroke={C.green} strokeWidth={4} />
        <text x={767} y={240} textAnchor="middle" fill={C.green} fontFamily={mono} fontSize={22} fontWeight={900}>AXLE</text>
        <text x={767} y={276} textAnchor="middle" fill={C.white} fontFamily={mono} fontSize={18}>FIXED</text>
        <text x={767} y={306} textAnchor="middle" fill={C.yellow} fontFamily={mono} fontSize={15}>TREAD MOVES</text>
      </svg>
      <div style={{position: "absolute", left: 840, right: 74, top: 750}}>
        <div style={{fontSize: 26, fontWeight: 900, lineHeight: 1.24}}>
          Qwen generated the correct diagnosis.
          <br />
          A fresh Qwen builder made one source edit.
          <br />
          External race: pass · console: clean.
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 62,
          right: 62,
          bottom: 34,
          padding: "16px 20px",
          border: `1px solid ${C.yellow}`,
          backgroundColor: "rgba(255,211,61,.07)",
          fontFamily: mono,
          color: C.yellow,
          fontSize: 15,
          letterSpacing: 0.5,
          textAlign: "center",
        }}
      >
        2/2 VS 0/2 IS DESCRIPTIVE ONLY · NEITHER SKILL ARM READ THE FULL SKILL · CORRELATION ≠ CAUSATION
      </div>
    </Base>
  );
};

const Precision: React.FC = () => (
  <Base kicker="OFFICIAL BF16 VS PRODUCTION INT4" title="More precision did not remove software mistakes">
    <MediaFrame label="OFFICIAL BF16 · ONE-SHOT FAILURES" note="SAME EMPTY-WORKSPACE PROMPT" x={58} y={190} width={1160} height={720} color={C.red}>
      <Img src={staticFile("media/bf16-failures.png")} style={{width: "100%", height: "100%", objectFit: "contain", backgroundColor: C.ink}} />
    </MediaFrame>
    <div style={{position: "absolute", left: 1260, right: 58, top: 195, display: "grid", gap: 16}}>
      <Stat value={experiment.precision.int4} label="INT4 · MATCHED REPAIR" color={C.cyan} />
      <Stat value={experiment.precision.bf16} label="BF16 · MATCHED REPAIR" color={C.red} />
      <div style={{fontSize: 24, fontWeight: 850, lineHeight: 1.28, marginTop: 12}}>
        One false lap.
        <br />
        One unresolved import.
      </div>
      <div style={{fontSize: 19, color: C.muted, lineHeight: 1.5}}>
        {experiment.precision.note}. Small sample; no universal precision claim.
      </div>
    </div>
  </Base>
);

const Gpu: React.FC = () => {
  const frame = useCurrentFrame();
  const width = 1690;
  const height = 520;
  const progress = interpolate(frame, [25, 250], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const points = gpuTimeline.map((active, index) => {
    const x = 115 + (width * index) / Math.max(1, gpuTimeline.length - 1);
    const y = 260 + height * (1 - active / 24);
    return `${x},${y}`;
  }).join(" ");
  return (
    <Base kicker="MEASURED INFERENCE FABRIC" title="We chased learning rate—not token theater">
      <div style={{position: "absolute", right: 115, top: 154, fontFamily: mono, fontSize: 15, color: C.muted, letterSpacing: 1.2}}>
        P90 ACTIVE CARDS PER EQUAL TIME BUCKET · ACTIVE ≥70% UTILIZATION
      </div>
      <svg width="1920" height="850" style={{position: "absolute", top: 120, left: 0}}>
        {[0, 6, 12, 18, 24].map((value) => {
          const y = 260 + height * (1 - value / 24);
          return (
            <g key={value}>
              <line x1={115} y1={y} x2={1805} y2={y} stroke={C.line} />
              <text x={62} y={y + 7} fill={C.muted} fontFamily={mono} fontSize={18}>{value}</text>
            </g>
          );
        })}
        <defs>
          <clipPath id="reveal">
            <rect x={0} y={0} width={1920 * progress} height={850} />
          </clipPath>
        </defs>
        <polyline points={points} fill="none" stroke={C.cyan} strokeWidth={8} strokeLinejoin="round" clipPath="url(#reveal)" />
        <line x1={115} y1={260 + height * (1 - 20 / 24)} x2={1805} y2={260 + height * (1 - 20 / 24)} stroke={C.yellow} strokeWidth={3} strokeDasharray="14 10" />
      </svg>
      <div style={{position: "absolute", left: 115, right: 115, bottom: 72, display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 18}}>
        <Stat value="0" label="WAITING AT SCALE CHECK" color={C.green} />
        <Stat value="22 / 24" label="MAX ACTIVE CARDS" color={C.cyan} />
        <Stat value="81°C" label="MAX OBSERVED TEMP" color={C.yellow} />
      </div>
    </Base>
  );
};

const Verdict: React.FC = () => {
  const frame = useCurrentFrame();
  const p = spring({frame, fps: 60, config: {damping: 17, stiffness: 90}});
  return (
    <Base>
      <div
        style={{
          position: "absolute",
          left: 100,
          right: 100,
          top: 118,
          opacity: p,
          transform: `translateY(${(1 - p) * 30}px)`,
        }}
      >
        <div style={{fontFamily: mono, color: C.cyan, fontSize: 21, letterSpacing: 4, fontWeight: 850}}>
          THE HONEST RESULT
        </div>
        <div style={{fontSize: 75, lineHeight: 0.99, fontWeight: 950, letterSpacing: -3, color: C.yellow, marginTop: 24, maxWidth: 1580}}>
          {experiment.verdictHeadline}
        </div>
        <div style={{fontSize: 29, lineHeight: 1.42, color: C.white, maxWidth: 1500, marginTop: 30}}>
          {experiment.verdictBody}
        </div>
        <div style={{display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 18, marginTop: 52}}>
          <Stat value="YES" label="REAL FUNCTIONAL REPAIRS" color={C.green} />
          <Stat value="NO" label="AAA-LIKE FINAL QUALITY" color={C.red} />
          <Stat value="GROUND IT" label="BEST REUSABLE LESSON" color={C.cyan} />
        </div>
      </div>
    </Base>
  );
};

const End: React.FC = () => (
  <Base>
    <div style={{position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column"}}>
      <div style={{fontFamily: mono, color: C.cyan, fontSize: 20, letterSpacing: 5}}>PROMPTS · TRAJECTORIES · SOURCE · METRICS · VIDEO</div>
      <div style={{fontSize: 86, fontWeight: 950, letterSpacing: -3, marginTop: 28}}>{experiment.repo}</div>
      <div style={{height: 7, width: 720, backgroundColor: C.yellow, marginTop: 30}} />
      <div style={{fontFamily: mono, color: C.muted, fontSize: 19, marginTop: 28}}>LOCAL QWEN GAUNTLET · NO CHERRY-PICKING</div>
    </div>
  </Base>
);

export const QwenGauntletVideo: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: C.ink}}>
    <Sequence from={0} durationInFrames={300}><Hook /></Sequence>
    <Sequence from={300} durationInFrames={420}><Rules /></Sequence>
    <Sequence from={720} durationInFrames={480}><Baseline /></Sequence>
    <Sequence from={1200} durationInFrames={480}><FirstAha /></Sequence>
    <Sequence from={1680} durationInFrames={420}><ExtensionAudit /></Sequence>
    <Sequence from={2100} durationInFrames={480}><Grounded /></Sequence>
    <Sequence from={2580} durationInFrames={420}><Breadth /></Sequence>
    <Sequence from={3000} durationInFrames={480}><Motion /></Sequence>
    <Sequence from={3480} durationInFrames={420}><TemporalAha /></Sequence>
    <Sequence from={3900} durationInFrames={420}><Precision /></Sequence>
    <Sequence from={4320} durationInFrames={420}><Gpu /></Sequence>
    <Sequence from={4740} durationInFrames={480}><Verdict /></Sequence>
    <Sequence from={5220} durationInFrames={240}><End /></Sequence>
  </AbsoluteFill>
);
