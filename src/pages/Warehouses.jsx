import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Pencil, Package, ArrowLeftRight, Users, Warehouse } from 'lucide-react';
import { toast } from 'sonner';
import { useOutletContext } from 'react-router-dom';
import WarehouseForm from '@/components/warehouse/WarehouseForm';
import InventoryEditor from '@/components/warehouse/InventoryEditor';
import TransferDialog from '@/components/warehouse/TransferDialog';

export default function Warehouses() {
  const { user } = useOutletContext();
  const queryClient = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState(null);
  const [showInventory, setShowInventory] = useState(null);
  const [showTransfer, setShowTransfer] = useState(false);

  const { data: warehouses = [] } = useQuery({ queryKey: ['warehouses'], queryFn: () => base44.entities.Warehouse.list() });
  const { data: inventory = [] } = useQuery({ queryKey: ['warehouseInventory'], queryFn: () => base44.entities.WarehouseInventory.list() });
  const { data: transfers = [] } = useQuery({ queryKey: ['warehouseTransfers'], queryFn: () => base44.entities.WarehouseTransfer.list('-created_date') });
  const { data: products = [] } = useQuery({ queryKey: ['products'], queryFn: () => base44.entities.Product.list() });
  const { data: users = [] } = useQuery({ queryKey: ['users'], queryFn: () => base44.entities.User.list() });

  const createWarehouse = useMutation({
    mutationFn: (data) => base44.entities.Warehouse.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['warehouses'] }); toast.success('Almacén creado'); },
  });

  const updateWarehouse = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Warehouse.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['warehouses'] }); toast.success('Almacén actualizado'); },
  });

  const saveInventory = useMutation({
    mutationFn: async ({ warehouseId, items }) => {
      const existing = inventory.filter(i => i.warehouse_id === warehouseId);
      await Promise.all(items.map(async (item) => {
        const found = existing.find(e => e.product_id === item.product_id);
        const data = { warehouse_id: warehouseId, warehouse_name: showInventory?.name, ...item };
        if (found) {
          await base44.entities.WarehouseInventory.update(found.id, data);
        } else {
          await base44.entities.WarehouseInventory.create(data);
        }
      }));
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['warehouseInventory'] }); toast.success('Inventario guardado'); },
  });

  const createTransfer = useMutation({
    mutationFn: async ({ folio, fromId, fromName, toId, toName, items, notes }) => {
      await base44.entities.WarehouseTransfer.create({
        folio, from_warehouse_id: fromId, from_warehouse_name: fromName,
        to_warehouse_id: toId, to_warehouse_name: toName,
        items, notes, status: 'completado', created_by_name: user?.full_name || '',
      });
      // Update inventory
      for (const item of items) {
        const fromInv = inventory.find(i => i.warehouse_id === fromId && i.product_id === item.product_id);
        const toInv = inventory.find(i => i.warehouse_id === toId && i.product_id === item.product_id);
        if (fromInv) await base44.entities.WarehouseInventory.update(fromInv.id, { quantity: Math.max(0, fromInv.quantity - item.quantity) });
        if (toInv) {
          await base44.entities.WarehouseInventory.update(toInv.id, { quantity: toInv.quantity + item.quantity });
        } else {
          await base44.entities.WarehouseInventory.create({
            warehouse_id: toId, warehouse_name: toName,
            product_id: item.product_id, product_name: item.product_name,
            quantity: item.quantity, unit_cost: item.unit_cost,
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouseTransfers'] });
      queryClient.invalidateQueries({ queryKey: ['warehouseInventory'] });
      toast.success('Traspaso registrado');
    },
  });

  const handleSaveWarehouse = (data) => {
    if (editingWarehouse) {
      updateWarehouse.mutate({ id: editingWarehouse.id, data });
    } else {
      createWarehouse.mutate(data);
    }
    setEditingWarehouse(null);
  };

  const getWarehouseStock = (warehouseId) => inventory.filter(i => i.warehouse_id === warehouseId).reduce((s, i) => s + i.quantity, 0);
  const getAssignedNames = (emails = []) => emails.map(e => users.find(u => u.email === e)?.full_name || e).join(', ');

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Almacenes</h1>
          <p className="text-muted-foreground text-sm">Gestiona tus almacenes, inventarios y traspasos</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowTransfer(true)}>
            <ArrowLeftRight className="w-4 h-4 mr-2" /> Nuevo Traspaso
          </Button>
          <Button onClick={() => { setEditingWarehouse(null); setShowForm(true); }}>
            <Plus className="w-4 h-4 mr-2" /> Nuevo Almacén
          </Button>
        </div>
      </div>

      <Tabs defaultValue="warehouses">
        <TabsList className="mb-6">
          <TabsTrigger value="warehouses"><Warehouse className="w-4 h-4 mr-2" />Almacenes</TabsTrigger>
          <TabsTrigger value="transfers"><ArrowLeftRight className="w-4 h-4 mr-2" />Traspasos</TabsTrigger>
        </TabsList>

        <TabsContent value="warehouses">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {warehouses.map(w => (
              <Card key={w.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{w.name}</CardTitle>
                      {w.description && <p className="text-xs text-muted-foreground mt-1">{w.description}</p>}
                    </div>
                    <Badge variant={w.is_active !== false ? 'default' : 'secondary'}>
                      {w.is_active !== false ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Package className="w-4 h-4" />
                    <span>{getWarehouseStock(w.id)} unidades en stock</span>
                  </div>
                  {w.assigned_users?.length > 0 && (
                    <div className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Users className="w-4 h-4 mt-0.5 shrink-0" />
                      <span className="truncate">{getAssignedNames(w.assigned_users)}</span>
                    </div>
                  )}
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => setShowInventory(w)}>
                      <Package className="w-4 h-4 mr-1" /> Inventario
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => { setEditingWarehouse(w); setShowForm(true); }}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {warehouses.length === 0 && (
              <div className="col-span-3 text-center py-16 text-muted-foreground">
                <Warehouse className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No hay almacenes creados</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="transfers">
          <div className="space-y-3">
            {transfers.map(t => (
              <Card key={t.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-semibold">{t.folio}</span>
                      <Badge variant="outline">{t.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t.from_warehouse_name} → {t.to_warehouse_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t.items?.length} producto(s) • {t.created_by_name} • {new Date(t.created_date).toLocaleDateString('es-MX')}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => {
                    const win = window.open('', '_blank', 'width=400,height=600');
                    const date = new Date(t.created_date).toLocaleString('es-MX');
                    win.document.write(`<html><head><style>body{font-family:monospace;font-size:12px;width:300px;margin:0 auto;}h2{text-align:center;font-size:14px;}table{width:100%;border-collapse:collapse;}td,th{padding:2px 4px;}th{border-bottom:1px solid #000;}</style></head><body>
                      <h2>TRASPASO DE ALMACÉN</h2>
                      <p style="text-align:center">Folio: ${t.folio}</p>
                      <p style="text-align:center">${date}</p><hr/>
                      <p><b>Origen:</b> ${t.from_warehouse_name}</p>
                      <p><b>Destino:</b> ${t.to_warehouse_name}</p>
                      ${t.notes ? `<p><b>Notas:</b> ${t.notes}</p>` : ''}
                      <hr/><table><tr><th>Producto</th><th>Cant</th></tr>
                      ${t.items?.map(i => `<tr><td>${i.product_name}</td><td>${i.quantity}</td></tr>`).join('')}
                      </table><hr/>
                      <p style="text-align:center">Firma origen: ___________</p>
                      <p style="text-align:center">Firma destino: __________</p>
                    </body></html>`);
                    win.document.close(); win.print();
                  }}>
                    Reimprimir
                  </Button>
                </div>
              </Card>
            ))}
            {transfers.length === 0 && (
              <div className="text-center py-16 text-muted-foreground">
                <ArrowLeftRight className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No hay traspasos registrados</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <WarehouseForm
        open={showForm}
        onClose={() => { setShowForm(false); setEditingWarehouse(null); }}
        onSave={handleSaveWarehouse}
        warehouse={editingWarehouse}
        users={users}
      />

      {showInventory && (
        <InventoryEditor
          open={!!showInventory}
          onClose={() => setShowInventory(null)}
          warehouse={showInventory}
          products={products}
          inventory={inventory}
          onSave={(items) => saveInventory.mutate({ warehouseId: showInventory.id, items })}
        />
      )}

      <TransferDialog
        open={showTransfer}
        onClose={() => setShowTransfer(false)}
        warehouses={warehouses}
        inventory={inventory}
        onConfirm={(data) => createTransfer.mutate(data)}
      />
    </div>
  );
}