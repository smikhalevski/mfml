export const enum RuntimeMethod {
  LOCALE = 'l',
  FRAGMENT = 'f',
  ARGUMENT = 'a',
  ELEMENT = 'e',

  /**
   * A method that creates an element that has no attributes.
   */
  SHORT_ELEMENT = 'E',
  FUNCTION = 'c',
  PLURAL = 'p',
  SELECT = 's',
  SELECT_ORDINAL = 'o',
}

export const runtimeMethods = [
  RuntimeMethod.LOCALE,
  RuntimeMethod.FRAGMENT,
  RuntimeMethod.ARGUMENT,
  RuntimeMethod.ELEMENT,
  RuntimeMethod.SHORT_ELEMENT,
  RuntimeMethod.FUNCTION,
  RuntimeMethod.PLURAL,
  RuntimeMethod.SELECT,
  RuntimeMethod.SELECT_ORDINAL,
];
