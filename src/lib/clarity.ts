import { clarity } from 'clarity-js';

export const initializeClarity = () => {
  if (import.meta.env.PROD) { // Only initialize in production
    clarity.start({
      projectId: 'rapt7iilco',
      track: true,
      content: true
    });
    console.log('Clarity initialized');
  }
};

export { clarity };
