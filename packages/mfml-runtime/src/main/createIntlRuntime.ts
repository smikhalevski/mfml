import {createRuntime, IRuntimeOptions} from './createRuntime';
import {IRuntime} from './runtime-types';
import {IFormatterRegistry} from './createFormatterRegistry';
import {createIntlFormatterRegistry} from './createIntlFormatterRegistry';

export interface IIntlRuntime<Result> extends IRuntime<Result> {
  registerFormatter: IFormatterRegistry<Result | string>['register'];
}

export function createIntlRuntime<Result>(options: IRuntimeOptions<Result>): IIntlRuntime<Result> {
  options = Object.assign({}, options);
  options.formatterRegistry ||= createIntlFormatterRegistry();

  const runtime = createRuntime(options) as IIntlRuntime<Result>;

  runtime.registerFormatter = options.formatterRegistry.register;

  return runtime;
}
