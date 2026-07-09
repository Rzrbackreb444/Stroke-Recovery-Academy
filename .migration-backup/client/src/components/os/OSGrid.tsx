import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface OSGridProps {
  children: ReactNode;
  className?: string;
  cols?: 1 | 2 | 3 | 4 | 5 | 6;
}

export function OSGrid({ children, className, cols = 3 }: OSGridProps) {
  const colsClass = {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
    5: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5",
    6: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6",
  };

  return (
    <div className={cn("grid gap-4", colsClass[cols], className)}>
      {children}
    </div>
  );
}

interface OSTileProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  iconColor?: string;
  children?: ReactNode;
  className?: string;
  onClick?: () => void;
  href?: string;
  badge?: string;
  badgeVariant?: "default" | "gold" | "orange" | "green";
}

export function OSTile({
  title,
  description,
  icon: Icon,
  iconColor = "text-primary",
  children,
  className,
  onClick,
  href,
  badge,
  badgeVariant = "default",
}: OSTileProps) {
  const badgeColors = {
    default: "bg-muted text-muted-foreground",
    gold: "bg-primary/20 text-primary",
    orange: "bg-accent/20 text-accent",
    green: "bg-green-500/20 text-green-400",
  };

  const content = (
    <div
      className={cn(
        "group relative bg-card border border-border rounded-lg p-4 hover-elevate transition-all duration-200",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      {badge && (
        <span
          className={cn(
            "absolute top-2 right-2 text-[10px] font-medium px-2 py-0.5 rounded-full",
            badgeColors[badgeVariant]
          )}
        >
          {badge}
        </span>
      )}
      <div className="flex items-start gap-3">
        {Icon && (
          <div className={cn("p-2 rounded-md bg-muted/50", iconColor)}>
            <Icon className="w-5 h-5" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
            {title}
          </h3>
          {description && (
            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
              {description}
            </p>
          )}
        </div>
      </div>
      {children && <div className="mt-3">{children}</div>}
    </div>
  );

  if (href) {
    return (
      <a href={href} className="block">
        {content}
      </a>
    );
  }

  return content;
}

interface OSCardProps {
  title?: string;
  description?: string;
  icon?: LucideIcon;
  iconColor?: string;
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
}

export function OSCard({
  title,
  description,
  icon: Icon,
  iconColor = "text-primary",
  children,
  className,
  noPadding = false,
}: OSCardProps) {
  return (
    <div
      className={cn(
        "bg-card border border-border rounded-lg overflow-hidden",
        className
      )}
    >
      {(title || Icon) && (
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          {Icon && (
            <div className={cn("p-1.5 rounded-md bg-muted/50", iconColor)}>
              <Icon className="w-4 h-4" />
            </div>
          )}
          <div>
            {title && <h3 className="font-semibold text-foreground">{title}</h3>}
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
        </div>
      )}
      <div className={cn(!noPadding && "p-4")}>{children}</div>
    </div>
  );
}

interface OSSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
}

export function OSSection({
  title,
  description,
  children,
  className,
  action,
}: OSSectionProps) {
  return (
    <section className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">{title}</h2>
          {description && (
            <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>
      {children}
    </section>
  );
}

interface OSStatProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  iconColor?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  className?: string;
}

export function OSStat({
  label,
  value,
  icon: Icon,
  iconColor = "text-primary",
  trend,
  trendValue,
  className,
}: OSStatProps) {
  const trendColors = {
    up: "text-green-400",
    down: "text-red-400",
    neutral: "text-muted-foreground",
  };

  return (
    <div
      className={cn(
        "bg-card border border-border rounded-lg p-4",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        {Icon && <Icon className={cn("w-4 h-4", iconColor)} />}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-bold text-foreground">{value}</span>
        {trend && trendValue && (
          <span className={cn("text-xs", trendColors[trend])}>{trendValue}</span>
        )}
      </div>
    </div>
  );
}

interface OSProgressProps {
  value: number;
  max?: number;
  label?: string;
  showPercentage?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "gold" | "green";
  className?: string;
}

export function OSProgress({
  value,
  max = 100,
  label,
  showPercentage = true,
  size = "md",
  variant = "default",
  className,
}: OSProgressProps) {
  const percentage = Math.round((value / max) * 100);
  
  const sizeClasses = {
    sm: "h-1.5",
    md: "h-2",
    lg: "h-3",
  };

  const variantClasses = {
    default: "bg-primary",
    gold: "bg-primary",
    green: "bg-green-500",
  };

  return (
    <div className={cn("space-y-1.5", className)}>
      {(label || showPercentage) && (
        <div className="flex items-center justify-between text-sm">
          {label && <span className="text-muted-foreground">{label}</span>}
          {showPercentage && (
            <span className="font-medium text-foreground">{percentage}%</span>
          )}
        </div>
      )}
      <div className={cn("w-full bg-muted rounded-full overflow-hidden", sizeClasses[size])}>
        <div
          className={cn("h-full transition-all duration-300", variantClasses[variant])}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
