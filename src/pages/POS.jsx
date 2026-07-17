import React, { useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Search, ShoppingCart, Nfc } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { toast } from 'sonner';
import ProductGrid from '@/components/pos/ProductGrid';
import CartPanel from '@/components/pos/CartPanel';
import PaymentDialog from '@/components/pos/PaymentDialog';
import TicketPreview from '@/components/pos/TicketPreview';

export default function POS() {
  const { user } = useOutletContext();
  const queryClient = useQueryClient();
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [showPayment, setShowPayment] = useState(false);
  const [showTicket, setShowTicket] = useState(false);
  const [lastSale, setLastSale] = useState(null);
  const [nfcInput, setNfcInput] = useState('');

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list(),
  });

  const { data: paymentMethods = [] } = useQuery({
    queryKey: ['paymentMethods'],
    queryFn: () => base44.entities.PaymentMethod.list(),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: ticketConfigs = [] } = useQuery({
    queryKey: ['ticketConfig'],
    queryFn: () => base44.entities.TicketConfig.list(),
  });

  const { data: salesCount = [] } = useQuery({
    queryKey: ['salesCount'],
    queryFn: () => base44.entities.Sale.list('-created_date', 1),
  });

  const waiters = users.filter(u => u.role === 'mesero');
  const ticketConfig = ticketConfigs[0] || {};

  const addProduct = useCallback((product) => {
    setCart(prev => {
      const existing = prev.findIndex(i => i.product_id === product.id);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing].quantity += 1;
        updated[existing].subtotal = updated[existing].quantity * updated[existing].unit_price;
        return updated;
      }
      return [...prev, {
        product_id: product.id,
        product_name: product.name,
        quantity: 1,
        unit_price: product.price,
        subtotal: product.price,
      }];
    });
  }, []);

  const updateQty = (idx, qty) => {
    if (qty <= 0) {
      setCart(prev => prev.filter((_, i) => i !== idx));
    } else {
      setCart(prev => {
        const updated = [...prev];
        updated[idx].quantity = qty;
        updated[idx].subtotal = qty * updated[idx].unit_price;
        return updated;
      });
    }
  };

  const removeItem = (idx) => setCart(prev => prev.filter((_, i) => i !== idx));

  const subtotal = cart.reduce((s, i) => s + i.subtotal, 0);
  const tax = subtotal * 0.16;
  const total = subtotal + tax;

  const generateFolio = () => {
    const date = new Date();
    const num = String(Math.floor(Math.random() * 9999)).padStart(4, '0');
    return `F-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}-${num}`;
  };

  const createSaleMutation = useMutation({
    mutationFn: (saleData) => base44.entities.Sale.create(saleData),
    onSuccess: (sale) => {
      setLastSale(sale);
      setShowPayment(false);
      setShowTicket(true);
      setCart([]);
      queryClient.invalidateQueries({ queryKey: ['salesCount'] });
      toast.success('Venta registrada exitosamente');
    },
  });

  const handleConfirmPayment = (paymentInfo) => {
    const saleData = {
      folio: generateFolio(),
      items: cart,
      subtotal,
      tax,
      total,
      payment_method: paymentInfo.payment_method,
      payment_method_type: paymentInfo.payment_method_type,
      cashier_email: user?.email || '',
      cashier_name: user?.full_name || '',
      waiter_email: paymentInfo.waiter_email,
      waiter_name: paymentInfo.waiter_name,
      status: 'completada',
      notes: paymentInfo.notes,
    };
    createSaleMutation.mutate(saleData);
  };

  // NFC simulation
  const handleNfcScan = () => {
    if (!nfcInput.trim()) return;
    const found = users.find(u => u.nfc_card_id === nfcInput.trim());
    if (found) {
      toast.success(`Identificado: ${found.full_name} (${found.role})`);
    } else {
      toast.error('Tarjeta NFC no reconocida');
    }
    setNfcInput('');
  };

  return (
    <div className="flex gap-6 h-[calc(100vh-5rem)]">
      {/* Left: Products */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Category navbar - top */}
        <div
          className="flex gap-2 overflow-x-auto pb-2 mb-3"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {['Todos', ...new Set(products.map(p => p.category).filter(Boolean))].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 transition-all ${
                selectedCategory === cat
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar producto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="relative w-48">
            <Nfc className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Escanear NFC..."
              value={nfcInput}
              onChange={(e) => setNfcInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleNfcScan()}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <ProductGrid
            products={products}
            onAddProduct={addProduct}
            searchTerm={searchTerm}
            selectedCategory={selectedCategory}
          />
        </div>
      </div>

      {/* Right: Cart */}
      <Card className="w-80 lg:w-96 p-4 flex flex-col shrink-0">
        <CartPanel
          cart={cart}
          onUpdateQty={updateQty}
          onRemove={removeItem}
          onClear={() => setCart([])}
          subtotal={subtotal}
          tax={tax}
          total={total}
        />
        {cart.length > 0 && (
          <Button
            className="mt-4 h-12 text-base"
            onClick={() => setShowPayment(true)}
          >
            <ShoppingCart className="w-5 h-5 mr-2" />
            Cobrar ${total.toFixed(2)}
          </Button>
        )}
      </Card>

      <PaymentDialog
        open={showPayment}
        onClose={() => setShowPayment(false)}
        total={total}
        paymentMethods={paymentMethods}
        waiters={waiters}
        onConfirm={handleConfirmPayment}
      />

      <TicketPreview
        open={showTicket}
        onClose={() => setShowTicket(false)}
        sale={lastSale}
        ticketConfig={ticketConfig}
      />
    </div>
  );
}