const fieldNames: Record<string, string> = {
  MaNV: "ma_nv",
  HoTen: "ho_ten",
  Email: "email",
  SoDienThoai: "so_dien_thoai",
  VaiTro: "vai_tro",
  ChuyenMon: "chuyen_mon",
  MaTB: "ma_tb",
  TenTB: "ten_tb",
  LoaiTB: "loai_tb",
  DiaChiIP: "dia_chi_ip",
  ViTri: "vi_tri",
  TrangThai: "trang_thai",
  TinhTrang: "tinh_trang",
  MaCS: "ma_cs",
  ThoiGianGhiNhan: "thoi_gian_ghi_nhan",
  DoTre: "do_tre",
  MatGoi: "mat_goi",
  BangThongSuDung: "bang_thong_su_dung",
  MaLH: "ma_lh",
  TenLoHong: "ten_lo_hong",
  MucDo: "muc_do",
  TrangThaiKhacPhuc: "trang_thai_khac_phuc",
  ThoiGianXayRaSuCo: "thoi_gian_xay_ra_su_co",
  ThoiGianXuLySuCo: "thoi_gian_xu_ly_su_co",
  MaNV_XuLy: "manv_xuly",
  MaLoi: "ma_loi",
  ThoiGianLoi: "thoi_gian_loi",
  MoTaLoi: "mo_ta_loi",
  MucDoNghiemTrong: "muc_do_nghiem_trong",
  DaXuLy: "da_xu_ly",
  ThoiGianHoanThanh: "thoi_gian_hoan_thanh",
  MaLK: "ma_lk",
  MaTB_Goc: "matb_goc",
  MaTB_Dich: "matb_dich",
  BangThongToiDa: "bang_thong_toi_da",
  MaNV_Tao: "manv_tao",
};

const fieldNamesReverse = Object.fromEntries(
  Object.entries(fieldNames).map(([uiName, apiName]) => [apiName, uiName]),
);

function mapFields(value: unknown, names: Record<string, string>): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => mapFields(item, names));
  }
  if (!value || typeof value !== "object" || value instanceof Date) {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      names[key] ?? key,
      mapFields(item, names),
    ]),
  );
}

export function toBackendFields<T>(value: T): unknown {
  return mapFields(value, fieldNames);
}

export function fromBackendFields<T>(value: unknown): T {
  return mapFields(value, fieldNamesReverse) as T;
}

export function successResponse<T extends object>(
  value: unknown,
  fallbackMessage: string,
): T & { success: true; message: string } {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Backend trả về response không hợp lệ.");
  }
  const mapped = fromBackendFields<Record<string, unknown>>(value);
  if (mapped.success === false) {
    throw new Error(
      typeof mapped.message === "string"
        ? mapped.message
        : "Backend rejected the request.",
    );
  }
  return {
    ...mapped,
    success: true,
    message:
      typeof mapped.message === "string" ? mapped.message : fallbackMessage,
  } as T & { success: true; message: string };
}
