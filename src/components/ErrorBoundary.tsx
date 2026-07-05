import { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Global error boundary. Catches React render/runtime errors so the app
 * never shows a blank white screen. Logs the error and offers recovery.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback) return this.props.fallback;

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-card border border-border rounded-2xl p-6 shadow-lg text-center space-y-4">
          <div className="mx-auto w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="w-7 h-7 text-destructive" />
          </div>
          <div className="space-y-1">
            <h1 className="text-xl font-semibold">Algo deu errado</h1>
            <p className="text-sm text-muted-foreground">
              Ocorreu um erro inesperado. Você pode tentar novamente ou voltar ao início.
            </p>
          </div>
          {import.meta.env.DEV && this.state.error && (
            <pre className="text-left text-xs bg-muted p-3 rounded-md overflow-auto max-h-40">
              {this.state.error.message}
            </pre>
          )}
          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={this.handleReload} className="flex-1">
              <RefreshCw className="w-4 h-4 mr-2" />
              Recarregar
            </Button>
            <Button onClick={this.handleGoHome} variant="outline" className="flex-1">
              <Home className="w-4 h-4 mr-2" />
              Início
            </Button>
          </div>
        </div>
      </div>
    );
  }
}
