import {compileEmptyFragment, compileNode, INodeCompilerOptions} from './compileNode';
import {isBlankNode, Node} from '../parser';
import {RuntimeMethod} from 'mfml-runtime';
import {jsonStringify} from '../misc';

/**
 * The mapping from a locale to an AST node.
 */
export interface ILocaleNodeMap {
  [locale: string]: Node;
}

export interface ILocaleNodeMapCompilerOptions extends Pick<INodeCompilerOptions,
    | 'otherSelectCaseKey'
    | 'indexVarName'
    | 'provideArgumentVarName'
    | 'onFunctionUsed'
    | 'onSelectUsed'
    | 'onRuntimeMethodUsed'> {

  /**
   * The name of the variable that holds the current locale.
   */
  localeVarName: string;

  /**
   * The default locale from {@link locales}.
   */
  defaultLocale: string;

  /**
   * The list of all supported locales stored in {@link localesVarName}.
   */
  locales: Array<string>;

  /**
   * The name of the variable that holds an array of locales supported by the message.
   */
  localesVarName: string;
}

/**
 * Compiles mapping from locale to AST node to a source code.
 *
 * @param localeNodeMap The map from locale to an AST node.
 * @param options The compiler options.
 */
export function compileLocaleNodeMap(localeNodeMap: ILocaleNodeMap, options: Readonly<ILocaleNodeMapCompilerOptions>): string {

  const {
    localeVarName,
    indexVarName,
    defaultLocale,
    locales,
    localesVarName,
    onRuntimeMethodUsed,
  } = options;

  const blankIndices: Array<number> = [];

  let defaultSrc = '';
  let childrenSrc = '';
  let childrenCount = 0;

  const nodeCompilerOptions: INodeCompilerOptions = Object.assign({localeSrc: localeVarName}, options);

  for (let i = 0; i < locales.length; ++i) {
    const locale = locales[i];
    const node = localeNodeMap[locale];

    if (node == null) {
      // Absent translations are replaced with default
      continue;
    }
    if (locale === defaultLocale) {
      // The default translation
      nodeCompilerOptions.localeSrc = jsonStringify(locale);
      defaultSrc = compileNode(node, nodeCompilerOptions);
      continue;
    }
    if (isBlankNode(node)) {
      // Blank translations are rendered as blank
      blankIndices.push(i);
      continue;
    }
    if (childrenCount !== 0) {
      childrenSrc += ':' + indexVarName;
    }

    nodeCompilerOptions.localeSrc = localeVarName;
    childrenSrc += '===' + i + '?' + compileNode(node, nodeCompilerOptions);
    childrenCount++;
  }

  const caseCount = childrenCount + blankIndices.length;

  if (caseCount === 0) {
    return defaultSrc || compileEmptyFragment(onRuntimeMethodUsed);
  }

  if (childrenCount === 0 && defaultSrc === '') {
    return compileEmptyFragment(onRuntimeMethodUsed);
  }

  let src = '';

  if (caseCount === 1) {
    onRuntimeMethodUsed?.(RuntimeMethod.LOCALE, false);
  } else {
    onRuntimeMethodUsed?.(RuntimeMethod.LOCALE, true);

    src += '(' + indexVarName + '=';
  }

  src += RuntimeMethod.LOCALE + '(' + localeVarName + ',' + localesVarName + ')';

  if (caseCount !== 1) {
    src += ',' + indexVarName;
  }

  src += childrenSrc;

  if (blankIndices.length !== 0 && defaultSrc !== '') {
    if (childrenCount !== 0) {
      src += ':' + indexVarName;
    }
    for (let i = 0; i < blankIndices.length; ++i) {
      if (i !== 0) {
        src += '||' + indexVarName;
      }
      src += '===' + blankIndices[i];
    }
    src += '?' + compileEmptyFragment(onRuntimeMethodUsed);
  }

  src += ':' + (defaultSrc || compileEmptyFragment(onRuntimeMethodUsed));

  if (caseCount !== 1) {
    src += ')';
  }

  return src;
}
