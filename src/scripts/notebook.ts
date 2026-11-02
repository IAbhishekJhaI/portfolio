// Turns the stacked chapters in [data-notebook] into a book: pours their blocks onto
// page-sized sheets (splitting long ones), shows them one spread at a time, and flips a
// leaf between spreads. See Chapter.astro for the data-* attributes blocks can carry.

const DESKTOP = window.matchMedia('(min-width: 960px) and (min-height: 560px)');
const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)');

// Never left stranded at the bottom of a page: they travel with whatever follows.
const KEEP_WITH_NEXT = 'h1, h2, h3, h4, h5, h6, header, [data-keep-next]';
const SPLITTABLE = '[data-split], ul, ol';
const INTERACTIVE = 'a, button, input, textarea, select, summary, label, [data-no-turn]';
const FONTS = ['400 1em Caveat', '700 1em Caveat', '1em "Special Elite"', '400 1em "IBM Plex Sans"', '600 1em "IBM Plex Sans"', 'italic 400 1em "IBM Plex Sans"', '1em "IBM Plex Mono"'];

interface Chapter {
  id: string;
  label: string;
  color: string;
  paper: string;
  blocks: HTMLElement[];
  start: number;
  tab: HTMLButtonElement;
}
interface Page {
  el: HTMLElement;
  chapter: Chapter | null;
}
interface Leaf {
  leaf: HTMLElement;
  front: HTMLElement;
  back: HTMLElement;
}

const root = document.querySelector<HTMLElement>('[data-notebook]');
if (root) void init(root);

async function init(root: HTMLElement) {
  const $ = <T extends Element = HTMLElement>(sel: string) => root.querySelector<T>(sel)!;
  const book = $('[data-book]');
  const spreadEl = $('[data-spread]');
  const slotL = $('[data-slot="left"]');
  const slotR = $('[data-slot="right"]');
  const tabsEl = $('[data-tabs]');
  const measure = $('[data-measure]');
  const live = $('[data-live]');
  const prevBtn = $<HTMLButtonElement>('[data-prev]');
  const nextBtn = $<HTMLButtonElement>('[data-next]');
  const fillers = [...$<HTMLTemplateElement>('[data-filler]').content.children];
  const cover = root.querySelector<HTMLElement>('[data-source] > [data-cover]');

  const chapters: Chapter[] = [...root.querySelectorAll<HTMLElement>('[data-source] > .chapter')].map((el, i, all) => {
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = 'nb-tab';
    tab.textContent = el.dataset.tab ?? '';
    tab.style.setProperty('--tab', el.dataset.color ?? '');
    tab.style.setProperty('--i', String(i));
    tab.style.setProperty('--n', String(all.length));
    tabsEl.append(tab);
    return {
      id: el.dataset.chapter ?? '',
      label: el.dataset.tab ?? '',
      color: el.dataset.color ?? '',
      paper: el.dataset.paper ?? 'ruled',
      blocks: [...el.children] as HTMLElement[],
      start: 0,
      tab,
    };
  });

  // Elements we split keep their original children here, so a re-layout can put them back.
  const originals = new Map<Element, Node[]>();
  const clones = new WeakSet<Element>();
  const anchors = new Map<string, number>();
  let pages: Page[] = [];
  let desktop = DESKTOP.matches;
  let spread = 0;
  let turning = false;
  let queued: number | null = null;
  let stale = false;

  // Desktop: page 0 (the cover) sits alone on the right, then spreads are (1,2), (3,4)...
  const spreadOf = (i: number) => (desktop ? Math.ceil(i / 2) : i);
  const pagesOf = (s: number): [number | null, number | null] =>
    desktop ? (s === 0 ? [null, 0] : [2 * s - 1, 2 * s]) : [null, s];
  const pageEl = (i: number | null) => (i === null ? null : (pages[i]?.el ?? null));
  const lastSpread = () => spreadOf(pages.length - 1);
  const only = (el: HTMLElement | null) => (el ? [el] : []);

  function div(className: string) {
    const el = document.createElement('div');
    el.className = className;
    return el;
  }

  function makePage(kind: string, ch: Chapter | null) {
    const el = document.createElement('article');
    el.className = `page page--${kind}`;
    el.tabIndex = -1;
    if (ch) {
      el.dataset.chapter = ch.id;
      el.style.setProperty('--tab', ch.color);
    }
    const head = div('page-head');
    head.textContent = ch?.label ?? '';
    el.append(head, div('page-body'), div('page-num'));
    return el;
  }
  const bodyOf = (page: HTMLElement) => page.querySelector<HTMLElement>('.page-body')!;

  // Puts `node` into `parent`. If it overflows the page, splits it by its children where it
  // can and returns what didn't fit (the node itself, or a shallow copy holding the rest).
  function fit(node: Node, parent: Element, over: () => boolean): Node | null {
    parent.appendChild(node);
    if (!over()) return null;
    if (!(node instanceof HTMLElement) || !node.matches(SPLITTABLE) || node.hasAttribute('data-keep') || !node.firstElementChild) {
      parent.removeChild(node);
      return node;
    }
    if (!clones.has(node) && !originals.has(node)) originals.set(node, [...node.childNodes]);
    const kids = [...node.childNodes];
    node.replaceChildren();
    for (let i = 0; i < kids.length; i++) {
      const rest = fit(kids[i], node, over);
      if (!rest) continue;
      const tail: Node[] = [rest, ...kids.slice(i + 1)];
      for (let last = node.lastElementChild; last?.matches(KEEP_WITH_NEXT); last = node.lastElementChild) {
        tail.unshift(last);
        last.remove();
      }
      if (!node.firstElementChild) {
        parent.removeChild(node);
        node.append(...tail);
        return node;
      }
      const shell = node.cloneNode(false) as HTMLElement;
      shell.removeAttribute('id');
      shell.removeAttribute('data-anchor');
      shell.removeAttribute('data-break');
      shell.classList.add('is-cont');
      if (node instanceof HTMLOListElement && shell instanceof HTMLOListElement) {
        shell.start = (node.start || 1) + node.querySelectorAll(':scope > li').length;
      }
      clones.add(shell);
      shell.append(...tail);
      return shell;
    }
    return null;
  }

  function paginate() {
    for (const [el, kids] of originals) el.replaceChildren(...kids);
    desktop = DESKTOP.matches;
    pages = [];
    anchors.clear();

    let body: HTMLElement | null = null;
    const over = () => !!body && body.scrollHeight > body.clientHeight + 1;
    const open = (kind: string, ch: Chapter | null) => {
      const el = makePage(kind, ch);
      measure.replaceChildren(el);
      pages.push({ el, chapter: ch });
      return bodyOf(el);
    };
    const filler = (ch: Chapter | null) => {
      const el = makePage('filler', ch);
      bodyOf(el).append(fillers[pages.length % fillers.length].cloneNode(true));
      pages.push({ el, chapter: ch });
    };

    if (cover) open('cover', null).append(cover);
    let prev: Chapter | null = null;
    for (const ch of chapters) {
      body = null;
      ch.start = -1;
      for (const block of ch.blocks) {
        const brk = block.dataset.break;
        if (brk) {
          body = null;
          // a spread starts on a left-hand (odd) page
          if (brk === 'spread' && desktop && pages.length % 2 === 0) filler(prev);
        }
        if (!body) body = open(block.dataset.paper ?? ch.paper, ch);
        if (ch.start < 0) ch.start = pages.length - 1;

        let rest = fit(block, body, over);
        while (rest) {
          if (!body.firstElementChild) {
            // too big for any page: let this one scroll rather than lose content
            body.append(rest);
            body.parentElement!.dataset.overflow = '';
            body = null;
            break;
          }
          const carry: Element | null =
            rest === block && body.childElementCount > 1 && body.lastElementChild?.matches(KEEP_WITH_NEXT) ? body.lastElementChild : null;
          body = open(ch.paper, ch);
          if (carry) body.append(carry);
          rest = fit(rest, body, over);
        }
        if (block.dataset.anchor) anchors.set(block.dataset.anchor, pages.findIndex((p) => p.el.contains(block)));
        if (block.hasAttribute('data-solo')) body = null;
      }
      prev = ch;
    }
    if (desktop && pages.length % 2 === 0) filler(prev);
    measure.replaceChildren();

    pages.forEach((p, i) => {
      p.el.querySelector('.page-num')!.textContent = i ? String(i) : '';
      p.el.setAttribute('aria-label', i ? `Page ${i}` : 'Cover');
    });
  }

  function place(s: number) {
    const [l, r] = pagesOf(s);
    slotL.replaceChildren(...only(pageEl(l)));
    slotR.replaceChildren(...only(pageEl(r)));
  }

  function chrome() {
    const [l, r] = pagesOf(spread);
    const shown = [l, r].filter((i): i is number => i !== null && i < pages.length);
    const current = pages[shown[0]]?.chapter ?? null;
    book.toggleAttribute('data-closed', spread === 0);
    for (const ch of chapters) {
      ch.tab.dataset.side = desktop && l !== null && ch.start <= l ? 'left' : 'right';
      ch.tab.toggleAttribute('aria-current', ch === current);
    }
    prevBtn.disabled = spread <= 0;
    nextBtn.disabled = spread >= lastSpread();

    const total = Math.max(pages.length - 1, 1);
    const first = shown[0] ?? 0;
    const last = shown[shown.length - 1] ?? 0;
    book.style.setProperty('--stack-l', `${Math.round((first / total) * 9) + 1}px`);
    book.style.setProperty('--stack-r', `${Math.round(((total - last) / total) * 9) + 1}px`);
    live.textContent = spread === 0 ? 'Cover' : `${current?.label ?? ''}, page ${first}${last !== first ? `–${last}` : ''} of ${total}`;

    if (!desktop && current) {
      const t = current.tab;
      tabsEl.scrollTo({ left: t.offsetLeft - (tabsEl.clientWidth - t.offsetWidth) / 2, behavior: 'smooth' });
    }
  }

  function makeLeaf(kind: 'fwd' | 'back' | 'solo'): Leaf {
    const leaf = div(`nb-leaf nb-leaf--${kind}`);
    leaf.setAttribute('aria-hidden', 'true');
    leaf.inert = true;
    const front = div('nb-face nb-face--front');
    const back = div('nb-face nb-face--back');
    front.dataset.side = kind === 'back' ? 'left' : 'right';
    back.dataset.side = kind === 'fwd' ? 'left' : 'right';
    front.append(div('nb-shade'));
    back.append(div('nb-shade'));
    leaf.append(front, back);
    return { leaf, front, back };
  }
  const blank = () => div('page page--blank');

  function swing(p: Leaf, from: number, to: number, delay: number, duration: number, z: [number, number]) {
    const opts: KeyframeAnimationOptions = { duration, delay, easing: 'cubic-bezier(0.42, 0.08, 0.28, 1)', fill: 'both' };
    p.front.lastElementChild!.animate([{ opacity: 0 }, { opacity: 0.6 }], { ...opts, duration: duration / 2 });
    p.back.lastElementChild!.animate([{ opacity: 0.6 }, { opacity: 0.6, offset: 0.5 }, { opacity: 0 }], opts);
    return p.leaf.animate(
      [
        { transform: `rotateY(${from}deg)`, zIndex: z[0] },
        { transform: `rotateY(${to}deg)`, zIndex: z[1] },
      ],
      opts,
    ).finished;
  }

  async function flip(from: number, to: number) {
    const fwd = to > from;
    const [la, ra] = pagesOf(from).map(pageEl);
    const [lb, rb] = pagesOf(to).map(pageEl);

    if (!desktop) {
      const p = makeLeaf('solo');
      p.front.prepend(fwd ? (ra ?? blank()) : (rb ?? blank()));
      p.back.prepend(blank());
      if (fwd) slotR.replaceChildren(...only(rb));
      spreadEl.append(p.leaf);
      await (fwd ? swing(p, 0, -180, 0, 650, [10, 10]) : swing(p, -180, 0, 0, 650, [10, 10]));
      if (!fwd) slotR.replaceChildren(...only(rb));
      p.leaf.remove();
      return;
    }

    // Jumping several spreads riffles a few blank leaves along with the real one.
    const n = 1 + Math.min(3, Math.abs(to - from) - 1);
    const leaves: Leaf[] = [];
    for (let k = 0; k < n; k++) {
      const p = makeLeaf(fwd ? 'fwd' : 'back');
      p.front.prepend((k === 0 ? (fwd ? ra : la) : null) ?? blank());
      p.back.prepend((k === n - 1 ? (fwd ? lb : rb) : null) ?? blank());
      leaves.push(p);
    }
    if (fwd) slotR.replaceChildren(...only(rb));
    else slotL.replaceChildren(...only(lb));
    spreadEl.append(...leaves.map((p) => p.leaf));
    const end = fwd ? -180 : 180;
    // first leaf starts on top of the pile, last leaf ends on top
    await Promise.all(leaves.map((p, k) => swing(p, 0, end, k * 120, 820, [20 + n - k, 20 + k])));
    if (fwd) slotL.replaceChildren(...only(lb));
    else slotR.replaceChildren(...only(rb));
    for (const p of leaves) p.leaf.remove();
  }

  async function fade(to: number) {
    place(to);
    await spreadEl.animate([{ opacity: 0.2 }, { opacity: 1 }], { duration: 220, easing: 'ease-out' }).finished;
  }

  async function turn(to: number, focus = false) {
    if (turning) {
      queued = to;
      return;
    }
    if (to === spread) return;
    turning = true;
    const from = spread;
    spread = to;
    chrome();
    try {
      if (REDUCED.matches) await fade(to);
      else await flip(from, to);
    } finally {
      turning = false;
    }
    if (stale) relayout();
    if (queued !== null) {
      const next = queued;
      queued = null;
      void turn(next, focus);
      return;
    }
    if (focus) (slotL.firstElementChild ?? slotR.firstElementChild)?.closest<HTMLElement>('.page')?.focus({ preventScroll: true });
  }

  function hashFor(s: number) {
    const [l, r] = pagesOf(s);
    const i = l ?? r;
    return i ? (pages[i]?.chapter?.id ?? '') : '';
  }

  function spreadForHash(raw: string): number | null {
    const key = decodeURIComponent(raw.replace(/^#/, ''));
    if (!key) return 0;
    const ch = chapters.find((c) => c.id === key);
    if (ch) return spreadOf(ch.start);
    const at = anchors.get(key);
    return at === undefined || at < 0 ? null : spreadOf(at);
  }

  function navigate(s: number, mode: 'push' | 'replace', hash?: string, focus = false) {
    const target = Math.max(0, Math.min(s, lastSpread()));
    const h = hash ?? hashFor(target);
    const url = h ? `#${h}` : location.pathname + location.search;
    if (mode === 'push') history.pushState(null, '', url);
    else history.replaceState(null, '', url);
    void turn(target, focus);
  }
  const step = (d: number) => navigate((queued ?? spread) + d, 'replace');

  // Re-lay out after a resize or a late font/image, keeping the reader on the same content.
  function firstOriginal(page: HTMLElement | null) {
    if (!page || page.classList.contains('page--filler')) return null;
    for (const el of bodyOf(page).querySelectorAll('*')) if (!clones.has(el)) return el;
    return null;
  }
  let sizeKey = '';
  const currentKey = () => `${DESKTOP.matches}|${measure.offsetWidth}x${measure.offsetHeight}`;
  function relayout() {
    stale = false;
    const [l, r] = pagesOf(spread);
    const marker = firstOriginal(pageEl(l)) ?? firstOriginal(pageEl(r));
    paginate();
    sizeKey = currentKey();
    const at = marker ? pages.findIndex((p) => p.el.contains(marker)) : 0;
    spread = spreadOf(Math.max(at, 0));
    place(spread);
    chrome();
  }
  let timer = 0;
  const schedule = (force: boolean) => {
    clearTimeout(timer);
    timer = window.setTimeout(() => {
      if (!force && currentKey() === sizeKey) return;
      if (turning) stale = true;
      else relayout();
    }, 200);
  };

  // ---- inputs ----
  chapters.forEach((ch) => ch.tab.addEventListener('click', () => navigate(spreadOf(ch.start), 'push', ch.id, true)));
  prevBtn.addEventListener('click', () => step(-1));
  nextBtn.addEventListener('click', () => step(1));

  let swiped = false;
  spreadEl.addEventListener('click', (e) => {
    const t = e.target as Element;
    if (swiped || t.closest(INTERACTIVE) || getSelection()?.toString()) return;
    const slot = t.closest<HTMLElement>('[data-slot]');
    if (!slot) return;
    if (desktop) step(slot === slotL ? -1 : 1);
    else {
      const box = slot.getBoundingClientRect();
      step(e.clientX - box.left < box.width / 3 ? -1 : 1);
    }
  });

  let sx = 0;
  let sy = 0;
  spreadEl.addEventListener('pointerdown', (e) => {
    sx = e.clientX;
    sy = e.clientY;
  });
  spreadEl.addEventListener('pointerup', (e) => {
    const dx = e.clientX - sx;
    const dy = e.clientY - sy;
    if (e.pointerType === 'mouse' || Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    swiped = true;
    step(dx < 0 ? 1 : -1);
    setTimeout(() => (swiped = false), 350);
  });

  const keys: Record<string, number> = { ArrowRight: 1, PageDown: 1, ArrowLeft: -1, PageUp: -1 };
  document.addEventListener('keydown', (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey || (e.target as Element).closest?.('input, textarea, select, [contenteditable]')) return;
    if (keys[e.key]) {
      e.preventDefault();
      step(keys[e.key]);
    } else if (e.key === 'Home' || e.key === 'End') {
      e.preventDefault();
      navigate(e.key === 'Home' ? 0 : lastSpread(), 'push');
    }
  });

  // In-book links (#projects/hacksync) turn pages instead of jumping.
  root.addEventListener('click', (e) => {
    const a = (e.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
    if (!a) return;
    const hash = a.getAttribute('href')!.slice(1);
    const s = spreadForHash(hash);
    if (s === null) return;
    e.preventDefault();
    navigate(s, 'push', hash, true);
  });

  const fromLocation = () => void turn(spreadForHash(location.hash) ?? 0);
  window.addEventListener('popstate', fromLocation);
  window.addEventListener('hashchange', fromLocation);
  window.addEventListener('resize', () => schedule(false));
  document.fonts.addEventListener('loadingdone', () => schedule(true));
  for (const img of root.querySelectorAll<HTMLImageElement>('[data-source] img')) {
    if (!img.complete) img.addEventListener('load', () => schedule(true), { once: true });
  }

  // ---- first layout ----
  // Fonts only load once something uses them, so ask for them before measuring anything.
  await Promise.race([Promise.allSettled(FONTS.map((f) => document.fonts.load(f))), new Promise((r) => setTimeout(r, 2500))]);
  paginate();
  sizeKey = currentKey();
  spread = Math.min(spreadForHash(location.hash) ?? 0, lastSpread());
  // open straight to the right spread, without the book sliding or tabs flying in
  root.dataset.instant = '';
  place(spread);
  chrome();
  void root.offsetWidth;
  delete root.dataset.instant;
  root.dataset.ready = '';
}
