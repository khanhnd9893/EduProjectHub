// Đọc format chung { success, message, data } từ một request axios đang chạy.
// Trả về data khi thành công; các trường hợp còn lại ném Error có message để hiển thị.
export async function unwrap(request) {
  const response = await request.catch((error) => {
    throw new Error(
      error.response?.data?.message || 'Không thể kết nối tới máy chủ',
      { cause: error },
    )
  })
  const body = response.data

  if (body?.success !== true) {
    throw new Error(body?.message || 'Phản hồi từ máy chủ không hợp lệ')
  }

  return body.data
}
