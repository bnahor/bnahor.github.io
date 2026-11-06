/** Default document title; routed pages restore it when they unmount. */
export const SITE_TITLE = 'Rohan Bahl — Engineer';

const publicAsset = (fileName: string) => `${import.meta.env.BASE_URL}${fileName}`;

export const profile = {
  name: 'Rohan Bahl',
  status: 'Open to new roles',
  previously: 'Founding Engineer · Cortex AI',
  location: 'Singapore',
  logline:
    'Engineer. Most recently founding engineer at Cortex AI, and before that at a hedge fund and a robotics company. Open to roles in San Francisco, New York and Singapore.',
  email: 'bnahor.dev@gmail.com',
  links: {
    github: 'https://github.com/bnahor',
    linkedin: 'https://www.linkedin.com/in/rohan-bahl',
    instagram: 'https://www.instagram.com/ubcebicib',
    x: 'https://x.com/rb_9823',
    resume: publicAsset('rohan-bahl-resume.pdf'),
  },
} as const;
