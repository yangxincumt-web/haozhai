import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// 构建后给index.html中的JS/CSS引用添加时间戳，强制清除微信WebView缓存
function bustCachePlugin() {
  return {
    name: 'bust-cache',
    closeBundle() {
      const indexPath = path.resolve(__dirname, 'dist/index.html')
      let html = fs.readFileSync(indexPath, 'utf-8')
      const ts = Date.now()
      // 给script src和link href添加?v=时间戳
      html = html.replace(/(src="\/haozhai\/assets\/[^"]+\.js)"/g, `$1?v=${ts}"`)
      html = html.replace(/(href="\/haozhai\/assets\/[^"]+\.css)"/g, `$1?v=${ts}"`)
      fs.writeFileSync(indexPath, html)
      console.log('[bust-cache] 已添加时间戳:', ts)
    },
  }
}

export default defineConfig({
  plugins: [react(), bustCachePlugin()],
  base: '/haozhai/',
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
})
