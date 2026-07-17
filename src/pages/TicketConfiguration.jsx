import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function TicketConfiguration() {
  const queryClient = useQueryClient();
  const { data: configs = [] } = useQuery({
    queryKey: ['ticketConfig'],
    queryFn: () => base44.entities.TicketConfig.list(),
  });

  const config = configs[0];
  const [form, setForm] = useState({
    business_name: '', address: '', phone: '', rfc: '', footer_message: '',
    show_cashier: true, show_waiter: true, show_date: true, show_tax: true,
    custom_fields: [],
  });

  useEffect(() => {
    if (config) {
      setForm({
        business_name: config.business_name || '',
        address: config.address || '',
        phone: config.phone || '',
        rfc: config.rfc || '',
        footer_message: config.footer_message || '',
        show_cashier: config.show_cashier !== false,
        show_waiter: config.show_waiter !== false,
        show_date: config.show_date !== false,
        show_tax: config.show_tax !== false,
        custom_fields: config.custom_fields || [],
      });
    }
  }, [config]);

  const saveMutation = useMutation({
    mutationFn: (data) => config
      ? base44.entities.TicketConfig.update(config.id, data)
      : base44.entities.TicketConfig.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['ticketConfig'] }); toast.success('Configuración guardada'); },
  });

  const addCustomField = () => setForm({ ...form, custom_fields: [...form.custom_fields, { label: '', value: '' }] });
  const removeCustomField = (i) => setForm({ ...form, custom_fields: form.custom_fields.filter((_, idx) => idx !== i) });
  const updateCustomField = (i, key, val) => {
    const fields = [...form.custom_fields];
    fields[i] = { ...fields[i], [key]: val };
    setForm({ ...form, custom_fields: fields });
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Configuración de Tickets</h1>
        <p className="text-muted-foreground text-sm">Personaliza los datos que aparecen en tus tickets de 80mm</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Datos del Negocio</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><Label>Nombre del Negocio *</Label><Input value={form.business_name} onChange={e => setForm({ ...form, business_name: e.target.value })} /></div>
          <div><Label>Dirección</Label><Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Teléfono</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
            <div><Label>RFC</Label><Input value={form.rfc} onChange={e => setForm({ ...form, rfc: e.target.value })} /></div>
          </div>
          <div><Label>Mensaje al Pie</Label><Input value={form.footer_message} onChange={e => setForm({ ...form, footer_message: e.target.value })} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Campos Visibles</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {[
            { key: 'show_cashier', label: 'Mostrar Cajero' },
            { key: 'show_waiter', label: 'Mostrar Mesero' },
            { key: 'show_date', label: 'Mostrar Fecha y Hora' },
            { key: 'show_tax', label: 'Mostrar IVA' },
          ].map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between py-1">
              <Label>{label}</Label>
              <Switch checked={form[key]} onCheckedChange={v => setForm({ ...form, [key]: v })} />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Campos Personalizados</CardTitle>
          <Button variant="outline" size="sm" onClick={addCustomField}>
            <Plus className="w-3 h-3 mr-1" /> Agregar
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {form.custom_fields.map((f, i) => (
            <div key={i} className="flex gap-2 items-end">
              <div className="flex-1">
                <Label className="text-xs">Etiqueta</Label>
                <Input value={f.label} onChange={e => updateCustomField(i, 'label', e.target.value)} placeholder="Ej: Mesa" />
              </div>
              <div className="flex-1">
                <Label className="text-xs">Valor</Label>
                <Input value={f.value} onChange={e => updateCustomField(i, 'value', e.target.value)} placeholder="Ej: 5" />
              </div>
              <Button variant="ghost" size="icon" onClick={() => removeCustomField(i)} className="text-destructive shrink-0">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
          {form.custom_fields.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No hay campos personalizados</p>
          )}
        </CardContent>
      </Card>

      <Button onClick={() => saveMutation.mutate(form)} className="w-full" disabled={!form.business_name}>
        <Save className="w-4 h-4 mr-2" /> Guardar Configuración
      </Button>
    </div>
  );
}