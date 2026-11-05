const MOCK_DELAY_MS = 200

export async function mockResolve(data) {
  await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS))
  return structuredClone(data)
}

export function findOrThrow(list, id, message) {
  const item = list.find((entry) => entry.id === Number(id))

  if (!item) {
    throw new Error(message)
  }

  return item
}

export function nextId(list) {
  return Math.max(0, ...list.map((entry) => entry.id)) + 1
}

export function nowIso() {
  return new Date().toISOString()
}

// Mốc thời gian tính theo ngày chạy để dữ liệu giả luôn có việc sắp đến hạn và quá hạn.
export function daysFromNow(days) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()
}

// API thật xác định người dùng từ token; mock đọc người đang đăng nhập do AuthContext lưu.
export function getMockUser() {
  try {
    return JSON.parse(localStorage.getItem('user')) || {}
  } catch {
    return {}
  }
}
