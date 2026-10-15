const fs = require("node:fs");
const path = require("node:path");

function executableFile(filePath) {
  if (!filePath) return false;
  try {
    const stat = fs.lstatSync(filePath);
    if (!stat.isFile() || stat.isSymbolicLink()) return false;
    fs.accessSync(filePath, fs.constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

function mediaBinaryNames() {
  // Windows 发行版的可执行文件以 .exe 结尾。优先匹配原始 Unix 命名，
  // 保持手工准备的跨平台运行时目录行为一致。
  if (process.platform === "win32") {
    return {
      ffmpeg: ["ffmpeg", "ffmpeg.exe"],
      ffprobe: ["ffprobe", "ffprobe.exe"]
    };
  }
  return { ffmpeg: ["ffmpeg"], ffprobe: ["ffprobe"] };
}

function findMediaBinary(binDirectory, names) {
  for (const name of names) {
    const candidate = path.join(binDirectory, name);
    if (executableFile(candidate)) return candidate;
  }
  return "";
}

function searchPathForExecutable(name) {
  for (const directory of String(process.env.PATH || "").split(path.delimiter).filter(Boolean)) {
    const candidate = path.join(directory, name);
    if (executableFile(candidate)) return candidate;
  }
  return "";
}

function resolveMediaRuntime(options = {}) {
  const resourcesPath = String(options.resourcesPath || process.resourcesPath || "").trim();
  const appRoot = path.resolve(options.appRoot || path.join(__dirname, ".."));
  const candidates = [
    resourcesPath ? path.join(resourcesPath, "media-runtime", "bin") : "",
    path.join(appRoot, "build", `media-runtime-${process.arch}`, "bin"),
    path.join(appRoot, "build", "media-runtime", "bin")
  ].filter(Boolean);
  const names = mediaBinaryNames();
  for (const binDirectory of candidates) {
    const ffmpegPath = findMediaBinary(binDirectory, names.ffmpeg);
    const ffprobePath = findMediaBinary(binDirectory, names.ffprobe);
    if (ffmpegPath && ffprobePath) {
      return {
        ok: true,
        source: binDirectory.includes(`${path.sep}Resources${path.sep}`)
          ? "bundled"
          : "development",
        binDirectory,
        ffmpegPath,
        ffprobePath
      };
    }
  }
  if (process.platform === "win32") {
    // Windows 回退：复用系统安装的 ffmpeg/ffprobe（winget、scoop 等方式）。
    const ffmpegPath = names.ffmpeg
      .map((name) => searchPathForExecutable(name))
      .find(Boolean) || "";
    const ffprobePath = names.ffprobe
      .map((name) => searchPathForExecutable(name))
      .find(Boolean) || "";
    if (ffmpegPath && ffprobePath) {
      return {
        ok: true,
        source: "system",
        binDirectory: "",
        ffmpegPath,
        ffprobePath
      };
    }
  }
  return {
    ok: false,
    source: "system",
    binDirectory: "",
    ffmpegPath: "",
    ffprobePath: ""
  };
}

function withMediaRuntimeEnvironment(runtime = {}, options = {}) {
  const mediaRuntime = options.mediaRuntime || resolveMediaRuntime(options);
  return {
    ...runtime,
    env: {
      ...(runtime.env || {}),
      ...(mediaRuntime.ffmpegPath
        ? { DOMI_FFMPEG_PATH: mediaRuntime.ffmpegPath }
        : {}),
      ...(mediaRuntime.ffprobePath
        ? { DOMI_FFPROBE_PATH: mediaRuntime.ffprobePath }
        : {})
    }
  };
}

module.exports = {
  executableFile,
  findMediaBinary,
  mediaBinaryNames,
  resolveMediaRuntime,
  withMediaRuntimeEnvironment
};
