import { StepEngineService } from './step-engine.service';
import { FlowStep } from '../../interfaces/flow';

const engine = new StepEngineService();
const ctx = { locale: 'zh' as const, threadKey: 'tk1', namespace: 'wizard', collected: {} };

describe('StepEngineService', () => {
  it('renders a choice step as buttons carrying threadKey + value', () => {
    const step: FlowStep = {
      id: 'env',
      type: 'choice',
      options: [{ key: 'uat', i18n: { en: 'UAT', zh: 'UAT' } }],
      i18n: { title: { en: 'Env', zh: '环境' } },
    };
    const card = engine.renderStepCard(step, ctx);
    expect(card.header.title).toBe('环境');
    const buttons = card.blocks.find((b) => b.type === 'buttons') as any;
    expect(buttons.actions[0].value).toMatchObject({ tk: 'tk1', stepId: 'env', value: 'uat' });
  });

  it('renders an input step with placeholder + submit', () => {
    const step: FlowStep = { id: 'branch', type: 'input', i18n: { title: { en: 'Branch', zh: '分支' } } };
    const card = engine.renderStepCard(step, ctx);
    const input = card.blocks.find((b) => b.type === 'input') as any;
    expect(input.value).toMatchObject({ tk: 'tk1', stepId: 'branch' });
  });

  it('shouldRender honors when-clause', () => {
    const step: FlowStep = {
      id: 'x', type: 'input',
      when: { field: 'env', equals: 'prod' },
      i18n: { title: { en: 'X', zh: 'X' } },
    };
    expect(engine.shouldRender(step, { env: 'uat' })).toBe(false);
    expect(engine.shouldRender(step, { env: 'prod' })).toBe(true);
  });
});
