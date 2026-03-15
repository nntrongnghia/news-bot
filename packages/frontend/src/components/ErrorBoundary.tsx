import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="border border-red-300 dark:border-red-800 rounded-lg p-4 bg-red-50 dark:bg-red-900/20">
          <p className="text-red-600 dark:text-red-400 text-sm font-medium">Đã xảy ra lỗi khi hiển thị nội dung.</p>
          <pre className="text-xs text-red-500 dark:text-red-400 mt-2 whitespace-pre-wrap">
            {this.state.error?.message}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}
