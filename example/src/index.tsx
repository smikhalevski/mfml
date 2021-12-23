import {render} from 'react-dom';
import {FC} from 'react';
import {LocaleProvider, Message, RuntimeContext, useLocale} from '@mfml/react-runtime';
import {AppMessages} from './gen';
import {reactRuntime} from './reactRuntime';

const LocaleSelect: FC = () => {
  // The `useLocale` hook from `@mfml/react-runtime` returns the locale provided by `LocaleProvider`.
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

const App: FC = () => (

    // RuntimeProvider is optional. The default runtime renders all tags using createElement. Since there's a custom
    // element `<red-button>` in translations, a runtime that can handle that element must be provided.
    <RuntimeContext.Provider value={reactRuntime}>

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
    </RuntimeContext.Provider>
);

render(<App/>, document.body.appendChild(document.createElement('div')));
