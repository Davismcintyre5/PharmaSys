import toast, { ToastOptions } from 'react-hot-toast';

export type ToastApi = ((msg: string, opts?: ToastOptions) => string) & {
  success: (msg: string, opts?: ToastOptions) => string;
  error: (msg: string, opts?: ToastOptions) => string;
  info: (msg: string, opts?: ToastOptions) => string;
  default: (msg: string, opts?: ToastOptions) => string;
};

export function useToast(): ToastApi {
  const notify = ((msg: string, opts?: ToastOptions) => toast(msg, opts)) as ToastApi;

  notify.success = (msg: string, opts?: ToastOptions) => toast.success(msg, opts);
  notify.error = (msg: string, opts?: ToastOptions) => toast.error(msg, opts);
  notify.info = (msg: string, opts?: ToastOptions) => toast(msg, opts);
  notify.default = notify;

  return notify;
}