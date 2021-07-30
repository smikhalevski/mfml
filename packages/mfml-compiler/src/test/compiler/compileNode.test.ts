import {compileNode, INodeCompilerOptions} from '../../main/compiler/compileNode';
import {createMfmlParser} from '../../main/parser/createMfmlParser';

describe('compileNode', () => {

  const parse = createMfmlParser();

  let options: INodeCompilerOptions;

  beforeEach(() => {
    options = {
      otherSelectCaseKey: 'other',
      indexVarName: 'i',
      localeSrc: 'locale',
      provideArgumentVarName: (name) => name,
      onFunctionUsed: () => undefined,
      onRuntimeMethodUsed: () => undefined,
      onSelectUsed: () => undefined,
    };
  });

  describe('select', () => {

    test('compiles select without cases', () => {
      expect(compileNode(parse('{foo,select,}'), options))
          .toBe('');
    });

    test('compiles select with a single blank case', () => {
      expect(compileNode(parse('{foo,select,aaa{}}'), options))
          .toBe('');
    });

    test('compiles select with a single non-blank case', () => {
      expect(compileNode(parse('{foo,select,aaa{AAA}}'), options))
          .toBe('s(foo,"aaa")===0?"AAA":f()');
    });

    test('compiles select with a multiple blank cases', () => {
      expect(compileNode(parse('{foo,select,aaa{}bbb{}}'), options))
          .toBe('');
    });

    test('compiles select with a blank case and non-blank case', () => {
      expect(compileNode(parse('{foo,select,aaa{}bbb{BBB}}'), options))
          .toBe('s(foo,"aaa","bbb")===1?"BBB":f()');
    });

    test('compiles select with multiple non-blank cases', () => {
      expect(compileNode(parse('{foo,select,aaa{AAA}bbb{BBB}}'), options))
          .toBe('(i=s(foo,"aaa","bbb"),i===0?"AAA":i===1?"BBB":f())');
    });

    test('compiles other', () => {
      expect(compileNode(parse('{foo,select,aaa{AAA}other{BBB}}'), options))
          .toBe('s(foo,"aaa","other")===0?"AAA":"BBB"');
    });

    test('respects other key setting', () => {
      options.otherSelectCaseKey = 'kkk';

      expect(compileNode(parse('{foo,select,aaa{AAA}kkk{BBB}}'), options))
          .toBe('s(foo,"aaa","kkk")===0?"AAA":"BBB"');
    });
  });

  describe('plural', () => {

    test('compiles plural without cases', () => {
      expect(compileNode(parse('{foo,plural,}'), options))
          .toBe('');
    });

    test('compiles plural without single other case', () => {
      expect(compileNode(parse('{foo,plural,other{AAA}}'), options))
          .toBe('"AAA"');
    });

    test('compiles plural with a single blank case', () => {
      expect(compileNode(parse('{foo,plural,one{}}'), options))
          .toBe('');
    });

    test('compiles plural with a single non-blank case', () => {
      expect(compileNode(parse('{foo,plural,one{AAA}}'), options))
          .toBe('p(locale,foo)===1?"AAA":f()');
    });

    test('compiles plural with a multiple blank cases', () => {
      expect(compileNode(parse('{foo,plural,zero{}one{}}'), options))
          .toBe('');
    });

    test('compiles plural with a blank case and non-blank case', () => {
      expect(compileNode(parse('{foo,plural,one{}zero{BBB}}'), options))
          .toBe('p(locale,foo)===0?"BBB":f()');
    });

    test('compiles plural cases in order', () => {
      expect(compileNode(parse('{foo,plural,many{MANY}other{OTHER}zero{ZERO}two{TWO}few{FEW}one{ONE}}'), options))
          .toBe('(i=p(locale,foo),i===0?"ZERO":i===1?"ONE":i===2?"TWO":i===3?"FEW":i===4?"MANY":"OTHER")');
    });

    test('compiles plural with an octothorpe', () => {
      expect(compileNode(parse('{foo,plural,many{#aaa}}'), options))
          .toBe('p(locale,foo)===4?f(a(foo),"aaa"):f()');
    });

    test('compiles nested plurals with an octothorpe', () => {
      expect(compileNode(parse('{foo,plural,many{#{bar,plural,one{#aaa}}}}'), options))
          .toBe('p(locale,foo)===4?f(a(foo),p(locale,bar)===1?f(a(bar),"aaa"):f()):f()');
    });

    test('compiles plural with an octothorpe nested in an element', () => {
      expect(compileNode(parse('{foo,plural,many{<b>#aaa</b>}}'), options))
          .toBe('p(locale,foo)===4?e("b",null,a(foo),"aaa"):f()');
    });
  });

  describe('fragment', () => {

    test('compiles empty fragment', () => {
      expect(compileNode(parse('{foo,plural,}{foo,plural,}'), options))
          .toBe('');
    });

    test('compiles fragment with a single node', () => {
      expect(compileNode(parse('aaa'), options))
          .toBe('"aaa"');
    });

    test('compiles fragment with multiple nodes', () => {
      expect(compileNode(parse('aaa{foo}'), options))
          .toBe('f("aaa",a(foo))');
    });
  });

  describe('element', () => {

    test('compiles an element without attrs and without children', () => {
      expect(compileNode(parse('<b></b>'), options))
          .toBe('e("b",null)');
    });

    test('compiles an element with a boolean attr', () => {
      expect(compileNode(parse('<b rrr></b>'), options))
          .toBe('e("b",{rrr:true})');
    });

    test('compiles an element with a string attr', () => {
      expect(compileNode(parse('<b rrr="www"></b>'), options))
          .toBe('e("b",{rrr:"www"})');
    });

    test('compiles an element with an argument attr', () => {
      expect(compileNode(parse('<b rrr="{foo}"></b>'), options))
          .toBe('e("b",{rrr:a(foo)})');
    });

    test('compiles an element with a fragment attr', () => {
      expect(compileNode(parse('<b rrr="aaa{foo}"></b>'), options))
          .toBe('e("b",{rrr:f("aaa",a(foo))})');
    });

    test('compiles an element with multiple attrs', () => {
      expect(compileNode(parse('<b rrr="www" ttt></b>'), options))
          .toBe('e("b",{rrr:"www",ttt:true})');
    });

    test('compiles an element with a single child', () => {
      expect(compileNode(parse('<b>{foo}</b>'), options))
          .toBe('e("b",null,a(foo))');
    });

    test('compiles an element with multiple children', () => {
      expect(compileNode(parse('<b>aaa{foo}</b>'), options))
          .toBe('e("b",null,"aaa",a(foo))');
    });

    test('compiles an element with an attr and a child', () => {
      expect(compileNode(parse('<b rrr="www">aaa{foo}</b>'), options))
          .toBe('e("b",{rrr:"www"},"aaa",a(foo))');
    });

    test('compiles nested elements', () => {
      expect(compileNode(parse('<b><i>aaa</i></b>'), options))
          .toBe('e("b",null,e("i",null,"aaa"))');
    });

    test('compiles elements mixed in a fragment', () => {
      expect(compileNode(parse('aaa<b>bbb{foo}ccc</b>ddd<i>eee{foo}fff</i>'), options))
          .toBe('f("aaa",e("b",null,"bbb",a(foo),"ccc"),"ddd",e("i",null,"eee",a(foo),"fff"))');
    });
  });

  describe('function', () => {

    test('compiles a function', () => {
      expect(compileNode(parse('{foo,www}'), options))
          .toBe('c("www",foo)');
    });

    test('compiles a function with an string child', () => {
      expect(compileNode(parse('{foo,www,aaa}'), options))
          .toBe('c("www",foo,"aaa")');
    });

    test('compiles a function with an element child', () => {
      expect(compileNode(parse('{foo,www,<b></b>}'), options))
          .toBe('c("www",foo,e("b",null))');
    });

    test('compiles a function with a fragment child', () => {
      expect(compileNode(parse('{foo,www,aaa<b></b>}'), options))
          .toBe('c("www",foo,f("aaa",e("b",null)))');
    });

    test('compiles a function with an argument child', () => {
      expect(compileNode(parse('{foo,www,{bar}}'), options))
          .toBe('c("www",foo,a(bar))');
    });

    test('invokes function callbacks', () => {
      const provideArgumentVarNameMock = jest.fn(() => 'eee');
      const onFunctionUsedMock = jest.fn();

      options.provideArgumentVarName = provideArgumentVarNameMock;
      options.onFunctionUsed = onFunctionUsedMock;

      compileNode(parse('{foo,www,{bar}}'), options);

      expect(provideArgumentVarNameMock).toHaveBeenCalledTimes(2);
      expect(provideArgumentVarNameMock).toHaveBeenNthCalledWith(1, 'foo');
      expect(provideArgumentVarNameMock).toHaveBeenNthCalledWith(2, 'bar');

      expect(onFunctionUsedMock).toHaveBeenCalledTimes(1);
    });

  });

});
