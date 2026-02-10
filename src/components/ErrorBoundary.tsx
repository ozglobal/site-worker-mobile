import React from 'react'
import { reportError } from '../lib/errorReporter'

interface Props {
  children: React.ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
    reportError('RENDER_CRASH', error.message, { stack: error.stack })
  }

  private handleReset = () => {
    this.setState({ hasError: false })
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen flex-col items-center justify-center gap-4 px-6">
          <p className="text-lg font-semibold text-slate-900">
            문제가 발생했습니다
          </p>
          <p className="text-sm text-slate-500 text-center">
            예상치 못한 오류가 발생했습니다.<br />
            아래 버튼을 눌러 다시 시도해 주세요.
          </p>
          <button
            onClick={this.handleReset}
            className="mt-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-white"
          >
            다시 시도
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
