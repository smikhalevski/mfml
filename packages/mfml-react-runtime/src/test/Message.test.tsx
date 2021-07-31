import {render, screen} from '@testing-library/react';
import React from 'react';
import {MessageFunction} from 'mfml-runtime';
import {LocaleProvider, Message, useMessage} from '../main/Message';

describe('Message', () => {

  const aaaBbb: MessageFunction<void> = (r, locale) => {
    return r.l(locale, ['en', 'ru']) === 1 ? r.f('ппп', 'ттт') : r.f('aaa', 'bbb');
  };

  const aaaBbbCcc: MessageFunction<{ ccc: string }> = (r, locale, values) => {
    return r.f('aaa', r.a(locale, values.ccc), 'bbb');
  };

  test('renders a message', () => {
    render(<Message message={aaaBbb}/>);

    expect(screen.queryByText('aaabbb')).not.toBeNull();
  });

  test('renders a message with locale', () => {
    render(<LocaleProvider value={'ru'}><Message message={aaaBbb}/></LocaleProvider>);

    expect(screen.queryByText('пппттт')).not.toBeNull();
  });

  test('renders a message with values', () => {
    render(<Message message={aaaBbbCcc} values={{ccc: 'CCC'}}/>);

    expect(screen.queryByText('aaaCCCbbb')).not.toBeNull();
  });

  test('renders a message with values', () => {
    const t = useMessage();

    t(aaaBbb);
    t(aaaBbbCcc, {ccc: ''});
  });
});
