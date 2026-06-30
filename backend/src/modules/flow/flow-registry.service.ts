import { Injectable } from '@nestjs/common';
import { FlowConfig, Locale } from '../../interfaces/flow';
import diagnose from '../../flows/diagnose.json';

/**
 * Registry of config-driven flows. Adding a capability = adding one JSON file here.
 * Routing and lifecycle code stay untouched.
 */
@Injectable()
export class FlowRegistryService {
  private readonly flows: FlowConfig[] = [diagnose as unknown as FlowConfig];

  get(command: string): FlowConfig | undefined {
    return this.flows.find((f) => f.command === command);
  }

  /** Infer command + locale from a trigger keyword found anywhere in the text. */
  match(text: string): { config: FlowConfig; locale: Locale } | undefined {
    const lower = text.toLowerCase();
    for (const config of this.flows) {
      if (config.triggers.en.some((t) => lower.includes(t.toLowerCase()))) {
        return { config, locale: 'en' };
      }
      if (config.triggers.zh.some((t) => text.includes(t))) {
        return { config, locale: 'zh' };
      }
    }
    return undefined;
  }
}
