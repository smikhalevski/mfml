import {MessageFunction} from '../main/runtime-types';
import {stringRuntime} from '../main/stringRuntime';

describe('stringRuntime', () => {

  const message: MessageFunction<{ aaa: Date | number, ccc: number }> = (r, locale, values) => {
    return r.f(r.a(locale, values.aaa), '__', r.a(locale, values.ccc));
  };

  test('formats ', () => {
    expect(message(stringRuntime, 'en', {aaa: new Date(123456789), ccc: 123123.123}))
        .toBe('1/2/1970__123,123.123');

    expect(message(stringRuntime, 'ru', {aaa: new Date(123456789), ccc: 123123.123}))
        .toBe('02.01.1970__123\u00a0123,123');
  });

  test('converts ', () => {
    expect(message(stringRuntime, 'en', {aaa: new Date(123456789), ccc: 123123.123}))
        .toBe('1/2/1970__123,123.123');
  });
});
