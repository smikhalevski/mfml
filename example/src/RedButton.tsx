import {createContext, FunctionComponent} from 'react';
import {createMessageHook, LocaleContext} from 'mfml-react-runtime';
import {createStringRuntime} from 'mfml-runtime';
import {RedButtonMessages} from './gen';

// A context that would propagate a string runtime to underlying children.
const StringRuntimeContext = createContext(createStringRuntime());

// This a custom hook that uses a runtime provided by `StringRuntimeContext` and a locale provided by `LocaleContext`
// to render messages. The last argument describes how locale should be retrieved from the `LocaleContext` value.
const useStringMessage = createMessageHook(StringRuntimeContext, LocaleContext, ([locale]) => locale);

const RedButton: FunctionComponent = ({children}) => {
  const t = useStringMessage();
  return (
      <button
          style={{color: 'red'}}
          onClick={() => alert(t(RedButtonMessages.alertContent))}
      >
        {children}
      </button>
  );
};

export default RedButton;
