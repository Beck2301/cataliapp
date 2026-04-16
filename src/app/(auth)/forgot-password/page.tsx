'use client'

import { useActionState } from 'react'
import { forgotPassword } from '../actions'
import Link from 'next/link'
import { Store, ArrowRight, AlertCircle, Check, Mail } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [state, formAction] = useActionState(
    async (prevState: any, formData: FormData) => {
      return forgotPassword(formData)
    },
    null
  )

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-[var(--font-sans)] text-[var(--color-text-primary)]">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/" className="flex justify-center items-center gap-2 mb-6 group">
          <img src="/logo_catali.svg" alt="Cataliapp Logo" className="w-16 h-16 sm:w-20 sm:h-20 object-contain transition-transform group-hover:scale-105" />
        </Link>
        <h2 className="text-center text-3xl font-bold tracking-tight">
          Recuperar contraseña
        </h2>
        <p className="mt-2 text-center text-base text-[var(--color-text-secondary)]">
          Te enviaremos un link para restablecer tu acceso.
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

            {state?.success && (
              <div className="bg-green-50 text-green-600 border border-green-200 text-sm p-3 rounded-lg flex items-center gap-2">
                <Check className="w-5 h-5 flex-shrink-0" />
                <span>{state.success}</span>
              </div>
            )}
            
            {!state?.success && (
              <>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-[var(--color-text-secondary)]">
                    Correo electrónico
                  </label>
                  <div className="mt-1 relative">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      placeholder="tu@email.com"
                      className="appearance-none block w-full px-3 py-2 border border-[var(--color-border)] bg-[var(--color-bg)] rounded-lg shadow-sm placeholder-[var(--color-text-tertiary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-text-primary)] focus:border-[var(--color-text-primary)] text-base text-[var(--color-text-primary)] transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-[var(--color-text-primary)] hover:bg-[var(--color-text-primary)]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-text-primary)] transition-colors group"
                  >
                    Enviar link de recuperación
                    <ArrowRight className="ml-2 w-5 h-5 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </button>
                </div>
              </>
            )}

            <div className="text-center">
              <Link href="/login" className="text-sm font-medium text-[var(--color-accent)] hover:underline">
                Volver al inicio de sesión
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
