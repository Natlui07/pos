import React from 'react';
import { Button } from '@/components/ui/button';
import { Minus, Plus, Trash2, ShoppingCart } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function CartPanel({ cart, onUpdateQty, onRemove, onClear, subtotal, tax, total }) {
  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-12">
        <ShoppingCart className="w-16 h-16 mb-4 opacity-20" />
        <p className="text-sm">Carrito vacío</p>
        <p className="text-xs mt-1">Selecciona productos para comenzar</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm">Carrito ({cart.length})</h3>
        <Button variant="ghost" size="sm" onClick={onClear} className="text-destructive text-xs h-7">
          <Trash2 className="w-3 h-3 mr-1" /> Limpiar
        </Button>
      </div>

      <ScrollArea className="flex-1 -mx-1 px-1">
        <div className="space-y-2">
          {cart.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2 bg-secondary/50 rounded-lg p-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.product_name}</p>
                <p className="text-xs text-muted-foreground">${item.unit_price.toFixed(2)} c/u</p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onUpdateQty(idx, item.quantity - 1)}
                  className="w-6 h-6 rounded-md bg-background border flex items-center justify-center hover:bg-destructive/10 transition-colors"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                <button
                  onClick={() => onUpdateQty(idx, item.quantity + 1)}
                  className="w-6 h-6 rounded-md bg-background border flex items-center justify-center hover:bg-primary/10 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
              <p className="text-sm font-bold w-16 text-right">${item.subtotal.toFixed(2)}</p>
              <button onClick={() => onRemove(idx)} className="text-destructive/50 hover:text-destructive transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="border-t pt-3 mt-3 space-y-1.5">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">IVA (16%)</span>
          <span>${tax.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-lg font-bold pt-1 border-t">
          <span>Total</span>
          <span className="text-primary">${total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}