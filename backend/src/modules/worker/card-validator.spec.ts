import { buildRepairPrompt, toReportReply, validateWorkerCard, WorkerCard } from './card-validator';

describe('card-validator', () => {
  const good: WorkerCard = { title: 'Diagnosis', blocks: [{ type: 'text', text: 'root cause…' }, { type: 'note', text: 'confidence 82%' }] };
  it('accepts a valid card', () => {
    expect(validateWorkerCard(good)).toEqual({ ok: true, card: good });
  });
  it('rejects missing title / empty blocks / unknown block type with named errors', () => {
    expect(validateWorkerCard({ blocks: [] })).toMatchObject({ ok: false, errors: expect.arrayContaining([expect.stringContaining('title'), expect.stringContaining('blocks')]) });
    expect(validateWorkerCard({ title: 't', blocks: [{ type: 'image', text: 'x' }] })).toMatchObject({ ok: false, errors: [expect.stringContaining('image')] });
    expect(validateWorkerCard(null)).toMatchObject({ ok: false });
  });
  it('repair prompt lists errors and restates grammar', () => {
    const p = buildRepairPrompt(['bad type: image']);
    expect(p).toContain('bad type: image');
    expect(p).toContain('EXACTLY');
  });
  it('renders a neutral CardSpec reply', () => {
    const reply = toReportReply(good, 'en');
    expect(reply).toMatchObject({ kind: 'card', card: { header: { title: 'Diagnosis' }, blocks: [{ type: 'text', text: 'root cause…' }, { type: 'note', text: 'confidence 82%' }] } });
  });
});
