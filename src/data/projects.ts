export type Project = {
  slug: string;
  title: string;
  href?: string;
  description: string;
  role: string;
  scope: string;
  impact: string;
  whyItMattered: string;
  measurableOutcome: string;
  metrics: string[];
  constraints: string[];
  architecture: string[];
  tech: string[];
  featured?: boolean;
  caseStudy?: {
    challenge: string;
    architecture: string[];
    tradeoffs: string[];
    outcome: string[];
  };
};

export const projects: Project[] = [
{
    slug: "gui-murphy",
    title: "GUI Murphy (TikTok Techjam 2025)",
    href: "https://github.com/RB9823/techjam-2025-final",
    description: "Automated UI inconsistency detection with a review workflow for fast visual regression triage.",
    role: "Backend and validation workflow",
    scope: "Hackathon prototype from screenshot ingestion through reviewer-facing GUI",
    impact: "Built and delivered under tight hackathon timelines.",
    whyItMattered: "UI regressions are expensive when detected late; the goal was to make validation immediate and visual.",
    measurableOutcome: "Delivered a functional prototype in a single competition cycle with end-to-end detection and review flows.",
    metrics: ["End-to-end validation loop", "Competition-cycle delivery", "Reviewer-ready GUI"],
    constraints: ["Tight demo timeline", "Ambiguous UI mismatch classes", "Need for human-readable findings"],
    architecture: ["Screenshot/layout processing", "Expected-vs-observed validation layer", "Triage GUI"],
    tech: ["Python", "OpenParser"],
    featured: true,
    caseStudy: {
      challenge:
        "Create a practical, demo-ready system that flags UI inconsistencies quickly enough to be useful during active product iteration.",
      architecture: [
        "Python processing service for screenshot and layout analysis.",
        "Validation layer that compares expected and observed UI patterns.",
        "Desktop-style GUI to surface actionable mismatches for fast triage.",
      ],
      tradeoffs: [
        "Prioritized detection speed and usability over deep model complexity.",
        "Focused scope on highest-signal inconsistency classes to keep quality stable.",
      ],
      outcome: [
        "Shipped an end-to-end validation experience with clear reviewer feedback loops.",
        "Created a base architecture suitable for future CI-driven UI checks.",
      ],
    },
  },
  {
    slug: "smart-storybook",
    title: "Smart Storybook (ETHGlobal SF 2024)",
    href: "https://github.com/imjwang/storybook",
    description: "Creator workflow joining AI-assisted story generation, IPFS persistence, and tokenized ownership.",
    role: "FastAPI backend and storage integration",
    scope: "Backend orchestration, metadata workflows, and Pinata/IPFS integration",
    impact: "Won 2nd place, Best AI Application.",
    whyItMattered: "The project explored creator ownership economics with low-friction publishing primitives.",
    measurableOutcome: "Awarded 2nd place (Best AI Application) at ETHGlobal SF 2024.",
    metrics: ["2nd place", "Best AI Application", "Creation-to-minting prototype"],
    constraints: ["Hackathon judging window", "Web3 onboarding friction", "Durable asset metadata"],
    architecture: ["FastAPI orchestration service", "Pinata/IPFS asset layer", "Minting and ownership flow"],
    tech: ["FastAPI", "Pinata", "IPFS", "Python", "Web3"],
    featured: true,
    caseStudy: {
      challenge:
        "Build a creator workflow that combines AI assistance with durable asset storage and tokenized ownership.",
      architecture: [
        "FastAPI backend handling content generation orchestration and metadata workflows.",
        "Pinata + IPFS storage layer for persistent decentralized asset hosting.",
        "Web3 integration for minting and ownership flows.",
      ],
      tradeoffs: [
        "Chose rapid integration with proven infra providers over fully custom chain tooling.",
        "Kept UX intentionally simple to reduce onboarding friction during demos.",
      ],
      outcome: [
        "Produced a cohesive prototype that connected creation, storage, and monetization.",
        "Validated product narrative through strong hackathon judging feedback.",
      ],
    },
  },
  {
    slug: "sentiment-genai",
    title: "sentiment. (GenAI Genesis Hackathon 2024)",
    href: "https://github.com/RB9823/GenAI",
    description: "Full-stack sentiment tool for text and voice notes with clear asynchronous processing states.",
    role: "Full-stack product engineering",
    scope: "React interface, Flask backend, and model/API integration for text and audio inputs",
    impact: "Developed a full-stack sentiment analysis app (React/Flask) integrating OpenAI GPT-3.5 API for text/voice analysis",
    whyItMattered: "It tested a multi-modal workflow where users can move between text and voice without changing tools.",
    measurableOutcome: "Delivered a full-stack MVP integrating text and voice sentiment inference in one interface.",
    metrics: ["Text + voice inputs", "Single interface workflow", "Full-stack MVP"],
    constraints: ["Async inference latency", "Input mode switching", "Demo-ready reliability"],
    architecture: ["React multi-modal input UI", "Flask orchestration API", "Inference and transcription pipeline"],
    tech: ["React", "Flask", "OpenAI API", "Python", "TypeScript"],
    featured: true,
    caseStudy: {
      challenge:
        "Unify text and audio sentiment processing in a single interface while preserving responsive UX.",
      architecture: [
        "React frontend for multi-modal input and quick result visualization.",
        "Flask backend orchestrating transcription and sentiment inference.",
        "API integration for text and voice model pipelines.",
      ],
      tradeoffs: [
        "Optimized for end-to-end usability and iteration speed over exhaustive model tuning.",
        "Used clear intermediate states to keep users informed during asynchronous processing.",
      ],
      outcome: [
        "Shipped a working multi-modal sentiment tool suitable for demo and validation.",
        "Established a reusable integration pattern for future AI-assisted interfaces.",
      ],
    },
  }
];
