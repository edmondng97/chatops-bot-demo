import { FlowConfig } from '../interfaces/flow';
import diagnose from './diagnose.json';

describe('diagnose flow config', () => {
  const cfg = diagnose as unknown as FlowConfig;

  it('declares triggers, steps, closePolicy and worker skill', () => {
    expect(cfg.command).toBe('diagnose');
    expect(cfg.triggers.en).toContain('diagnose');
    expect(cfg.triggers.zh).toContain('诊断');
    expect(cfg.closePolicy).toBe('conversational');
    expect(cfg.worker.skill).toBe('diagnose-orchestrator');
    expect(cfg.steps.map((s) => s.id)).toEqual(['env', 'branch']);
  });

  it('every step text has both en and zh', () => {
    for (const step of cfg.steps) {
      expect(step.i18n.title.en).toBeTruthy();
      expect(step.i18n.title.zh).toBeTruthy();
    }
  });
});
