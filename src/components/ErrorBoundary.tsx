import { Component, ReactNode, ErrorInfo } from "react";
import { AlertTriangle, RefreshCw, ClipboardCopy } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  copied: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, copied: false };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  handleCopy = () => {
    const text = `${this.state.error?.message}\n\n${this.state.error?.stack ?? ""}`;
    navigator.clipboard.writeText(text).then(() => {
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-screen bg-gray-50 p-4">
          <div className="max-w-lg w-full bg-white rounded-xl shadow-lg border border-red-200 p-8 text-center space-y-4">
            <div className="flex justify-center">
              <AlertTriangle className="h-12 w-12 text-red-500" />
            </div>
            <h1 className="text-xl font-bold text-gray-800">Something went wrong</h1>
            <p className="text-sm text-gray-600">
              An unexpected error occurred in the application. You can try reloading, or copy the
              error details to report the issue.
            </p>
            {this.state.error && (
              <pre className="text-left text-xs bg-red-50 border border-red-200 rounded p-3 overflow-auto max-h-40 text-red-700 font-mono">
                {this.state.error.message}
              </pre>
            )}
            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium transition"
              >
                <RefreshCw className="h-4 w-4" />
                Reload
              </button>
              <button
                onClick={this.handleCopy}
                className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 px-4 py-2 rounded text-sm font-medium transition"
              >
                <ClipboardCopy className="h-4 w-4" />
                {this.state.copied ? "Copied!" : "Copy Error"}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
