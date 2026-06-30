import { Locale } from '../flow';

export interface WorkerRequest {
  skill: string;
  locale: Locale;
  collected: Record<string, unknown>;
  prompt: string;
}

export interface WorkerResult {
  result: string;
}
