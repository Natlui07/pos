import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Printer } from 'lucide-react';

export default function InventoryEditor({ open, onClose, warehouse, products, inventory, onSave }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!open) return;
    const initial = products.map(p => {
      const existing = inventory.find(i => i.product_id === p.id && i.warehouse_id === warehouse?.id);
      return {
        product_id: p.id,
        product_name: p.name,
        quantity: existing?.quantity ?? 0,
        unit_cost: existing?.unit_cost ?? p.price ?? 0,
      };
    });
    setItems(initial);
  }, [open, warehouse, products, inventory]);

  const update = (idx, field, value) => {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: parseFloat(value) || 0 } : item));
  };

  const handlePrint = () => {
    const win = window.open('', '_blank', 'width=400,height=600');
    const date = new Date().toLocaleString('es-MX');
    win.document.write(`
      <html><head><style>
        body { font-family: monospace; font-size: 12px; width: 300px; margin: 0 auto; }
        h2 { text-align: center; font-size: 14px; }
        table { width: 100%; border-collapse: collapse; }
        td, th { padding: 2px 4px; }
        th { border-bottom: 1px solid #000; }
        .total { border-top: 1px solid #000; font-weight: bold; }
      </style></head><body>
        <h2>INVENTARIO INICIAL</h2>
        <p style="text-align:center">${warehouse?.name}</p>
        <p style="text-align:center">${date}</p>
        <hr/>
        <table>
          <tr><th>Producto</th><th>Cant</th><th>Costo</th></tr>
          ${items.filter(i => i.quantity > 0).map(i => `
            <tr><td>${i.product_name}</td><td>${i.quantity}</td><td>$${i.unit_cost.toFixed(2)}</td></tr>
          `).join('')}
        </table>
        <hr/>
        <p style="text-align:center">Total productos: ${items.filter(i => i.quantity > 0).length}</p>
      </body></html>
    `);
    win.document.close();
    win.print();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Inventario Inicial — {warehouse?.name}</DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto flex-1">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-background">
              <tr className="border-b">
                <th className="text-left py-2">Producto</th>
                <th className="text-center py-2 w-28">Cantidad</th>
                <th className="text-center py-2 w-32">Costo Unit.</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={item.product_id} className="border-b hover:bg-muted/30">
                  <td className="py-2">{item.product_name}</td>
                  <td className="py-2 px-2">
                    <Input type="number" min="0" value={item.quantity} onChange={e => update(idx, 'quantity', e.target.value)} className="h-8 text-center" />
                  </td>
                  <td className="py-2 px-2">
                    <Input type="number" min="0" value={item.unit_cost} onChange={e => update(idx, 'unit_cost', e.target.value)} className="h-8 text-center" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-between pt-3 border-t">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" /> Imprimir
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={() => { onSave(items); onClose(); }}>Guardar Inventario</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}