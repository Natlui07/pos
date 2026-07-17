import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Banknote, CreditCard, Ticket, FileText, Smartphone, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const iconMap = {
  'Banknote': Banknote,
  'CreditCard': CreditCard,
  'Ticket': Ticket,
  'FileText': FileText,
  'Smartphone': Smartphone,
};

export default function PaymentDialog({ open, onClose, total, paymentMethods, waiters, onConfirm }) {
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [selectedWaiter, setSelectedWaiter] = useState('');
  const [notes, setNotes] = useState('');
  const [amountReceived, setAmountReceived] = useState('');

  const change = selectedMethod?.type === 'efectivo' 
    ? Math.max(0, (parseFloat(amountReceived) || 0) - total) 
    : 0;

  const handleConfirm = () => {
    onConfirm({
      payment_method: selectedMethod?.name,
      payment_method_type: selectedMethod?.type,
      waiter_email: selectedWaiter,
      waiter_name: waiters.find(w => w.email === selectedWaiter)?.full_name || '',
      notes,
    });
    setSelectedMethod(null);
    setSelectedWaiter('');
    setNotes('');
    setAmountReceived('');
  };

  const canConfirm = selectedMethod && (
    selectedMethod.type !== 'efectivo' || (parseFloat(amountReceived) || 0) >= total
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">Procesar Pago</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Total */}
          <div className="text-center py-4 bg-primary/5 rounded-xl">
            <p className="text-sm text-muted-foreground">Total a Cobrar</p>
            <p className="text-4xl font-bold text-primary">${total.toFixed(2)}</p>
          </div>

          {/* Payment Methods */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Método de Pago</Label>
            <div className="grid grid-cols-2 gap-2">
              {paymentMethods.filter(m => m.is_active).map(method => {
                const Icon = iconMap[method.icon] || Banknote;
                const isSelected = selectedMethod?.id === method.id;
                return (
                  <button
                    key={method.id}
                    onClick={() => setSelectedMethod(method)}
                    className={cn(
                      "flex items-center gap-2 p-3 rounded-lg border-2 transition-all text-left",
                      isSelected
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border hover:border-primary/30"
                    )}
                  >
                    <Icon className={cn("w-5 h-5", isSelected ? "text-primary" : "text-muted-foreground")} />
                    <span className={cn("text-sm font-medium", isSelected && "text-primary")}>{method.name}</span>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-primary ml-auto" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cash amount */}
          {selectedMethod?.type === 'efectivo' && (
            <div className="space-y-2">
              <Label>Monto Recibido</Label>
              <Input
                type="number"
                value={amountReceived}
                onChange={(e) => setAmountReceived(e.target.value)}
                placeholder="0.00"
                className="text-lg"
              />
              {parseFloat(amountReceived) >= total && (
                <div className="text-right">
                  <span className="text-sm text-muted-foreground">Cambio: </span>
                  <span className="text-lg font-bold text-green-600">${change.toFixed(2)}</span>
                </div>
              )}
            </div>
          )}

          {/* Waiter */}
          {waiters.length > 0 && (
            <div className="space-y-2">
              <Label>Mesero (opcional)</Label>
              <Select value={selectedWaiter} onValueChange={setSelectedWaiter}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar mesero" />
                </SelectTrigger>
                <SelectContent>
                  {waiters.map(w => (
                    <SelectItem key={w.email} value={w.email}>{w.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notas (opcional)</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notas adicionales..." rows={2} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleConfirm} disabled={!canConfirm} className="bg-primary">
            <CheckCircle2 className="w-4 h-4 mr-2" /> Confirmar Pago
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}