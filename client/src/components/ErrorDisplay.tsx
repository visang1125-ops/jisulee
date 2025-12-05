import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";

interface ErrorDisplayProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export default function ErrorDisplay({ 
  title = "오류가 발생했습니다", 
  message = "데이터를 불러오는 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.",
  onRetry,
  className 
}: ErrorDisplayProps) {
  return (
    <Card className={`shadow-lg ${className}`}>
      <CardContent className="pt-6">
        <Alert variant="destructive" role="alert" aria-live="assertive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{title}</AlertTitle>
          <AlertDescription className="mt-2">
            {message}
          </AlertDescription>
          {onRetry && (
            <div className="mt-4">
              <Button 
                onClick={onRetry} 
                variant="outline" 
                size="sm"
                className="gap-2 min-h-[44px]"
                aria-label="다시 시도"
              >
                <RefreshCw className="h-4 w-4" />
                다시 시도
              </Button>
            </div>
          )}
        </Alert>
      </CardContent>
    </Card>
  );
}





