// Adapted from CTRL+P 015a7b58, app/api/admin/coupons/route.ts.
// The caller supplies a verified member and an organization-scoped repository.
export type Coupon = {
  id: string; code: string; description: string | null;
  discount_type: 'percentage' | 'fixed'; discount_value: number;
  min_order_total: number | null; max_uses: number | null; uses_count: number;
  expires_at: string | null; active: boolean; created_at: string; revision: number;
};
export type CouponFields = Pick<Coupon, 'code' | 'description' | 'discount_type' | 'discount_value' | 'min_order_total' | 'max_uses' | 'expires_at' | 'active'>;
export class CouponError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}
export function couponFields(body: Record<string, unknown>, existing?: Coupon): CouponFields {
  const value = {...existing, ...body};
  const code = String(value.code ?? '').trim().toUpperCase();
  if (!/^[A-Z0-9_-]{1,64}$/.test(code)) throw new CouponError('Use 1–64 letters, numbers, underscores or hyphens for the code.');
  if (existing && code !== existing.code) throw new CouponError('An existing coupon code cannot be changed.');
  const discount_type = value.discount_type;
  if (discount_type !== 'fixed' && discount_type !== 'percentage') throw new CouponError('Choose a fixed or percentage discount.');
  const number = (input: unknown, label: string, minimum: number, maximum: number) => {
    if ((typeof input !== 'number' && typeof input !== 'string') || String(input).trim() === '') throw new CouponError(`${label} is required.`);
    const result = Number(input);
    if (!Number.isFinite(result) || result < minimum || result > maximum || Math.abs(result * 100 - Math.round(result * 100)) > 0.000001) throw new CouponError(`${label} is out of range or has more than two decimals.`);
    return result;
  };
  const discount_value = number(value.discount_value, 'Discount', 0.01, discount_type === 'percentage' ? 100 : 99999999.99);
  const min_order_total = value.min_order_total == null ? null : number(value.min_order_total, 'Minimum order', 0, 99999999.99);
  const max_uses = value.max_uses == null ? null : number(value.max_uses, 'Maximum uses', 1, 2147483647);
  if (max_uses !== null && !Number.isInteger(max_uses)) throw new CouponError('Maximum uses must be a whole number.');
  if (typeof value.active !== 'boolean') throw new CouponError('Active must be true or false.');
  if (value.description != null && typeof value.description !== 'string') throw new CouponError('Description must be text.');
  const description = String(value.description ?? '').trim() || null;
  if (description && description.length > 2000) throw new CouponError('Description is too long.');
  let expires_at: string | null = null;
  if (value.expires_at != null) {
    if (typeof value.expires_at !== 'string' || !/^\d{4}-\d{2}-\d{2}T/.test(value.expires_at) || !Number.isFinite(Date.parse(value.expires_at))) throw new CouponError('Expiry must be an ISO date and time.');
    expires_at = new Date(value.expires_at).toISOString();
  }
  return {code, description, discount_type, discount_value, min_order_total, max_uses, expires_at, active:value.active};
}
export function requireCouponWriter(role: string) {
  if (role !== 'admin' && role !== 'staff') throw new CouponError('Only active staff or administrators can change coupons.', 403);
}
export function couponRevision(body: Record<string, unknown>) {
  if (!Number.isSafeInteger(body.revision) || Number(body.revision) < 0) throw new CouponError('The current coupon revision is required.');
  return Number(body.revision);
}
