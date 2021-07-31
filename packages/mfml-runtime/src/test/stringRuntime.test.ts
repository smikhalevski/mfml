import {MessageFunction} from '../main';
import {stringRuntime} from '../main/stringRuntime';

describe('stringRuntime', () => {

  const message: MessageFunction<{ aaa: Date | number, ccc: number }> = (r, locale, values) => {
    return r.f(r.a(locale, values.aaa), '__', r.a(locale, values.ccc));
  };

  test('renders a string', () => {
    expect(message(stringRuntime, 'en', {aaa: new Date(), ccc: 123123}))
        .toBe('7/31/2021__123,123');
  });
});
