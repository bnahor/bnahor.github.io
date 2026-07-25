export type Profile = {
  name: string;
  role: string;
  valueProp: string;
  personalBlurb: string;
  proofPoints: {
    value: string;
    label: string;
    context: string;
  }[];
  operatingPrinciples: string[];
  email: string;
  timezone: string;
  location: string;
  availability: string;
  now: {
    focus: string;
    learning: string;
    beyondCode: string;
  };
  links: {
    github: string;
    linkedin: string;
    resume: string;
  };
};

export const profile: Profile = {
  name: "Rohan Bahl",
  role: "Backend + Platform Engineer",
  valueProp: "I build calm, observable systems for trading desks, robot fleets, and teams that need software to behave under pressure.",
  personalBlurb:
    "I care about the handoff between architecture and operations: clear ownership, predictable failure modes, and interfaces that make the next action obvious.",
  proofPoints: [
    {
      value: "99%",
      label: "less dashboard toil",
      context: "Grafana automation moved repeat infra work from 10h to 5m.",
    },
    {
      value: "95%",
      label: "faster log retrieval",
      context: "FIX log viewer reduced extraction latency from 60s to 3s.",
    },
    {
      value: "5M+",
      label: "telemetry points/run",
      context: "Serverless robot fleet pipeline processed production-scale runs.",
    },
    {
      value: "20+",
      label: "robots in the field",
      context: "Live telemetry and resilient firmware supported fleet operations.",
    },
  ],
  operatingPrinciples: [
    "Design for the person on call, not the happy-path demo.",
    "Make ownership visible in the interface and in the system boundary.",
    "Prefer boring, observable primitives over clever abstractions.",
  ],
  email: "rohan_bahl@u.nus.edu",
  timezone: "Asia/Singapore (UTC+08:00)",
  location: "Singapore",
  availability: "Open to software engineering opportunities in 2026.",
  now: {
    focus: "Distributed backend platforms with strong incident ergonomics.",
    learning: "Deeper production architecture patterns for event-driven systems.",
    beyondCode: "Writing short engineering notes and collecting lessons from shipped systems.",
  },
  links: {
    github: "https://github.com/RB9823",
    linkedin: "https://www.linkedin.com/in/rohan-bahl",
    resume: "/Rohan_Bahl_Resume.pdf",
  },
};
