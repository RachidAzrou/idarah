import { AlertTriangle, Info, CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface RuleWarningProps {
  type: 'warning' | 'error' | 'info' | 'success';
  title: string;
  warnings: string[];
  reasons?: string[];
  showOverride?: boolean;
  onOverride?: () => void;
  overrideLabel?: string;
  className?: string;
}

export function RuleWarning({
  type = 'warning',
  title,
  warnings,
  reasons = [],
  showOverride = false,
  onOverride,
  overrideLabel = 'Handmatig toekennen',
  className
}: RuleWarningProps) {
  const getIcon = () => {
    switch (type) {
      case 'error':
        return <AlertTriangle className="h-4 w-4" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />;
      case 'info':
        return <Info className="h-4 w-4" />;
      case 'success':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getVariant = () => {
    switch (type) {
      case 'error':
      case 'warning':
        return 'destructive';
      case 'success':
        return 'default';
      case 'info':
      default:
        return 'default';
    }
  };

  return (
    <Alert variant={getVariant()} className={cn("border-l-4", className)}>
      <div className="flex items-start gap-3">
        {getIcon()}
        <div className="flex-1 space-y-2">
          <h4 className="font-medium">{title}</h4>
          
          {warnings.length > 0 && (
            <div className="space-y-1">
              {warnings.map((warning, index) => (
                <AlertDescription key={index} className="text-sm">
                  {warning}
                </AlertDescription>
              ))}
            </div>
          )}

          {reasons.length > 0 && (
            <div className="mt-3 space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Reden:</p>
              {reasons.map((reason, index) => (
                <p key={index} className="text-xs text-muted-foreground">
                  • {reason}
                </p>
              ))}
            </div>
          )}

          {showOverride && onOverride && (
            <div className="mt-3">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onOverride}
                className="text-xs"
              >
                {overrideLabel}
              </Button>
            </div>
          )}
        </div>
      </div>
    </Alert>
  );
}