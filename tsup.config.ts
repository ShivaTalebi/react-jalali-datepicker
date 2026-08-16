import { defineConfig } from "tsup";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  sourcemap: true,
  splitting: false,
  minify: true,
  external: ["react", "react-dom"],
  noExternal: ["react-date-object"],

  // استایل‌ها را خودمان با JS تزریق می‌کنیم؛ پس داخل JS اینجکت نشود
  injectStyle: false,

  // لودرها و خروجی فونت‌ها
  esbuildOptions(options) {
    // فونت‌ها داخل dist/fonts کپی شوند (بدون هش برای سادگی مسیرها)
    options.assetNames = "fonts/[name]";
    options.define = {
      ...options.define,
      __RJD_BASE_CSS__: JSON.stringify(
        readFileSync(resolve(process.cwd(), "src/styles/styles.css"), "utf8")
      ),
    };

    options.loader = {
      ...options.loader,
      // فونت‌ها فایل باشند
      // فونت پیش‌فرض داخل خود bundle قرار می‌گیرد تا مصرف‌کننده به کپی‌کردن
      // asset یا تنظیم base path وابسته نباشد.
      ".ttf": "dataurl",
      ".woff": "file",
      ".woff2": "file",
      ".eot": "file",
      ".svg": "file",
    };

  },
});
