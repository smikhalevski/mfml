import {render, screen} from '@testing-library/react';
import React from 'react';
import {MessageFunction, RuntimeMethod} from 'mfml-runtime';
import {LocaleProvider, Message} from '../main/Message';

describe('Message', () => {

  const aaaBbb: MessageFunction = (runtime, locale) => {
    return runtime[RuntimeMethod.LOCALE](locale, ['en', 'ru']) === 1 ? runtime[RuntimeMethod.FRAGMENT]('ппп', 'ттт') : runtime[RuntimeMethod.FRAGMENT]('aaa', 'bbb');
  };

  const aaaBbbCcc: MessageFunction<{ ccc: string }> = (runtime, locale, values) => {
    return runtime[RuntimeMethod.FRAGMENT]('aaa', runtime[RuntimeMethod.ARGUMENT](values.ccc), 'bbb');
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
});
