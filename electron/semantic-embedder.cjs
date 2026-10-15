// Local embedding provider for semantic retrieval. Loads transformers.js
// (onnxruntime-backed) lazily in the worker thread; everything degrades to
// "unavailable" so callers can fall back to the FTS channel without failing.
//
// Model: multilingual-e5-small (ONNX q8, ~120MB, first-use download into the
// app cache directory). e5 models require "query: " / "passage: " prefixes.

const DEFAULT_MODEL_ID = "Xenova/multilingual-e5-small";
const EMBED_BATCH_SIZE = 8;
// huggingface.co is unreachable from many China-network machines. The model
// files are public weights (no user data flows through this download), so the
// mirror is the pragmatic default; DOMI_SEMANTIC_MODEL_HOST overrides it.
const DEFAULT_REMOTE_HOST = "https://hf-mirror.com";

let transformersModulePromise = null;
let extractorPromise = null;
let extractorFailed = false;
let embedderConfig = null;

function configureSemanticEmbedder(options = {}) {
  embedderConfig = {
    cacheDir: String(options.cacheDir || ""),
    modelId: String(options.modelId || DEFAULT_MODEL_ID),
    // DOMI_SEMANTIC_MODEL_HOST overrides the mirror default for networks
    // where the official endpoint is preferred.
    remoteHost: String(options.remoteHost || process.env.DOMI_SEMANTIC_MODEL_HOST || DEFAULT_REMOTE_HOST).trim()
  };
}

async function loadTransformers() {
  if (!transformersModulePromise) {
    transformersModulePromise = import("@huggingface/transformers").catch((error) => {
      transformersModulePromise = null;
      throw error;
    });
  }
  return transformersModulePromise;
}

async function loadExtractor() {
  if (extractorFailed) return null;
  if (extractorPromise) return extractorPromise;
  extractorPromise = (async () => {
    const config = embedderConfig || {};
    const transformers = await loadTransformers();
    const env = transformers.env;
    if (config.cacheDir) {
      env.cacheDir = config.cacheDir;
    }
    if (config.remoteHost) {
      env.remoteHost = config.remoteHost;
    }
    env.allowLocalModels = false;
    return transformers.pipeline("feature-extraction", config.modelId || DEFAULT_MODEL_ID, {
      dtype: "q8"
    });
  })().catch((error) => {
    extractorFailed = true;
    extractorPromise = null;
    throw error;
  });
  return extractorPromise;
}

// Kicks off model loading without waiting. The first semantic queries simply
// report unavailable until this resolves; indexing keeps working meanwhile.
function warmSemanticEmbedder() {
  if (extractorFailed || extractorPromise) return;
  void loadExtractor().catch(() => undefined);
}

function semanticEmbedderReady() {
  return Boolean(extractorPromise) && !extractorFailed;
}

function e5Prefix(kind) {
  return kind === "query" ? "query: " : "passage: ";
}

// Returns Float32Array[] (L2-normalised, mean-pooled), or null when the model
// is not ready or inference fails — callers must treat null as "skip".
async function embedTexts(texts, kind = "passage") {
  const extractor = await loadExtractor().catch(() => null);
  if (!extractor) return null;
  const prepared = texts.map((text) => `${e5Prefix(kind)}${String(text || "").slice(0, 4_000)}`);
  try {
    const output = await extractor(prepared, { pooling: "mean", normalize: true });
    const list = output.tolist();
    return list.map((vector) => Float32Array.from(vector));
  } catch {
    return null;
  }
}

function embeddingDimensionHint() {
  return 384;
}

module.exports = {
  EMBED_BATCH_SIZE,
  configureSemanticEmbedder,
  embedTexts,
  embeddingDimensionHint,
  semanticEmbedderReady,
  warmSemanticEmbedder
};
