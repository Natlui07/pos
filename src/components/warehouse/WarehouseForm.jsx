import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

export default function WarehouseForm({ open, onClose, onSave, warehouse, users }) {
  const [form, setForm] = useState({
    name: warehouse?.name || '',
    description: warehouse?.description || '',
    assigned_users: warehouse?.assigned_users || [],
    is_active: warehouse?.is_active !== false,
  });

  const toggleUser = (email) => {
    setForm(f => ({
      ...f,
      assigned_users: f.assigned_users.includes(email)
        ? f.assigned_users.filter(e => e !== email)
        : [...f.assigned_users, email],
    }));
  };

  const handleSave = () => {
    if (!form.name.trim()) return;
    onSave(form);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{warehouse ? 'Editar Almacén' : 'Nuevo Almacén'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Nombre *</Label>
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ej: Almacén Principal" />
          </div>
          <div>
            <Label>Descripción</Label>
            <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Descripción opcional" />
          </div>
          <div>
            <Label className="mb-2 block">Personas asignadas</Label>
            <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-3">
              {users.length === 0 && <p className="text-sm text-muted-foreground">No hay usuarios disponibles</p>}
              {users.map(u => (
                <div key={u.id} className="flex items-center gap-2">
                  <Checkbox
                    checked={form.assigned_users.includes(u.email)}
                    onCheckedChange={() => toggleUser(u.email)}
                  />
                  <span className="text-sm">{u.full_name} <span className="text-muted-foreground">({u.email})</span></span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!form.name.trim()}>Guardar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}