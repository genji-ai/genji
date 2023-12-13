import react from '@vitejs/plugin-react-swc'
import fs from 'node:fs'
import path from 'node:path'
import { defineConfig } from 'vite'
import svgr from 'vite-plugin-svgr'
import webExtension from 'vite-plugin-web-extension'

// Recursive function to list all files in a directory
function tree(dir: string, fileList: string[] = []) {
  fs.readdirSync(dir).forEach((file) => {
    const absolutePath = path.resolve(dir, file)
    if (fs.statSync(absolutePath).isDirectory()) {
      tree(absolutePath, fileList)
    } else {
      fileList.push(absolutePath)
    }
  })
  return fileList
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    svgr(),
    webExtension({
      manifest: 'src/manifest.json',
      additionalInputs: ['src/lib/user.css', 'src/vimium/content_scripts/vimium.css'],
      watchFilePaths: tree('src'),
      disableAutoLaunch: true,
    }),
  ],
  resolve: {
    alias: {
      // In dev mode, make sure fast refresh works
      '/@react-refresh': path.resolve('node_modules/@vitejs/plugin-react-swc/refresh-runtime.js'),
    },
  },
})
