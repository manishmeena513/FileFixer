import JSZip from "jszip";

export type CaseTransform = "lowercase" | "uppercase" | "titlecase" | "kebab" | "snake" | "none" | "as-is";

export interface FindReplaceRule {
  find: string;
  replace: string;
  matchCase?: boolean;
  replaceAll?: boolean;
}

export interface NumberingRule {
  enabled: boolean;
  startIndex?: number;
  padding?: number;
  position?: "prefix" | "suffix" | "replace";
  separator?: string;
}

export interface RegexRule {
  pattern: string;
  replacement: string;
  flags?: string;
}

export interface RenameRules {
  prefix?: string;
  suffix?: string;
  template?: string;
  findReplace?: FindReplaceRule;
  numbering?: NumberingRule;
  caseTransform?: CaseTransform;
  regex?: RegexRule;
  preserveExtension?: boolean;
  lowercaseExtension?: boolean;
}

export interface RenamePreviewItem {
  file: File;
  original: string;
  renamed: string;
  valid: boolean;
  error?: string;
}

/**
 * Splits a filename into base name and extension.
 */
export function splitFilename(filename: string): { base: string; ext: string } {
  const lastDot = filename.lastIndexOf(".");
  if (lastDot <= 0 || lastDot === filename.length - 1) {
    return { base: filename, ext: "" };
  }
  return {
    base: filename.slice(0, lastDot),
    ext: filename.slice(lastDot + 1),
  };
}

/**
 * Applies case transformation to a string.
 */
export function applyCaseTransform(input: string, transform?: CaseTransform): string {
  if (!transform || transform === "none" || transform === "as-is") return input;

  switch (transform) {
    case "lowercase":
      return input.toLowerCase();
    case "uppercase":
      return input.toUpperCase();
    case "titlecase":
      return input
        .toLowerCase()
        .replace(/(?:^|[\s_\-./\\])([a-z0-9])/g, (match) => match.toUpperCase());
    case "kebab":
      return input
        .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
        .replace(/[\s_]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-+|-+$/g, "")
        .toLowerCase();
    case "snake":
      return input
        .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
        .replace(/[\s-]+/g, "_")
        .replace(/_+/g, "_")
        .replace(/^_+|_+$/g, "")
        .toLowerCase();
    default:
      return input;
  }
}

/**
 * Validates a generated filename for filesystem legality.
 */
export function validateFilename(name: string): { valid: boolean; error?: string } {
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: "Filename cannot be empty" };
  }
  if (trimmed === "." || trimmed === "..") {
    return { valid: false, error: "Reserved directory name" };
  }
  if (trimmed.endsWith(".")) {
    return { valid: false, error: "Filename cannot end with a period" };
  }
  // Check for forbidden characters in Windows / POSIX (excluding path separators)
  if (/[<>:"/\\|?*\x00-\x1F]/.test(trimmed)) {
    return { valid: false, error: "Contains illegal characters (<>:\"/\\|?*)" };
  }
  // Check for DOS reserved device names (CON, PRN, AUX, NUL, COM1-9, LPT1-9)
  const baseName = trimmed.split(".")[0].toUpperCase();
  if (/^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/.test(baseName)) {
    return { valid: false, error: "Reserved system device name" };
  }
  if (trimmed.length > 255) {
    return { valid: false, error: "Filename exceeds 255 characters" };
  }
  return { valid: true };
}

/**
 * Applies rename rules to a single filename given its batch index.
 */
export function applyRenameRules(
  filename: string,
  index: number,
  rules: RenameRules = {}
): string {
  const preserveExt = rules.preserveExtension !== false;
  const { base: origBase, ext: origExt } = splitFilename(filename);

  let base = origBase;

  // 1. Template substitution if specified
  if (rules.template && rules.template.trim().length > 0) {
    const tpl = rules.template;
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10); // YYYY-MM-DD
    const todayCompact = todayStr.replace(/-/g, ""); // YYYYMMDD

    const num = (rules.numbering?.startIndex ?? 1) + index;
    const hashMatch = tpl.match(/#+/);
    const padding = hashMatch ? hashMatch[0].length : rules.numbering?.padding ?? 3;
    const paddedNum = num < 0
      ? `-${String(Math.abs(num)).padStart(Math.max(1, (padding || 1) - 1), "0")}`
      : String(num).padStart(padding || 1, "0");

    base = tpl
      .replace(/YYYY-MM-DD/g, todayStr)
      .replace(/YYYYMMDD/g, todayCompact)
      .replace(/#+/, paddedNum)
      .replace(/\{n\}/g, String(num))
      .replace(/\{index\}/g, String(num))
      .replace(/\{orig\}/g, () => origBase)
      .replace(/\{name\}/g, () => origBase)
      .replace(/\{ext\}/g, () => origExt);
  }

  // 2. Find and Replace
  if (rules.findReplace && rules.findReplace.find.length > 0) {
    const { find, replace, matchCase, replaceAll } = rules.findReplace;
    const escaped = find.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const flags = (replaceAll !== false ? "g" : "") + (matchCase ? "" : "i");
    base = base.replace(new RegExp(escaped, flags), replace);
  }

  // 3. Regex Replacement
  if (rules.regex && rules.regex.pattern.length > 0) {
    try {
      const flags = rules.regex.flags !== undefined ? rules.regex.flags : "g";
      const regexObj = new RegExp(rules.regex.pattern, flags);
      base = base.replace(regexObj, rules.regex.replacement);
    } catch {
      // Gracefully ignore invalid regex patterns
    }
  }

  // 4. Number Sequencing (if template was not used for numbering or explicitly requested)
  if (rules.numbering?.enabled && (!rules.template || !rules.template.includes("#"))) {
    const num = (rules.numbering.startIndex ?? 1) + index;
    const padding = rules.numbering.padding ?? 3;
    const padded = num < 0
      ? `-${String(Math.abs(num)).padStart(Math.max(1, (padding || 1) - 1), "0")}`
      : String(num).padStart(padding || 1, "0");
    const sep = rules.numbering.separator ?? "_";
    const pos = rules.numbering.position ?? "suffix";

    if (pos === "prefix") {
      base = `${padded}${sep}${base}`;
    } else if (pos === "replace") {
      base = padded;
    } else {
      base = `${base}${sep}${padded}`;
    }
  }

  // 5. Case Transform
  if (rules.caseTransform) {
    base = applyCaseTransform(base, rules.caseTransform);
  }

  // 6. Prefix & Suffix
  if (rules.prefix) {
    base = `${rules.prefix}${base}`;
  }
  if (rules.suffix) {
    base = `${base}${rules.suffix}`;
  }

  // 7. Extension handling
  if (!preserveExt) {
    return base;
  }

  let ext = origExt;
  if (rules.lowercaseExtension) {
    ext = ext.toLowerCase();
  }

  return ext ? `${base}.${ext}` : base;
}

/**
 * Generates preview of renamed files for live UI presentation.
 */
export function previewRenames(
  files: File[],
  rules: RenameRules = {}
): RenamePreviewItem[] {
  return files.map((file, idx) => {
    const original = file.name;
    const renamed = applyRenameRules(original, idx, rules);
    const { valid, error } = validateFilename(renamed);

    return {
      file,
      original,
      renamed,
      valid,
      error,
    };
  });
}

/**
 * Packages all renamed files into a client-side ZIP archive.
 */
export async function packageRenamedZip(
  files: File[],
  rules: RenameRules = {}
): Promise<Blob> {
  const zip = new JSZip();
  const previews = previewRenames(files, rules);
  const usedNames = new Set<string>();
  const counterMap = new Map<string, number>();

  for (const item of previews) {
    let finalName = item.renamed;

    // Collision handling: ensure unique entries within the ZIP archive in O(N)
    if (usedNames.has(finalName)) {
      const { base, ext } = splitFilename(finalName);
      const key = `${base}__${ext}`;
      let counter = counterMap.get(key) ?? 1;
      const candidate = (c: number) => (ext ? `${base}_${c}.${ext}` : `${base}_${c}`);
      while (usedNames.has(candidate(counter))) {
        counter++;
      }
      finalName = candidate(counter);
      counterMap.set(key, counter + 1);
    }
    usedNames.add(finalName);

    zip.file(finalName, item.file);
  }

  return await zip.generateAsync({
    type: "blob",
  });
}
