const publicAsset = (fileName: string) => `${import.meta.env.BASE_URL}${fileName}`;

export const profile = {
  name: 'Rohan Bahl',
  role: 'Founding Engineer',
  company: 'Cortex AI',
  location: 'Singapore',
  valueProp:
    'I’m Rohan, a founding engineer at Cortex AI. I’ve built sub-second alerting for a hedge fund’s SRE team, telemetry pipelines for autonomous robots, and the capture infrastructure behind large-scale motion datasets — along with the dashboards, desktop apps, and mobile clients people use to run them.',
  email: 'bnahor.dev@gmail.com',
  links: {
    github: 'https://github.com/bnahor',
    linkedin: 'https://www.linkedin.com/in/rohan-bahl',
    instagram: 'https://www.instagram.com/ubcebicib',
    x: 'https://x.com/rb_9823',
    resume: publicAsset('rohan-bahl-resume.pdf'),
  },
} as const;
