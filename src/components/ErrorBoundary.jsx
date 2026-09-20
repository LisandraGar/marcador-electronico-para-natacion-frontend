import { Component } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary capturó un error:', error, errorInfo)
    }
  }

  handleReload = () => {
    window.location.reload()
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-gray-900 border border-red-500/40 rounded-xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
              <AlertTriangle size={32} />
            </div>
            <h1 className="text-xl font-bold font-mono text-red-400">
              Ha ocurrido un error en la interfaz
            </h1>
            <p className="text-sm text-gray-400 font-sans">
              Ocurrió una excepción al procesar los datos de visualización. Puedes intentar restablecer el estado o recargar la página.
            </p>
            {this.state.error?.message && (
              <pre className="text-xs bg-black/60 p-3 rounded text-left overflow-x-auto text-red-300 font-mono border border-gray-800">
                {this.state.error.message}
              </pre>
            )}
            <div className="flex gap-3 justify-center pt-2">
              <button
                onClick={this.handleReset}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 text-sm font-mono rounded-lg transition-colors border border-gray-700"
              >
                Reintentar
              </button>
              <button
                onClick={this.handleReload}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-mono rounded-lg shadow-lg transition-all"
              >
                <RotateCcw size={16} />
                Recargar Aplicación
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
