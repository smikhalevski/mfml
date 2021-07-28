/**
 * Holds all information about the message.
 */
export interface IMessage {

  /**
   * The translations of the message to applicable locales.
   */
  translations: {
    [locale: string]: string;
  };
}

/**
 * The group of messages compiled into a single module.
 */
export interface IMessageModule {

  /**
   * The list of messages in the module.
   */
  messages: {
    [messageName: string]: IMessage;
  };
}
