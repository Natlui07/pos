import React, { useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function TicketPreview({ open, onClose, sale, ticketConfig }) {
  const ticketRef = useRef(null);

  const handlePrint = () => {
    const content = ticketRef.current;
    if (!content) return;
    const printWindow = window.open('', '_blank', 'width=300,height=600');
    printWindow.document.write(`
      <html>
      <head><title>Ticket ${sale?.folio}</title>
      <style>
        body { font-family: 'Courier New', monospace; font-size: 12px; width: 72mm; margin: 4mm; padding: 0; color: #000; }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .line { border-top: 1px dashed #000; margin: 6px 0; }
        .flex-row { display: flex; justify-content: space-between; }
        .small { font-size: 10px; }
        h2 { font-size: 16px; margin: 4px 0; }
        p { margin: 2px 0; }
      </style></head>
      <body>${content.innerHTML}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  if (!sale) return null;

  const config = ticketConfig || {};

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Vista Previa del Ticket</DialogTitle>
        </DialogHeader>

        <div className="bg-white text-black p-4 rounded-lg border-2 border-dashed max-h-[70vh] overflow-y-auto">
          <div ref={ticketRef}>
            {/* Header */}
            <div className="center" style={{ textAlign: 'center' }}>
              {config.logo_url && <img src={config.logo_url} alt="Logo" style={{ width: '80px', margin: '0 auto' }} />}
              <h2 style={{ fontWeight: 'bold', fontSize: '16px', margin: '4px 0' }}>{config.business_name || 'Mi Negocio'}</h2>
              {config.address && <p style={{ fontSize: '10px', margin: '2px 0' }}>{config.address}</p>}
              {config.phone && <p style={{ fontSize: '10px', margin: '2px 0' }}>Tel: {config.phone}</p>}
              {config.rfc && <p style={{ fontSize: '10px', margin: '2px 0' }}>RFC: {config.rfc}</p>}
            </div>

            <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />

            {/* Sale Info */}
            <div style={{ fontSize: '11px' }}>
              <p><strong>Folio:</strong> {sale.folio}</p>
              {config.show_date !== false && (
                <p><strong>Fecha:</strong> {format(new Date(sale.created_date), "dd/MM/yyyy HH:mm", { locale: es })}</p>
              )}
              {config.show_cashier !== false && sale.cashier_name && (
                <p><strong>Cajero:</strong> {sale.cashier_name}</p>
              )}
              {config.show_waiter !== false && sale.waiter_name && (
                <p><strong>Mesero:</strong> {sale.waiter_name}</p>
              )}
              <p><strong>Pago:</strong> {sale.payment_method}</p>
            </div>

            <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />

            {/* Items */}
            <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #000' }}>
                  <th style={{ textAlign: 'left' }}>Producto</th>
                  <th style={{ textAlign: 'center' }}>Cant</th>
                  <th style={{ textAlign: 'right' }}>Precio</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {sale.items?.map((item, i) => (
                  <tr key={i}>
                    <td style={{ textAlign: 'left', maxWidth: '100px', overflow: 'hidden' }}>{item.product_name}</td>
                    <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                    <td style={{ textAlign: 'right' }}>${item.unit_price?.toFixed(2)}</td>
                    <td style={{ textAlign: 'right' }}>${item.subtotal?.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />

            {/* Totals */}
            <div style={{ fontSize: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Subtotal:</span><span>${sale.subtotal?.toFixed(2)}</span>
              </div>
              {config.show_tax !== false && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>IVA (16%):</span><span>${sale.tax?.toFixed(2)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '14px', marginTop: '4px' }}>
                <span>TOTAL:</span><span>${sale.total?.toFixed(2)}</span>
              </div>
            </div>

            {/* Custom Fields */}
            {config.custom_fields?.length > 0 && (
              <>
                <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />
                {config.custom_fields.map((f, i) => (
                  <p key={i} style={{ fontSize: '10px' }}><strong>{f.label}:</strong> {f.value}</p>
                ))}
              </>
            )}

            {/* Footer */}
            <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />
            <p style={{ textAlign: 'center', fontSize: '10px' }}>{config.footer_message || '¡Gracias por su compra!'}</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cerrar</Button>
          <Button onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" /> Imprimir Ticket
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}