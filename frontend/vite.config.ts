import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd(), '')
  
  const config: any = {
    plugins: [react()],
  }
  
  // 只有在设置了 VITE_BASE 环境变量时才设置 base
  if (env.VITE_BASE) {
    config.base = env.VITE_BASE
  }
  
  return config
})
