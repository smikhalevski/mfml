import {createMessageComponent} from './createMessageComponent';
import {RuntimeContext} from './RuntimeContext';
import {LocaleContext} from './LocaleContext';

/**
 * Renders a message using a runtime from {@link RuntimeContext} and a locale from {@link LocaleContext}.
 *
 * @see {@link createMessageComponent}
 * @see {@link LocaleProvider}
 */
export const Message = createMessageComponent(RuntimeContext, LocaleContext, ([locale]) => locale);

Message.displayName = 'Message';
