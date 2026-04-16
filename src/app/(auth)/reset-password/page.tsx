'use client'

import { useActionState, useState } from 'react'
import { updatePassword } from '../actions'
import Link from 'next/link'
import { Store, ArrowRight, AlertCircle, Eye, EyeOff, Check, X } from 'lucide-react'

export default function ResetPasswordPage() {
  const [state, formAction] = useActionState(
    async (prevState: any, formData: FormData) => {
      return updatePassword(formData)
    },
    null
  )

  const [showPassword, setShowPassword] = useState(false)
  const [password, setPassword] = useState('')

  const passwordRequirements = [
    { label: 'Al menos 6 caracteres', satisfied: password.length >= 6 },
    { label: 'Un número', satisfied: /[0-9]/.test(password) },
    { label: 'Una letra', satisfied: /[a-zA-Z]/.test(password) },
  ];

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-[var(--font-sans)] text-[var(--color-text-primary)]">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/" className="flex justify-center items-center gap-2 mb-6 group">
          <img src="/logo_catali.svg" alt="Cataliapp Logo" className="w-16 h-16 sm:w-20 sm:h-20 object-contain transition-transform group-hover:scale-105" />
        </Link>
        <h2 className="text-center text-3xl font-bold tracking-tight">
          Nueva contraseña
        </h2>
        <p className="mt-2 text-center text-base text-[var(--color-text-secondary)]">
          Ingresa tu nueva contraseña para recuperar el acceso.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[var(--color-surface)] py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-[var(--color-border)]">
          <form className="space-y-6" action={formAction}>
            {state?.error && (
              <div className="bg-red-50 text-red-600 border border-red-200 text-sm p-3 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{state.error}</span>
              </div>
            )}
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[var(--color-text-secondary)]">
                Nueva Contraseña
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-[var(--color-border)] bg-[var(--color-bg)] rounded-lg shadow-sm placeholder-[var(--color-text-tertiary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-text-primary)] focus:border-[var(--color-text-primary)] text-base text-[var(--color-text-primary)] transition-colors pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              
              {/* Real-time validation */}
              <div className="mt-3 space-y-2">
                {passwordRequirements.map((req) => (
                  <div key={req.label} className="flex items-center gap-2 text-xs transition-colors">
                    {req.satisfied ? (
                      <Check className="w-3.5 h-3.5 text-green-500" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-gray-300 flex items-center justify-center text-[8px] text-gray-400">
                        <X className="w-2 h-2" />
                      </div>
                    )}
                    <span className={req.satisfied ? 'text-green-600 font-medium' : 'text-[var(--color-text-tertiary)]'}>
                      {req.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-[var(--color-text-primary)] hover:bg-[var(--color-text-primary)]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-text-primary)] transition-colors group"
              >
                Actualizar contraseña
                <ArrowRight className="ml-2 w-5 h-5 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
