import React from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function StatsCard({ title, value, icon: Icon, trend, className }) {
  return (
    <Card className={cn("p-5 relative overflow-hidden group hover:shadow-lg transition-all duration-300", className)}>
      <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -translate-y-8 translate-x-8 group-hover:scale-150 transition-transform duration-500" />
      <div className="flex items-start justify-between relative">
        <div>
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {trend && (
            <p className={cn("text-xs mt-1 font-medium", trend > 0 ? "text-green-600" : "text-red-500")}>
              {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% vs ayer
            </p>
          )}
        </div>
        {Icon && (
          <div className="p-2.5 rounded-xl bg-primary/10">
            <Icon className="w-5 h-5 text-primary" />
          </div>
        )}
      </div>
    </Card>
  );
}