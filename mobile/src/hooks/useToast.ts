import Toast, { type ToastOptions } from 'react-native-toast-message';

export type ToastApi = ((msg: string, opts?: ToastOptions) => void) & {
  success: (msg: string, opts?: ToastOptions) => void;
  error: (msg: string, opts?: ToastOptions) => void;
  info: (msg: string, opts?: ToastOptions) => void;
};

export function useToast(): ToastApi {
  const notify = ((msg: string, opts?: ToastOptions) => {
    Toast.show({ type: 'info', text1: msg, ...opts });
  }) as ToastApi;

  notify.success = (msg: string, opts?: ToastOptions) => {
    Toast.show({ type: 'success', text1: msg, ...opts });
  };

  notify.error = (msg: string, opts?: ToastOptions) => {
    Toast.show({ type: 'error', text1: msg, ...opts });
  };

  notify.info = (msg: string, opts?: ToastOptions) => {
    Toast.show({ type: 'info', text1: msg, ...opts });
  };

  return notify;
}