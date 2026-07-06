// ─── UI dùng riêng cho khu vực Staff ───────────────────────────────────────
// Phần lớn component (Badge, Card, Input, Modal, ...) vẫn dùng chung với
// Admin để tránh trùng lặp style/logic. Riêng `Table` được định nghĩa lại
// ở đây (thêm hỗ trợ `alignCenter` cho header) để không phải đụng vào
// component dùng chung của Admin.
import { Children } from "react";

export {
  Badge,
  Btn,
  Field,
  Input,
  Select,
  Textarea,
  Card,
  CardHeader,
  StatCard,
  Modal,
  TR,
  TD,
  SearchInput,
  SelectPill,
  Toolbar,
  FilterTabs,
  DrawerPanel,
  AdminPagination,
  useToggle,
} from "../admin/ui.jsx";

// ─── Table (bản riêng của Staff — hỗ trợ thêm alignCenter) ─────────────────
export function Table({
  headers,
  children,
  loading,
  empty,
  colWidths,
  alignRight,
  alignCenter,
}) {
  const hasRows = Children.count(children) > 0;
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[13px] table-fixed">
        {colWidths && (
          <colgroup>
            {colWidths.map((w, i) => (
              <col key={i} style={{ width: w, minWidth: w }} />
            ))}
          </colgroup>
        )}
        <thead>
          <tr className="bg-cream">
            {headers.map((h, i) => (
              <th
                key={i}
                className={`px-4 py-2.5 text-muted font-bold text-xs whitespace-nowrap border-b border-shade overflow-hidden ${
                  alignRight?.includes(i)
                    ? "text-right"
                    : alignCenter?.includes(i)
                      ? "text-center"
                      : "text-left"
                }`}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td
                colSpan={headers.length}
                className="py-10 text-center text-muted text-sm"
              >
                Đang tải...
              </td>
            </tr>
          ) : hasRows ? (
            children
          ) : (
            empty && (
              <tr>
                <td
                  colSpan={headers.length}
                  className="py-10 text-center text-muted text-sm"
                >
                  {empty}
                </td>
              </tr>
            )
          )}
        </tbody>
      </table>
    </div>
  );
}
