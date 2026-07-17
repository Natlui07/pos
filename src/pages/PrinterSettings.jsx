import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Printer, Wifi, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function PrinterSettings() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name: '', ip_address: '', port: 9100, location: '', is_default: false, is_active: true });

  const { data: printers = [] } = useQuery({
    queryKey: ['printers'],
    queryFn: () => base44.entities.PrinterConfig.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.PrinterConfig.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['printers'] }); closeForm(); toast.success('Impresora añadida'); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.PrinterConfig.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['printers'] }); closeForm(); toast.success('Impresora actualizada'); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.PrinterConfig.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['printers'] }); toast.success('Impresora eliminada'); },
  });

  const closeForm = () => { setShowForm(false); setEditItem(null); setForm({ name: '', ip_address: '', port: 9100, location: '', is_default: false, is_active: true }); };

  const handleSave = () => {
    const data = { ...form, port: parseInt(form.port) || 9100 };
    if (editItem) updateMutation.mutate({ id: editItem.id, data });
    else createMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Impresoras</h1>
          <p className="text-muted-foreground text-sm">Configuración de impresoras de tickets por Ethernet</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" /> Nueva Impresora
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>IP</TableHead>
                <TableHead>Puerto</TableHead>
                <TableHead>Ubicación</TableHead>
                <TableHead>Predeterminada</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {printers.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Printer className="w-4 h-4 text-primary" />
                      {p.name}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{p.ip_address}</TableCell>
                  <TableCell>{p.port}</TableCell>
                  <TableCell>{p.location || '-'}</TableCell>
                  <TableCell>{p.is_default ? <Badge>Sí</Badge> : <span className="text-muted-foreground text-xs">No</span>}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Wifi className={`w-3 h-3 ${p.is_active ? 'text-green-500' : 'text-red-500'}`} />
                      <Badge variant={p.is_active ? 'default' : 'secondary'}>{p.is_active ? 'Activa' : 'Inactiva'}</Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => {
                        setEditItem(p);
                        setForm({ name: p.name, ip_address: p.ip_address, port: p.port || 9100, location: p.location || '', is_default: p.is_default || false, is_active: p.is_active !== false });
                        setShowForm(true);
                      }}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(p.id)} className="text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {printers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No hay impresoras configuradas
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showForm} onOpenChange={closeForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editItem ? 'Editar Impresora' : 'Nueva Impresora'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>Nombre</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Impresora Barra" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Dirección IP</Label><Input value={form.ip_address} onChange={e => setForm({ ...form, ip_address: e.target.value })} placeholder="192.168.1.100" /></div>
              <div><Label>Puerto</Label><Input type="number" value={form.port} onChange={e => setForm({ ...form, port: e.target.value })} /></div>
            </div>
            <div><Label>Ubicación</Label><Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Caja principal" /></div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch checked={form.is_default} onCheckedChange={v => setForm({ ...form, is_default: v })} />
                <Label>Predeterminada</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.is_active} onCheckedChange={v => setForm({ ...form, is_active: v })} />
                <Label>Activa</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeForm}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!form.name || !form.ip_address}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}