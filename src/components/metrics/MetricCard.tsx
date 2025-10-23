import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

type Metric = {
  id?: string;
  label: string;
  value: string;
  value_numeric?: number;
  type?: 'currency' | 'percent' | 'number' | 'text';
  unit?: string;
  change?: string | null;
  change_type?: 'increase' | 'decrease' | 'neutral' | null;
  priority?: number;
  subtitle?: string | null;
  sparkline?: number[];
};

import { Card, CardHeader, CardContent, CardDescription } from '@/components/ui/card';
import { formatMetricValue } from '../../lib/format';

export default function MetricCard({ metric }: { metric: Metric }) {
  const isIncrease = metric.change_type === 'increase';
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription className="text-xs">{metric.label}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold text-foreground">{formatMetricValue(metric)}</div>
            {metric.change ? (
              <div className={`text-xs flex items-center gap-1 mt-1 ${isIncrease ? 'text-green-600' : 'text-red-600'}`}>
                {isIncrease ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {metric.change}
              </div>
            ) : null}
            {metric.subtitle ? <div className="text-xs text-muted-foreground mt-1">{metric.subtitle}</div> : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
