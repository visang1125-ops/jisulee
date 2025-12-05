import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 에러 로깅 (실제 환경에서는 에러 리포팅 서비스로 전송)
    // 에러는 항상 로그 (프로덕션에서도 필요)
    console.error("[ErrorBoundary] Caught an error:", error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
          <Card className="w-full max-w-2xl">
            <CardContent className="pt-6">
              <Alert variant="destructive" role="alert">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle className="text-lg font-semibold mb-2">
                  예상치 못한 오류가 발생했습니다
                </AlertTitle>
                <AlertDescription className="space-y-4">
                  <p>
                    애플리케이션에서 예상치 못한 오류가 발생했습니다. 
                    페이지를 새로고침하거나 잠시 후 다시 시도해주세요.
                  </p>
                  {process.env.NODE_ENV === "development" && this.state.error && (
                    <details className="mt-4 p-3 bg-destructive/10 rounded-md text-xs font-mono overflow-auto max-h-48">
                      <summary className="cursor-pointer font-sans font-medium mb-2">
                        에러 상세 정보 (개발 모드)
                      </summary>
                      <div className="space-y-2">
                        <div>
                          <strong>에러:</strong> {this.state.error.toString()}
                        </div>
                        {this.state.errorInfo && (
                          <div>
                            <strong>스택 트레이스:</strong>
                            <pre className="whitespace-pre-wrap mt-1">
                              {this.state.errorInfo.componentStack}
                            </pre>
                          </div>
                        )}
                      </div>
                    </details>
                  )}
                  <div className="flex gap-2 mt-4">
                    <Button
                      onClick={this.handleReset}
                      variant="outline"
                      className="gap-2 min-h-[44px]"
                      aria-label="다시 시도"
                    >
                      <RefreshCw className="h-4 w-4" />
                      다시 시도
                    </Button>
                    <Button
                      onClick={() => window.location.reload()}
                      variant="default"
                      className="gap-2 min-h-[44px]"
                      aria-label="페이지 새로고침"
                    >
                      <RefreshCw className="h-4 w-4" />
                      페이지 새로고침
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}





