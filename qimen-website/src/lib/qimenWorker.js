let ready
async function start() {
  const root = new URL('/', self.location.href)
  const { loadPyodide } = await import(/* @vite-ignore */ 'https://cdn.jsdelivr.net/pyodide/v0.27.7/full/pyodide.mjs')
  const py = await loadPyodide({ indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.27.7/full/' })
  await py.loadPackage('sqlite3')
  py.FS.mkdirTree('/project/qimen_engine')
  py.FS.mkdirTree('/project/api')
  const names = ['analyze.py','pan_engine.py','calendar_util.py','workflow.py','event_scope.py','chart_review.py','original_cases.py','shenqi_cases.sqlite']
  await Promise.all(names.map(async (name) => {
    const response = await fetch(new URL('qimen_engine/' + name, root))
    if (!response.ok) throw new Error('计算资料加载失败，请刷新重试。')
    py.FS.writeFile('/project/qimen_engine/' + name, new Uint8Array(await response.arrayBuffer()))
  }))
  const response = await fetch(new URL('qimen_api/qimen.py', root))
  if (!response.ok) throw new Error('计算程序加载失败，请刷新重试。')
  py.FS.writeFile('/project/api/qimen.py', new Uint8Array(await response.arrayBuffer()))
  await py.runPythonAsync("import sys,json\nsys.path.insert(0,'/project/api')\nfrom qimen import run_analysis")
  return py
}
let queue = Promise.resolve()
self.onmessage = ({ data }) => {
  queue = queue.then(async () => {
    try {
      if (!ready) ready = start().catch(error => { ready = undefined; throw error })
      const py = await ready
      py.globals.set('_qimen_input', JSON.stringify(data.input))
      const result = JSON.parse(await py.runPythonAsync('json.dumps(run_analysis(json.loads(_qimen_input)),ensure_ascii=False)'))
      self.postMessage({ id: data.id, result })
    } catch (error) {
      const msg = error?.message || '计算失败，请检查输入后重试。'
      const detail = msg.match(/ValueError: ([^\n]+)/)?.[1] || msg
      self.postMessage({ id: data.id, error: detail.length > 300 ? '计算组件加载失败，请刷新后重试。' : detail })
    }
  })
}
