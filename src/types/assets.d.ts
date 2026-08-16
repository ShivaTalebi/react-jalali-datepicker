// src/types/assets.d.ts
declare module "*.ttf" {
  const src: string;
  export default src;
}
declare module "*.woff" {
  const src: string;
  export default src;
}
declare module "*.woff2" {
  const src: string;
  export default src;
}
declare module "*.eot" {
  const src: string;
  export default src;
}
declare module "*.svg" {
  const src: string;
  export default src;
}

// اگر CSS را به عنوان متن import می‌کنی:
declare module "*.css" {
  const css: string;
  export default css;
}
