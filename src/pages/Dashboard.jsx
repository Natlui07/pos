import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useOutletContext } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { DollarSign, ShoppingCart, Users, TrendingUp, Calendar, Edit, Mail, Loader2, Scissors } from 'lucide-react';
import { format, startOfDay, endOfDay, parseISO, isWithinInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import StatsCard from '@/components/dashboard/StatsCard';
import CashRegisterCutDialog from '@/components/dashboard/CashRegisterCutDialog';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const COLORS = ['hsl(243,75%,59%)', 'hsl(262,83%,58%)', 'hsl(173,58%,39%)', 'hsl(43,74%,66%)', 'hsl(27,87%,67%)'];

export default function Dashboard() {
  const { user } = useOutletContext();
  const queryClient = useQueryClient();
  const isSuperAdmin = user?.role === 'superadmin';
  const [dateFrom, setDateFrom] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [editSale, setEditSale] = useState(null);
  const [editReason, setEditReason] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [showCashCut, setShowCashCut] = useState(false);

  const { data: sales = [] } = useQuery({
    queryKey: ['allSales'],
    queryFn: () => base44.entities.Sale.list('-created_date', 500),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
  });

  const filteredSales = useMemo(() => {
    return sales.filter(s => {
      const saleDate = new Date(s.created_date);
      const from = startOfDay(new Date(dateFrom));
      const to = endOfDay(new Date(dateTo));
      return isWithinInterval(saleDate, { start: from, end: to });
    });
  }, [sales, dateFrom, dateTo]);

  const completedSales = filteredSales.filter(s => s.status === 'completada');
  const totalSales = completedSales.reduce((s, sale) => s + (sale.total || 0), 0);
  const totalTransactions = completedSales.length;
  const avgTicket = totalTransactions > 0 ? totalSales / totalTransactions : 0;

  // Sales by waiter
  const salesByWaiter = useMemo(() => {
    const map = {};
    completedSales.forEach(s => {
      const name = s.waiter_name || 'Sin mesero';
      map[name] = (map[name] || 0) + (s.total || 0);
    });
    return Object.entries(map).map(([name, total]) => ({ name, total })).sort((a, b) => b.total - a.total);
  }, [completedSales]);

  // Sales by cashier
  const salesByCashier = useMemo(() => {
    const map = {};
    completedSales.forEach(s => {
      const name = s.cashier_name || 'Sin cajero';
      map[name] = (map[name] || 0) + (s.total || 0);
    });
    return Object.entries(map).map(([name, total]) => ({ name, total })).sort((a, b) => b.total - a.total);
  }, [completedSales]);

  // Sales by payment method
  const salesByPayment = useMemo(() => {
    const map = {};
    completedSales.forEach(s => {
      const method = s.payment_method || 'Otro';
      map[method] = (map[method] || 0) + (s.total || 0);
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [completedSales]);

  // Sales by product
  const salesByProduct = useMemo(() => {
    const map = {};
    completedSales.forEach(s => {
      s.items?.forEach(item => {
        map[item.product_name] = (map[item.product_name] || 0) + item.quantity;
      });
    });
    return Object.entries(map).map(([name, qty]) => ({ name, qty })).sort((a, b) => b.qty - a.qty).slice(0, 10);
  }, [completedSales]);

  const updateSaleMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Sale.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allSales'] });
      setEditSale(null);
      toast.success('Venta actualizada');
    },
  });

  const handleEditSale = () => {
    updateSaleMutation.mutate({
      id: editSale.id,
      data: { status: editStatus, modification_reason: editReason },
    });
  };

  const handleSendReport = async () => {
    setSendingEmail(true);
    const reportBody = `
      <h2>Reporte de Ventas - ${format(new Date(dateFrom), 'dd/MM/yyyy')} a ${format(new Date(dateTo), 'dd/MM/yyyy')}</h2>
      <p><strong>Total de Ventas:</strong> $${totalSales.toFixed(2)}</p>
      <p><strong>Transacciones:</strong> ${totalTransactions}</p>
      <p><strong>Ticket Promedio:</strong> $${avgTicket.toFixed(2)}</p>
      <h3>Top Productos:</h3>
      <ul>${salesByProduct.map(p => `<li>${p.name}: ${p.qty} unidades</li>`).join('')}</ul>
      <h3>Ventas por Mesero:</h3>
      <ul>${salesByWaiter.map(w => `<li>${w.name}: $${w.total.toFixed(2)}</li>`).join('')}</ul>
    `;
    await base44.integrations.Core.SendEmail({
      to: user?.email,
      subject: `Reporte de Ventas - ${format(new Date(), 'dd/MM/yyyy')}`,
      body: reportBody,
    });
    setSendingEmail(false);
    toast.success('Reporte enviado a tu correo');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            {isSuperAdmin ? 'Panel de Superadministrador' : 'Panel de Reportes'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-36 h-9" />
            <span className="text-muted-foreground text-sm">a</span>
            <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-36 h-9" />
          </div>
          <Button variant="outline" size="sm" onClick={handleSendReport} disabled={sendingEmail}>
            {sendingEmail ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Mail className="w-4 h-4 mr-1" />}
            Enviar Reporte
          </Button>
          <Button size="sm" onClick={() => setShowCashCut(true)}>
            <Scissors className="w-4 h-4 mr-1" />
            Corte de Caja
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Ventas Totales" value={`$${totalSales.toFixed(2)}`} icon={DollarSign} />
        <StatsCard title="Transacciones" value={totalTransactions} icon={ShoppingCart} />
        <StatsCard title="Ticket Promedio" value={`$${avgTicket.toFixed(2)}`} icon={TrendingUp} />
        <StatsCard title="Meseros Activos" value={users.filter(u => u.role === 'mesero').length} icon={Users} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Products chart */}
        <Card>
          <CardHeader><CardTitle className="text-base">Top Productos</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={salesByProduct}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="qty" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Cantidad" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Payment methods pie */}
        <Card>
          <CardHeader><CardTitle className="text-base">Métodos de Pago</CardTitle></CardHeader>
          <CardContent className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={salesByPayment} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {salesByPayment.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => `$${v.toFixed(2)}`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Waiter sales */}
        <Card>
          <CardHeader><CardTitle className="text-base">Ventas por Mesero</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={salesByWaiter} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => `$${v}`} />
                <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 11 }} />
                <Tooltip formatter={v => `$${v.toFixed(2)}`} />
                <Bar dataKey="total" fill="hsl(var(--accent))" radius={[0, 4, 4, 0]} name="Total" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Cashier sales */}
        <Card>
          <CardHeader><CardTitle className="text-base">Ventas por Cajero</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={salesByCashier} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => `$${v}`} />
                <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 11 }} />
                <Tooltip formatter={v => `$${v.toFixed(2)}`} />
                <Bar dataKey="total" fill="hsl(var(--chart-3))" radius={[0, 4, 4, 0]} name="Total" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Sales table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Detalle de Ventas</CardTitle>
          <Badge variant="secondary">{filteredSales.length} ventas</Badge>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Folio</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Cajero</TableHead>
                  <TableHead>Mesero</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Estado</TableHead>
                  {isSuperAdmin && <TableHead>Acciones</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSales.slice(0, 50).map(sale => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-mono text-xs">{sale.folio}</TableCell>
                    <TableCell className="text-xs">{format(new Date(sale.created_date), 'dd/MM/yy HH:mm')}</TableCell>
                    <TableCell className="text-sm">{sale.cashier_name || '-'}</TableCell>
                    <TableCell className="text-sm">{sale.waiter_name || '-'}</TableCell>
                    <TableCell className="text-sm">{sale.payment_method || '-'}</TableCell>
                    <TableCell className="font-semibold">${sale.total?.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={sale.status === 'completada' ? 'default' : sale.status === 'cancelada' ? 'destructive' : 'secondary'}>
                        {sale.status}
                      </Badge>
                    </TableCell>
                    {isSuperAdmin && (
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => { setEditSale(sale); setEditStatus(sale.status); setEditReason(sale.modification_reason || ''); }}>
                          <Edit className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Cash Register Cut Dialog */}
      <CashRegisterCutDialog
        open={showCashCut}
        onClose={() => setShowCashCut(false)}
        sales={filteredSales}
        user={user}
        dateFrom={dateFrom}
        dateTo={dateTo}
      />

      {/* Edit Sale Dialog */}
      <Dialog open={!!editSale} onOpenChange={() => setEditSale(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modificar Venta - {editSale?.folio}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Estado</Label>
              <Select value={editStatus} onValueChange={setEditStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="completada">Completada</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                  <SelectItem value="modificada">Modificada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Razón de Modificación</Label>
              <Textarea value={editReason} onChange={e => setEditReason(e.target.value)} placeholder="Describa la razón..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditSale(null)}>Cancelar</Button>
            <Button onClick={handleEditSale}>Guardar Cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}