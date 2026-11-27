import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'

const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
after(() => vite.close())
const { default: ReportsCalendar } = await vite.ssrLoadModule('/src/features/reports/ReportsCalendar.jsx')

test('calendar displays deadlines at both ends of the day without overlapping', () => {
  const reports = [
    { id: 1, title: 'Early', groupName: 'A', deadline: '2026-11-25 00:01:00' },
    { id: 2, title: 'Late', groupName: 'A', deadline: '2026-11-25 23:59:59' },
    { id: 3, title: 'Same hour', groupName: 'B', deadline: '2026-11-25 23:30:00' },
    { id: 4, title: 'No deadline', deadline: null },
  ]
  const html = renderToStaticMarkup(React.createElement(ReportsCalendar, {
    reports,
    selectedId: '',
    onSelect() {},
    onShowList() {},
    disabled: false,
    focusDeadline: { value: '2026-11-25 12:00:00' },
  }))

  assert.equal((html.match(/class="calendar-hour-label"/g) || []).length, 24)
  assert.ok(html.includes('Early, A, hạn 25/11/2026 00:01'))
  assert.ok(html.includes('Late, A, hạn 25/11/2026 23:59:59'))
  assert.ok(html.includes('Same hour, B, hạn 25/11/2026 23:30'))
  assert.ok(html.indexOf('Same hour, B, hạn') < html.indexOf('Late, A, hạn'))
  assert.ok(html.includes('1 báo cáo không có hạn nộp'))
})
