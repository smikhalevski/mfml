import {compileBlankValue, compileNode, INodeCompilerOptions} from './compileNode';
import {isBlankNode, Node} from '../parser';
import {RuntimeMethod} from '../runtime';

/**
 * The mapping from a locale to an AST node.
 */
export interface ILocaleNodeMap {
  [locale: string]: Node;
}

export interface ILocaleNodeMapCompilerOptions extends INodeCompilerOptions {

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
export function compileLocaleNodeMap(localeNodeMap: ILocaleNodeMap, options: ILocaleNodeMapCompilerOptions): string {

  const {
    nullable,
    localeVarName,
    indexVarName,
    defaultLocale,
    locales,
    localesVarName,
    onRuntimeMethodUsed,
  } = options;

  const blankIndices: Array<number> = [];
  const blankSrc = compileBlankValue(nullable);

  let defaultSrc = '';
  let childrenSrc = '';
  let childrenCount = 0;

  for (let i = 0; i < locales.length; ++i) {
    const locale = locales[i];
    const node = localeNodeMap[locale];

    if (node == null) {
      // Absent translations are replaced with default
      continue;
    }
    if (locale === defaultLocale) {
      // The default translation
      defaultSrc = compileNode(node, options);
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
    childrenSrc += '===' + i + '?' + compileNode(node, options);
    childrenCount++;
  }

  const caseCount = childrenCount + blankIndices.length;

  if (caseCount === 0) {
    return defaultSrc || blankSrc;
  }

  if (childrenCount === 0 && defaultSrc === '') {
    return blankSrc;
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
    src += '?' + blankSrc;
  }

  src += ':' + (defaultSrc || blankSrc);

  if (caseCount !== 1) {
    src += ')';
  }

  return src;
}
