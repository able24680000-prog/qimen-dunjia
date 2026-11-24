let worker
let sequence = 0
const pending = new Map()
function engine() {
  if (worker) return worker
  worker = new Worker(new URL('./qimenWorker.js', import.meta.url), { type: 'module' })
  worker.onmessage = ({ data }) => {
    const item = pending.get(data.id)
    if (!item) return
    pending.delete(data.id)
    if (data.error) item.reject(new Error(data.error))
    else item.resolve(data.result)
  }
  worker.onerror = () => {
    for (const item of pending.values()) item.reject(new Error('计算组件加载失败，请检查网络后重试。'))
    pending.clear()
    worker.terminate()
    worker = undefined
  }
  return worker
}
export function runQimen(input) {
  return new Promise((resolve, reject) => {
    const id = ++sequence
    pending.set(id, { resolve, reject })
    try { engine().postMessage({ id, input }) } catch (error) { pending.delete(id); reject(error) }
  })
}
