import {compileNode, INodeCompilerOptions, KnownArgumentType} from '../../main/compiler/compileNode';
import {createMfmlParser} from '../../main';
import {RuntimeMethod} from '../../main/runtime';

describe('compileNode', () => {

  const parse = createMfmlParser();

  let options: INodeCompilerOptions;
  let argumentTypes: Record<string, string | undefined>;
  let usedMethods: Array<RuntimeMethod>;

  beforeEach(() => {
    argumentTypes = {};
    usedMethods = [];
    options = {
      renameTag: (name) => name,
      renameAttribute: (name) => name,
      renameFunction: (name) => name,
      resolveArgumentVarName: (name) => name,
      rewriteFunctionArgumentType: () => 'qqq',
      onArgumentTypeChanged(argName, type) {
        argumentTypes[argName] = type;
      },
      onRuntimeMethodUsed(method) {
        if (usedMethods.indexOf(method) === -1) {
          usedMethods.push(method);
        }
      },
    };
  });

  describe('select', () => {

    test('compiles select without cases', () => {
      expect(compileNode(parse('{foo,select,}'), options))
          .toBe('');
      expect(argumentTypes).toEqual({foo: KnownArgumentType.NUMBER});
      expect(usedMethods).toEqual([]);
    });

    test('compiles select with a single blank case', () => {
      expect(compileNode(parse('{foo,select,aaa{}}'), options))
          .toBe('');
      expect(argumentTypes).toEqual({foo: KnownArgumentType.NUMBER});
      expect(usedMethods).toEqual([]);
    });

    test('compiles select with a single non-blank case', () => {
      expect(compileNode(parse('{foo,select,aaa{AAA}}'), options))
          .toBe('s(foo,"aaa")===0?"AAA":null');
      expect(argumentTypes).toEqual({foo: KnownArgumentType.NUMBER});
      expect(usedMethods).toEqual([RuntimeMethod.SELECT]);
    });

    test('compiles select with a multiple blank cases', () => {
      expect(compileNode(parse('{foo,select,aaa{}bbb{}}'), options))
          .toBe('');
      expect(argumentTypes).toEqual({foo: KnownArgumentType.NUMBER});
      expect(usedMethods).toEqual([]);
    });

    test('compiles select with a blank case and non-blank case', () => {
      expect(compileNode(parse('{foo,select,aaa{}bbb{BBB}}'), options))
          .toBe('s(foo,"bbb")===1?"BBB":null');
      expect(argumentTypes).toEqual({foo: KnownArgumentType.NUMBER});
      expect(usedMethods).toEqual([RuntimeMethod.SELECT]);
    });

    test('compiles select with multiple non-blank cases', () => {
      expect(compileNode(parse('{foo,select,aaa{AAA}bbb{BBB}}'), options))
          .toBe('(i=s(foo,"aaa","bbb"),i===0?"AAA":i===1?"BBB":null)');
      expect(argumentTypes).toEqual({foo: KnownArgumentType.NUMBER});
      expect(usedMethods).toEqual([RuntimeMethod.SELECT]);
    });
  });

  describe('plural', () => {
    test('compiles plural without cases', () => {
      expect(compileNode(parse('{foo,plural,}'), options))
          .toBe('');
      expect(argumentTypes).toEqual({foo: KnownArgumentType.NUMBER});
      expect(usedMethods).toEqual([]);
    });

    test('compiles plural without single other case', () => {
      expect(compileNode(parse('{foo,plural,other{AAA}}'), options))
          .toBe('"AAA"');
      expect(argumentTypes).toEqual({foo: KnownArgumentType.NUMBER});
      expect(usedMethods).toEqual([]);
    });

    test('compiles plural with a single blank case', () => {
      expect(compileNode(parse('{foo,plural,one{}}'), options))
          .toBe('');
      expect(argumentTypes).toEqual({foo: KnownArgumentType.NUMBER});
      expect(usedMethods).toEqual([]);
    });

    test('compiles plural with a single non-blank case', () => {
      expect(compileNode(parse('{foo,plural,one{AAA}}'), options))
          .toBe('p(foo)===1?"AAA":null');
      expect(argumentTypes).toEqual({foo: KnownArgumentType.NUMBER});
      expect(usedMethods).toEqual([RuntimeMethod.PLURAL]);
    });

    test('compiles plural with a multiple blank cases', () => {
      expect(compileNode(parse('{foo,plural,zero{}one{}}'), options))
          .toBe('');
      expect(argumentTypes).toEqual({foo: KnownArgumentType.NUMBER});
      expect(usedMethods).toEqual([]);
    });

    test('compiles plural with a blank case and non-blank case', () => {
      expect(compileNode(parse('{foo,plural,one{}zero{BBB}}'), options))
          .toBe('p(foo)===0?"BBB":null');
      expect(argumentTypes).toEqual({foo: KnownArgumentType.NUMBER});
      expect(usedMethods).toEqual([RuntimeMethod.PLURAL]);
    });

    test('compiles plural cases in order', () => {
      expect(compileNode(parse('{foo,plural,many{MANY}other{OTHER}zero{ZERO}two{TWO}few{FEW}one{ONE}}'), options))
          .toBe('(i=p(foo),i===0?"ZERO":i===1?"ONE":i===2?"TWO":i===3?"FEW":i===4?"MANY":"OTHER")');
      expect(argumentTypes).toEqual({foo: KnownArgumentType.NUMBER});
      expect(usedMethods).toEqual([RuntimeMethod.PLURAL]);
    });

    test('compiles plural with an octothorpe', () => {
      expect(compileNode(parse('{foo,plural,many{#aaa}}'), options))
          .toBe('p(foo)===4?f(foo,"aaa"):null');
      expect(argumentTypes).toEqual({foo: KnownArgumentType.NUMBER});
      expect(usedMethods).toEqual([RuntimeMethod.FRAGMENT, RuntimeMethod.PLURAL]);
    });

    test('compiles plural with an octothorpe nested in an element', () => {
      expect(compileNode(parse('{foo,plural,many{<b>#aaa</b>}}'), options))
          .toBe('p(foo)===4?E("b",foo,"aaa"):null');
      expect(argumentTypes).toEqual({foo: KnownArgumentType.NUMBER});
      expect(usedMethods).toEqual([RuntimeMethod.SHORT_ELEMENT, RuntimeMethod.PLURAL]);
    });
  });

  describe('fragment', () => {

    test('compiles empty fragment', () => {
      expect(compileNode(parse('{foo,plural,}{foo,plural,}'), options))
          .toBe('');
      expect(usedMethods).toEqual([]);
    });

    test('compiles fragment with a single node', () => {
      expect(compileNode(parse('aaa'), options))
          .toBe('"aaa"');
      expect(usedMethods).toEqual([]);
    });

    test('compiles fragment with multiple nodes', () => {
      expect(compileNode(parse('aaa{foo}'), options))
          .toBe('f("aaa",foo)');
      expect(usedMethods).toEqual([RuntimeMethod.FRAGMENT]);
    });
  });

  describe('element', () => {

    test('compiles an element without attrs and without children', () => {
      expect(compileNode(parse('<b></b>'), options))
          .toBe('E("b")');
      expect(usedMethods).toEqual([RuntimeMethod.SHORT_ELEMENT]);
    });

    test('compiles an element with a boolean attr', () => {
      expect(compileNode(parse('<b rrr></b>'), options))
          .toBe('e("b",{"rrr":true})');
      expect(usedMethods).toEqual([RuntimeMethod.ELEMENT]);
    });

    test('compiles an element with a string attr', () => {
      expect(compileNode(parse('<b rrr="www"></b>'), options))
          .toBe('e("b",{"rrr":"www"})');
      expect(usedMethods).toEqual([RuntimeMethod.ELEMENT]);
    });

    test('compiles an element with an argument attr', () => {
      expect(compileNode(parse('<b rrr="{foo}"></b>'), options))
          .toBe('e("b",{"rrr":foo})');
      expect(usedMethods).toEqual([RuntimeMethod.ELEMENT]);
    });

    test('compiles an element with a fragment attr', () => {
      expect(compileNode(parse('<b rrr="aaa{foo}"></b>'), options))
          .toBe('e("b",{"rrr":f("aaa",foo)})');
      expect(usedMethods).toEqual([RuntimeMethod.ELEMENT, RuntimeMethod.FRAGMENT]);
    });

    test('compiles an element with multiple attrs', () => {
      expect(compileNode(parse('<b rrr="www" ttt></b>'), options))
          .toBe('e("b",{"rrr":"www","ttt":true})');
      expect(usedMethods).toEqual([RuntimeMethod.ELEMENT]);
    });

    test('compiles an element with a single child', () => {
      expect(compileNode(parse('<b>{foo}</b>'), options))
          .toBe('E("b",foo)');
      expect(usedMethods).toEqual([RuntimeMethod.SHORT_ELEMENT]);
    });

    test('compiles an element with multiple children', () => {
      expect(compileNode(parse('<b>aaa{foo}</b>'), options))
          .toBe('E("b","aaa",foo)');
      expect(usedMethods).toEqual([RuntimeMethod.SHORT_ELEMENT]);
    });

    test('compiles an element with an attr and a child', () => {
      expect(compileNode(parse('<b rrr="www">aaa{foo}</b>'), options))
          .toBe('e("b",{"rrr":"www"},"aaa",foo)');
      expect(usedMethods).toEqual([RuntimeMethod.ELEMENT]);
    });

    test('compiles nested elements', () => {
      expect(compileNode(parse('<b><i>aaa</i></b>'), options))
          .toBe('E("b",E("i","aaa"))');
      expect(usedMethods).toEqual([RuntimeMethod.SHORT_ELEMENT]);
    });

    test('compiles elements mixed in a fragment', () => {
      expect(compileNode(parse('aaa<b>bbb{foo}ccc</b>ddd<i>eee{foo}fff</i>'), options))
          .toBe('f("aaa",E("b","bbb",foo,"ccc"),"ddd",E("i","eee",foo,"fff"))');
      expect(usedMethods).toEqual([RuntimeMethod.FRAGMENT, RuntimeMethod.SHORT_ELEMENT]);
    });
  });

  describe('function', () => {

    test('compiles a function', () => {
      expect(compileNode(parse('{foo,www}'), options))
          .toBe('c("www",foo)');
      expect(argumentTypes).toEqual({foo: 'qqq'});
      expect(usedMethods).toEqual([RuntimeMethod.FUNCTION]);
    });

    test('compiles a function with an string child', () => {
      expect(compileNode(parse('{foo,www,aaa}'), options))
          .toBe('c("www",foo,"aaa")');
      expect(argumentTypes).toEqual({foo: 'qqq'});
      expect(usedMethods).toEqual([RuntimeMethod.FUNCTION]);
    });

    test('compiles a function with an element child', () => {
      expect(compileNode(parse('{foo,www,<b></b>}'), options))
          .toBe('c("www",foo,E("b"))');
      expect(argumentTypes).toEqual({foo: 'qqq'});
      expect(usedMethods).toEqual([RuntimeMethod.FUNCTION, RuntimeMethod.SHORT_ELEMENT]);
    });

    test('compiles a function with a fragment child', () => {
      expect(compileNode(parse('{foo,www,aaa<b></b>}'), options))
          .toBe('c("www",foo,f("aaa",E("b")))');
      expect(argumentTypes).toEqual({foo: 'qqq'});
      expect(usedMethods).toEqual([RuntimeMethod.FUNCTION, RuntimeMethod.FRAGMENT, RuntimeMethod.SHORT_ELEMENT]);
    });

    test('compiles a function with an argument child', () => {
      expect(compileNode(parse('{foo,www,{bar}}'), options))
          .toBe('c("www",foo,bar)');
      expect(argumentTypes).toEqual({foo: 'qqq'});
      expect(usedMethods).toEqual([RuntimeMethod.FUNCTION]);
    });

  });

});
