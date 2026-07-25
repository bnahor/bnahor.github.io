export type Experience = {
  company: string;
  role: string;
  location: string;
  start: string;
  end: string;
  current?: boolean;
  summary: string;
  story?: string;
  metrics: string[];
  bullets: string[];
  // How many bullets to show before the "Show more" disclosure.
  featuredBulletCount: number;
  tech: string[];
};

export const experience: Experience[] = [
  {
    company: 'Cortex AI',
    role: 'Founding Engineer',
    location: 'Singapore',
    start: 'Jan 2026',
    end: 'Present',
    current: true,
    summary:
      'I work on the capture stack behind large-scale human-motion datasets.',
    story:
      'A client’s pose stream started jittering badly enough to stop R&D. The regression had already held work up for about six weeks. I traced it to smoothing being applied twice to velocity derivatives. Three hours later, the reconstruction was stable again.',
    metrics: ['1.5 months unblocked', '20 min → <2 min sync', '50+ operators'],
    bullets: [
      'The fix combined raw-derivative 1-Euro filtering, inter-MCP distance constraints, and Jakobsen relaxation.',
      'I wrote the clock-authority layer for Vive Trackers and ZED Boxes on Jetson Orin. It kept video, poses, and IMU samples aligned for 50+ operators across 1,000+ hours.',
      'Three cameras arrived without a shared clock. A VLM alignment pass plus cross-correlation fallback cut session sync time by 90%.',
      'I replaced three weeks of manual planning with a sub-minute allocation workflow across Environment, Scene, Task, and Operator.',
      'I built the mobile capture app in under a week. Native Swift, ARKit, Kotlin, CameraX, and ARCore sit behind one Dart interface.',
      'Browser uploads had to survive weak connections and 3–4K-file batches. Resumable GCS uploads, retry, duplicate detection, and offset recovery stopped the daily failures.',
    ],
    featuredBulletCount: 3,
    tech: [
      'Python',
      'FastAPI',
      'Flutter',
      'Swift',
      'Kotlin',
      'ARKit',
      'ARCore',
      'GCP',
      'PySide6',
      'Jetson Orin',
    ],
  },
  {
    company: 'The Tudor Group',
    role: 'Software Engineer Intern',
    location: 'Singapore',
    start: 'May 2025',
    end: 'Aug 2025',
    summary:
      'Reliability tooling for the SRE and global TradeOps teams.',
    story:
      'A routine Grafana infrastructure update was a ten-hour manual slog across dev, staging, and production. I wrote an Ansible and Python toolkit that turned it into a five-minute job.',
    metrics: ['4 services', '99% less Grafana toil', '95% faster retrieval'],
    bullets: [
      'The SRE team needed Grafana alerts routed in under a second. I replaced the legacy path with four Spring Boot services over ActiveMQ and Redis.',
      'TradeOps used to wait 60 seconds for a FIX log. The React and Spring Boot viewer returned it in three and was adopted by 50+ users.',
    ],
    featuredBulletCount: 2,
    tech: ['Spring Boot', 'ActiveMQ', 'Redis', 'React', 'TypeScript', 'Ansible', 'Grafana'],
  },
  {
    company: 'Upside Robotics',
    role: 'Software Engineer Intern',
    location: 'Waterloo',
    start: 'Aug 2024',
    end: 'Mar 2025',
    summary:
      'Telemetry infrastructure and field tools for autonomous robots.',
    story:
      'Robots kept losing data whenever LTE dropped mid-run in the field. Batching writes with offline caching and recovery made the telemetry 40% more reliable.',
    metrics: ['5M+ records / run', '30% fewer diagnostics', '40% more reliable data'],
    bullets: [
      'Each telemetry run produced more than five million sensor records. I built the Lambda, S3, and DynamoDB pipeline that validated and processed them.',
      'A Next.js and Mapbox operations view put live telemetry and robot location in one place, cutting manual field diagnostics by 30%.',
    ],
    featuredBulletCount: 2,
    tech: ['AWS Lambda', 'S3', 'DynamoDB', 'Next.js', 'TypeScript', 'Mapbox'],
  },
  {
    company: 'CUCU Covers',
    role: 'Software Developer Intern',
    location: 'Toronto',
    start: 'Jan 2024',
    end: 'Aug 2024',
    summary:
      'Analytics and order automation for a small e-commerce team.',
    metrics: ['40% faster decisions', '2× throughput', '55% fewer incidents'],
    bullets: [
      'I put Shopify, Instagram, TikTok, and Sendlane numbers into one Slack report backed by Python, Flask, and MongoDB.',
      'Order parsing and image cleanup were manual. One Python pipeline more than doubled throughput.',
      'Fixing schema mismatches, API failures, and timestamp errors cut production incidents by 55% and made room for two product lines.',
    ],
    featuredBulletCount: 2,
    tech: ['Python', 'Flask', 'MongoDB', 'Slack API', 'Vercel', 'CI/CD'],
  },
  {
    company: 'Accenture',
    role: 'Quality Engineering Intern',
    location: 'Singapore',
    start: 'May 2023',
    end: 'Aug 2023',
    summary:
      'Regression testing inside a 300-person global QA programme.',
    metrics: ['60+ tests automated', '40% less manual QA', '30% faster resolution'],
    bullets: [
      'I logged and tracked more than 100 SAP defects in JIRA while running regression tests.',
      'Sixty automated end-to-end tests in Tricentis Tosca reduced manual QA by 40%.',
      'Shared triage and test plans across development and support shortened average resolution time by 30%.',
    ],
    featuredBulletCount: 2,
    tech: ['Tricentis Tosca', 'JIRA', 'SAP'],
  },
];
