import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useOutletContext } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, Eye, Printer } from 'lucide-react';
import { format } from 'date-fns';
import TicketPreview from '@/components/pos/TicketPreview';

export default function SalesHistory() {
  const { user } = useOutletContext();
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [viewSale, setViewSale] = useState(null);
  const [showTicket, setShowTicket] = useState(false);
  const [ticketSale, setTicketSale] = useState(null);

  const { data: sales = [] } = useQuery({
    queryKey: ['salesHistory'],
    queryFn: () => base44.entities.Sale.list('-created_date', 200),
  });

  const { data: ticketConfigs = [] } = useQuery({
    queryKey: ['ticketConfig'],
    queryFn: () => base44.entities.TicketConfig.list(),
  });

  const filtered = sales.filter(s => {
    const matchSearch = !search || s.folio?.toLowerCase().includes(search.toLowerCase()) || s.cashier_name?.toLowerCase().includes(search.toLowerCase());
    const matchDate = !dateFilter || s.created_date?.startsWith(dateFilter);
    const matchUser = user?.role === 'cajero' ? s.cashier_email === user.email : true;
    return matchSearch && matchDate && matchUser;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Historial de Ventas</h1>
        <p className="text-muted-foreground text-sm">Consulta todas las transacciones</p>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por folio o cajero..." className="pl-10" />
        </div>
        <Input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="w-40" />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Folio</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Cajero</TableHead>
                <TableHead>Mesero</TableHead>
                <TableHead>Pago</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(s => (
                <TableRow key={s.id}>
                  <TableCell className="font-mono text-xs">{s.folio}</TableCell>
                  <TableCell className="text-xs">{format(new Date(s.created_date), 'dd/MM/yy HH:mm')}</TableCell>
                  <TableCell className="text-sm">{s.cashier_name || '-'}</TableCell>
                  <TableCell className="text-sm">{s.waiter_name || '-'}</TableCell>
                  <TableCell className="text-sm">{s.payment_method || '-'}</TableCell>
                  <TableCell className="font-semibold">${s.total?.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant={s.status === 'completada' ? 'default' : s.status === 'cancelada' ? 'destructive' : 'secondary'}>
                      {s.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => setViewSale(s)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => { setTicketSale(s); setShowTicket(true); }}>
                        <Printer className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!viewSale} onOpenChange={() => setViewSale(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalle de Venta - {viewSale?.folio}</DialogTitle>
          </DialogHeader>
          {viewSale && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Cajero:</span> <span className="font-medium">{viewSale.cashier_name}</span></div>
                <div><span className="text-muted-foreground">Mesero:</span> <span className="font-medium">{viewSale.waiter_name || '-'}</span></div>
                <div><span className="text-muted-foreground">Pago:</span> <span className="font-medium">{viewSale.payment_method}</span></div>
                <div><span className="text-muted-foreground">Estado:</span> <Badge variant="outline">{viewSale.status}</Badge></div>
              </div>
              {viewSale.modification_reason && (
                <div className="bg-destructive/5 p-3 rounded-lg text-sm">
                  <span className="text-muted-foreground">Razón de modificación: </span>{viewSale.modification_reason}
                </div>
              )}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead>Cant</TableHead>
                    <TableHead>Precio</TableHead>
                    <TableHead>Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {viewSale.items?.map((item, i) => (
                    <TableRow key={i}>
                      <TableCell>{item.product_name}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>${item.unit_price?.toFixed(2)}</TableCell>
                      <TableCell className="font-semibold">${item.subtotal?.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="text-right space-y-1 text-sm">
                <p>Subtotal: <span className="font-semibold">${viewSale.subtotal?.toFixed(2)}</span></p>
                <p>IVA: <span className="font-semibold">${viewSale.tax?.toFixed(2)}</span></p>
                <p className="text-lg font-bold">Total: ${viewSale.total?.toFixed(2)}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <TicketPreview
        open={showTicket}
        onClose={() => setShowTicket(false)}
        sale={ticketSale}
        ticketConfig={ticketConfigs[0] || {}}
      />
    </div>
  );
}