'use client';

import { useActionState, useState } from 'react'
import { signup } from '../actions'
import Link from 'next/link'
import { Store, ArrowRight, AlertCircle, Sparkles, Eye, EyeOff, Check, X } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      const password = formData.get('password') as string;
      if (password.length < 6) {
        return { error: 'La contraseña debe tener al menos 6 caracteres.' };
      }
      return signup(formData)
    },
    null
  )

  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [password, setPassword] = useState('')

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true)
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  const passwordRequirements = [
    { label: 'Al menos 6 caracteres', satisfied: password.length >= 6 },
    { label: 'Un número', satisfied: /[0-9]/.test(password) },
    { label: 'Una letra', satisfied: /[a-zA-Z]/.test(password) },
  ];

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-[var(--font-sans)] text-[var(--color-text-primary)]">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/" className="flex justify-center items-center gap-2 mb-6 group">
          <div className="w-10 h-10 bg-[var(--color-text-primary)] rounded-lg flex items-center justify-center transition-transform group-hover:scale-105">
            <Store className="w-5 h-5 text-white" />
          </div>
          <span className="text-3xl font-bold tracking-tight">Catálogo</span>
        </Link>
        <div className="flex justify-center mb-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-[var(--color-accent)]/10 text-[var(--color-accent)] ring-1 ring-inset ring-[var(--color-accent)]/20">
            <Sparkles className="w-4 h-4" />
            Crea tu propia tienda hoy
          </span>
        </div>
        <h2 className="text-center text-3xl font-bold tracking-tight">
          Crea una cuenta
        </h2>
        <p className="mt-2 text-center text-base text-[var(--color-text-secondary)]">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="font-medium text-[var(--color-accent)] hover:underline transition">
            Inicia sesión aquí
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[var(--color-surface)] py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-[var(--color-border)]">
          <button
             type="button"
             onClick={handleGoogleLogin}
             disabled={isGoogleLoading}
             className="w-full flex justify-center items-center gap-3 py-2.5 px-4 mb-6 border border-[var(--color-border)] rounded-lg shadow-sm bg-[var(--color-surface)] text-base font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-surface-elevated)] transition-colors disabled:opacity-50"
          >
             {isGoogleLoading ? (
               <div className="w-5 h-5 border-2 border-[var(--color-border)] border-t-[var(--color-accent)] rounded-full animate-spin" />
             ) : (
               <svg className="w-5 h-5" viewBox="0 0 24 24">
                 <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                 <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                 <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                 <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
               </svg>
             )}
            Continuar con Google
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--color-border)]" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-[var(--color-surface)] text-[var(--color-text-tertiary)]">o regístrate con tu email</span>
            </div>
          </div>

          <form className="space-y-6" action={formAction}>
            {state?.error && (
              <div className="bg-red-50 text-red-600 border border-red-200 text-sm p-3 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{state.error === 'Password should be at least 6 characters' ? 'La contraseña debe tener al menos 6 caracteres.' : state.error}</span>
              </div>
            )}

            {state?.success && (
              <div className="bg-green-50 text-green-600 border border-green-200 text-sm p-3 rounded-lg flex items-center gap-2">
                <Check className="w-5 h-5 flex-shrink-0" />
                <span>{state.success}</span>
              </div>
            )}
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[var(--color-text-secondary)]">
                Correo electrónico
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-[var(--color-border)] bg-[var(--color-bg)] rounded-lg shadow-sm placeholder-[var(--color-text-tertiary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-text-primary)] focus:border-[var(--color-text-primary)] text-base text-[var(--color-text-primary)] transition-colors"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[var(--color-text-secondary)]">
                Contraseña
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
                Registrarme
                <ArrowRight className="ml-2 w-5 h-5 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
