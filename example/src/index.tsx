import {render} from 'react-dom';
import {FunctionComponent} from 'react';
import {LocaleProvider, Message, RuntimeProvider, useLocale} from 'mfml-react-runtime';
import {AppMessages} from './gen';
import {reactRuntime} from './reactRuntime';

const LocaleSelect: FunctionComponent = () => {
  // The `useLocale` hook from `mfml-react-runtime` returns the locale provided by `LocaleProvider`.
  const [locale, setLocale] = useLocale();
  return (
      <select
          value={locale}
          onChange={(event) => setLocale(event.target.value)}
      >
        <option value={'en-US'}>{'English'}</option>
        <option value={'ru-RU'}>{'Russian'}</option>
      </select>
  );
};

const App: FunctionComponent = () => (

    // RuntimeProvider is optional. The default runtime renders all tags using createElement. Since there's a custom
    // element `<red-button>` in translations, a runtime that can handle that element must be provided.
    <RuntimeProvider value={reactRuntime}>

      {/* LocaleProvider is optional. By default it provides "en" locale to underlying children. */}
      <LocaleProvider initialLocale={'en-US'}>
        <Message
            message={AppMessages.sayHello}
            values={{userName: 'Karen'}}
        />
        <hr/>
        <Message
            message={AppMessages.visitCounter}
            values={{
              visitCount: 100,
              visitDate: new Date(),
            }}
        />
        <hr/>
        <LocaleSelect/>
      </LocaleProvider>
    </RuntimeProvider>
);

render(<App/>, document.body.appendChild(document.createElement('div')));
