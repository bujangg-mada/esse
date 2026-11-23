import { toast } from 'sonner';

export const notify = {
  success: (message: string) =>
    toast.success(message, {
      style: {
        backgroundColor: '#243B2E',
        border: '1px solid #3E634E',
        color: '#A8C9B5',
        borderRadius: '8px',
        fontFamily: 'Sora, sans-serif',
      },
    }),
  warning: (message: string) =>
    toast.warning(message, {
      style: {
        backgroundColor: '#47331D',
        border: '1px solid #755532',
        color: '#E0C394',
        borderRadius: '8px',
        fontFamily: 'Sora, sans-serif',
      },
    }),
  error: (message: string) =>
    toast.error(message, {
      style: {
        backgroundColor: '#5E1B1E',
        border: '1px solid #963538',
        color: '#F0A8AA',
        borderRadius: '8px',
        fontFamily: 'Sora, sans-serif',
      },
    }),
};
