import {createMessageHook} from './createMessageHook';
import {RuntimeContext} from './RuntimeContext';
import {LocaleContext} from './LocaleContext';

/**
 * The React hook that returns a callback that renders a message function using a runtime from {@link RuntimeContext}
 * and a locale from {@link LocaleContext}.
 *
 * @see {@link createMessageHook}
 * @see {@link LocaleProvider}
 */
export const useMessage = createMessageHook(RuntimeContext, LocaleContext, ([locale]) => locale);
