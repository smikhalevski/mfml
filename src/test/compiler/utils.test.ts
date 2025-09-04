import { describe, expect, test } from 'vitest';
import { collectArgumentTsTypes, escapeJsIdentifier, hashCode, truncateMessage } from '../../main/compiler/utils.js';
import { parseMessage } from '../../main/parser/createParser.js';
import { htmlTokenizer } from '../../main/parser/index.js';
import { getArgumentNaturalTsType } from '../../main/compiler/createCompiler.js';

describe('hashCode', () => {
  test('generates hash code', async () => {
    await expect(hashCode('aaa', 16)).resolves.toBe('9834876dcfb05cb1');
    await expect(hashCode('aaa', 8)).resolves.toBe('9834876d');
    await expect(hashCode('bbb', 4)).resolves.toBe('3e74');
  });
});

describe('collectArgumentTsTypes', () => {
  test('empty is no arguments', () => {
    const messageNode = parseMessage('en', '', { tokenizer: htmlTokenizer });
    const argumentTsTypes = new Map();

    collectArgumentTsTypes(messageNode, getArgumentNaturalTsType, argumentTsTypes);

    expect(argumentTsTypes).toEqual(new Map());
  });

  test('collects untyped argument types', () => {
    const messageNode = parseMessage('en', '{xxx}{yyy}', { tokenizer: htmlTokenizer });
    const argumentTsTypes = new Map();

    collectArgumentTsTypes(messageNode, getArgumentNaturalTsType, argumentTsTypes);

    expect(argumentTsTypes).toEqual(
      new Map([
        ['xxx', new Set()],
        ['yyy', new Set()],
      ])
    );
  });

  test('collects typed and untyped argument types', () => {
    const messageNode = parseMessage('en', '{xxx,time}{xxx}', { tokenizer: htmlTokenizer });
    const argumentTsTypes = new Map();

    collectArgumentTsTypes(messageNode, getArgumentNaturalTsType, argumentTsTypes);

    expect(argumentTsTypes).toEqual(new Map([['xxx', new Set(['number|Date'])]]));
  });

  test('collects differently typed argument types', () => {
    const messageNode = parseMessage('en', '{xxx,time}{xxx,number}', { tokenizer: htmlTokenizer });
    const argumentTsTypes = new Map();

    collectArgumentTsTypes(messageNode, getArgumentNaturalTsType, argumentTsTypes);

    expect(argumentTsTypes).toEqual(new Map([['xxx', new Set(['number|Date', 'number|bigint'])]]));
  });

  test('collects argument types from attributes', () => {
    const messageNode = parseMessage('en', '<a title="{xxx,time}">', { tokenizer: htmlTokenizer });
    const argumentTsTypes = new Map();

    collectArgumentTsTypes(messageNode, getArgumentNaturalTsType, argumentTsTypes);

    expect(argumentTsTypes).toEqual(new Map([['xxx', new Set(['number|Date'])]]));
  });

  test('collects argument types from tag children', () => {
    const messageNode = parseMessage('en', '<a>{xxx,time}', { tokenizer: htmlTokenizer });
    const argumentTsTypes = new Map();

    collectArgumentTsTypes(messageNode, getArgumentNaturalTsType, argumentTsTypes);

    expect(argumentTsTypes).toEqual(new Map([['xxx', new Set(['number|Date'])]]));
  });

  test('collects argument types from select', () => {
    const messageNode = parseMessage('en', '{yyy,select,zzz{{xxx,time}}}', { tokenizer: htmlTokenizer });
    const argumentTsTypes = new Map();

    collectArgumentTsTypes(messageNode, getArgumentNaturalTsType, argumentTsTypes);

    expect(argumentTsTypes).toEqual(
      new Map([
        ['yyy', new Set(['number|string'])],
        ['xxx', new Set(['number|Date'])],
      ])
    );
  });
});

describe('truncateMessage', () => {
  test('truncates before a whitespace', () => {
    expect(truncateMessage('', 5)).toBe('');
    expect(truncateMessage('   ', 5)).toBe('   ');
    expect(truncateMessage('   ', 0)).toBe('   ');
    expect(truncateMessage('aaa bbb ccc', 5)).toBe('aaa…');
    expect(truncateMessage('aaa   bbb ccc', 10)).toBe('aaa   bbb…');
    expect(truncateMessage('   aaa   bbb ccc', 5)).toBe('   aaa…');
    expect(truncateMessage('   aaa   bbb ccc', 0)).toBe('   aaa…');
    expect(truncateMessage('aaa\nbbb ccc', 5)).toBe('aaa…');
    expect(truncateMessage('aaa\nbbb ccc', 8)).toBe('aaa\nbbb…');
  });
});

describe('escapeJsIdentifier', () => {
  test('replaces illegal characters with an underscore', () => {
    expect(escapeJsIdentifier('111')).toBe('_111');
    expect(escapeJsIdentifier('+=*')).toBe('___');
    expect(escapeJsIdentifier('hello')).toBe('hello');
  });

  test('prepends underscore to reserved characters', () => {
    expect(escapeJsIdentifier('break')).toBe('_break');
  });
});
