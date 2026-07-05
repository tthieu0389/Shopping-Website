// Chuẩn hoá từ khoá tìm kiếm trước khi đưa vào query ILIKE:
// - Cắt khoảng trắng thừa ở đầu/cuối (trim)
// - Gộp nhiều khoảng trắng liên tiếp ở giữa thành 1 khoảng trắng
//   (vd: "iphone   15" hoặc "  áo   thun " - "iphone 15" / "áo thun")
exports.normalizeKeyword = (keyword) => {
  if (typeof keyword !== "string") return "";
  return keyword.trim().replace(/\s+/g, " ");
};
