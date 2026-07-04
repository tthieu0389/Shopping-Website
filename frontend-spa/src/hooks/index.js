import { useState, useEffect, useCallback, useRef } from "react";
import {
  productsApi,
  categoriesApi,
  blogsApi,
  reviewsApi,
  favoritesApi,
  ordersApi,
  userApi,
  promotionsApi,
} from "../api/index.js";
import useAuthStore from "../store/authStore.js";
import { resolveImageUrl } from "../utils/index.js";

// ── useProducts ───────────────────────────────────────────────────────────────
export const useProducts = (params = {}) => {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    productsApi
      .getAll(params)
      .then((res) => {
        if (cancelled) return;
        const list = (res.data || []).map((p) =>
          p.thumbnail_url ? { ...p, thumbnail: p.thumbnail_url } : p,
        );
        setData(list);
        setTotal(res.total || 0);
        setLoading(false);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || "Lỗi tải sản phẩm");
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(params)]);

  return { data, total, loading, error };
};

// ── useProduct (single by slug/id) ───────────────────────────────────────────
export const useProduct = (slug) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    productsApi
      .getBySlug(slug)
      .then((res) => {
        setData(res.data || res);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Không tìm thấy sản phẩm");
        setLoading(false);
      });
  }, [slug]);

  return { data, loading, error };
};

// ── useRelatedProducts ────────────────────────────────────────────────────────
export const useRelatedProducts = (id) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    productsApi
      .getRelated(id)
      .then((res) => {
        if (cancelled) return;
        const list = (res.data || []).map((p) =>
          p.thumbnail_url ? { ...p, thumbnail: p.thumbnail_url } : p,
        );
        setData(list);
        setLoading(false);
      })
      .catch(() => setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [id]);

  return { data, loading };
};

// ── useDiscountedProducts ─────────────────────────────────────────────────────
// Dùng cho trang Flash Sale / Khuyến mãi — gọi đúng endpoint chỉ trả về những sản
// phẩm đang có promotion active thật (GET /promotions/discounted-products), thay vì
// lấy toàn bộ sản phẩm rồi hiển thị nhầm cả sản phẩm không giảm giá.
export const useDiscountedProducts = (params = {}) => {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    promotionsApi
      .getDiscountedProducts(params)
      .then((res) => {
        if (cancelled) return;
        const list = (res.data || []).map((p) =>
          p.thumbnail_url ? { ...p, thumbnail: p.thumbnail_url } : p,
        );
        setData(list);
        // Đọc total ở cả root lẫn meta để tránh vỡ pagination nếu backend
        // đổi shape response (đã từng gây bug mất pagination ở Flash Sale).
        setTotal(res.total ?? res.meta?.total ?? 0);
        setLoading(false);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || "Lỗi tải sản phẩm khuyến mãi");
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(params)]);

  return { data, total, loading, error };
};

// ── useCategories ─────────────────────────────────────────────────────────────
export const useCategories = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // categoriesApi.getAll() đã normalize về { data: [] }
    categoriesApi
      .getAll()
      .then((res) => {
        setData(res.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return { data, loading };
};

// ── useBlogs ──────────────────────────────────────────────────────────────────
export const useBlogs = (params = {}) => {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    blogsApi
      .getAll(params)
      .then((res) => {
        setData(res.data || []);
        setTotal(Number(res.total) || 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(params)]);

  return { data, total, loading };
};

// ── useReviews ────────────────────────────────────────────────────────────────
export const useReviews = (productId) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(() => {
    if (!productId) return;
    setLoading(true);
    reviewsApi
      .getByProduct(productId)
      .then((res) => {
        setData(res.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [productId]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, loading, reload };
};

// ── useFavorites ──────────────────────────────────────────────────────────────
export const useFavorites = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(() => {
    setLoading(true);
    favoritesApi
      .getAll()
      .then((res) => {
        setData(res.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const isFav = useCallback(
    (productId) =>
      data.some((f) => f.product_id === productId || f.id === productId),
    [data],
  );

  const toggle = useCallback(
    async (productId) => {
      if (isFav(productId)) {
        await favoritesApi.remove(productId);
      } else {
        await favoritesApi.add(productId);
      }
      reload();
    },
    [isFav, reload],
  );

  return { data, loading, isFav, toggle, reload };
};

// ── useOrders ─────────────────────────────────────────────────────────────────
// Dùng cho trang "Đơn hàng của tôi" ngoài storefront (KHÔNG dùng cho Admin panel).
//
// ⚠️ WORKAROUND BACKEND BUG:
// Endpoint GET /orders hiện bị backend dùng chung cho cả admin panel lẫn trang
// "đơn hàng của tôi" ngoài storefront, và chỉ phân nhánh dữ liệu theo req.user.role:
//   - role === 'admin'  -> trả về TẤT CẢ đơn hàng của mọi user
//   - role !== 'admin'  -> chỉ trả về đơn hàng của chính user đó
// Hệ quả: nếu tài khoản admin vào trang cá nhân (AccountPage, ngoài /admin) để xem
// đơn hàng của chính họ, API vẫn trả về đơn của TẤT CẢ user khác -> đơn hàng của
// user thường bị lộ ra ngoài trang admin panel.
// Trong lúc chờ backend sửa endpoint (tách riêng API "đơn hàng của tôi" luôn lọc
// theo req.user.id bất kể role), ta lọc lại ở client để đảm bảo trang storefront
// chỉ hiển thị đúng đơn hàng của người đang đăng nhập.
export const useOrders = (params = {}) => {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const currentUserId = useAuthStore((state) => state.user?.id);

  const reload = useCallback(() => {
    setLoading(true);
    ordersApi
      .getAll(params)
      .then((res) => {
        const all = res.data || [];
        // Chỉ giữ lại đơn hàng thuộc về user đang đăng nhập (kể cả khi họ là admin),
        // để trang storefront không lộ đơn hàng của người khác do backend trả thừa.
        const mine = currentUserId
          ? all.filter((o) => String(o.user_id) === String(currentUserId))
          : all;
        setData(mine);
        // total trả từ backend là tổng toàn hệ thống khi user là admin nên không còn
        // đúng nữa sau khi lọc -> dùng số lượng thực tế sau khi lọc cho khớp UI.
        setTotal(mine.length);
        setLoading(false);
      })
      .catch(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(params), currentUserId]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, total, loading, reload };
};

// ── useUserProfile ────────────────────────────────────────────────────────────
export const useUserProfile = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(() => {
    setLoading(true);
    userApi
      .getProfile()
      .then((res) => {
        setData(res.data || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, loading, reload };
};

// ── useAvatarUrl ──────────────────────────────────────────────────────────────
// Dùng chung cho mọi nơi cần hiển thị avatar user hiện tại (Navbar, AdminLayout,
// StaffLayout...). Tự fetch khi đã đăng nhập, và tự cập nhật ngay lập tức khi
// avatar được đổi ở nơi khác (AccountPage) thông qua event 'vnpt:avatar-updated'
// — không cần reload trang.
export const useAvatarUrl = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [avatarUrl, setAvatarUrl] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setAvatarUrl(null);
      return;
    }
    let cancelled = false;
    userApi
      .getProfile()
      .then((res) => {
        if (!cancelled) setAvatarUrl(resolveImageUrl(res.data?.avatar));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  useEffect(() => {
    const handleAvatarUpdated = (e) => setAvatarUrl(resolveImageUrl(e.detail?.avatar));
    window.addEventListener("vnpt:avatar-updated", handleAvatarUpdated);
    return () => window.removeEventListener("vnpt:avatar-updated", handleAvatarUpdated);
  }, []);

  return avatarUrl;
};

// ── useUserAddresses ──────────────────────────────────────────────────────────
export const useUserAddresses = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(() => {
    setLoading(true);
    userApi
      .getAddresses()
      .then((res) => {
        setData(res.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, loading, reload };
};

// ── useSearch (debounced) ────────────────────────────────────────────────────
export const useSearch = (delay = 400) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    let cancelled = false;

    const timer = setTimeout(async () => {
      try {
        const res = await productsApi.getAll({ search: query, limit: 8 });
        if (cancelled) return;
        const list = (res.data || []).map((p) =>
          p.thumbnail_url ? { ...p, thumbnail: p.thumbnail_url } : p,
        );
        setResults(list);
        setLoading(false);
      } catch (_) {
        if (!cancelled) {
          setResults([]);
          setLoading(false);
        }
      }
    }, delay);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, delay]);

  return { query, setQuery, results, loading };
};

// ── useCountdown ──────────────────────────────────────────────────────────────
export const useCountdown = (targetSeconds = 6443) => {
  const [time, setTime] = useState(targetSeconds);
  const ref = useRef(null);

  useEffect(() => {
    ref.current = setInterval(() => {
      setTime((t) => (t <= 0 ? 0 : t - 1));
    }, 1000);
    return () => clearInterval(ref.current);
  }, []);

  const h = String(Math.floor(time / 3600)).padStart(2, "0");
  const m = String(Math.floor((time % 3600) / 60)).padStart(2, "0");
  const s = String(time % 60).padStart(2, "0");

  return { h, m, s, time };
};

// ── usePagination ─────────────────────────────────────────────────────────────
export const usePagination = (total, limit = 12) => {
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(total / limit);

  const goTo = (p) => setPage(Math.min(Math.max(1, p), totalPages || 1));
  const next = () => goTo(page + 1);
  const prev = () => goTo(page - 1);

  return {
    page,
    totalPages,
    goTo,
    next,
    prev,
    limit,
    offset: (page - 1) * limit,
  };
};