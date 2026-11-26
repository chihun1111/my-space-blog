// A small lexical highlighter: source is always escaped, never interpreted as HTML.
const escape = value => value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const languages = {
  text: ['Text', 'text', 'plaintext', 'plain', 'txt'],
  bash: ['Bash', 'bash', 'sh', 'shell', 'shellscript', 'zsh', 'console'],
  javascript: ['JavaScript', 'javascript', 'js', 'jsx', 'mjs', 'cjs'],
  typescript: ['TypeScript', 'typescript', 'ts', 'tsx'],
  python: ['Python', 'python', 'py'],
  json: ['JSON', 'json', 'jsonc'],
  yaml: ['YAML', 'yaml', 'yml'],
  html: ['HTML', 'html', 'xml', 'svg'],
  css: ['CSS', 'css'],
  sql: ['SQL', 'sql'],
};
const aliases = new Map(Object.entries(languages).flatMap(([name, [, ...names]]) => names.map(alias => [alias, name])));

export function codeLanguage(info = '') {
  const token = String(info).trim().split(/\s+/)[0].slice(0, 40);
  const name = aliases.get(token.toLowerCase()) || 'text';
  return { name, label: aliases.has(token.toLowerCase()) || !token ? languages[name][0] : token };
}

const keywords = {
  javascript: 'async await break case catch class const continue debugger default delete do else export extends false finally for from function get if import in instanceof let new null of return set static super switch this throw true try typeof undefined var void while with yield',
  typescript: 'abstract any as asserts async await bigint boolean break case catch class const constructor continue declare default delete do else enum export extends false finally for from function get if implements import in infer instanceof interface is keyof let module namespace never new null number object of private protected public readonly return set static string super switch symbol this throw true try type typeof undefined unknown var void while yield',
  python: 'and as assert async await break class continue def del elif else except False finally for from global if import in is lambda None nonlocal not or pass raise return True try while with yield',
  bash: 'if then else elif fi for while until do done in case esac function select time coproc return break continue export local readonly declare set unset source sudo',
  json: 'true false null',
  yaml: 'true false null yes no on off',
  sql: 'select from where join inner outer left right full on as and or not null true false insert into values update set delete create alter drop table index view distinct group by order having limit offset union all exists in is like between case when then else end asc desc primary key foreign references constraint default with returning begin commit rollback count sum min max avg',
};
const keywordSets = Object.fromEntries(Object.entries(keywords).map(([name, words]) => [name, new Set(words.split(' '))]));
const span = (type, source) => `<span class="syntax-${type}">${escape(source)}</span>`;

function quotedLength(source, quote, prefix = 0, doubled = false) {
  let index = prefix + quote.length;
  while (index < source.length) {
    if (source[index] === '\\') { index += 2; continue; }
    if (source.startsWith(quote, index)) {
      if (doubled && source.startsWith(quote + quote, index)) { index += quote.length * 2; continue; }
      return index + quote.length;
    }
    index++;
  }
  return source.length;
}

function markupTag(source) {
  let html = '', index = 0;
  const beginning = /^<\/?[\w:-]+|^<![\w:-]+|^<\?[\w:-]+/.exec(source);
  if (!beginning) return null;
  html += span('tag', beginning[0]); index += beginning[0].length;
  while (index < source.length) {
    const rest = source.slice(index);
    const end = /^(?:\/?>|\?>)/.exec(rest);
    if (end) return { html: html + span('tag', end[0]), length: index + end[0].length };
    const quote = rest[0];
    if (quote === '"' || quote === "'") {
      const length = quotedLength(rest, quote);
      html += span('string', rest.slice(0, length)); index += length; continue;
    }
    const attribute = /^[\w:-]+(?=\s*=)/.exec(rest);
    if (attribute) { html += span('property', attribute[0]); index += attribute[0].length; continue; }
    html += escape(rest[0]); index++;
  }
  return { html, length: index };
}

export function highlightCode(value, language = 'text') {
  const source = String(value);
  if (!Object.hasOwn(languages, language) || language === 'text') return escape(source);
  let html = '', index = 0;
  const emit = (type, length) => { const chunk = source.slice(index, index + length); html += type ? span(type, chunk) : escape(chunk); index += length; };
  while (index < source.length) {
    const rest = source.slice(index), char = rest[0], previous = source[index - 1] || '\n';
    if (language === 'html') {
      if (rest.startsWith('<!--')) { const end = rest.indexOf('-->', 4); emit('comment', end < 0 ? rest.length : end + 3); continue; }
      if (char === '<') { const tag = markupTag(rest); if (tag) { html += tag.html; index += tag.length; continue; } }
      emit(null, 1); continue;
    }
    const slashComments = ['javascript', 'typescript', 'css', 'sql', 'json'].includes(language);
    if (slashComments && rest.startsWith('/*')) { const end = rest.indexOf('*/', 2); emit('comment', end < 0 ? rest.length : end + 2); continue; }
    const lineComment = (['javascript', 'typescript', 'json'].includes(language) && rest.startsWith('//'))
      || (language === 'sql' && rest.startsWith('--'))
      || (language === 'python' && char === '#')
      || (['bash', 'yaml'].includes(language) && char === '#' && /[\s;|&()]/.test(previous));
    if (lineComment) { const end = rest.indexOf('\n'); emit('comment', end < 0 ? rest.length : end); continue; }
    const pythonQuote = language === 'python' && /^(?:[rubf]{1,2})?("""|'''|"|')/i.exec(rest);
    if (pythonQuote) { emit('string', quotedLength(rest, pythonQuote[1], pythonQuote[0].length - pythonQuote[1].length)); continue; }
    if (char === '"' || char === "'" || (['javascript', 'typescript', 'bash'].includes(language) && char === '`')) {
      const length = quotedLength(rest, char, 0, ['sql', 'yaml'].includes(language));
      const property = language === 'json' && /^\s*:/.test(rest.slice(length));
      emit(property ? 'property' : 'string', length); continue;
    }
    if (language === 'bash' && char === '$') {
      const variable = /^\$(?:\{[^}\n]*\}|[\w@*#?$!\-]+)/.exec(rest);
      if (variable) { emit('property', variable[0].length); continue; }
    }
    const number = /^(?:0[xX][\da-fA-F]+|\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)(?![\w])/.exec(rest);
    if (number && !/[\w]/.test(previous)) { emit('number', number[0].length); continue; }
    const word = (['bash', 'yaml', 'css'].includes(language) ? /^[A-Za-z_][\w-]*/ : /^[A-Za-z_][\w]*/).exec(rest);
    if (word) {
      const text = word[0], following = rest.slice(text.length);
      const key = language === 'sql' || language === 'yaml' ? text.toLowerCase() : text;
      let type = keywordSets[language]?.has(key) ? 'keyword' : null;
      if (['yaml', 'css'].includes(language) && /^\s*:/.test(following)) type = 'property';
      else if (!type && /^\s*\(/.test(following)) type = 'function';
      emit(type, text.length); continue;
    }
    const operator = /^[=+*/%!?&|<>:^~\-]+/.exec(rest);
    if (operator) { emit('operator', operator[0].length); continue; }
    const whitespace = /^\s+/.exec(rest);
    emit(null, whitespace ? whitespace[0].length : 1);
  }
  return html;
}
