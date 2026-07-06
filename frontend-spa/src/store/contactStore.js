import { create } from "zustand";
import { contactApi } from "../api/index.js";
import useAuthStore from "./authStore.js";

// Store nhỏ giữ số phản hồi liên hệ CHƯA ĐỌC, dùng để hiển thị chấm đỏ
// thông báo ở mục "Liên hệ" trên Navbar.
//
// Backend hiện KHÔNG có cột/API riêng cho trạng thái "đã đọc" — nên trạng
// thái này được tính hoàn toàn ở phía frontend, dựa trên dữ liệu đã có sẵn
// từ GET /contacts/mine (status, reply, replied_at):
//   - Một liên hệ được coi là "có phản hồi mới" nếu status === 'resolved'
//     và có replied_at.
//   - "Đã đọc hay chưa" được lưu trong localStorage (theo từng user_id, để
//     không lẫn lộn khi nhiều tài khoản dùng chung trình duyệt), map
//     { [contactId]: repliedAt } — nếu replied_at hiện tại khác với giá trị
//     đã lưu (hoặc chưa có), nghĩa là user chưa xem phản hồi (mới) này.
const READ_KEY_PREFIX = "vnpt_contact_read_replies_";

function getReadMap(userId) {
  try {
    const raw = localStorage.getItem(READ_KEY_PREFIX + userId);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function setReadMap(userId, map) {
  try {
    localStorage.setItem(READ_KEY_PREFIX + userId, JSON.stringify(map));
  } catch {
    /* ignore (vd: localStorage bị chặn) */
  }
}

const useContactStore = create((set) => ({
  unreadCount: 0,

  // Gọi getMine() rồi tự so sánh với localStorage để tính số chưa đọc.
  fetchUnread: async () => {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) return;
    try {
      const res = await contactApi.getMine();
      const contacts = res?.data || [];
      const readMap = getReadMap(userId);
      const unread = contacts.filter(
        (c) => c.status === "resolved" && c.replied_at && readMap[c.id] !== c.replied_at,
      ).length;
      set({ unreadCount: unread });
    } catch {
      // Im lặng bỏ qua (lỗi mạng, chưa đăng nhập...) — không làm phiền UX
    }
  },

  // Gọi khi user mở tab "Phản hồi của tôi" — lưu lại replied_at hiện tại
  // của mọi liên hệ đã resolved, coi như đã xem, rồi tắt chấm đỏ.
  markAllRead: (contacts) => {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) return;
    const readMap = getReadMap(userId);
    contacts.forEach((c) => {
      if (c.status === "resolved" && c.replied_at) {
        readMap[c.id] = c.replied_at;
      }
    });
    setReadMap(userId, readMap);
    set({ unreadCount: 0 });
  },

  clearUnread: () => set({ unreadCount: 0 }),
}));

export default useContactStore;