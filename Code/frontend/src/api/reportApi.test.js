import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { createServer } from 'vite'

const vite = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' })
after(() => vite.close())
const { default: reportApi } = await vite.ssrLoadModule('/src/api/reportApi.js')
const { default: apiClient } = await vite.ssrLoadModule('/src/api/client.js')

test('download requests the selected version and returns its file', async () => {
  const originalGet = apiClient.get
  const file = new Blob(['report'], { type: 'application/pdf' })
  apiClient.get = async (path, options) => {
    assert.equal(path, '/reports.php')
    assert.deepEqual(options.params, { action: 'download', version_id: 42 })
    assert.equal(options.responseType, 'blob')
    return { status: 200, data: file }
  }
  try {
    assert.equal(await reportApi.downloadVersion(42), file)
  } finally {
    apiClient.get = originalGet
  }
})

test('download displays the server error instead of downloading it', async () => {
  const originalGet = apiClient.get
  apiClient.get = async () => ({
    status: 403,
    data: new Blob([JSON.stringify({ error: 'Không có quyền xem báo cáo.' })], { type: 'application/json' }),
  })
  try {
    await assert.rejects(reportApi.downloadVersion(42), /Không có quyền xem báo cáo/)
  } finally {
    apiClient.get = originalGet
  }
})
