import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Printer, Plus, Trash2 } from 'lucide-react';

export default function TransferDialog({ open, onClose, warehouses, inventory, onConfirm }) {
  const [fromId, setFromId] = useState('');
  const [toId, setToId] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([{ product_id: '', product_name: '', quantity: 1, unit_cost: 0 }]);

  const fromInventory = inventory.filter(i => i.warehouse_id === fromId && i.quantity > 0);

  const updateItem = (idx, field, value) => {
    setItems(prev => prev.map((item, i) => {
      if (i !== idx) return item;
      if (field === 'product_id') {
        const inv = fromInventory.find(x => x.product_id === value);
        return { ...item, product_id: value, product_name: inv?.product_name || '', unit_cost: inv?.unit_cost || 0 };
      }
      return { ...item, [field]: field === 'quantity' ? parseFloat(value) || 0 : value };
    }));
  };

  const addItem = () => setItems(prev => [...prev, { product_id: '', product_name: '', quantity: 1, unit_cost: 0 }]);
  const removeItem = (idx) => setItems(prev => prev.filter((_, i) => i !== idx));

  const handlePrint = (folio) => {
    const win = window.open('', '_blank', 'width=400,height=600');
    const fromName = warehouses.find(w => w.id === fromId)?.name || '';
    const toName = warehouses.find(w => w.id === toId)?.name || '';
    const date = new Date().toLocaleString('es-MX');
    win.document.write(`
      <html><head><style>
        body { font-family: monospace; font-size: 12px; width: 300px; margin: 0 auto; }
        h2 { text-align: center; font-size: 14px; }
        table { width: 100%; border-collapse: collapse; }
        td, th { padding: 2px 4px; }
        th { border-bottom: 1px solid #000; }
      </style></head><body>
        <h2>TRASPASO DE ALMACÉN</h2>
        <p style="text-align:center">Folio: ${folio}</p>
        <p style="text-align:center">${date}</p>
        <hr/>
        <p><b>Origen:</b> ${fromName}</p>
        <p><b>Destino:</b> ${toName}</p>
        ${notes ? `<p><b>Notas:</b> ${notes}</p>` : ''}
        <hr/>
        <table>
          <tr><th>Producto</th><th>Cant</th></tr>
          ${items.filter(i => i.product_id).map(i => `
            <tr><td>${i.product_name}</td><td>${i.quantity}</td></tr>
          `).join('')}
        </table>
        <hr/>
        <p style="text-align:center">Firma origen: ___________</p>
        <p style="text-align:center">Firma destino: __________</p>
      </body></html>
    `);
    win.document.close();
    win.print();
  };

  const handleConfirm = () => {
    const fromWarehouse = warehouses.find(w => w.id === fromId);
    const toWarehouse = warehouses.find(w => w.id === toId);
    const folio = `T-${Date.now()}`;
    const validItems = items.filter(i => i.product_id && i.quantity > 0);
    if (!validItems.length) return;
    onConfirm({ folio, fromId, fromName: fromWarehouse?.name, toId, toName: toWarehouse?.name, items: validItems, notes });
    handlePrint(folio);
    onClose();
    setFromId(''); setToId(''); setNotes('');
    setItems([{ product_id: '', product_name: '', quantity: 1, unit_cost: 0 }]);
  };

  const isValid = fromId && toId && fromId !== toId && items.some(i => i.product_id && i.quantity > 0);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Nuevo Traspaso entre Almacenes</DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto flex-1 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Almacén Origen *</Label>
              <Select value={fromId} onValueChange={setFromId}>
                <SelectTrigger><SelectValue placeholder="Seleccionar origen" /></SelectTrigger>
                <SelectContent>
                  {warehouses.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Almacén Destino *</Label>
              <Select value={toId} onValueChange={setToId}>
                <SelectTrigger><SelectValue placeholder="Seleccionar destino" /></SelectTrigger>
                <SelectContent>
                  {warehouses.filter(w => w.id !== fromId).map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Notas</Label>
            <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notas del traspaso..." />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Productos a traspasar</Label>
              <Button size="sm" variant="outline" onClick={addItem}>
                <Plus className="w-4 h-4 mr-1" /> Agregar
              </Button>
            </div>
            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <Select value={item.product_id} onValueChange={v => updateItem(idx, 'product_id', v)} disabled={!fromId}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Producto" />
                    </SelectTrigger>
                    <SelectContent>
                      {fromInventory.map(inv => (
                        <SelectItem key={inv.product_id} value={inv.product_id}>
                          {inv.product_name} (Stock: {inv.quantity})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number" min="1"
                    value={item.quantity}
                    onChange={e => updateItem(idx, 'quantity', e.target.value)}
                    className="w-24 text-center"
                    placeholder="Cant."
                  />
                  <Button size="icon" variant="ghost" onClick={() => removeItem(idx)} className="text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-3 border-t">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleConfirm} disabled={!isValid}>
            <Printer className="w-4 h-4 mr-2" /> Confirmar e Imprimir
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}