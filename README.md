# 🐥 Chíp English

Web app học từ vựng tiếng Anh lớp 1–12 (theo bộ sách Global Success) cùng mascot Chíp.

- Học từ mới bằng thẻ hình, nghe phát âm
- 4 dạng bài luyện tập, ôn lại từ hay sai
- 🎤 Luyện đọc: đọc to, app nhận giọng nói và chấm điểm
- Chuỗi ngày học (streak), XP, sao, mục tiêu mỗi ngày
- Chíp nhắc học theo giờ đã đặt (thông báo + thêm vào lịch điện thoại)
- Dùng được trên điện thoại, iPad và máy tính; cài lên màn hình chính như app (PWA)

## Thêm lớp mới
1. Tạo `data/gradeN.js` theo mẫu `data/grade1.js`
2. Điền `src: 'data/gradeN.js'` cho lớp đó trong `data/grades.js`
3. Thêm `'data/gradeN.js'` vào danh sách `ASSETS` trong `sw.js` và tăng `VERSION`

## Chạy trên máy
```
powershell -ExecutionPolicy Bypass -File serve.ps1
```
Mở http://localhost:8080
