import {createIntlDateTimeFormatter, createIntlNumberFormatter, IFormatterStyles} from './intl-formatters';
import {createFormatterRegistry, IFormatterRegistry} from './createFormatterRegistry';

const defaultDateStyles: IFormatterStyles<Intl.DateTimeFormatOptions> = {
  long: {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  },
  default: {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  },
  short: {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  },
  narrow: {
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
  },
};

const defaultTimeStyles: IFormatterStyles<Intl.DateTimeFormatOptions> = {
  default: {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  },
};

const defaultNumberStyles: IFormatterStyles<Intl.NumberFormatOptions> = {
  default: {},
};

const defaultPercentStyles: IFormatterStyles<Intl.NumberFormatOptions> = {
  default: {
    style: 'percent',
  },
};

const defaultIntegerStyles: IFormatterStyles<Intl.NumberFormatOptions> = {
  default: {
    maximumFractionDigits: 0,
  },
};

const defaultCurrencyStyles: IFormatterStyles<Intl.NumberFormatOptions> = {
  default: {
    style: 'currency',
  },
};

export interface IIntlFormatterRegistryOptions {
  dateStyles?: IFormatterStyles<Intl.DateTimeFormatOptions>;
  timeStyles?: IFormatterStyles<Intl.DateTimeFormatOptions>;
  numberStyles?: IFormatterStyles<Intl.NumberFormatOptions>;
  percentStyles?: IFormatterStyles<Intl.NumberFormatOptions>;
  integerStyles?: IFormatterStyles<Intl.NumberFormatOptions>;
  currencyStyles?: IFormatterStyles<Intl.NumberFormatOptions>;
}

export function createIntlFormatterRegistry(options?: IIntlFormatterRegistryOptions): IFormatterRegistry<string> {
  options ||= {};

  const {
    dateStyles,
    timeStyles,
    numberStyles,
    percentStyles,
    integerStyles,
    currencyStyles,
  } = options;

  const registry = createFormatterRegistry<string>();

  registry.register('date', createIntlDateTimeFormatter(Object.assign({}, defaultDateStyles, dateStyles)));
  registry.register('time', createIntlDateTimeFormatter(Object.assign({}, defaultTimeStyles, timeStyles)));
  registry.register('number', createIntlNumberFormatter(Object.assign({}, defaultNumberStyles, numberStyles)));
  registry.register('percent', createIntlNumberFormatter(Object.assign({}, defaultPercentStyles, percentStyles)));
  registry.register('integer', createIntlNumberFormatter(Object.assign({}, defaultIntegerStyles, integerStyles)));
  registry.register('currency', createIntlNumberFormatter(Object.assign({}, defaultCurrencyStyles, currencyStyles)));

  return registry;
}
