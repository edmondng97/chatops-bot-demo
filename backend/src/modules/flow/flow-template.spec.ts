import { renderTemplate } from './flow-template';

describe('renderTemplate', () => {
  it('substitutes {{collected.x}} tokens', () => {
    const out = renderTemplate('env={{collected.env}} branch={{collected.branch}}', {
      collected: { env: 'uat', branch: 'main' },
    });
    expect(out).toBe('env=uat branch=main');
  });

  it('leaves unknown tokens empty', () => {
    expect(renderTemplate('x={{collected.missing}}', { collected: {} })).toBe('x=');
  });
});
