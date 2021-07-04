import {compileNode} from '../../main/compiler/compileNode';
import {createIcuDomParser} from '../../main/parser/createIcuDomParser';
import {RuntimeMethod} from '../../main/runtime';

describe('compileNode', () => {

  const parse = createIcuDomParser();

  let argMap: Record<string, string | undefined>;
  let usedMethods: Set<RuntimeMethod>;

  beforeEach(() => {
    argMap = Object.create(null);
    usedMethods = new Set();
  });

  test('compiles text', () => {
    expect(compileNode(parse('aaa'), argMap, usedMethods)).toBe('"aaa"');
    expect(argMap).toEqual({});
  });

  test('compiles an argument', () => {
    expect(compileNode(parse('{foo}'), argMap, usedMethods)).toBe('args.foo');
    expect(argMap).toEqual({foo: undefined});
  });

  test('compiles a typed argument', () => {
    const getArgumentTypeMock = jest.fn(() => 'FOO');
    const source = compileNode(parse('{foo}'), argMap, usedMethods, {
      getArgumentType: getArgumentTypeMock,
    });

    expect(source).toBe('args.foo');
    expect(argMap).toEqual({foo: 'FOO'});
    expect(getArgumentTypeMock).toHaveBeenCalledTimes(1);
    expect(getArgumentTypeMock).toHaveBeenNthCalledWith(1, 'foo', null);
  });

  test('compiles a function', () => {
    expect(compileNode(parse('{foo,date}'), argMap, usedMethods)).toBe('fn("date",args.foo)');
    expect(argMap).toEqual({foo: undefined});
  });

  test('compiles a function with children', () => {
    expect(compileNode(parse('{foo,date,<b>aaa</b>}'), argMap, usedMethods)).toBe('fn("date",args.foo,e("b",null,"aaa"))');
    expect(argMap).toEqual({foo: undefined});
  });

  test('compiles a typed function', () => {
    const getArgumentTypeMock = jest.fn(() => 'FOO');
    const source = compileNode(parse('{foo,date}'), argMap, usedMethods, {
      getArgumentType: getArgumentTypeMock,
    });

    expect(source).toBe('fn("date",args.foo)');
    expect(argMap).toEqual({foo: 'FOO'});
    expect(getArgumentTypeMock).toHaveBeenCalledTimes(1);
    expect(getArgumentTypeMock).toHaveBeenNthCalledWith(1, 'foo', 'date');
  });

  test('compiles plural', () => {
    expect(compileNode(parse('{foo,plural,one{AAA} many{BBB}}'), argMap, usedMethods)).toBe('p(locale,args.foo,{one:"AAA",many:"BBB"})');
  });

  test('compiles plural with nested fragments', () => {
    expect(compileNode(parse('{foo,plural,one{AAA<foo></foo>}many{BBB}}'), argMap, usedMethods)).toBe('p(locale,args.foo,{one:f("AAA",e("foo",null)),many:"BBB"})');
  });

  test('compiles select', () => {
    expect(compileNode(parse('{foo,select,aaa{AAA}bbb{BBB}}'), argMap, usedMethods)).toBe('s(args.foo,{aaa:"AAA",bbb:"BBB"})');
  });

  test('compiles select ordinal', () => {
    expect(compileNode(parse('{foo,selectordinal,zero{AAA}few{BBB}}'), argMap, usedMethods)).toBe('o(args.foo,{zero:"AAA",few:"BBB"})');
  });

  test('compiles a fragment', () => {
    expect(compileNode(parse('aaa{foo}bbb'), argMap, usedMethods)).toBe('f("aaa",args.foo,"bbb")');
  });

  test('compiles an element', () => {
    expect(compileNode(parse('<foo>'), argMap, usedMethods)).toBe('e("foo",null)');
  });

  test('compiles an element with children', () => {
    expect(compileNode(parse('<foo><bar></bar></foo>'), argMap, usedMethods)).toBe('e("foo",null,e("bar",null))');
  });

  test('compiles an element with a text attribute', () => {
    expect(compileNode(parse('<foo bar="aaa"></foo>'), argMap, usedMethods)).toBe('e("foo",{bar:"aaa"})');
  });

  test('compiles an element with an argument attribute', () => {
    expect(compileNode(parse('<foo bar="{baz}"></foo>'), argMap, usedMethods)).toBe('e("foo",{bar:args.baz})');
  });

  test('compiles an element with a fragment attribute', () => {
    expect(compileNode(parse('<foo bar="aaa{baz}bbb"></foo>'), argMap, usedMethods)).toBe('e("foo",{bar:f("aaa",args.baz,"bbb")})');
  });

  test('compiles an element with multiple attributes', () => {
    expect(compileNode(parse('<foo bar="aaa" baz="bbb"></foo>'), argMap, usedMethods)).toBe('e("foo",{bar:"aaa",baz:"bbb"})');
  });
});
