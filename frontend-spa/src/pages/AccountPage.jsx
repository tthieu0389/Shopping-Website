import { useState, useCallback, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useOrders, useUserProfile, useUserAddresses } from "../hooks/index.js";
import {
  Breadcrumb,
  LoadingSpinner,
  EmptyState,
  AvatarUploadModal,
} from "../components/common/index.jsx";
import {
  formatPrice,
  formatDate,
  toast,
  resolveImageUrl,
} from "../utils/index.js";
import { ordersApi, userApi } from "../api/index.js";
import useAuthStore from "../store/authStore.js";

const NAV_ITEMS = [
  { id: "overview", icon: "📊", label: "Tổng quan", path: "/account" },
  { id: "orders", icon: "📦", label: "Đơn hàng", path: "/account/orders" },
  { id: "addresses", icon: "📍", label: "Địa chỉ", path: "/account/addresses" },
  { id: "settings", icon: "⚙️", label: "Cài đặt", path: "/account/settings" },
];

const ORDER_STATUS_MAP = {
  pending: { label: "Chờ xác nhận", color: "bg-yellow-100 text-yellow-700" },
  confirmed: { label: "Đã xác nhận", color: "bg-blue-100 text-blue-700" },
  processing: { label: "Đang xử lý", color: "bg-purple-100 text-purple-700" },
  shipped: { label: "Đang giao", color: "bg-indigo-100 text-indigo-700" },
  completed: { label: "Đã giao", color: "bg-green-100 text-green-700" },
  cancelled: { label: "Đã huỷ", color: "bg-red-100 text-red-700" },
};

// ── Tab: Tổng quan ────────────────────────────────────────────────────────────
function OverviewTab({ user }) {
  const { data: orders, loading: oLoading } = useOrders();

  const totalSpent = orders
    .filter((o) => o.status === "completed")
    .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

  const stats = [
    { icon: "📦", value: String(orders.length), label: "Tổng đơn hàng" },
    {
      icon: "✅",
      value: String(orders.filter((o) => o.status === "completed").length),
      label: "Đã giao thành công",
    },
    { icon: "💳", value: formatPrice(totalSpent), label: "Tổng chi tiêu" },
  ];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {stats.map(({ icon, value, label }) => (
          <div
            key={label}
            className="bg-white border border-shade rounded-xl p-5 text-center flex flex-col items-center"
          >
            <div className="text-3xl mb-3">{icon}</div>
            <div className="w-full flex items-center justify-center overflow-hidden">
              <span
                className="font-bold text-vnpt font-display leading-none text-[28px] block w-full text-center"
                style={{ fontSize: "clamp(16px, 2.5vw, 28px)" }}
              >
                {value}
              </span>
            </div>
            <div className="text-xs text-muted mt-2">{label}</div>
          </div>
        ))}
      </div>

      {/* Đơn hàng gần đây */}
      <div className="bg-white border border-shade rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-body">Đơn hàng gần đây</h3>
          <Link
            to="/account/orders"
            className="text-sm text-vnpt font-semibold hover:underline"
          >
            Xem tất cả →
          </Link>
        </div>
        {oLoading ? (
          <LoadingSpinner text="Đang tải..." />
        ) : orders.length === 0 ? (
          <p className="text-sm text-muted text-center py-6">
            Chưa có đơn hàng nào ·{" "}
            <Link to="/products" className="text-vnpt font-semibold">
              Mua sắm ngay
            </Link>
          </p>
        ) : (
          <div className="space-y-3">
            {orders.slice(0, 3).map((order) => {
              const status = ORDER_STATUS_MAP[order.status] || {
                label: order.status,
                color: "bg-gray-100 text-gray-700",
              };
              return (
                <div
                  key={order.id}
                  className="flex items-center justify-between py-3 border-b border-shade last:border-none"
                >
                  <div>
                    <div className="text-sm font-semibold text-body">
                      Đơn #{order.id}
                    </div>
                    <div className="text-xs text-muted">
                      {formatDate(order.created_at)}
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full mb-1 ${status.color}`}
                    >
                      {status.label}
                    </span>
                    <div className="text-sm font-bold text-accent">
                      {formatPrice(order.total_amount)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Tab: Đơn hàng ─────────────────────────────────────────────────────────────
function OrdersTab() {
  const [statusFilter, setStatusFilter] = useState("");
  const {
    data: orders,
    loading,
    reload,
  } = useOrders(statusFilter ? { status: statusFilter } : {});
  const [cancelling, setCancelling] = useState(null);

  const handleCancel = async (id) => {
    if (!window.confirm("Bạn có chắc muốn huỷ đơn hàng này?")) return;
    setCancelling(id);
    try {
      await ordersApi.cancel(id);
      toast.success("Đã huỷ đơn hàng");
      reload();
    } catch (err) {
      toast.error(err.message || "Không thể huỷ đơn hàng");
    } finally {
      setCancelling(null);
    }
  };

  return (
    <div>
      {/* Filter */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {[
          { value: "", label: "Tất cả" },
          { value: "pending", label: "Chờ xác nhận" },
          { value: "confirmed", label: "Đã xác nhận" },
          { value: "shipped", label: "Đang giao" },
          { value: "completed", label: "Đã giao" },
          { value: "cancelled", label: "Đã huỷ" },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
              statusFilter === f.value
                ? "bg-vnpt text-white"
                : "border border-shade text-muted hover:border-vnpt hover:text-vnpt"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : orders.length === 0 ? (
        <EmptyState
          icon="📦"
          title="Không có đơn hàng"
          desc="Chưa có đơn hàng nào trong mục này"
        />
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const status = ORDER_STATUS_MAP[order.status] || {
              label: order.status,
              color: "bg-gray-100 text-gray-700",
            };
            const canCancel = ["pending", "confirmed"].includes(order.status);
            return (
              <div
                key={order.id}
                className="bg-white border border-shade rounded-xl p-5"
              >
                <div className="flex items-center justify-between mb-3 pb-3 border-b border-shade">
                  <div>
                    <span className="text-sm font-bold text-body">
                      Đơn #{order.id}
                    </span>
                    {order.order_code && (
                      <span className="ml-2 text-xs text-muted">
                        ({order.order_code})
                      </span>
                    )}
                    <div className="text-xs text-muted mt-0.5">
                      {formatDate(order.created_at)}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full ${status.color}`}
                    >
                      {status.label}
                    </span>
                    <span className="text-base font-bold text-accent">
                      {formatPrice(order.total_amount)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted">
                    {order.payment_method && (
                      <span>
                        Thanh toán:{" "}
                        <strong className="text-body">
                          {order.payment_method.toUpperCase()}
                        </strong>
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Link
                      to={`/account/orders/${order.id}`}
                      className="px-4 py-2 border border-vnpt text-vnpt rounded-full text-xs font-semibold hover:bg-vnpt hover:text-white transition-colors"
                    >
                      Xem chi tiết
                    </Link>
                    {canCancel && (
                      <button
                        onClick={() => handleCancel(order.id)}
                        disabled={cancelling === order.id}
                        className="px-4 py-2 border border-accent text-accent rounded-full text-xs font-semibold hover:bg-accent hover:text-white transition-colors disabled:opacity-60"
                      >
                        {cancelling === order.id ? "Đang huỷ..." : "Huỷ đơn"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Tab: Địa chỉ ─────────────────────────────────────────────────────────────
const EMPTY_ADDR = {
  receiver_name: "",
  phone: "",
  province: "",
  district: "",
  ward: "",
  address_line: "",
  is_default: false,
};

const VN_DATA_URL =
  "https://raw.githubusercontent.com/kenzouno1/DiaGioiHanhChinhVN/master/data.json";

// Cache dữ liệu tỉnh/huyện/xã toàn quốc (chỉ fetch 1 lần)
let _vnDataCache = null;
async function fetchVNData() {
  if (_vnDataCache) return _vnDataCache;
  const res = await fetch(VN_DATA_URL);
  _vnDataCache = await res.json();
  return _vnDataCache;
}

const selectCls = (disabled) =>
  `w-full px-4 py-3 border rounded-lg text-sm outline-none transition-colors appearance-none bg-white
   ${disabled ? "border-shade text-muted cursor-not-allowed bg-surface" : "border-shade focus:border-vnpt cursor-pointer hover:border-vnpt/60"}`;

function AddressForm({
  initial = EMPTY_ADDR,
  onSave,
  onCancel,
  saving,
  title,
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm({ defaultValues: initial });

  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [vnData, setVnData] = useState(null);
  const [loadingGeo, setLoadingGeo] = useState(true);
  // true = đang trong quá trình khôi phục giá trị cũ (edit) -> các effect cascade bên dưới
  // không được phép tự ý reset district/ward về rỗng
  const initializingRef = useRef(!!initial.province);
  // Cờ đánh dấu từng bước đã set value hay chưa, để chỉ chạy đúng 1 lần mỗi bước
  const provinceSetRef = useRef(false);
  const districtSetRef = useRef(false);
  const wardSetRef = useRef(false);

  const selectedProvince = watch("province");
  const selectedDistrict = watch("district");

  // Load dữ liệu địa giới một lần
  useEffect(() => {
    fetchVNData()
      .then((data) => {
        setVnData(data);
        setProvinces(data.map((p) => p.Name));
        setLoadingGeo(false);
      })
      .catch(() => setLoadingGeo(false));
  }, []);

  // Khi tỉnh thay đổi → cập nhật danh sách huyện
  useEffect(() => {
    if (!vnData || !selectedProvince) {
      setDistricts([]);
      setWards([]);
      return;
    }
    const found = vnData.find((p) => p.Name === selectedProvince);
    if (!found) {
      setDistricts([]);
      setWards([]);
      return;
    }
    setDistricts(found.Districts.map((d) => d.Name));
    // Chỉ reset khi user tự đổi, không reset lúc đang khôi phục data cũ
    if (!initializingRef.current) {
      setWards([]);
      setValue("district", "");
      setValue("ward", "");
    }
  }, [selectedProvince, vnData]); // eslint-disable-line react-hooks/exhaustive-deps

  // Khi huyện thay đổi → cập nhật danh sách xã
  useEffect(() => {
    if (!vnData || !selectedProvince || !selectedDistrict) {
      setWards([]);
      return;
    }
    const foundP = vnData.find((p) => p.Name === selectedProvince);
    if (!foundP) {
      setWards([]);
      return;
    }
    const foundD = foundP.Districts.find((d) => d.Name === selectedDistrict);
    if (!foundD) {
      setWards([]);
      return;
    }
    setWards(foundD.Wards.map((w) => w.Name));
    if (!initializingRef.current) setValue("ward", "");
  }, [selectedDistrict, selectedProvince, vnData]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Khôi phục giá trị cũ khi sửa địa chỉ (chạy tuần tự, từng bước một) ──────
  // Lý do phải làm tuần tự: <select> là uncontrolled qua register, setValue()
  // chỉ có tác dụng nếu <option> tương ứng ĐÃ tồn tại trong DOM lúc đó.
  // Nên phải: set tỉnh -> đợi list huyện thực sự có data (do effect cascade phía
  // trên tự điền) -> set huyện -> đợi list xã có data -> set xã.

  // Bước 1: khi vnData sẵn sàng, set tỉnh
  useEffect(() => {
    if (!vnData || !initializingRef.current || provinceSetRef.current) return;
    provinceSetRef.current = true;
    if (initial.province) {
      setValue("province", initial.province, { shouldDirty: false });
    } else {
      initializingRef.current = false;
    }
  }, [vnData]); // eslint-disable-line react-hooks/exhaustive-deps

  // Bước 2: khi list huyện (districts) đã được điền do effect cascade ở trên, set huyện
  useEffect(() => {
    if (
      !initializingRef.current ||
      !provinceSetRef.current ||
      districtSetRef.current
    )
      return;
    if (districts.length === 0) return; // chưa kịp điền, đợi thêm
    districtSetRef.current = true;
    if (initial.district && districts.includes(initial.district)) {
      setValue("district", initial.district, { shouldDirty: false });
      // Nếu địa chỉ cũ không có phường/xã thì không cần đợi bước 3 nữa
      if (!initial.ward) initializingRef.current = false;
    } else {
      initializingRef.current = false;
    }
  }, [districts]); // eslint-disable-line react-hooks/exhaustive-deps

  // Bước 3: khi list xã (wards) đã được điền, set xã rồi kết thúc quá trình khôi phục
  useEffect(() => {
    if (
      !initializingRef.current ||
      !districtSetRef.current ||
      wardSetRef.current
    )
      return;
    if (wards.length === 0) return; // chưa kịp điền, đợi thêm
    wardSetRef.current = true;
    if (initial.ward && wards.includes(initial.ward)) {
      setValue("ward", initial.ward, { shouldDirty: false });
    }
    initializingRef.current = false;
  }, [wards]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <form
      onSubmit={handleSubmit(onSave)}
      className="bg-white border-2 border-vnpt/30 rounded-xl p-6 space-y-4"
    >
      <h3 className="font-bold text-body">{title}</h3>

      {/* Họ tên + SĐT */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-semibold block mb-1.5">
            Họ tên người nhận *
          </label>
          <input
            {...register("receiver_name", { required: "Vui lòng nhập tên" })}
            className="w-full px-4 py-3 border border-shade rounded-lg text-sm outline-none focus:border-vnpt transition-colors"
            placeholder="Nguyễn Văn A"
          />
          {errors.receiver_name && (
            <p className="text-xs text-accent mt-1">
              {errors.receiver_name.message}
            </p>
          )}
        </div>
        <div>
          <label className="text-sm font-semibold block mb-1.5">
            Số điện thoại *
          </label>
          <input
            {...register("phone", { required: "Vui lòng nhập SĐT" })}
            className="w-full px-4 py-3 border border-shade rounded-lg text-sm outline-none focus:border-vnpt transition-colors"
            placeholder="0901 234 567"
          />
          {errors.phone && (
            <p className="text-xs text-accent mt-1">{errors.phone.message}</p>
          )}
        </div>
      </div>

      {/* Tỉnh → Huyện → Xã (cascade) */}
      <div className="grid grid-cols-3 gap-4">
        {/* Tỉnh / Thành phố */}
        <div>
          <label className="text-sm font-semibold block mb-1.5">
            Tỉnh / Thành phố *
          </label>
          <div className="relative">
            <select
              {...register("province", { required: "Chọn tỉnh/thành phố" })}
              disabled={loadingGeo}
              className={selectCls(loadingGeo)}
            >
              <option value="">
                {loadingGeo ? "Đang tải..." : "-- Chọn tỉnh/TP --"}
              </option>
              {provinces.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted text-xs">
              ▼
            </span>
          </div>
          {errors.province && (
            <p className="text-xs text-accent mt-1">
              {errors.province.message}
            </p>
          )}
        </div>

        {/* Quận / Huyện */}
        <div>
          <label className="text-sm font-semibold block mb-1.5">
            Quận / Huyện *
          </label>
          <div className="relative">
            <select
              {...register("district", { required: "Chọn quận/huyện" })}
              disabled={!selectedProvince || districts.length === 0}
              className={selectCls(!selectedProvince || districts.length === 0)}
            >
              <option value="">-- Chọn quận/huyện --</option>
              {districts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted text-xs">
              ▼
            </span>
          </div>
          {errors.district && (
            <p className="text-xs text-accent mt-1">
              {errors.district.message}
            </p>
          )}
        </div>

        {/* Phường / Xã */}
        <div>
          <label className="text-sm font-semibold block mb-1.5">
            Phường / Xã
          </label>
          <div className="relative">
            <select
              {...register("ward")}
              disabled={!selectedDistrict || wards.length === 0}
              className={selectCls(!selectedDistrict || wards.length === 0)}
            >
              <option value="">-- Chọn phường/xã --</option>
              {wards.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted text-xs">
              ▼
            </span>
          </div>
        </div>
      </div>

      {/* Địa chỉ cụ thể */}
      <div>
        <label className="text-sm font-semibold block mb-1.5">
          Địa chỉ cụ thể *
        </label>
        <input
          {...register("address_line", {
            required: "Vui lòng nhập địa chỉ cụ thể",
          })}
          className="w-full px-4 py-3 border border-shade rounded-lg text-sm outline-none focus:border-vnpt transition-colors"
          placeholder="Số nhà, tên đường..."
        />
        {errors.address_line && (
          <p className="text-xs text-accent mt-1">
            {errors.address_line.message}
          </p>
        )}
      </div>

      {/* Đặt mặc định */}
      {!initial.is_default && (
        <label className="flex items-center gap-3 cursor-pointer select-none w-fit group">
          <div className="relative">
            <input
              type="checkbox"
              {...register("is_default")}
              className="sr-only peer"
            />
            <div className="w-10 h-5 bg-shade rounded-full peer-checked:bg-vnpt transition-colors duration-200" />
            <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 peer-checked:translate-x-5" />
          </div>
          <span className="text-sm font-semibold text-body group-hover:text-vnpt transition-colors">
            Đặt làm địa chỉ mặc định
          </span>
        </label>
      )}
      {initial.is_default && (
        <div className="flex items-center gap-2 text-sm text-vnpt font-semibold">
          <span className="w-4 h-4 rounded-full bg-vnpt flex items-center justify-center text-white text-[10px]">
            ✓
          </span>
          Đây là địa chỉ mặc định
        </div>
      )}

      <div className="flex gap-3 pt-1">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 bg-vnpt text-white rounded-full text-sm font-bold hover:bg-vnpt-dark transition-colors disabled:opacity-60"
        >
          {saving ? "Đang lưu..." : "Lưu địa chỉ"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2.5 border border-shade text-muted rounded-full text-sm font-semibold hover:border-body transition-colors"
        >
          Huỷ
        </button>
      </div>
    </form>
  );
}

function AddressesTab() {
  const { data: addresses, loading, reload } = useUserAddresses();
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [settingDefaultId, setSettingDefaultId] = useState(null);

  // Địa chỉ mặc định luôn lên đầu
  const sortedAddresses = [...addresses].sort(
    (a, b) => (b.is_default ? 1 : 0) - (a.is_default ? 1 : 0),
  );

  // ── Thêm mới ──────────────────────────────────────────────────────────────
  const handleAdd = async (data) => {
    setSaving(true);
    try {
      const { is_default, ...rest } = data;
      const newAddr = await userApi.addAddress(rest);
      if (is_default && newAddr?.data?.id) {
        await userApi.setDefaultAddress(newAddr.data.id);
      }
      toast.success("Đã thêm địa chỉ mới");
      setShowAdd(false);
      reload();
    } catch (err) {
      toast.error(err?.message || "Thêm địa chỉ thất bại");
    } finally {
      setSaving(false);
    }
  };

  // ── Cập nhật ──────────────────────────────────────────────────────────────
  const handleUpdate = async (id, data) => {
    setSaving(true);
    try {
      const { is_default, ...rest } = data;
      await userApi.updateAddress(id, rest);
      if (is_default) await userApi.setDefaultAddress(id);
      toast.success("Đã cập nhật địa chỉ");
      setEditingId(null);
      reload();
    } catch (err) {
      toast.error(err?.message || "Cập nhật thất bại");
    } finally {
      setSaving(false);
    }
  };

  // ── Đặt mặc định ──────────────────────────────────────────────────────────
  const handleSetDefault = async (id) => {
    setSettingDefaultId(id);
    try {
      await userApi.setDefaultAddress(id);
      toast.success("Đã đặt địa chỉ mặc định");
      reload();
    } catch (err) {
      toast.error(err?.message || "Thất bại");
    } finally {
      setSettingDefaultId(null);
    }
  };

  // ── Xoá ───────────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm("Xoá địa chỉ này?")) return;
    setDeletingId(id);
    try {
      await userApi.deleteAddress(id);
      toast.success("Đã xoá địa chỉ");
      reload();
    } catch (err) {
      toast.error(err?.message || "Xoá thất bại");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      {addresses.length === 0 && !showAdd && (
        <EmptyState
          icon="📍"
          title="Chưa có địa chỉ nào"
          desc="Thêm địa chỉ để thanh toán nhanh hơn"
        />
      )}

      {sortedAddresses.map((addr) => (
        <div key={addr.id} className="space-y-2">
          {/* ── Card ── */}
          <div
            className={`bg-white border rounded-xl p-5 flex items-start justify-between gap-4 transition-colors ${
              editingId === addr.id
                ? "border-vnpt/40 bg-vnpt-light/30"
                : "border-shade hover:border-vnpt/30"
            }`}
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-sm font-bold text-body">
                  {addr.receiver_name}
                </span>
                <span className="text-sm text-muted">· {addr.phone}</span>
                {addr.is_default && (
                  <span className="text-xs bg-vnpt-light text-vnpt font-semibold px-2 py-0.5 rounded-full">
                    Mặc định
                  </span>
                )}
              </div>
              <p className="text-sm text-muted">
                {[addr.address_line, addr.ward, addr.district, addr.province]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <button
                onClick={() => {
                  setEditingId(editingId === addr.id ? null : addr.id);
                  setShowAdd(false);
                }}
                className={`text-sm font-semibold hover:underline ${editingId === addr.id ? "text-muted" : "text-vnpt"}`}
              >
                {editingId === addr.id ? "Đóng" : "Sửa"}
              </button>
              <button
                onClick={() => handleDelete(addr.id)}
                disabled={deletingId === addr.id}
                className="text-sm text-accent hover:underline disabled:opacity-60"
              >
                {deletingId === addr.id ? "Đang xoá..." : "Xoá"}
              </button>
            </div>
          </div>

          {/* ── Form sửa ── */}
          {editingId === addr.id && (
            <AddressForm
              title="Sửa địa chỉ"
              initial={{
                receiver_name: addr.receiver_name,
                phone: addr.phone,
                province: addr.province,
                district: addr.district,
                ward: addr.ward || "",
                address_line: addr.address_line,
                is_default: !!addr.is_default,
              }}
              saving={saving}
              onSave={(data) => handleUpdate(addr.id, data)}
              onCancel={() => setEditingId(null)}
            />
          )}
        </div>
      ))}

      {/* ── Form thêm mới ── */}
      {showAdd ? (
        <AddressForm
          title="Thêm địa chỉ mới"
          saving={saving}
          onSave={handleAdd}
          onCancel={() => setShowAdd(false)}
        />
      ) : (
        <button
          onClick={() => {
            setShowAdd(true);
            setEditingId(null);
          }}
          className="w-full py-3.5 border-2 border-dashed border-shade rounded-xl text-sm text-muted font-semibold hover:border-vnpt hover:text-vnpt transition-colors"
        >
          + Thêm địa chỉ mới
        </button>
      )}
    </div>
  );
}

// ── Tab: Cài đặt ─────────────────────────────────────────────────────────────
function SettingsTab() {
  const { data: profile, loading, reload } = useUserProfile();
  const { user } = useAuthStore();
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { isDirty },
  } = useForm({
    values: {
      full_name: profile?.full_name || user?.name || "",
      phone: profile?.phone || "",
      gender: profile?.gender || "",
    },
  });

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      await userApi.updateProfile(data);
      toast.success("Cập nhật thông tin thành công!");
      reload();
    } catch (err) {
      toast.error(err.message || "Cập nhật thất bại");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="bg-white border border-shade rounded-xl p-6">
        <h3 className="font-bold text-body mb-5 pb-4 border-b border-shade">
          Thông tin cá nhân
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-semibold block mb-1.5">Email</label>
            <input
              value={user?.email || ""}
              disabled
              className="w-full px-4 py-3 border border-shade rounded-lg text-sm bg-surface text-muted cursor-not-allowed"
            />
            <p className="text-xs text-muted mt-1">Email không thể thay đổi</p>
          </div>
          <div>
            <label className="text-sm font-semibold block mb-1.5">
              Họ và tên
            </label>
            <input
              {...register("full_name")}
              className="w-full px-4 py-3 border border-shade rounded-lg text-sm outline-none focus:border-vnpt"
              placeholder="Nguyễn Văn A"
            />
          </div>
          <div>
            <label className="text-sm font-semibold block mb-1.5">
              Số điện thoại
            </label>
            <input
              {...register("phone")}
              type="tel"
              className="w-full px-4 py-3 border border-shade rounded-lg text-sm outline-none focus:border-vnpt"
              placeholder="0901 234 567"
            />
          </div>
          <div>
            <label className="text-sm font-semibold block mb-1.5">
              Giới tính
            </label>
            <select
              {...register("gender")}
              className="w-full px-4 py-3 border border-shade rounded-lg text-sm outline-none focus:border-vnpt bg-white"
            >
              <option value="">Chọn giới tính</option>
              <option value="male">Nam</option>
              <option value="female">Nữ</option>
              <option value="other">Khác</option>
            </select>
          </div>
        </div>
        <div className="mt-5">
          <button
            type="submit"
            disabled={saving || !isDirty}
            className="px-6 py-2.5 bg-vnpt text-white rounded-full text-sm font-bold hover:bg-vnpt-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      </div>
    </form>
  );
}

// ── Main AccountPage ──────────────────────────────────────────────────────────
export default function AccountPage() {
  const { user, logout } = useAuthStore();
  const { data: profile, reload: reloadProfile } = useUserProfile();
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const avatarUrl = resolveImageUrl(profile?.avatar);

  const currentPath = location.pathname;
  const activeTab =
    NAV_ITEMS.find(
      (n) =>
        n.path === currentPath ||
        (n.path !== "/account" && currentPath.startsWith(n.path)),
    )?.id || "overview";

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const renderTab = () => {
    switch (activeTab) {
      case "overview":
        return <OverviewTab user={user} />;
      case "orders":
        return <OrdersTab />;
      case "addresses":
        return <AddressesTab />;
      case "settings":
        return <SettingsTab />;
      default:
        return <OverviewTab user={user} />;
    }
  };

  return (
    <div>
      <Breadcrumb
        items={[{ to: "/", label: "Trang chủ" }, { label: "Tài khoản" }]}
      />

      <div className="max-w-[1200px] mx-auto px-10 py-8 grid grid-cols-[260px_1fr] gap-7 items-start">
        {/* ── SIDEBAR ─────────────────────────────────────────────────────── */}
        <aside className="sticky top-24">
          {/* User card */}
          <div className="bg-white border border-shade rounded-xl p-6 mb-4 text-center">
            <button
              type="button"
              onClick={() => setAvatarModalOpen(true)}
              className="group relative w-16 h-16 rounded-full mx-auto mb-3 block overflow-hidden focus:outline-none focus:ring-2 focus:ring-vnpt focus:ring-offset-2"
              title="Đổi ảnh đại diện"
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-vnpt text-white flex items-center justify-center text-2xl font-bold">
                  {user?.name?.charAt(0)?.toUpperCase() || "U"}
                </div>
              )}
              {/* Overlay khi hover, gợi ý đổi ảnh — giống pattern Facebook/LinkedIn */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/45 transition-colors flex items-center justify-center">
                <span className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs">
                  📷
                </span>
              </div>
            </button>
            <div className="font-bold text-body">
              {user?.name || "Người dùng"}
            </div>
            <div className="text-xs text-muted mt-1 mb-3 truncate">
              {user?.email}
            </div>
            <span className="inline-block bg-yellow-50 text-yellow-700 text-xs font-bold px-3 py-1 rounded-full">
              🥇 Thành viên
            </span>
          </div>

          {/* Nav */}
          <nav className="bg-white border border-shade rounded-xl overflow-hidden">
            {NAV_ITEMS.map(({ id, icon, label, path }) => (
              <Link
                key={id}
                to={path}
                className={`flex items-center gap-3 px-4 py-3.5 text-sm font-medium border-b border-shade last:border-none transition-colors ${
                  activeTab === id
                    ? "bg-vnpt-light text-vnpt font-semibold"
                    : "text-body hover:bg-vnpt-light hover:text-vnpt"
                }`}
              >
                <span>{icon}</span>
                {label}
              </Link>
            ))}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-sm font-medium text-accent hover:bg-red-50 transition-colors"
            >
              <span>🚪</span>
              Đăng xuất
            </button>
          </nav>
        </aside>

        {/* ── CONTENT ─────────────────────────────────────────────────────── */}
        <div>
          <h2 className="font-display text-2xl font-bold text-body mb-6">
            {NAV_ITEMS.find((n) => n.id === activeTab)?.label || "Tài khoản"}
          </h2>
          {renderTab()}
        </div>
      </div>

      {avatarModalOpen && (
        <AvatarUploadModal
          currentAvatarUrl={avatarUrl}
          onClose={() => setAvatarModalOpen(false)}
          onSuccess={() => reloadProfile()}
        />
      )}
    </div>
  );
}
