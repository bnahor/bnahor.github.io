/** Default document title; routed pages restore it when they unmount. */
export const SITE_TITLE = 'Rohan Bahl — Backend & Robotics Systems Engineer';

const publicAsset = (fileName: string) => `${import.meta.env.BASE_URL}${fileName}`;

export const profile = {
  name: 'Rohan Bahl',
  status: 'Open to new roles',
  previously: 'Founding Engineer · Cortex AI',
  location: 'Singapore',
  valueProp:
    'I’m Rohan, a backend and robotics-systems engineer, most recently a founding engineer at Cortex AI — and now looking for what’s next. I’ve built sub-second alerting for a hedge fund’s SRE team, telemetry pipelines for autonomous robots, and the capture infrastructure behind large-scale motion datasets — along with the dashboards, desktop apps, and mobile clients people use to run them.',
  email: 'bnahor.dev@gmail.com',
  links: {
    github: 'https://github.com/bnahor',
    linkedin: 'https://www.linkedin.com/in/rohan-bahl',
    instagram: 'https://www.instagram.com/ubcebicib',
    x: 'https://x.com/rb_9823',
    resume: publicAsset('rohan-bahl-resume.pdf'),
  },
} as const;
