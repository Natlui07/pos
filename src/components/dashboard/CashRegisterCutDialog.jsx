import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Scissors, DollarSign, CreditCard, Wallet } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { toast } from 'sonner';

export default function CashRegisterCutDialog({ open, onClose, sales, user, dateFrom, dateTo }) {
  const [notes, setNotes] = useState('');
  const queryClient = useQueryClient();

  // Calculate cut totals from completed sales in the selected period
  const cutData = useMemo(() => {
    const completed = sales.filter(s => s.status === 'completada');

    let totalCash = 0;
    let totalCard = 0;
    let totalOther = 0;

    completed.forEach(s => {
      const type = s.payment_method_type || '';
      const amount = s.total || 0;
      if (type === 'efectivo') {
        totalCash += amount;
      } else if (type === 'bancaria') {
        totalCard += amount;
      } else {
        totalOther += amount;
      }
    });

    const totalSales = totalCash + totalCard + totalOther;

    return {
      totalSales,
      totalCash,
      totalCard,
      totalOther,
      saleCount: completed.length,
    };
  }, [sales]);

  const saveCutMutation = useMutation({
    mutationFn: (cutPayload) => base44.entities.CashRegisterCut.create(cutPayload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cashCuts'] });
      toast.success('Corte de caja registrado exitosamente');
      setNotes('');
      onClose();
    },
  });

  const handleConfirm = () => {
    saveCutMutation.mutate({
      cut_date: new Date().toISOString(),
      cashier_email: user?.email || '',
      cashier_name: user?.full_name || user?.email || '',
      total_sales: cutData.totalSales,
      total_cash: cutData.totalCash,
      total_card: cutData.totalCard,
      total_other: cutData.totalOther,
      sale_count: cutData.saleCount,
      notes,
    });
  };

  const statRows = [
    { label: 'Efectivo', Icon: DollarSign, value: cutData.totalCash, color: 'text-green-600' },
    { label: 'Tarjeta / Banco', Icon: CreditCard, value: cutData.totalCard, color: 'text-blue-600' },
    { label: 'Otros métodos', Icon: Wallet, value: cutData.totalOther, color: 'text-purple-600' },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scissors className="w-5 h-5 text-primary" />
            Corte de Caja
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Period */}
          <div className="text-sm text-muted-foreground text-center">
            Período: <span className="font-medium text-foreground">{dateFrom}</span> al <span className="font-medium text-foreground">{dateTo}</span>
          </div>

          {/* Total */}
          <div className="bg-primary/10 rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Total de Ventas</p>
            <p className="text-3xl font-bold text-primary">${cutData.totalSales.toFixed(2)}</p>
            <Badge variant="secondary" className="mt-2">{cutData.saleCount} transacciones</Badge>
          </div>

          {/* Breakdown */}
          <div className="space-y-2">
            {statRows.map(({ label, Icon, value, color }) => (
              <div key={label} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${color}`} />
                  <span className="text-sm font-medium">{label}</span>
                </div>
                <span className={`font-semibold ${color}`}>${value.toFixed(2)}</span>
              </div>
            ))}
          </div>

          {/* Cashier */}
          <div className="text-sm text-muted-foreground">
            Cajero: <span className="font-medium text-foreground">{user?.full_name || user?.email}</span>
          </div>

          {/* Notes */}
          <div>
            <Label>Notas (opcional)</Label>
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Observaciones del corte..."
              className="mt-1"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleConfirm} disabled={saveCutMutation.isPending}>
            {saveCutMutation.isPending ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Guardando...</>
            ) : (
              <><Scissors className="w-4 h-4 mr-2" />Registrar Corte</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}