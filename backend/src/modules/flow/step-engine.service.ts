import { Injectable } from '@nestjs/common';
import { FlowStep, Locale } from '../../interfaces/flow';
import { CardSpec } from './card.types';

export interface StepContext {
  locale: Locale;
  threadKey: string;
  namespace: string; // 'wizard' | 'feedback' — disambiguates the callback owner
  collected: Record<string, unknown>;
}

@Injectable()
export class StepEngineService {
  /** Evaluate when-clause. Absent when → always render. */
  shouldRender(step: FlowStep, collected: Record<string, unknown>): boolean {
    if (!step.when) return true;
    return collected[step.when.field] === step.when.equals;
  }

  /** Render a step to a CardSpec. choice → buttons; input → form. */
  renderStepCard(step: FlowStep, ctx: StepContext): CardSpec {
    const base = { stepId: step.id, tk: ctx.threadKey, namespace: ctx.namespace, locale: ctx.locale };
    const title = step.i18n.title[ctx.locale];
    const note = step.i18n.note?.[ctx.locale];
    const header = { title, color: 'turquoise' };
    const lead = note ? [{ type: 'note' as const, text: note }] : [];

    if (step.type === 'choice' || step.type === 'multiselect') {
      const opts = step.options ?? [];
      return {
        header,
        locale: ctx.locale,
        blocks: [
          ...lead,
          {
            type: 'buttons' as const,
            actions: opts.map((o) => ({ text: o.i18n[ctx.locale], value: { ...base, value: o.key } })),
          },
        ],
      };
    }

    // input
    return {
      header,
      locale: ctx.locale,
      blocks: [
        ...lead,
        {
          type: 'input' as const,
          placeholder: this.placeholder(step, ctx.locale),
          submit: ctx.locale === 'en' ? 'Submit' : '提交',
          value: { ...base },
        },
      ],
    };
  }

  private placeholder(step: FlowStep, locale: Locale): string {
    if (step.default) return locale === 'en' ? `default: ${step.default}` : `默认：${step.default}`;
    return locale === 'en' ? 'Type here…' : '请输入…';
  }
}
