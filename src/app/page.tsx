'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Store, Sparkles, Share2, Smartphone, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';

export default function HomePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };
    checkUser();
  }, []);

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      {/* Navigation */}
      <nav className="max-w-6xl mx-auto px-4 md:px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-[var(--color-text-primary)] rounded-lg flex items-center justify-center flex-shrink-0">
            <Store className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="text-lg font-[var(--font-sans)] hidden sm:inline">Cataliapp</span>
        </div>

        <div className="flex items-center gap-3">
          {loading ? (
            <div className="w-20 h-8 bg-[var(--color-surface-elevated)] animate-pulse rounded-lg" />
          ) : user ? (
            <Link
              href="/dashboard"
              className="text-sm font-medium bg-[var(--color-text-primary)] text-white px-5 py-2.5 rounded-lg shadow-sm hover:bg-[var(--color-text-primary)]/90 transition-all hover:scale-105 flex items-center gap-2"
            >
              Dashboard <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="text-xs sm:text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
              >
                Ingresar
              </Link>
              <div className="w-px h-4 bg-[var(--color-border)] mx-1" />
              <Link
                href="/register"
                className="text-xs sm:text-sm font-medium bg-[var(--color-text-primary)] text-white px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg shadow-sm hover:bg-[var(--color-text-primary)]/90 transition-all hover:scale-105 whitespace-nowrap"
              >
                Crear tienda
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <main className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="py-16 md:py-24 lg:py-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl"
          >
            <h1 className="font-[var(--font-sans)] leading-[1.1] mb-6">
              <span className="block text-4xl sm:text-5xl md:text-6xl lg:text-7xl">Tu catálogo,</span>
              <span className="block text-4xl sm:text-5xl md:text-6xl lg:text-7xl italic text-[var(--color-accent)] mt-1">tu marca</span>
            </h1>
            <p className="text-xl md:text-2xl text-[var(--color-text-secondary)] font-light leading-relaxed mb-10">
              Crea catálogos digitales que reflejan la esencia de tu negocio.
              Personalización total, diseño exclusivo y sin publicidad.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 bg-[var(--color-text-primary)] text-white px-8 py-4 rounded-lg text-lg hover:bg-[var(--color-text-primary)]/90 transition-colors shadow-md hover:scale-105"
              >
                <Sparkles className="w-5 h-5" />
                Crear mi catálogo
              </Link>
              <Link
                href="/tienda/urban-threads"
                className="inline-flex items-center gap-2 border border-[var(--color-border)] text-[var(--color-text-primary)] px-8 py-4 rounded-lg text-lg hover:bg-[var(--color-surface)] transition-colors"
              >
                Ver ejemplo
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 md:gap-12 py-16 border-t border-[var(--color-border)]">
          {[
            {
              icon: Store,
              title: 'Personalizado',
              description: 'Tu catálogo refleja tu identidad de marca. Colores, tipografía y estilo único.',
            },
            {
              icon: Share2,
              title: 'Fácil de compartir',
              description: 'Un link personalizado para que tus clientes vean tus productos en cualquier momento.',
            },
            {
              icon: Smartphone,
              title: 'Experiencia Mobile-First',
              description: 'Tus clientes podrán navegar y comprar desde su celular con una rapidez y fluidez inigualables.',
            },
          ].map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.15 }}
              className="space-y-4"
            >
              <div className="w-12 h-12 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl flex items-center justify-center">
                <feature.icon className="w-5 h-5 text-[var(--color-accent)]" />
              </div>
              <h3 className="text-xl font-[var(--font-sans)]">{feature.title}</h3>
              <p className="text-[var(--color-text-secondary)] leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="py-20 text-center"
        >
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-12 md:p-16">
            <h2 className="text-3xl md:text-4xl font-[var(--font-sans)] mb-4">
              ¿Listo para empezar?
            </h2>
            <p className="text-[var(--color-text-secondary)] text-lg mb-8 max-w-xl mx-auto">
              Crea tu primer catálogo en minutos. Gratis, sin tarjeta de crédito.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 bg-[var(--color-text-primary)] text-white px-8 py-4 rounded-lg text-lg hover:bg-[var(--color-text-primary)]/90 transition-colors"
            >
              Crear catálogo gratis
            </Link>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--color-border)] py-8 text-center">
        <p className="text-[var(--color-text-tertiary)] text-sm flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-4">
          <span>© 2025 Cataliapp</span>
          <span className="hidden sm:inline">·</span>
          <span>Desarrollado por <a href="https://bescobar-git-master-beck23s-projects.vercel.app/" target="_blank" rel="noopener noreferrer" className="text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] font-medium transition-colors">Bryan Escobar</a></span>
        </p>
      </footer>
    </div>
  );
}
