// Adapted from CTRL+P 015a7b58b80e63ef87c73bec549a23242b88f3e3: lib/admin/admin-api.ts
"use client";
import type { ArtworkFile,Product,Proof } from "@/ctrlp/lib/admin/types";
import type { AppRole } from "@/ctrlp/lib/rbac/roles";
import { sourceDashboardData,sourceFetch,sourceProfile } from "@/lib/dashboard/source-runtime";

import { getSupabaseBrowserClient } from "@/ctrlp/lib/supabase/browser";
function requireClient() {
    const db = getSupabaseBrowserClient();
    if (!db)
        throw new Error("Supabase is not configured.");
    return db;
}
export async function getCurrentAdminProfile() { return sourceProfile(); }
export async function loadAdminDashboardData() { return sourceDashboardData(); }
export async function saveAdminShipment(input: {
    shipmentId?: string;
    orderId: string;
    carrier: string;
    trackingNumber: string;
    trackingUrl: string;
    status: string;
    shippedAt: string;
    estimatedDeliveryAt: string;
    deliveredAt: string;
    notifyEmail: boolean;
    notifySms: boolean;
}) {
    const db = requireClient();
    const sessionResult = await db.auth.getSession();
    const token = sessionResult.data.session?.access_token;
    if (!token)
        throw new Error("Sign in again before saving shipping.");
    const response = await sourceFetch("/api/ctrlp/admin/shipping", {
        method: input.shipmentId ? "PATCH" : "POST",
        headers: {
            "content-type": "application/json",
            authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
            shipment_id: input.shipmentId,
            order_id: input.orderId,
            carrier: input.carrier,
            tracking_number: input.trackingNumber,
            tracking_url: input.trackingUrl,
            status: input.status,
            shipped_at: input.shippedAt ? new Date(`${input.shippedAt}T12:00:00`).toISOString() : null,
            estimated_delivery_at: input.estimatedDeliveryAt ? new Date(`${input.estimatedDeliveryAt}T12:00:00`).toISOString() : null,
            delivered_at: input.deliveredAt ? new Date(`${input.deliveredAt}T12:00:00`).toISOString() : null,
            notify_email: input.notifyEmail,
            notify_sms: input.notifySms,
        }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(payload.error || "Could not save shipment.");
    }
    return payload.shipment;
}
export async function previewShippingRate(input: {
    carrier: string;
    service: string;
    weightLbs: number;
    lengthIn: number;
    widthIn: number;
    heightIn: number;
    postalCodeFrom: string;
    postalCodeTo: string;
}) {
    const db = requireClient();
    const sessionResult = await db.auth.getSession();
    const token = sessionResult.data.session?.access_token;
    if (!token)
        throw new Error("Sign in again before quoting shipping.");
    const response = await sourceFetch("/api/ctrlp/admin/shipping/rates", {
        method: "POST",
        headers: {
            "content-type": "application/json",
            authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(input),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(payload.error || "Could not quote shipping.");
    }
    return payload as {
        rate: {
            carrier: string;
            service: string;
            amount: number;
            currency: string;
            estimatedDays: number;
            configured: boolean;
            note: string;
        };
    };
}
export async function uploadAdminArtwork(input: {
    mode: "artwork" | "proof";
    file: File;
    orderId: string;
    orderItemId: string;
    userId?: string;
    status: string;
    proofUrl?: string;
    adminComments: string;
    customerComments: string;
    dpi?: string;
    colorMode?: string;
}) {
    const db = requireClient();
    const sessionResult = await db.auth.getSession();
    const token = sessionResult.data.session?.access_token;
    if (!token)
        throw new Error("Sign in again before uploading artwork.");
    const form = new FormData();
    form.append("mode", input.mode);
    form.append("file", input.file);
    form.append("order_id", input.orderId);
    form.append("order_item_id", input.orderItemId);
    form.append("user_id", input.userId || "");
    form.append("status", input.status);
    form.append("proof_url", input.proofUrl || "");
    form.append("admin_comments", input.adminComments);
    form.append("customer_comments", input.customerComments);
    form.append("dpi", input.dpi || "");
    form.append("color_mode", input.colorMode || "");
    const response = await sourceFetch("/api/ctrlp/admin/artwork", {
        method: "POST",
        headers: { authorization: `Bearer ${token}` },
        body: form,
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(payload.error || "Could not upload artwork.");
    }
    return payload as {
        artwork?: ArtworkFile;
        proof?: Proof;
    };
}
export async function updateAdminArtworkReview(input: {
    type: "artwork" | "proof";
    id: string;
    status: string;
    adminComments: string;
    customerComments: string;
}) {
    const db = requireClient();
    const sessionResult = await db.auth.getSession();
    const token = sessionResult.data.session?.access_token;
    if (!token)
        throw new Error("Sign in again before updating artwork.");
    const response = await sourceFetch("/api/ctrlp/admin/artwork", {
        method: "PATCH",
        headers: {
            "content-type": "application/json",
            authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
            type: input.type,
            id: input.id,
            status: input.status,
            admin_comments: input.adminComments,
            customer_comments: input.customerComments,
        }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(payload.error || "Could not update artwork review.");
    }
    return payload as {
        artwork?: ArtworkFile;
        proof?: Proof;
    };
}
async function currentUserId() {
    const db = requireClient();
    const sessionResult = await db.auth.getSession();
    return sessionResult.data.session?.user.id ?? null;
}
async function logActivity(action: string, entityType: string, entityId: string, details: Record<string, unknown>) {
    const db = requireClient();
    const result = await db.from("activity_logs").insert({
        actor_id: await currentUserId(),
        action,
        entity_type: entityType,
        entity_id: entityId,
        details,
    });
    if (result.error)
        throw result.error;
}
export async function updateProductionJobStatus(jobId: string, status: string, orderId: string) {
    const db = requireClient();
    const jobResult = await db
        .from("production_jobs")
        .update({ status })
        .eq("id", jobId)
        .select("id, order_id, status")
        .single();
    if (jobResult.error)
        throw jobResult.error;
    const orderResult = await db
        .from("orders")
        .update({ production_status: status })
        .eq("id", orderId || jobResult.data.order_id);
    if (orderResult.error)
        throw orderResult.error;
    await logActivity("production_status_updated", "production_job", jobId, {
        order_id: orderId || jobResult.data.order_id,
        status,
    });
    return jobResult.data;
}
export async function createProductionJob(input: {
    orderId: string;
    orderItemId?: string;
    status: string;
    priority: number;
    station: string;
    dueAt: string;
    assignedStaffId?: string;
    notes: string;
}) {
    const db = requireClient();
    const sessionResult = await db.auth.getSession();
    const token = sessionResult.data.session?.access_token;
    if (!token)
        throw new Error("Sign in again before creating a production job.");
    const response = await sourceFetch("/api/ctrlp/admin/production", {
        method: "POST",
        headers: {
            "content-type": "application/json",
            authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
            order_id: input.orderId,
            order_item_id: input.orderItemId || null,
            status: input.status,
            priority: input.priority,
            station: input.station,
            due_at: input.dueAt ? new Date(`${input.dueAt}T12:00:00`).toISOString() : null,
            assigned_staff_id: input.assignedStaffId || null,
            notes: input.notes,
        }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(payload.error || "Could not create production job.");
    }
    return payload.job;
}
export async function updateProductionJob(input: {
    jobId: string;
    orderId: string;
    status: string;
    priority: number;
    station: string;
    dueAt: string;
    assignedStaffId?: string;
    notes: string;
}) {
    const db = requireClient();
    const sessionResult = await db.auth.getSession();
    const token = sessionResult.data.session?.access_token;
    if (!token)
        throw new Error("Sign in again before updating a production job.");
    const response = await sourceFetch("/api/ctrlp/admin/production", {
        method: "PATCH",
        headers: {
            "content-type": "application/json",
            authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
            job_id: input.jobId,
            order_id: input.orderId,
            status: input.status,
            priority: input.priority,
            station: input.station,
            due_at: input.dueAt ? new Date(`${input.dueAt}T12:00:00`).toISOString() : null,
            assigned_staff_id: input.assignedStaffId || null,
            notes: input.notes,
        }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(payload.error || "Could not update production job.");
    }
    return payload.job;
}
export async function updateAdminOrder(input: {
    orderId: string;
    status: string;
    paymentStatus: string;
    productionStatus: string;
    internalNotes: string;
    dueAt: string;
}) {
    const db = requireClient();
    const sessionResult = await db.auth.getSession();
    const token = sessionResult.data.session?.access_token;
    if (!token)
        throw new Error("Sign in again before updating an order.");
    const response = await sourceFetch("/api/ctrlp/admin/orders", {
        method: "PATCH",
        headers: {
            "content-type": "application/json",
            authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
            order_id: input.orderId,
            status: input.status,
            payment_status: input.paymentStatus,
            production_status: input.productionStatus,
            internal_notes: input.internalNotes,
            due_at: input.dueAt ? new Date(`${input.dueAt}T12:00:00`).toISOString() : null,
        }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(payload.error || "Could not update order.");
    }
    return payload.order;
}
export async function createAdminOrder(input: {
    userId?: string;
    productId: string;
    quantity: number;
    unitPrice: number;
    couponCode?: string;
    status: string;
    paymentStatus: string;
    productionStatus: string;
    company: string;
    customerEmail: string;
    customerPhone: string;
    customerNotes: string;
    internalNotes: string;
    dueAt: string;
    shippingMethod: string;
}) {
    const db = requireClient();
    const sessionResult = await db.auth.getSession();
    const token = sessionResult.data.session?.access_token;
    if (!token)
        throw new Error("Sign in again before creating an order.");
    const response = await sourceFetch("/api/ctrlp/admin/orders", {
        method: "POST",
        headers: {
            "content-type": "application/json",
            authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
            user_id: input.userId || null,
            product_id: input.productId,
            quantity: input.quantity,
            unit_price: input.unitPrice,
            coupon_code: input.couponCode || undefined,
            status: input.status,
            payment_status: input.paymentStatus,
            production_status: input.productionStatus,
            company: input.company,
            customer_email: input.customerEmail,
            customer_phone: input.customerPhone,
            customer_notes: input.customerNotes,
            internal_notes: input.internalNotes,
            due_at: input.dueAt ? new Date(`${input.dueAt}T12:00:00`).toISOString() : null,
            shipping_method: input.shippingMethod,
        }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(payload.error || "Could not create order.");
    }
    return payload.order;
}
export async function markMessageRead(messageId: string, orderId: string | null) {
    const db = requireClient();
    const result = await db
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .eq("id", messageId)
        .select("id, order_id, read_at")
        .single();
    if (result.error)
        throw result.error;
    await logActivity("message_marked_read", "message", messageId, {
        order_id: orderId || result.data.order_id,
    });
    return result.data;
}
export async function updateAdminUser(userId: string, updates: {
    role: AppRole;
    status: string;
    full_name?: string;
    email?: string;
    phone?: string;
    company?: string;
}) {
    const db = requireClient();
    const currentId = await currentUserId();
    if (currentId === userId && updates.status !== "active") {
        throw new Error("You cannot deactivate your own admin account.");
    }
    const sessionResult = await db.auth.getSession();
    const token = sessionResult.data.session?.access_token;
    if (!token)
        throw new Error("Sign in again before updating user access.");
    const response = await sourceFetch("/api/ctrlp/admin/users", {
        method: "PATCH",
        headers: {
            "content-type": "application/json",
            authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
            user_id: userId,
            role: updates.role,
            status: updates.status,
            full_name: updates.full_name,
            email: updates.email,
            phone: updates.phone,
            company: updates.company,
        }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(payload.error || "Could not update user access.");
    }
    return payload.user;
}
export async function removeAdminUser(userId: string) {
    const db = requireClient();
    const currentId = await currentUserId();
    if (currentId === userId) {
        throw new Error("You cannot remove your own admin account.");
    }
    const sessionResult = await db.auth.getSession();
    const token = sessionResult.data.session?.access_token;
    if (!token)
        throw new Error("Sign in again before removing a user.");
    const response = await sourceFetch("/api/ctrlp/admin/users", {
        method: "DELETE",
        headers: {
            "content-type": "application/json",
            authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ user_id: userId }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(payload.error || "Could not remove user.");
    }
    return payload;
}
export async function createAdminInvoice(input: {
    orderId: string;
    amount: number;
    notes: string;
    invoiceNumber: string;
    dueAt: string;
    terms: string;
    billingContact: unknown;
    senderProfile: unknown;
    deliveryMethod: string;
    deliveryRecipient: string;
    invoiceMessage: string;
    lineItems: unknown;
    subtotal: number;
    taxAmount: number;
    discountAmount: number;
    processor: string;
    deliveryStatus: string;
    paymentLinkUrl?: string;
}) {
    const db = requireClient();
    const sessionResult = await db.auth.getSession();
    const token = sessionResult.data.session?.access_token;
    if (!token)
        throw new Error("Sign in again before creating an invoice.");
    const response = await sourceFetch("/api/ctrlp/admin/payments", {
        method: "POST",
        headers: {
            "content-type": "application/json",
            authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
            order_id: input.orderId,
            amount: input.amount,
            notes: input.notes,
            invoice_number: input.invoiceNumber,
            invoice_due_at: input.dueAt,
            invoice_terms: input.terms,
            billing_contact: input.billingContact,
            sender_profile: input.senderProfile,
            delivery_method: input.deliveryMethod,
            delivery_recipient: input.deliveryRecipient,
            invoice_message: input.invoiceMessage,
            line_items: input.lineItems,
            subtotal: input.subtotal,
            tax_amount: input.taxAmount,
            discount_amount: input.discountAmount,
            processor: input.processor,
            delivery_status: input.deliveryStatus,
            payment_link_url: input.paymentLinkUrl || null,
        }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(payload.error || "Could not create invoice.");
    }
    return payload.payment;
}
export async function updateAdminInvoice(input: {
    paymentId: string;
    amount?: number;
    notes?: string;
    invoiceNumber?: string;
    dueAt?: string;
    terms?: string;
    billingContact?: unknown;
    senderProfile?: unknown;
    lineItems?: unknown;
    subtotal?: number;
    taxAmount?: number;
    discountAmount?: number;
    paymentLinkUrl?: string | null;
    deliveryStatus?: string;
    status?: string;
}) {
    const db = requireClient();
    const sessionResult = await db.auth.getSession();
    const token = sessionResult.data.session?.access_token;
    if (!token)
        throw new Error("Sign in again before editing an invoice.");
    const body: Record<string, unknown> = {};
    if (input.amount !== undefined)
        body.amount = input.amount;
    if (input.notes !== undefined)
        body.notes = input.notes;
    if (input.invoiceNumber !== undefined)
        body.invoice_number = input.invoiceNumber;
    if (input.dueAt !== undefined)
        body.invoice_due_at = input.dueAt;
    if (input.terms !== undefined)
        body.invoice_terms = input.terms;
    if (input.billingContact !== undefined)
        body.billing_contact = input.billingContact;
    if (input.senderProfile !== undefined)
        body.sender_profile = input.senderProfile;
    if (input.lineItems !== undefined)
        body.line_items = input.lineItems;
    if (input.subtotal !== undefined)
        body.subtotal = input.subtotal;
    if (input.taxAmount !== undefined)
        body.tax_amount = input.taxAmount;
    if (input.discountAmount !== undefined)
        body.discount_amount = input.discountAmount;
    if (input.paymentLinkUrl !== undefined)
        body.payment_link_url = input.paymentLinkUrl;
    if (input.deliveryStatus !== undefined)
        body.delivery_status = input.deliveryStatus;
    if (input.status !== undefined)
        body.status = input.status;
    const response = await sourceFetch(`/api/admin/payments/${input.paymentId}`, {
        method: "PATCH",
        headers: {
            "content-type": "application/json",
            authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(payload.error || "Could not update invoice.");
    }
    return payload.payment;
}
export async function createSquarePaymentLink(input: {
    orderId?: string;
    amount: number;
    description: string;
    customerEmail: string;
    customerPhone: string;
    notes: string;
    deliveryMethod: string;
    productId?: string;
    productName?: string;
    quantity?: number;
    unitPrice?: number;
}) {
    const db = requireClient();
    const sessionResult = await db.auth.getSession();
    const token = sessionResult.data.session?.access_token;
    if (!token)
        throw new Error("Sign in again before processing a payment.");
    const response = await sourceFetch("/api/ctrlp/admin/payments/square", {
        method: "POST",
        headers: {
            "content-type": "application/json",
            authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
            order_id: input.orderId,
            amount: input.amount,
            description: input.description,
            customer_email: input.customerEmail,
            customer_phone: input.customerPhone,
            notes: input.notes,
            delivery_method: input.deliveryMethod,
            product_id: input.productId,
            product_name: input.productName,
            quantity: input.quantity,
            unit_price: input.unitPrice,
        }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(payload.error || "Could not create Square payment link.");
    }
    return payload as {
        payment: import("@/ctrlp/lib/admin/types").Payment;
        square: {
            environment: string;
            payment_link_id: string | null;
            order_id: string | null;
            url: string;
        };
    };
}
export async function loadSquarePaymentConfig() {
    const db = requireClient();
    const sessionResult = await db.auth.getSession();
    const token = sessionResult.data.session?.access_token;
    if (!token)
        throw new Error("Sign in again before loading Square payment settings.");
    const response = await sourceFetch("/api/ctrlp/admin/payments/square/config", {
        headers: { authorization: `Bearer ${token}` },
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(payload.error || "Could not load Square payment settings.");
    }
    return payload as {
        applicationId: string;
        currency: string;
        environment: "sandbox" | "production";
        locationId: string;
        scriptUrl: string;
    };
}
export async function createSquareCardPayment(input: {
    sourceId: string;
    verificationToken?: string;
    orderId?: string;
    amount: number;
    description: string;
    customerEmail: string;
    customerPhone: string;
    cardholderName: string;
    addressLine1: string;
    addressLine2: string;
    locality: string;
    administrativeDistrictLevel1: string;
    postalCode: string;
    country: string;
    notes: string;
    productId?: string;
    productName?: string;
    quantity?: number;
    unitPrice?: number;
}) {
    const db = requireClient();
    const sessionResult = await db.auth.getSession();
    const token = sessionResult.data.session?.access_token;
    if (!token)
        throw new Error("Sign in again before processing a card payment.");
    const response = await sourceFetch("/api/ctrlp/admin/payments/square/card", {
        method: "POST",
        headers: {
            "content-type": "application/json",
            authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
            source_id: input.sourceId,
            verification_token: input.verificationToken,
            order_id: input.orderId,
            amount: input.amount,
            description: input.description,
            customer_email: input.customerEmail,
            customer_phone: input.customerPhone,
            cardholder_name: input.cardholderName,
            address_line_1: input.addressLine1,
            address_line_2: input.addressLine2,
            locality: input.locality,
            administrative_district_level_1: input.administrativeDistrictLevel1,
            postal_code: input.postalCode,
            country: input.country,
            notes: input.notes,
            product_id: input.productId,
            product_name: input.productName,
            quantity: input.quantity,
            unit_price: input.unitPrice,
        }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(payload.error || "Could not process Square card payment.");
    }
    return payload as {
        payment: import("@/ctrlp/lib/admin/types").Payment;
        square: {
            environment: string;
            payment_id: string | null;
            order_id: string | null;
            status: string | null;
            receipt_url: string | null;
        };
    };
}
export async function createSquareRefund(input: {
    paymentId: string;
    amount: number;
    reason: string;
}) {
    const db = requireClient();
    const sessionResult = await db.auth.getSession();
    const token = sessionResult.data.session?.access_token;
    if (!token)
        throw new Error("Sign in again before issuing a refund.");
    const response = await sourceFetch(`/api/admin/payments/${input.paymentId}/refund`, {
        method: "POST",
        headers: {
            "content-type": "application/json",
            authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount: input.amount, reason: input.reason }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(payload.error || "Could not process refund.");
    }
    return payload as {
        refund: {
            id: string;
            status: string;
        };
        square_refund_id: string | null;
        amount: number;
        status: string;
    };
}
export async function deliverPaymentDocument(input: {
    paymentId: string;
    kind: "invoice" | "receipt";
    channel: "email" | "sms" | "both";
    recipientEmail?: string;
    recipientPhone?: string;
}) {
    const db = requireClient();
    const sessionResult = await db.auth.getSession();
    const token = sessionResult.data.session?.access_token;
    if (!token)
        throw new Error("Sign in again before sending a payment document.");
    const response = await sourceFetch(`/api/admin/payments/${input.paymentId}/deliver`, {
        method: "POST",
        headers: {
            "content-type": "application/json",
            authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
            kind: input.kind,
            channel: input.channel,
            recipient_email: input.recipientEmail,
            recipient_phone: input.recipientPhone,
        }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(payload.error || "Could not send payment document.");
    }
    return payload as {
        sent: string[];
        documentUrl: string;
    };
}
export type ProductPayload = {
    id?: string;
    sku: string;
    slug: string;
    name: string;
    category: string;
    tagline: string;
    description: string;
    short_description: string;
    product_type: string;
    base_cost: number;
    base_price: number;
    sale_price: number;
    vendor: string;
    active: boolean;
    status: string;
    stock_status: string;
    featured: boolean;
    customizer_enabled: boolean;
    alternate_skus: unknown;
    tags: unknown;
    brands: unknown;
    tax_status: string;
    tax_class: string;
    coupon_code: string;
    accessories: unknown;
    specifications: unknown;
    image_url: string;
    video_url: string;
    photo_gallery: unknown;
    faqs: unknown;
    tips: unknown;
    attributes: unknown;
    similar_products: unknown;
    linked_products: unknown;
    weight_lbs: number;
    dimension_length_in: number;
    dimension_width_in: number;
    dimension_height_in: number;
    shipping_class: string;
    template_files: unknown;
    import_sources: unknown;
    woo_product_id: string;
    woo_permalink: string;
    woo_sync_enabled: boolean;
    woo_sync_status: string;
    gallery: unknown;
    sizes: unknown;
    materials: unknown;
    print_options: unknown;
    finishing_options: unknown;
    quantity_tiers: unknown;
    turnaround_times: unknown;
    shipping_options: unknown;
    file_upload_requirements: unknown;
    price_rules: unknown;
    designer_template: unknown;
    designer_surfaces: unknown;
    designer_constraints: unknown;
    personalization_schema: unknown;
    proofing_settings: unknown;
    production_requirements: unknown;
    product_assets: unknown;
    meta: unknown;
};
export async function saveAdminProduct(input: ProductPayload): Promise<Product> {
    const db = requireClient();
    const sessionResult = await db.auth.getSession();
    const token = sessionResult.data.session?.access_token;
    if (!token)
        throw new Error("Sign in again before saving a product.");
    const response = await sourceFetch("/api/ctrlp/admin/products", {
        method: input.id ? "PATCH" : "POST",
        headers: {
            "content-type": "application/json",
            authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(input),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(payload.error || "Could not save product.");
    }
    return payload.product;
}
