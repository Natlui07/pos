import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Banknote, CreditCard, Ticket, FileText, Smartphone } from 'lucide-react';
import { toast } from 'sonner';

const iconOptions = [
  { value: 'Banknote', label: 'Efectivo', Icon: Banknote },
  { value: 'CreditCard', label: 'Tarjeta', Icon: CreditCard },
  { value: 'Ticket', label: 'Cupón', Icon: Ticket },
  { value: 'FileText', label: 'Documento', Icon: FileText },
  { value: 'Smartphone', label: 'NFC/Móvil', Icon: Smartphone },
];

const iconMap = { Banknote, CreditCard, Ticket, FileText, Smartphone };

export default function PaymentMethods() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name: '', type: 'otro', icon: 'Banknote', is_active: true });

  const { data: methods = [] } = useQuery({
    queryKey: ['paymentMethods'],
    queryFn: () => base44.entities.PaymentMethod.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.PaymentMethod.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['paymentMethods'] }); closeForm(); toast.success('Método creado'); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.PaymentMethod.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['paymentMethods'] }); closeForm(); toast.success('Método actualizado'); },
  });

  const closeForm = () => { setShowForm(false); setEditItem(null); setForm({ name: '', type: 'otro', icon: 'Banknote', is_active: true }); };

  const handleSave = () => {
    if (editItem) updateMutation.mutate({ id: editItem.id, data: form });
    else createMutation.mutate(form);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Métodos de Pago</h1>
          <p className="text-muted-foreground text-sm">Configuración de formas de pago</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" /> Nuevo Método
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Método</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {methods.map(m => {
                const Icon = iconMap[m.icon] || Banknote;
                return (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-primary" />
                        {m.name}
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="outline">{m.type?.replace(/_/g, ' ')}</Badge></TableCell>
                    <TableCell>
                      <Badge variant={m.is_active ? 'default' : 'secondary'}>{m.is_active ? 'Activo' : 'Inactivo'}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => {
                        setEditItem(m);
                        setForm({ name: m.name, type: m.type, icon: m.icon || 'Banknote', is_active: m.is_active });
                        setShowForm(true);
                      }}>
                        <Edit className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showForm} onOpenChange={closeForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editItem ? 'Editar Método' : 'Nuevo Método de Pago'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>Nombre</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div>
              <Label>Tipo</Label>
              <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="efectivo">Efectivo</SelectItem>
                  <SelectItem value="bancaria">Bancaria</SelectItem>
                  <SelectItem value="cupon">Cupón</SelectItem>
                  <SelectItem value="cuenta_por_cobrar">Cuenta por Cobrar</SelectItem>
                  <SelectItem value="nfc">NFC</SelectItem>
                  <SelectItem value="otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Ícono</Label>
              <div className="grid grid-cols-5 gap-2 mt-1">
                {iconOptions.map(opt => (
                  <button key={opt.value} onClick={() => setForm({ ...form, icon: opt.value })}
                    className={`p-3 rounded-lg border-2 flex flex-col items-center gap-1 transition-all ${form.icon === opt.value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'}`}>
                    <opt.Icon className="w-5 h-5" />
                    <span className="text-[10px]">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_active} onCheckedChange={v => setForm({ ...form, is_active: v })} />
              <Label>Activo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeForm}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!form.name}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}