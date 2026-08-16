// محتوای فایل‌های CSS به‌صورت رشته
declare module "*.css" {
  const content: string;
  export default content;
}

// محتوای فایل‌های CSS که با ?inline وارد می‌شوند نیز رشته است
declare module "*.css?inline" {
  const content: string;
  export default content;
}
