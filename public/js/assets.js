// 图片加载：素材没生成时返回 null，渲染层自动用占位图。
const cache = new Map();

export function image(path) {
  if (!cache.has(path)) {
    const entry = { img: null, failed: false };
    cache.set(path, entry);
    const img = new Image();
    img.onload = () => { entry.img = img; };
    img.onerror = () => { entry.failed = true; };
    img.src = path;
  }
  return cache.get(path).img;
}

export const mapImage = id => image(`assets/maps/${id}.png`);
export const spriteImage = id => image(`assets/sprites/${id}.png`);
export const itemImage = id => image(`assets/items/${id}.png`);
export const uiImage = id => image(`assets/ui/${id}.png`);

// 头像文件名：{角色}_{表情}.png，找不到表情就退回 _neutral，再退回不带后缀的文件。
export function portraitImage(base, emotion = 'neutral') {
  if (!base) return null;
  return image(`assets/portraits/${base}_${emotion}.png`)
    || image(`assets/portraits/${base}_neutral.png`)
    || image(`assets/portraits/${base}.png`)
    || image(`assets/portraits/${base}_videocall.png`);
}

// 这个表情的头像是否还在下载（下载完可能要换掉临时顶上的 neutral）
export function portraitLoading(base, emotion = 'neutral') {
  const path = `assets/portraits/${base}_${emotion}.png`;
  image(path);
  const entry = cache.get(path);
  return !entry.img && !entry.failed;
}

// 预热：让常用图片尽早开始下载。
export function preload(paths) {
  for (const p of paths) image(p);
}
