import type { SvgDocument, SvgElement } from '@svg-spawn/core';
import type { SmilElement } from './generators/smil.js';

/**
 * Deep-clone an SvgElement tree.
 */
function cloneElement(el: SvgElement): SvgElement {
  return {
    nodeUid: el.nodeUid,
    tagName: el.tagName,
    attributes: { ...el.attributes },
    children: el.children.map(cloneElement),
    ...(el.fingerprint ? { fingerprint: el.fingerprint } : {}),
    ...(el.textContent !== undefined ? { textContent: el.textContent } : {}),
  };
}

/**
 * Set of nodeUids that require data-uid attributes for CSS targeting.
 */
function collectAnimatedUids(
  smilElements: SmilElement[],
  cssBlock: string,
): Set<string> {
  const uids = new Set<string>();
  for (const smil of smilElements) {
    uids.add(smil.nodeUid);
  }
  // Extract nodeUids from CSS data-uid selectors
  const regex = /data-uid="([^"]+)"/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(cssBlock)) !== null) {
    uids.add(match[1]!);
  }
  return uids;
}

/**
 * Insert SMIL elements as children of their target elements and add data-uid attributes.
 */
function insertSmilElements(
  el: SvgElement,
  smilByUid: Map<string, string[]>,
  animatedUids: Set<string>,
): SvgElement {
  const clone = cloneElement(el);

  // Add data-uid attribute if this element has animations
  if (animatedUids.has(clone.nodeUid)) {
    clone.attributes['data-uid'] = clone.nodeUid;
  }

  // Process children recursively first
  clone.children = clone.children.map((child) =>
    insertSmilElements(child, smilByUid, animatedUids),
  );

  // Insert SMIL elements as children (as raw text children)
  const smilStrings = smilByUid.get(clone.nodeUid);
  if (smilStrings && smilStrings.length > 0) {
    // We represent SMIL elements as SvgElement children with tagName and no further parsing.
    // For simplicity, we store them as raw children with a special marker.
    for (const smilStr of smilStrings) {
      clone.children.push({
        nodeUid: `__smil_${clone.nodeUid}_${clone.children.length}`,
        tagName: '__raw',
        attributes: {},
        children: [],
        textContent: smilStr,
      });
    }
  }

  return clone;
}

/**
 * Escape text for XML.
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Serialize an SvgElement to an XML string.
 */
function serializeElement(el: SvgElement, indent: number = 0): string {
  const pad = '  '.repeat(indent);

  // Raw SMIL element
  if (el.tagName === '__raw') {
    return `${pad}${el.textContent ?? ''}`;
  }

  const attrs = Object.entries(el.attributes)
    .map(([k, v]) => `${k}="${escapeXml(v)}"`)
    .join(' ');

  const openTag = attrs ? `${pad}<${el.tagName} ${attrs}` : `${pad}<${el.tagName}`;

  if (el.children.length === 0 && !el.textContent) {
    return `${openTag}/>`;
  }

  const parts: string[] = [];
  parts.push(`${openTag}>`);

  if (el.textContent && el.children.length === 0) {
    parts[0] = `${openTag}>${escapeXml(el.textContent)}</${el.tagName}>`;
    return parts[0]!;
  }

  if (el.textContent) {
    parts.push(`${pad}  ${escapeXml(el.textContent)}`);
  }

  for (const child of el.children) {
    parts.push(serializeElement(child, indent + 1));
  }

  parts.push(`${pad}</${el.tagName}>`);
  return parts.join('\n');
}

/**
 * Assemble the final animated SVG string.
 */
export function assemble(
  document: SvgDocument,
  smilElements: SmilElement[],
  cssBlock: string,
): string {
  // Group SMIL elements by target nodeUid
  const smilByUid = new Map<string, string[]>();
  for (const smil of smilElements) {
    if (!smilByUid.has(smil.nodeUid)) {
      smilByUid.set(smil.nodeUid, []);
    }
    smilByUid.get(smil.nodeUid)!.push(smil.elementString);
  }

  const animatedUids = collectAnimatedUids(smilElements, cssBlock);

  // Clone and process the root
  let root = insertSmilElements(document.root, smilByUid, animatedUids);

  // Add data-uid to root if it has animations
  if (animatedUids.has(root.nodeUid)) {
    root.attributes['data-uid'] = root.nodeUid;
  }

  // Insert <style> as first child if we have CSS
  if (cssBlock) {
    const styleElement: SvgElement = {
      nodeUid: '__style',
      tagName: 'style',
      attributes: {},
      children: [],
      textContent: cssBlock,
    };
    root.children = [styleElement, ...root.children];
  }

  // Build viewBox from document
  const vb = document.viewBox;
  root.attributes['viewBox'] = `${vb.minX} ${vb.minY} ${vb.width} ${vb.height}`;

  // Add xmlns if not already present
  if (!root.attributes['xmlns']) {
    root.attributes['xmlns'] = 'http://www.w3.org/2000/svg';
  }

  // Add additional namespaces
  for (const [prefix, uri] of Object.entries(document.namespaces)) {
    const attrName = prefix === '' ? 'xmlns' : `xmlns:${prefix}`;
    if (!root.attributes[attrName]) {
      root.attributes[attrName] = uri;
    }
  }

  // Add width/height if present in document
  if (document.width !== undefined) {
    root.attributes['width'] = String(document.width);
  }
  if (document.height !== undefined) {
    root.attributes['height'] = String(document.height);
  }

  // Serialize
  const xmlDecl = '<?xml version="1.0" encoding="UTF-8"?>';
  const svgString = serializeElement(root, 0);
  return `${xmlDecl}\n${svgString}`;
}
