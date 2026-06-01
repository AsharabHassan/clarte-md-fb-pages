'use client';

import Image from 'next/image';
import { Plus, Minus } from 'lucide-react';
import { useCart } from '@/lib/cart/use-cart';
import { PRODUCT_META } from '@/lib/products/catalog';
import { PRODUCT_IMAGE } from '@/lib/funnel/product-images';

/**
 * A single product card: photo, name, actives, price, and an
 * Add ⇄ qty-stepper control wired to the shared cart.
 */
export function ProductCard({ sku }: { sku: string }) {
  const { cart, addProduct, updateQty, removeItem } = useCart();
  const meta = PRODUCT_META[sku];
  if (!meta) return null;

  const idx = cart.items.findIndex((i) => i.type === 'product' && i.sku === sku);
  const qty = idx >= 0 ? cart.items[idx].qty : 0;

  function dec() {
    if (idx < 0) return;
    if (qty <= 1) removeItem(idx);
    else updateQty(idx, qty - 1);
  }

  return (
    <article className={`funnel-product-card ${qty > 0 ? 'is-added' : ''}`}>
      <div className="funnel-product-thumb">
        <Image src={PRODUCT_IMAGE[sku]} alt={meta.name} width={72} height={72} />
      </div>
      <div className="funnel-product-info">
        <div className="funnel-product-name">{meta.shortName}</div>
        <div className="funnel-product-actives">{meta.actives}</div>
        <div className="funnel-product-price">PKR {meta.pricePkr.toLocaleString()}</div>
      </div>
      {qty === 0 ? (
        <button type="button" className="funnel-product-add" onClick={() => addProduct(sku)} aria-label={`Add ${meta.name}`}>
          <Plus className="h-4 w-4" /> Add
        </button>
      ) : (
        <div className="funnel-product-qty" aria-label={`${meta.name} quantity`}>
          <button type="button" onClick={dec} aria-label="Decrease">
            <Minus className="h-3.5 w-3.5" />
          </button>
          <span>{qty}</span>
          <button type="button" onClick={() => addProduct(sku)} aria-label="Increase">
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </article>
  );
}
