/** Default document title; routed pages restore it when they unmount. */
export const SITE_TITLE = 'Rohan Bahl — Backend & Robotics Systems Engineer';

const publicAsset = (fileName: string) => `${import.meta.env.BASE_URL}${fileName}`;

export const profile = {
  name: 'Rohan Bahl',
  status: 'Open to new roles',
  previously: 'Founding Engineer · Cortex AI',
  location: 'Singapore',
  logline:
    'Backend and robotics systems engineer. I built the capture stack behind large-scale human-motion datasets as a founding engineer at Cortex AI. Open to new roles.',
  email: 'bnahor.dev@gmail.com',
  links: {
    github: 'https://github.com/bnahor',
    linkedin: 'https://www.linkedin.com/in/rohan-bahl',
    instagram: 'https://www.instagram.com/ubcebicib',
    x: 'https://x.com/rb_9823',
    resume: publicAsset('rohan-bahl-resume.pdf'),
  },
} as const;
