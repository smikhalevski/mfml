import {createMessageComponent} from './createMessageComponent';
import {RuntimeContext} from './RuntimeProvider';
import {LocaleContext} from './LocaleProvider';
import {createMessageHook} from './createMessageHook';

/**
 * Renders a message using a runtime from {@link RuntimeContext} and a locale from {@link LocaleContext}.
 *
 * @see {@link createMessageComponent}
 */
export const Message = createMessageComponent(RuntimeContext, LocaleContext, ([locale]) => locale);

Message.displayName = 'Message';

/**
 * The React hook that returns a callback that renders a message function using a runtime from {@link RuntimeContext}
 * and a locale from {@link LocaleContext}.
 *
 * @see {@link createMessageHook}
 */
export const useMessage = createMessageHook(RuntimeContext, LocaleContext, ([locale]) => locale);
