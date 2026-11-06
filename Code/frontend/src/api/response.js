// Đọc response JSON của PHP backend và đưa lỗi máy chủ lên giao diện.
export async function unwrap(request) {
  let response
  try {
    response = await request
  } catch (error) {
    throw new Error(
      error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        'Không thể kết nối tới máy chủ',
      { cause: error },
    )
  }

  const body = response.data

  if (body?.error) {
    throw new Error(body.error)
  }

  if (Object.hasOwn(body ?? {}, 'data')) {
    return body.data
  }

  return body
}

export function backendNotImplemented(feature) {
  throw new Error(`Backend PHP hiện chưa hỗ trợ API ${feature}.`)
}
