import {MessageFunction} from '../main/runtime-types';
import {createStringRuntime} from '../main/createStringRuntime';

describe('stringRuntime', () => {

  const runtime = createStringRuntime();

  const message: MessageFunction<{ aaa: Date | number, ccc: number }> = (r, locale, values) => {
    return r.f(r.a(locale, values.aaa), '__', r.e('strong', null, r.a(locale, values.ccc)));
  };

  test('renders message as a string', () => {
    const date = new Date('2021-08-05T10:39:53.688Z');

    expect(message(runtime, 'en', {aaa: date, ccc: 123123.123}))
        .toBe(date + '__123123.123');
  });
});
