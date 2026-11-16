<?php
// Dán Gemini API key vào 'gemini_api_key' (lấy tại https://aistudio.google.com/api-keys).
// Sau khi pull, chạy một lần để Git không bao giờ commit key của bạn:
//   git update-index --skip-worktree Code/Backend/config/local.php
// Hoặc đặt biến môi trường GEMINI_API_KEY cho Apache (ưu tiên cao hơn file này).
return [
    'gemini_api_key' => '',
    'gemini_model' => 'gemini-3.5-flash-lite',
];
    