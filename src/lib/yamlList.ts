import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { Loader } from 'astro/loaders';
import { parse } from 'yaml';

const slug = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

/**
 * Loads a YAML file holding a plain list of entries. Unlike Astro's file() loader,
 * entries don't need an `id`: it's derived from `title` (or `name`), so adding an
 * item is just adding a list item. An empty or comment-only file yields no entries.
 */
export function yamlList(path: string): Loader {
  return {
    name: 'yaml-list',
    async load({ store, parseData, watcher, logger }) {
      const abs = resolve(path);
      const sync = async () => {
        const items = parse(await readFile(abs, 'utf8')) ?? [];
        if (!Array.isArray(items)) throw new Error(`${path} must be a YAML list`);
        // Validate everything before touching the store, so a reload never serves a half-empty list.
        const seen = new Map<string, number>();
        const entries = [];
        for (const item of items) {
          const base = slug(String(item.title ?? item.name ?? 'item'));
          const n = (seen.get(base) ?? 0) + 1;
          seen.set(base, n);
          const id = n === 1 ? base : `${base}-${n}`;
          entries.push({ id, data: await parseData({ id, data: item }) });
        }
        store.clear();
        for (const entry of entries) store.set(entry);
      };
      await sync();
      watcher?.add(abs);
      watcher?.on('change', async (changed) => {
        if (resolve(changed) !== abs) return;
        logger.info(`Reloading ${path}`);
        await sync();
      });
    },
  };
}
