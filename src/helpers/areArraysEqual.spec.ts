import areArraysEqual from './areArraysEquals';

describe('areArraysEqual', () => {
  it('should return true for equal arrays with the same elements in the same order', () => {
    const array1 = [1, 2, 3];
    const array2 = [1, 2, 3];
    expect(areArraysEqual(array1, array2)).toBe(true);
  });

  it('should return true for equal arrays with the same elements in different order', () => {
    const array1 = [1, 2, 3];
    const array2 = [3, 1, 2];
    expect(areArraysEqual(array1, array2)).toBe(true);
  });

  it('should return false for arrays with different lengths', () => {
    const array1 = [1, 2, 3];
    const array2 = [1, 2];
    expect(areArraysEqual(array1, array2)).toBe(false);
  });

  it('should return false for arrays with the same length but different elements', () => {
    const array1 = [1, 2, 3];
    const array2 = [4, 5, 6];
    expect(areArraysEqual(array1, array2)).toBe(false);
  });

  it('should return true for empty arrays', () => {
    const array1: any[] = [];
    const array2: any[] = [];
    expect(areArraysEqual(array1, array2)).toBe(true);
  });

  it('should handle arrays with different types correctly', () => {
    const array1 = [1, '2', true];
    const array2 = [true, 1, '2'];
    expect(areArraysEqual(array1, array2)).toBe(true);
  });
});
