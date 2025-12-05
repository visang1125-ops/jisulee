import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  colorScheme?: "blue" | "green" | "orange" | "purple";
  tooltip?: string;
}

export default function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend = "neutral",
  trendValue,
  colorScheme = "blue",
  tooltip,
}: KPICardProps) {
  const colorClasses = {
    blue: "bg-gradient-to-br from-blue-500 to-blue-600 shadow-blue-500/25",
    green: "bg-gradient-to-br from-green-500 to-green-600 shadow-green-500/25",
    orange: "bg-gradient-to-br from-orange-500 to-orange-600 shadow-orange-500/25",
    purple: "bg-gradient-to-br from-purple-500 to-purple-600 shadow-purple-500/25",
  };

  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColorClass = trend === "up" ? "text-green-600 dark:text-green-400" : trend === "down" ? "text-red-600 dark:text-red-400" : "text-muted-foreground";

  const cardContent = (
    <Card className="overflow-visible shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group" data-testid={`card-kpi-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={`p-2.5 rounded-lg ${colorClasses[colorScheme]} shadow-lg`}>
          <Icon className="h-4 w-4 text-white" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl sm:text-3xl font-bold font-mono tracking-tight" data-testid={`text-kpi-value-${title.toLowerCase().replace(/\s+/g, '-')}`}>
          {value}
        </div>
        {(subtitle || trendValue) && (
          <div className="flex flex-wrap items-center gap-2 mt-2 text-xs sm:text-sm">
            {trendValue && (
              <div className={`flex items-center gap-1 ${trendColorClass} font-medium`}>
                <TrendIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>{trendValue}</span>
              </div>
            )}
            {subtitle && (
              <p className="text-muted-foreground whitespace-pre-line">{subtitle}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (tooltip) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {cardContent}
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="text-sm whitespace-pre-line" style={{ wordBreak: "keep-all" }}>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return cardContent;
}
