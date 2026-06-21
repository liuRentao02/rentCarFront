import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { fileURLToPath } from 'node:url'

import {createSvgIconsPlugin} from "vite-plugin-svg-icons";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
      createSvgIconsPlugin({
        iconDirs: [path.resolve(process.cwd(), 'src/assets/icons')],
        symbolId: 'icon-[dir]-[name]',
      })
  ],

  // 3. 配置 @ 别名
  resolve: {
    alias: {
      '@': path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'src')
    }
  }
})
