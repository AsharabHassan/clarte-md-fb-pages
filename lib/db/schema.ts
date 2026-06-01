import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  primaryKey,
  index,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// ---------- products ----------
export const products = pgTable('products', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  sku: text('sku').notNull().unique(),
  name: text('name').notNull(),
  pricePkr: integer('price_pkr').notNull(),
  listPricePkr: integer('list_price_pkr'),
  actives: text('actives'),
  imageUrl: text('image_url'),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ---------- bundles ----------
export const bundles = pgTable('bundles', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  concern: text('concern').notNull(),
  pricePkr: integer('price_pkr').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ---------- bundle_items ----------
export const bundleItems = pgTable(
  'bundle_items',
  {
    bundleId: uuid('bundle_id').notNull().references(() => bundles.id, { onDelete: 'cascade' }),
    productId: uuid('product_id').notNull().references(() => products.id),
    position: integer('position').notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.bundleId, t.productId] }),
  }),
);

// ---------- ai_sessions ----------
export const aiSessions = pgTable(
  'ai_sessions',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    kind: text('kind').notNull(), // 'before_after' | 'skin_analysis'
    concern: text('concern'),
    inputImagePath: text('input_image_path').notNull(),
    inputImageSha256: text('input_image_sha256').notNull(),
    outputImagePath: text('output_image_path'),
    analysisJson: jsonb('analysis_json'),
    modelVersion: text('model_version').notNull(),
    latencyMs: integer('latency_ms'),
    consentGiven: boolean('consent_given').notNull(),
    clientIpHash: text('client_ip_hash').notNull(),
    clientUa: text('client_ua'),
    error: text('error'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    rateLimitIdx: index('ai_sessions_rate_limit_idx').on(t.clientIpHash, t.createdAt),
    kindIdx: index('ai_sessions_kind_idx').on(t.kind, t.createdAt),
  }),
);

// ---------- orders ----------
export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  orderNumber: text('order_number').notNull().unique(),
  status: text('status').notNull().default('pending'),
  concern: text('concern'),
  sourcePage: text('source_page').notNull(),
  customerName: text('customer_name').notNull(),
  customerPhone: text('customer_phone').notNull(),
  customerEmail: text('customer_email').notNull(),
  shippingAddress: text('shipping_address').notNull(),
  shippingCity: text('shipping_city').notNull(),
  shippingPostal: text('shipping_postal'),
  shippingNotes: text('shipping_notes'),
  paymentMethod: text('payment_method').notNull(),
  paymentStatus: text('payment_status').notNull().default('pending'),
  subtotalPkr: integer('subtotal_pkr').notNull(),
  shippingPkr: integer('shipping_pkr').notNull(),
  totalPkr: integer('total_pkr').notNull(),
  bundleInCart: boolean('bundle_in_cart').notNull(),
  usedAiPreview: boolean('used_ai_preview').notNull(),
  aiSessionId: uuid('ai_session_id').references(() => aiSessions.id),
  clientIpHash: text('client_ip_hash').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ---------- order_items ----------
export const orderItems = pgTable('order_items', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  sku: text('sku').notNull(),
  name: text('name').notNull(),
  qty: integer('qty').notNull(),
  unitPricePkr: integer('unit_price_pkr').notNull(),
  isBundle: boolean('is_bundle').notNull().default(false),
});

// ---------- subscribers ----------
// Newsletter opt-ins captured from the contact form (and, later, the
// site-wide footer subscribe stub). Unique on email so repeat submits
// dedupe via onConflictDoNothing. No PII beyond email + IP hash.
export const subscribers = pgTable('subscribers', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  email: text('email').notNull().unique(),
  sourcePage: text('source_page').notNull(),
  ipHash: text('ip_hash').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ---------- order_lookups ----------
// Every order-tracking attempt (regardless of outcome) so brute-force
// on order_number + phone last-4 can be rate-limited per IP.
export const orderLookups = pgTable(
  'order_lookups',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    clientIpHash: text('client_ip_hash').notNull(),
    targetOrderNumber: text('target_order_number').notNull(),
    found: boolean('found').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    rateLimitIdx: index('order_lookups_rate_limit_idx').on(t.clientIpHash, t.createdAt),
  }),
);

// ---------- type exports ----------
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type Bundle = typeof bundles.$inferSelect;
export type NewBundle = typeof bundles.$inferInsert;
export type BundleItem = typeof bundleItems.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;
export type AiSession = typeof aiSessions.$inferSelect;
export type NewAiSession = typeof aiSessions.$inferInsert;
export type Subscriber = typeof subscribers.$inferSelect;
export type NewSubscriber = typeof subscribers.$inferInsert;
export type OrderLookup = typeof orderLookups.$inferSelect;
export type NewOrderLookup = typeof orderLookups.$inferInsert;
