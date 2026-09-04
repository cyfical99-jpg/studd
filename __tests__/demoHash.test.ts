import { demoHash } from '@/services/demoHash';

describe('demoHash', () => {
  it('is deterministic for the same input', () => {
    expect(demoHash('demo1234')).toBe(demoHash('demo1234'));
  });

  it('differs for different inputs', () => {
    expect(demoHash('demo1234')).not.toBe(demoHash('demo12345'));
  });

  it('differs for different-case emails/passwords', () => {
    expect(demoHash('Password')).not.toBe(demoHash('password'));
  });
});
