import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const categoryColors = {
  'Comida': 'bg-orange-500/10 text-orange-600 border-orange-200',
  'Bebidas': 'bg-blue-500/10 text-blue-600 border-blue-200',
  'Postres': 'bg-pink-500/10 text-pink-600 border-pink-200',
};

export default function ProductGrid({ products, onAddProduct, searchTerm, selectedCategory }) {
  const filtered = products.filter(p => {
    const matchesSearch = !searchTerm || p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = !selectedCategory || selectedCategory === 'Todos' || p.category === selectedCategory;
    return matchesSearch && matchesCat && p.is_active !== false;
  });

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {filtered.map(product => (
          <Card
            key={product.id}
            onClick={() => onAddProduct(product)}
            className="p-4 cursor-pointer hover:shadow-lg hover:border-primary/30 transition-all duration-200 active:scale-95 group"
          >
            <div className="flex flex-col h-full">
              {product.image_url ? (
                <img src={product.image_url} alt={product.name} className="w-full h-20 object-cover rounded-md mb-2" />
              ) : (
                <div className="w-full h-20 bg-gradient-to-br from-primary/10 to-accent/10 rounded-md mb-2 flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary/30">{product.name[0]}</span>
                </div>
              )}
              <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">{product.name}</p>
              <div className="flex items-center justify-between mt-auto pt-2">
                <span className="text-lg font-bold text-primary">${product.price?.toFixed(2)}</span>
                {product.category && (
                  <Badge variant="outline" className={cn("text-[10px]", categoryColors[product.category] || '')}>
                    {product.category}
                  </Badge>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
  );
}