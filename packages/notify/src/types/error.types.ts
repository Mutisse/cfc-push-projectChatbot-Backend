export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
}

export type SafeError = {
  message: string;
  code?: string;
  details?: any;
};