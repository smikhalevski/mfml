import {createMessageRuntime, RuntimeMethod} from '../main';

describe('createMessageRuntime', () => {

  test('invokes methods from options', () => {

    const renderFragmentMock = jest.fn();
    const renderElementMock = jest.fn();
    const renderFunctionMock = jest.fn();
    const renderArgumentMock = jest.fn();
    const matchLocaleMock = jest.fn();
    const matchSelectMock = jest.fn();
    const matchPluralMock = jest.fn();
    const matchSelectOrdinalMock = jest.fn();

    const runtime = createMessageRuntime({
      renderFragment: renderFragmentMock,
      renderElement: renderElementMock,
      renderFunction: renderFunctionMock,
      renderArgument: renderArgumentMock,
      matchLocale: matchLocaleMock,
      matchSelect: matchSelectMock,
      matchPlural: matchPluralMock,
      matchSelectOrdinal: matchSelectOrdinalMock,
    });

    runtime[RuntimeMethod.FRAGMENT]('abc');
    runtime[RuntimeMethod.ELEMENT]('foo', {aaa: 123}, 'abc');
    runtime[RuntimeMethod.FUNCTION]('foo', 123, 'bar');
    runtime[RuntimeMethod.ARGUMENT](123);
    runtime[RuntimeMethod.LOCALE]('ru', ['en', 'ru']);
    runtime[RuntimeMethod.SELECT]('bbb', 'aaa', 'bbb', 'ccc');
    runtime[RuntimeMethod.PLURAL]('ru', 1);
    runtime[RuntimeMethod.SELECT_ORDINAL]('ru', 1);

    expect(renderFragmentMock).toHaveBeenCalledTimes(1);
    expect(renderElementMock).toHaveBeenCalledTimes(1);
    expect(renderFunctionMock).toHaveBeenCalledTimes(1);
    expect(renderArgumentMock).toHaveBeenCalledTimes(1);
    expect(matchLocaleMock).toHaveBeenCalledTimes(1);
    expect(matchSelectMock).toHaveBeenCalledTimes(1);
    expect(matchPluralMock).toHaveBeenCalledTimes(1);
    expect(matchSelectOrdinalMock).toHaveBeenCalledTimes(1);

    expect(renderFragmentMock).toHaveBeenCalledWith('abc');
    expect(renderElementMock).toHaveBeenCalledWith('foo', {aaa: 123}, 'abc');
    expect(renderFunctionMock).toHaveBeenCalledWith('foo', 123, 'bar');
    expect(renderArgumentMock).toHaveBeenCalledWith(123);
    expect(matchLocaleMock).toHaveBeenCalledWith('ru', ['en', 'ru']);
    expect(matchSelectMock).toHaveBeenCalledWith('bbb', 'aaa', 'bbb', 'ccc');
    expect(matchPluralMock).toHaveBeenCalledWith('ru', 1);
    expect(matchSelectOrdinalMock).toHaveBeenCalledWith('ru', 1);
  });
});
