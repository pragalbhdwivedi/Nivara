import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import MarkdownIt from "markdown-it";
import anchor from "markdown-it-anchor";
import { withBase } from "./paths";

const DOCS_ROOT = path.resolve(new URL("../../../docs/nivara", import.meta.url).pathname);
const INDEX_PATH = path.join(DOCS_ROOT, "00_INDEX.md");
const CHARACTERS_INDEX_PATH = path.join(DOCS_ROOT, "characters", "00_CHARACTERS_INDEX.md");

const ROUTE_LABELS = new Map([
  ["/world", "World"],
  ["/power", "Power"],
  ["/the-melt", "The Melt"],
  ["/factions", "Factions"],
  ["/characters", "Characters"],
  ["/story-arcs", "Story Arcs"],
  ["/symbols", "Symbols"],
  ["/appendix", "Appendix"],
]);

const ROUTE_MAP = new Map([
  ["01_WORLD_OVERVIEW.md", "/world"],
  ["02_CORE_PREMISE.md", "/world"],
  ["07_REGIONS_MAP_FEEL.md", "/world"],
  ["03_MAGIC_SYSTEM_OATHS_ELEMENTS.md", "/power"],
  ["05_POWER_STRUCTURE_FEMALE_LED.md", "/power"],
  ["04_FACTIONS.md", "/factions"],
  ["06_CONFLICT_THE_MELT.md", "/the-melt"],
  ["08_STORY_ARCS.md", "/story-arcs"],
  ["symbols/SYMBOLS_AND_SIGILS.md", "/symbols"],
  ["APPENDIX_STORY_EXCERPTS.md", "/appendix"],
  ["characters/00_CHARACTERS_INDEX.md", "/characters"],
]);

let canonCache = null;

const slugify = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const isMarkdownLink = (href) => href && href.includes(".md");

const resolveDocPath = (basePath, link) => path.resolve(path.dirname(basePath), link.split("#")[0]);

const getRelativeDocPath = (absolutePath) => path.relative(DOCS_ROOT, absolutePath).replace(/\\/g, "/");

const getCharacterSlug = (relativePath) => {
  const segments = relativePath.split("/");
  const folder = segments[1] ?? "";
  return slugify(folder);
};

const getRouteForDocPath = (relativePath) => {
  if (relativePath.startsWith("characters/") && relativePath.endsWith("/README.md")) {
    return `/characters/${getCharacterSlug(relativePath)}`;
  }

  return ROUTE_MAP.get(relativePath) ?? null;
};

const extractLinks = (markdown) => {
  const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
  const links = [];
  let match = linkPattern.exec(markdown);
  while (match) {
    links.push({ label: match[1].trim(), href: match[2].trim() });
    match = linkPattern.exec(markdown);
  }
  return links;
};

const createMarkdownRenderer = (routeMap, basePath) => {
  const md = new MarkdownIt({ html: false, linkify: true });
  md.use(anchor, {
    slugify,
    permalink: anchor.permalink.linkInsideHeader({
      symbol: "#",
      placement: "after",
      ariaHidden: true,
    }),
  });

  const defaultLinkOpen = md.renderer.rules.link_open || ((tokens, idx, options, env, self) => self.renderToken(tokens, idx, options));

  md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
    const hrefIndex = tokens[idx].attrIndex("href");
    if (hrefIndex >= 0) {
      const href = tokens[idx].attrs[hrefIndex][1];
      if (isMarkdownLink(href) && !href.startsWith("http")) {
        const [filePart, hash] = href.split("#");
        const resolved = resolveDocPath(basePath, filePart);
        const mapped = routeMap.get(resolved);
        if (mapped) {
          const resolvedHref = hash ? `${mapped}#${hash}` : mapped;
          tokens[idx].attrs[hrefIndex][1] = withBase(resolvedHref);
        }
      }
    }

    return defaultLinkOpen(tokens, idx, options, env, self);
  };

  return md;
};

const extractToc = (tokens) => {
  const toc = [];
  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];
    if (token.type === "heading_open") {
      const inline = tokens[i + 1];
      if (!inline || inline.type !== "inline") {
        continue;
      }
      const level = Number(token.tag.replace("h", ""));
      const text = inline.content;
      if (!text) {
        continue;
      }
      toc.push({ level, text, slug: slugify(text) });
    }
  }

  return toc;
};

const renderMarkdownFile = async (filePath, routeMap) => {
  const raw = await fs.readFile(filePath, "utf-8");
  const { content, data } = matter(raw);
  const md = createMarkdownRenderer(routeMap, filePath);
  const tokens = md.parse(content, { routeMap, basePath: filePath });
  const html = md.renderer.render(tokens, md.options, { routeMap, basePath: filePath });
  const toc = extractToc(tokens);
  return { html, data, toc };
};

const loadCanonIndex = async () => {
  if (canonCache) {
    return canonCache;
  }

  canonCache = (async () => {
    const indexRaw = await fs.readFile(INDEX_PATH, "utf-8");
    const mainLinks = extractLinks(indexRaw);
    const resolvedMainLinks = mainLinks.map((link) => ({
      ...link,
      absolutePath: resolveDocPath(INDEX_PATH, link.href),
    }));

    const charactersIndexLink = resolvedMainLinks.find((link) => link.absolutePath === CHARACTERS_INDEX_PATH);
    if (!charactersIndexLink) {
      throw new Error("Characters index must be linked in docs/nivara/00_INDEX.md.");
    }

    const charactersIndexRaw = await fs.readFile(CHARACTERS_INDEX_PATH, "utf-8");
    const characterLinks = extractLinks(charactersIndexRaw).map((link) => ({
      ...link,
      absolutePath: resolveDocPath(CHARACTERS_INDEX_PATH, link.href),
    }));

    const mainIndexCharacterLinks = resolvedMainLinks.filter((link) =>
      getRelativeDocPath(link.absolutePath).startsWith("characters/") &&
      getRelativeDocPath(link.absolutePath).endsWith("/README.md")
    );

    const allowedDocPaths = new Set();
    resolvedMainLinks.forEach((link) => allowedDocPaths.add(link.absolutePath));
    characterLinks.forEach((link) => allowedDocPaths.add(link.absolutePath));

    await Promise.all(
      Array.from(allowedDocPaths).map(async (docPath) => {
        try {
          await fs.access(docPath);
        } catch (error) {
          throw new Error(`Indexed doc is missing: ${docPath}`);
        }
      })
    );

    const routeDocs = new Map();
    const routeMap = new Map();

    resolvedMainLinks
      .filter((link) => !getRelativeDocPath(link.absolutePath).startsWith("characters/") || link.absolutePath === CHARACTERS_INDEX_PATH)
      .forEach((link) => {
        const relativePath = getRelativeDocPath(link.absolutePath);
        const route = getRouteForDocPath(relativePath);
        if (!route) {
          throw new Error(`No route mapping defined for indexed doc: ${relativePath}`);
        }
        const entries = routeDocs.get(route) ?? [];
        entries.push(link.absolutePath);
        routeDocs.set(route, entries);
        routeMap.set(link.absolutePath, route);
      });

    const characterEntriesMap = new Map();
    [...characterLinks, ...mainIndexCharacterLinks].forEach((link) => {
      const relativePath = getRelativeDocPath(link.absolutePath);
      const route = getRouteForDocPath(relativePath);
      if (!route) {
        throw new Error(`No route mapping defined for character doc: ${relativePath}`);
      }
      routeMap.set(link.absolutePath, route);
      if (!characterEntriesMap.has(link.absolutePath)) {
        characterEntriesMap.set(link.absolutePath, {
          label: link.label,
          slug: getCharacterSlug(relativePath),
          route,
          filePath: link.absolutePath,
        });
      }
    });
    const characterEntries = Array.from(characterEntriesMap.values());

    routeMap.set(CHARACTERS_INDEX_PATH, "/characters");

    return {
      routeDocs,
      routeMap,
      characterEntries,
      navLinks: resolvedMainLinks
        .map((link) => {
          const relativePath = getRelativeDocPath(link.absolutePath);
          const route = getRouteForDocPath(relativePath);
          if (!route || !ROUTE_LABELS.has(route) || !routeDocs.has(route)) {
            return null;
          }
          return { route, label: ROUTE_LABELS.get(route) };
        })
        .filter(Boolean)
        .filter((link, index, array) => array.findIndex((item) => item.route === link.route) === index),
    };
  })();

  return canonCache;
};

export const getCanonNavigation = async () => {
  const { navLinks } = await loadCanonIndex();
  return navLinks;
};

export const getCanonRoute = async (route) => {
  const { routeDocs, routeMap } = await loadCanonIndex();
  const docs = routeDocs.get(route);
  if (!docs || docs.length === 0) {
    throw new Error(`No canon docs found for route: ${route}`);
  }
  const sections = [];
  let toc = [];
  for (const docPath of docs) {
    const rendered = await renderMarkdownFile(docPath, routeMap);
    sections.push({ ...rendered, sourcePath: docPath });
    toc = toc.concat(rendered.toc);
  }

  return {
    title: ROUTE_LABELS.get(route) ?? "Canon",
    sections,
    toc,
  };
};

export const getCanonRouteLabel = (route) => ROUTE_LABELS.get(route) ?? "Canon";

export const getCanonCharacters = async () => {
  const { characterEntries, routeMap } = await loadCanonIndex();
  return { characterEntries, routeMap };
};

export const renderCanonMarkdown = async (filePath, routeMap) => renderMarkdownFile(filePath, routeMap);

export const getCanonCharactersIndexPath = () => CHARACTERS_INDEX_PATH;

export const getCanonValidationSummary = async () => {
  const { routeDocs, characterEntries } = await loadCanonIndex();
  return {
    routeDocs: Array.from(routeDocs.entries()).map(([route, docs]) => ({ route, docs })),
    characterEntries,
  };
};
