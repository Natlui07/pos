import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, ShoppingCart, Users, Package, 
  CreditCard, Printer, Settings, Receipt, LogOut,
  ChevronLeft, ChevronRight, FileText, Warehouse
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';

const menuItems = {
  superadmin: [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/pos', label: 'Punto de Venta', icon: ShoppingCart },
    { path: '/users', label: 'Usuarios', icon: Users },
    { path: '/products', label: 'Productos', icon: Package },
    { path: '/payment-methods', label: 'Métodos de Pago', icon: CreditCard },
    { path: '/printers', label: 'Impresoras', icon: Printer },
    { path: '/ticket-config', label: 'Config. Tickets', icon: Receipt },
    { path: '/sales-history', label: 'Historial Ventas', icon: FileText },
    { path: '/warehouses', label: 'Almacenes', icon: Warehouse },
  ],
  admin: [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/pos', label: 'Punto de Venta', icon: ShoppingCart },
    { path: '/sales-history', label: 'Historial Ventas', icon: FileText },
    { path: '/warehouses', label: 'Almacenes', icon: Warehouse },
  ],
  gerente: [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/pos', label: 'Punto de Venta', icon: ShoppingCart },
    { path: '/products', label: 'Productos', icon: Package },
    { path: '/sales-history', label: 'Historial Ventas', icon: FileText },
    { path: '/warehouses', label: 'Almacenes', icon: Warehouse },
  ],
  mesero: [
    { path: '/pos', label: 'Punto de Venta', icon: ShoppingCart },
  ],
  cajero: [
    { path: '/pos', label: 'Punto de Venta', icon: ShoppingCart },
    { path: '/sales-history', label: 'Mis Ventas', icon: FileText },
  ],
};

export default function Sidebar({ user, collapsed, onToggle }) {
  const location = useLocation();
  const role = user?.role || 'mesero';
  const items = menuItems[role] || menuItems.mesero;

  return (
    <aside className={cn(
      "fixed left-0 top-0 h-screen bg-card border-r border-border flex flex-col z-40 transition-all duration-300",
      collapsed ? "w-16" : "w-60"
    )}>
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-border">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <ShoppingCart className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">POS</span>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center mx-auto">
            <ShoppingCart className="w-4 h-4 text-primary-foreground" />
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {items.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link key={item.path} to={item.path}>
              <div className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                isActive 
                  ? "bg-primary text-primary-foreground shadow-md" 
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}>
                <item.icon className="w-5 h-5 shrink-0" />
                {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User & Logout */}
      <div className="p-3 border-t border-border space-y-2">
        {!collapsed && (
          <div className="px-3 py-2">
            <p className="text-sm font-medium truncate">{user?.full_name || 'Usuario'}</p>
            <p className="text-xs text-muted-foreground capitalize">{role}</p>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
          onClick={() => base44.auth.logout()}
        >
          <LogOut className="w-4 h-4" />
          {!collapsed && 'Cerrar Sesión'}
        </Button>
      </div>

      {/* Toggle */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-card border border-border flex items-center justify-center hover:bg-secondary transition-colors"
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </aside>
  );
}