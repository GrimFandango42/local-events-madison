// Simple test to verify Vitest is working
describe('Basic functionality', () => {
  test('should perform basic arithmetic', () => {
    expect(2 + 2).toBe(4);
  });

  test('should handle strings', () => {
    expect('hello'.toUpperCase()).toBe('HELLO');
  });
});