// Danh sách khối lớp. Khi có tài liệu lớp mới:
//   1. Tạo file data/gradeN.js theo mẫu data/grade1.js
//   2. Điền `src` cho lớp đó bên dưới
//   3. Thêm đường dẫn file vào danh sách ASSETS trong sw.js (để học offline)
window.GRADES = [
  { id: 1,  name: 'Lớp 1',  book: 'Tiếng Anh 1 Global Success',  src: 'data/grade1.js' },
  { id: 2,  name: 'Lớp 2',  book: 'Tiếng Anh 2 Global Success',  src: null },
  { id: 3,  name: 'Lớp 3',  book: 'Tiếng Anh 3 Global Success',  src: 'data/grade3.js' },
  { id: 4,  name: 'Lớp 4',  book: 'Tiếng Anh 4 Global Success',  src: null },
  { id: 5,  name: 'Lớp 5',  book: 'Tiếng Anh 5 Global Success',  src: null },
  { id: 6,  name: 'Lớp 6',  book: 'Tiếng Anh 6 Global Success',  src: null },
  { id: 7,  name: 'Lớp 7',  book: 'Tiếng Anh 7 Global Success',  src: 'data/grade7.js' },
  { id: 8,  name: 'Lớp 8',  book: 'Tiếng Anh 8 Global Success',  src: null },
  { id: 9,  name: 'Lớp 9',  book: 'Tiếng Anh 9 Global Success',  src: null },
  { id: 10, name: 'Lớp 10', book: 'Tiếng Anh 10 Global Success', src: null },
  { id: 11, name: 'Lớp 11', book: 'Tiếng Anh 11 Global Success', src: null },
  { id: 12, name: 'Lớp 12', book: 'Tiếng Anh 12 Global Success', src: null },
];
