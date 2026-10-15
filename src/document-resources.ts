function decodedResource(resource: string) {
  try {
    return decodeURIComponent(resource);
  } catch {
    return resource;
  }
}

function localDocumentCandidate(resource?: string) {
  if (!resource) return "";
  let candidate = decodedResource(resource.trim().replace(/\u200b/g, ""));
  if (/^https?:\/\//i.test(candidate) || candidate.startsWith("#")) return "";
  if (candidate.startsWith("<") && candidate.endsWith(">")) {
    candidate = candidate.slice(1, -1).trim();
  }
  return candidate;
}

export function isLocalMarkdownResource(resource?: string) {
  return /\.(?:md|markdown)(?:(?::\d+(?::\d+)?)|[?#].*)?$/i.test(
    localDocumentCandidate(resource)
  );
}

export function isLocalPdfResource(resource?: string) {
  return /\.pdf(?:(?::\d+(?::\d+)?)|[?#].*)?$/i.test(
    localDocumentCandidate(resource)
  );
}

// Keep local links as file URLs until the host converts them with fileURLToPath.
// URL.pathname contains /C:/ on Windows and is not a native filesystem path.
export function resolveLocalDocumentLink(resource: string, documentPath: string) {
  const candidate = resource.trim();
  if (!candidate || candidate.startsWith("#")) return "";
  const windowsPath = /^[a-z]:[\\/]/i.test(candidate);
  if (!windowsPath && /^[a-z][a-z0-9+.-]*:/i.test(candidate) && !/^file:/i.test(candidate)) {
    return "";
  }

  try {
    const normalizedPath = documentPath.replace(/\\/g, "/");
    const encodedPath = normalizedPath.split("/").map((segment, index) => (
      index === 0 && /^[a-z]:$/i.test(segment) ? segment : encodeURIComponent(segment)
    )).join("/");
    let base: string;
    if (normalizedPath.startsWith("//")) {
      base = `file:${encodedPath}`;
    } else if (/^[a-z]:\//i.test(normalizedPath)) {
      base = `file:///${encodedPath}`;
    } else if (normalizedPath.startsWith("/")) {
      base = `file://${encodedPath}`;
    } else {
      return "";
    }
    const target = windowsPath
      ? `file:///${candidate.replace(/\\/g, "/")}`
      : candidate.replace(/\\/g, "/");
    const resolved = new URL(target, base);
    return resolved.protocol === "file:" ? resolved.href : "";
  } catch {
    return "";
  }
}
