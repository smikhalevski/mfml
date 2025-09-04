import { createTokenizer, TokenizerOptions } from './createTokenizer.js';

const formTags = ['input', 'option', 'optgroup', 'select', 'button', 'datalist', 'textarea'];

const pTags = ['p'];

const ddtTags = ['dd', 'dt'];

const rtpTags = ['rt', 'rp'];

const tableTags = ['thead', 'tbody'];

/**
 * Options used by the {@link htmlTokenizer forgiving HTML tokenizer}.
 *
 * @see {@link htmlTokenizer}
 * @see {@link createTokenizer}
 * @group Tokenizer
 */
export const htmlTokenizerOptions: TokenizerOptions = {
  voidTags: [
    'area',
    'base',
    'basefont',
    'br',
    'col',
    'command',
    'embed',
    'frame',
    'hr',
    'img',
    'input',
    'isindex',
    'keygen',
    'link',
    'meta',
    'param',
    'source',
    'track',
    'wbr',
  ],
  rawTextTags: ['script', 'style', 'textarea'],
  implicitlyClosedTags: {
    tr: ['tr', 'th', 'td'],
    th: ['th'],
    td: ['thead', 'th', 'td'],
    body: ['head', 'link', 'script'],
    li: ['li'],
    option: ['option'],
    optgroup: ['optgroup', 'option'],
    dd: ddtTags,
    dt: ddtTags,
    select: formTags,
    input: formTags,
    output: formTags,
    button: formTags,
    datalist: formTags,
    textarea: formTags,
    p: pTags,
    h1: pTags,
    h2: pTags,
    h3: pTags,
    h4: pTags,
    h5: pTags,
    h6: pTags,
    address: pTags,
    article: pTags,
    aside: pTags,
    blockquote: pTags,
    details: pTags,
    div: pTags,
    dl: pTags,
    fieldset: pTags,
    figcaption: pTags,
    figure: pTags,
    footer: pTags,
    form: pTags,
    header: pTags,
    hr: pTags,
    main: pTags,
    nav: pTags,
    ol: pTags,
    pre: pTags,
    section: pTags,
    table: pTags,
    ul: pTags,
    rt: rtpTags,
    rp: rtpTags,
    tbody: tableTags,
    tfoot: tableTags,
  },
  implicitlyOpenedTags: ['p', 'br'],
  isCaseInsensitiveTags: true,
  isSelfClosingTagsRecognized: false,
  isUnbalancedTagsImplicitlyClosed: true,
  isOrphanClosingTagsIgnored: true,
  isRawTextInterpolated: true,
};

/**
 * The forgiving HTML syntax {@link createTokenizer tokenizer} that uses {@link htmlTokenizerOptions}.
 *
 * @see {@link createTokenizer}
 * @group Tokenizer
 */
export const htmlTokenizer = createTokenizer(htmlTokenizerOptions);
