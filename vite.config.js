import { defineConfig } from 'vite';

// GitHub Pages では相対パス出力にしておくと、リポジトリ名の差し替えなしで動かしやすい。
export default defineConfig({
  base: './',
});
