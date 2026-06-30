// utils/roleRedirect.js
// Trả về đường dẫn mặc định tương ứng với role của user sau khi đăng nhập.
export function getHomePathForRole(role) {
  if (role === 'admin') return '/admin'
  if (role === 'staff') return '/staff'
  return '/'
}