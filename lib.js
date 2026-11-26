import { codeLanguage, highlightCode } from './syntax.js';

export const escapeHTML = (value = '') => String(value).replace(/[&<>"']/g, char => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[char]));

const paths = {
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8" cy="8" r="1.5"/><path d="m3 16 5-5 4 4 3-3 6 6"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  diagonal: '<path d="M6 18 18 6M6 6h12v12"/>',
  search: '<circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4.5 4.5"/>',
  moon: '<path d="M20.5 14A8.7 8.7 0 0 1 10 3.5 8.8 8.8 0 1 0 20.5 14Z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>',
  pen: '<path d="m15 4 5 5M4 20l5-1L20 8a3.5 3.5 0 0 0-5-5L4 14Z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  pin: '<path d="m16 3 5 5-4 1-4 4v4l-2 2-6-6 2-2h4l4-4 1-4ZM2 22l6-6"/>',
  back: '<path d="M19 12H5m6-6-6 6 6 6"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  link: '<path d="m10 13 4-4m-6 1L5 13a4 4 0 0 0 6 6l3-3m-4-8 3-3a4 4 0 0 1 6 6l-3 3"/>',
  github: '<path d="M9 19c-4 1-4-2-6-2m12 5v-4a3.5 3.5 0 0 0-1-3c3-.3 6-1.5 6-6a5 5 0 0 0-1.4-3.5A4.6 4.6 0 0 0 18.5 2S17 1.5 14 3a13 13 0 0 0-5 0C6 1.5 4.5 2 4.5 2a4.6 4.6 0 0 0-.1 3.5A5 5 0 0 0 3 9c0 4.5 3 5.7 6 6a3.5 3.5 0 0 0-1 3v4"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="m3 7 9 6 9-6"/>',
  book: '<path d="M12 6C8 3 4 4 2 5v15c3-2 7-1 10 1 3-2 7-3 10-1V5c-2-1-6-2-10 1Zm0 0v15"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
};
export const icon = (name, className = '') => `<svg class="icon ${className}" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.arrow}</svg>`;

export function safeURL(value) {
  try { const url = new URL(value); return ['https:', 'http:', 'mailto:'].includes(url.protocol) ? url.href : ''; }
  catch { return ''; }
}

function inline(text, base, depth = 0, links = true) {
  if (depth > 8) return escapeHTML(text);
  let html = '', index = 0;
  while (index < text.length) {
    const rest = text.slice(index);
    if (rest[0] === '\\' && /^[\\`*_[\]{}()#+\-.!>|~]/.test(rest[1] || '')) { html += escapeHTML(rest[1]); index += 2; continue; }
    const ticks = /^`+/.exec(rest);
    if (ticks) {
      let end = rest.indexOf(ticks[0], ticks[0].length);
      while (end >= 0 && (rest[end - 1] === '`' || rest[end + ticks[0].length] === '`')) end = rest.indexOf(ticks[0], end + 1);
      if (end >= 0) { html += `<code>${escapeHTML(rest.slice(ticks[0].length, end))}</code>`; index += end + ticks[0].length; continue; }
      html += escapeHTML(ticks[0]); index += ticks[0].length; continue;
    }
    const link = links && /^\[([^\]\n]+)\]\((https?:\/\/[^\s)]+|#post\/[a-z0-9]+(?:-[a-z0-9]+)*)\)/.exec(rest);
    const internal = link && link[2].startsWith('#post/');
    if (link && (internal || safeURL(link[2]))) {
      const href = internal && base ? `${base}posts/${link[2].slice(6)}/` : link[2];
      html += `<a href="${escapeHTML(href)}"${internal ? '' : ' target="_blank" rel="noopener noreferrer"'}>${inline(link[1], base, depth + 1, false)}</a>`;
      index += link[0].length; continue;
    }
    const marker = ['**', '~~', '*', '__', '_'].find(value => rest.startsWith(value));
    if (marker && !(marker.includes('_') && /[\p{L}\p{N}]/u.test(text[index - 1] || ''))) {
      const end = rest.indexOf(marker, marker.length);
      if (end > marker.length) {
        const tag = marker === '~~' ? 'del' : marker.length === 2 ? 'strong' : 'em';
        html += `<${tag}>${inline(rest.slice(marker.length, end), base, depth + 1, links)}</${tag}>`;
        index += end + marker.length; continue;
      }
    }
    html += escapeHTML(rest[0]); index++;
  }
  return html;
}

export const markdownImage = line => /^!\[([^\]]*)\]\((https?:\/\/[^\s)]+|\.\/assets\/[^\s)]+)\)$/.exec(line.trim());

export function markdownFence(line) {
  const match = /^ {0,3}(`{3,}|~{3,})([^\n]*)$/.exec(line);
  if (!match || (match[1][0] === '`' && match[2].includes('`'))) return null;
  return { marker: match[1][0], length: match[1].length, info: match[2].trim() };
}

export function closesMarkdownFence(line, fence) {
  const match = /^ {0,3}(`+|~+)\s*$/.exec(line);
  return Boolean(match && match[1][0] === fence.marker && match[1].length >= fence.length);
}

// Remove author comments, while preserving HTML comment examples inside code.
function withoutComments(lines) {
  let comment = false, fence = null;
  const quoteContent = (line, limit = Infinity) => {
    let content = line, depth = 0, match;
    while (depth < limit && (match = /^ {0,3}>\s?/.exec(content))) {
      content = content.slice(match[0].length); depth++;
    }
    return { content, depth };
  };
  const openingFence = line => {
    const { content, depth } = quoteContent(line), opening = markdownFence(content);
    return opening ? { ...opening, quoteDepth: depth } : null;
  };
  return lines.map(line => {
    if (fence) {
      // Only remove the container's quote markers; any additional > is code.
      const { content, depth } = quoteContent(line, fence.quoteDepth);
      if (depth === fence.quoteDepth) {
        if (closesMarkdownFence(content, fence)) fence = null;
        return line;
      }
      // An unclosed code block ends with its enclosing quoted block.
      fence = null;
    }
    if (!comment) { const opening = openingFence(line); if (opening) { fence = opening; return line; } }
    let visible = '', index = 0;
    while (index < line.length) {
      if (comment) {
        const end = line.indexOf('-->', index);
        if (end < 0) break;
        comment = false; index = end + 3; continue;
      }
      if (line.startsWith('<!--', index)) { comment = true; index += 4; continue; }
      const ticks = /^`+/.exec(line.slice(index));
      if (ticks) {
        let end = line.indexOf(ticks[0], index + ticks[0].length);
        while (end >= 0 && (line[end - 1] === '`' || line[end + ticks[0].length] === '`')) end = line.indexOf(ticks[0], end + 1);
        if (end >= 0) { visible += line.slice(index, end + ticks[0].length); index = end + ticks[0].length; continue; }
        visible += ticks[0]; index += ticks[0].length; continue;
      }
      visible += line[index++];
    }
    if (!comment) fence = openingFence(visible);
    return visible;
  });
}

function codeBlock(source, info) {
  const { name, label } = codeLanguage(info);
  return `<div class="code-block" data-language="${name}"><div class="code-toolbar"><span class="code-language">${escapeHTML(label)}</span><button type="button" class="code-copy" data-copy-code><span class="copy-label-ko">복사</span><span class="copy-label-en">Copy</span></button></div><pre tabindex="0" aria-label="${escapeHTML(label)} code"><code class="language-${name}">${highlightCode(source, name)}</code></pre><span class="code-feedback sr-only" role="status" aria-live="polite"></span></div>`;
}

function tableCells(line) {
  let value = line.trim();
  if (value.startsWith('|')) value = value.slice(1);
  if (value.endsWith('|') && !value.endsWith('\\|')) value = value.slice(0, -1);
  const cells = []; let cell = '', ticks = 0;
  for (let index = 0; index < value.length; index++) {
    if (value[index] === '\\' && value[index + 1] === '|') { cell += '\\|'; index++; continue; }
    if (value[index] === '`') {
      const run = /^`+/.exec(value.slice(index))[0];
      if (!ticks) ticks = run.length; else if (ticks === run.length) ticks = 0;
      cell += run; index += run.length - 1; continue;
    }
    if (value[index] === '|' && !ticks) { cells.push(cell.trim()); cell = ''; }
    else cell += value[index];
  }
  cells.push(cell.trim()); return cells;
}

const listItem = line => /^( *)([-+*]|\d+[.)])\s+(.+)$/.exec(line);
const isOrdered = item => /^\d/.test(item[2]);

function renderList(lines, start, base, depth = 0) {
  if (depth > 20) return { html: `<ul><li>${escapeHTML(lines[start].trim())}</li></ul>`, end: start + 1 };
  const first = listItem(lines[start]), indent = first[1].length, ordered = isOrdered(first), type = ordered ? 'ol' : 'ul';
  const initial = ordered ? Number.parseInt(first[2], 10) : 1;
  const items = []; let index = start, tasks = false;
  while (index < lines.length) {
    const item = listItem(lines[index]);
    if (!item || item[1].length !== indent || isOrdered(item) !== ordered) break;
    let body = item[3], task = /^\[([ xX])\]\s+/.exec(body);
    if (task) { tasks = true; body = body.slice(task[0].length); }
    let child = ''; index++;
    while (index < lines.length) {
      const next = listItem(lines[index]);
      if (next && next[1].length > indent) { const nested = renderList(lines, index, base, depth + 1); child += nested.html; index = nested.end; continue; }
      if (next || !lines[index].trim() || !lines[index].startsWith(' '.repeat(indent + 2))) break;
      body += '\n' + lines[index].trim(); index++;
    }
    const checkbox = task ? `<input type="checkbox" disabled${task[1].toLowerCase() === 'x' ? ' checked' : ''} aria-label="${escapeHTML(body)}"> ` : '';
    items.push(`<li${task ? ' class="task-list-item"' : ''}>${checkbox}${inline(body, base).replace(/\n/g, '<br>')}${child}</li>`);
  }
  return { html: `<${type}${tasks ? ' class="task-list"' : ''}${ordered && initial !== 1 ? ` start="${initial}"` : ''}>${items.join('')}</${type}>`, end: index };
}

const htmlEntities = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'" };
const plainText = markup => markup.replace(/<[^>]*>/g, '').replace(/&(?:amp|lt|gt|quot|#39);/g, entity => htmlEntities[entity]).trim();

function articleHeading(markup, level, article) {
  const title = plainText(markup);
  const slug = title.normalize('NFC').toLowerCase().replace(/[^\p{L}\p{M}\p{N}]+/gu, '-').replace(/^-|-$/g, '');
  const stem = `section-${slug || 'untitled'}`;
  let id = stem, suffix = article.nextSuffix.get(stem) || 2;
  while (article.ids.has(id)) id = `${stem}-${suffix++}`;
  article.nextSuffix.set(stem, suffix);
  article.ids.add(id);
  if (level === 2 && title) article.headings.push({ id, title });
  return ` id="${id}"`;
}

function renderBlocks(lines, article, depth = 0) {
  if (depth > 20) return `<p>${escapeHTML(lines.join('\n'))}</p>`;
  let html = '', paragraph = [], index = 0;
  const base = article?.base;
  const flush = () => { if (paragraph.length) { html += `<p>${inline(paragraph.join('\n'), base).replace(/\n/g, '<br>')}</p>`; paragraph = []; } };
  while (index < lines.length) {
    const line = lines[index], fence = markdownFence(line);
    if (fence) {
      flush(); let end = index + 1;
      while (end < lines.length && !closesMarkdownFence(lines[end], fence)) end++;
      const body = lines.slice(index + 1, end).join('\n') + (end < lines.length && end > index + 1 ? '\n' : '');
      html += codeBlock(body, fence.info); index = end < lines.length ? end + 1 : end; continue;
    }
    const image = markdownImage(line), heading = /^(#{1,6})\s+(.+)$/.exec(line), item = listItem(line);
    if (image) {
      flush();
      const src = base && image[2].startsWith('./assets/') ? base + image[2].slice(2) : image[2];
      html += `<figure><button type="button" class="image-zoom" data-zoom-image aria-label="${escapeHTML(image[1] || 'Image')}"><img src="${escapeHTML(src)}" alt="${escapeHTML(image[1])}" loading="lazy"></button></figure>`;
      index++; continue;
    }
    if (heading) {
      flush();
      const level = Math.min(heading[1].length + 1, 6), title = inline(heading[2], base);
      const id = article && depth === 0 ? articleHeading(title, level, article) : '';
      html += `<h${level}${id}>${title}</h${level}>`;
      index++; continue;
    }
    if (/^ {0,3}>\s?/.test(line)) {
      flush(); const quote = [];
      while (index < lines.length && /^ {0,3}>\s?/.test(lines[index])) quote.push(lines[index++].replace(/^ {0,3}>\s?/, ''));
      html += `<blockquote>${renderBlocks(quote, article, depth + 1)}</blockquote>`; continue;
    }
    if (/^ {0,3}(?:-{3,}|\*{3,}|_{3,})\s*$/.test(line)) { flush(); html += '<hr>'; index++; continue; }
    if (item) { flush(); const list = renderList(lines, index, base); html += list.html; index = list.end; continue; }
    const cells = line.includes('|') && tableCells(line), separators = index + 1 < lines.length && tableCells(lines[index + 1]);
    if (cells && separators && cells.length === separators.length && separators.every(cell => /^:?-{3,}:?$/.test(cell))) {
      flush(); const alignments = separators.map(cell => cell.startsWith(':') && cell.endsWith(':') ? 'center' : cell.endsWith(':') ? 'right' : cell.startsWith(':') ? 'left' : '');
      const row = (values, tag) => `<tr>${cells.map((_, at) => `<${tag}${tag === 'th' ? ' scope="col"' : ''}${alignments[at] ? ` class="align-${alignments[at]}"` : ''}>${inline(values[at] || '', base)}</${tag}>`).join('')}</tr>`;
      html += `<div class="markdown-table" tabindex="0" role="region" aria-label="Table"><table><thead>${row(cells, 'th')}</thead><tbody>`;
      index += 2;
      while (index < lines.length && lines[index].trim() && lines[index].includes('|')) { html += row(tableCells(lines[index]), 'td'); index++; }
      html += '</tbody></table></div>'; continue;
    }
    if (!line.trim()) flush(); else paragraph.push(line);
    index++;
  }
  flush(); return html;
}

const markdownLines = source => withoutComments(String(source).replace(/\r\n/g, '\n').split('\n'));

export function markdown(source = '') {
  return renderBlocks(markdownLines(source));
}

export function articleContent(source = '', { base = './' } = {}) {
  const headings = [];
  const html = renderBlocks(markdownLines(source), { base, headings, ids: new Set(), nextSuffix: new Map() });
  return { html, headings };
}

export function articleExcerpt(html) {
  const paragraph = /<p>(.*?)<\/p>/s.exec(html);
  return paragraph ? plainText(paragraph[1].replace(/<br>/g, ' ')) : '';
}

export function articleToc(headings, label) {
  if (headings.length < 5) return '';
  const items = headings.map(({ id, title }) => `<li><a href="#${escapeHTML(id)}">${escapeHTML(title)}</a></li>`).join('');
  return `<details class="article-toc"><summary>${escapeHTML(label)}</summary><ul>${items}</ul></details>`;
}

export const readTime = body => Math.max(1, Math.ceil(String(body || '').length / 500));
export const dateText = (date, language = 'ko') => new Intl.DateTimeFormat(language === 'en' ? 'en-US' : 'ko-KR', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }).format(new Date(`${date}T00:00:00Z`));

export async function loadContent() {
  let response;
  try {
    response = await fetch('./api/content', { cache: 'no-store' });
    if (response.ok && response.headers.get('content-type')?.includes('application/json')) return await response.json();
  } catch { /* A static export uses the generated JSON instead. */ }
  response = await fetch('./data/content.json', { cache: 'no-store' });
  if (!response.ok) throw new Error('기록을 불러오지 못했어요. 서버가 실행 중인지 확인해 주세요.');
  return response.json();
}
