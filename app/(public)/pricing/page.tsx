'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Check, Star, Zap, Crown, ArrowRight, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface PricingPlan {
  id: string
  plan_type: 'monthly' | 'annual' | 'course'
  price_cents: number
  name: string
  description: string | null
}

// Planes por defecto si no hay conexion a DB
const defaultPlans: PricingPlan[] = [
  { id: '1', plan_type: 'monthly', price_cents: 2300, name: 'Premium Mensual', description: 'Acceso a todos los cursos premium por 1 mes' },
  { id: '2', plan_type: 'annual', price_cents: 23000, name: 'Premium Anual', description: 'Acceso a todos los cursos premium por 1 ano (2 meses gratis)' },
]

const planFeatures = {
  free: [
    'Acceso a cursos gratuitos',
    'Certificados de cursos gratuitos',
    'Sistema de gamificacion (XP, badges)',
    'Acceso a la comunidad',
    'Rutas de aprendizaje basicas',
  ],
  premium: [
    'Todo lo incluido en Free',
    'Acceso a TODOS los cursos premium',
    'Certificados verificables con QR',
    'Prioridad en soporte',
    'Acceso anticipado a nuevos cursos',
    'Elegibilidad para certificacion instructor',
    'Descuentos en eventos y workshops',
  ],
}

export default function PricingPage() {
  const [plans, setPlans] = useState<PricingPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('annual')

  useEffect(() => {
    async function fetchPlans() {
      try {
        const supabase = createClient()
        // Usar query raw porque pricing_plans puede no estar en los tipos generados
        const { data, error } = await supabase
          .from('pricing_plans' as any)
          .select('id, plan_type, price_cents, name, description')
          .eq('is_active', true)
          .in('plan_type', ['monthly', 'annual'])
          .order('price_cents', { ascending: true })

        if (error || !data) {
          console.error('Error fetching pricing plans:', error)
          setPlans(defaultPlans)
        } else {
          setPlans(data as unknown as PricingPlan[])
        }
      } catch (err) {
        console.error('Error:', err)
        setPlans(defaultPlans)
      }
      setLoading(false)
    }
    fetchPlans()
  }, [])

  const monthlyPlan = plans.find(p => p.plan_type === 'monthly')
  const annualPlan = plans.find(p => p.plan_type === 'annual')

  const formatPrice = (cents: number) => {
    return (cents / 100).toFixed(2).replace('.', ',')
  }

  const getMonthlyEquivalent = (plan: PricingPlan) => {
    if (plan.plan_type === 'annual') {
      return (plan.price_cents / 12 / 100).toFixed(2).replace('.', ',')
    }
    return formatPrice(plan.price_cents)
  }

  const getSavings = () => {
    if (!monthlyPlan || !annualPlan) return 0
    const yearlyIfMonthly = monthlyPlan.price_cents * 12
    const savings = yearlyIfMonthly - annualPlan.price_cents
    return Math.round((savings / yearlyIfMonthly) * 100)
  }

  return (
    <div className="min-h-screen bg-dark-primary">
      {/* Header */}
      <header className="border-b border-white/10 bg-dark-secondary/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <span className="text-3xl">N</span>
            <span className="text-xl font-bold text-white">Nodo360</span>
          </Link>
          <Link
            href="/login"
            className="px-4 py-2 rounded-lg bg-brand/20 text-brand hover:bg-brand/30 transition-colors text-sm font-medium"
          >
            Iniciar sesion
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-16">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand/10 border border-brand/20 text-brand text-sm mb-6">
            <Sparkles className="w-4 h-4" />
            Invierte en tu futuro
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Planes y Precios
          </h1>
          <p className="text-xl text-white/60 max-w-2xl mx-auto">
            Accede a contenido premium y acelera tu carrera con cursos de alta calidad
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex items-center gap-4 p-1.5 rounded-xl bg-white/5 border border-white/10">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
                billingPeriod === 'monthly'
                  ? 'bg-brand text-white shadow-lg'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Mensual
            </button>
            <button
              onClick={() => setBillingPeriod('annual')}
              className={`px-6 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 ${
                billingPeriod === 'annual'
                  ? 'bg-brand text-white shadow-lg'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Anual
              {getSavings() > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs">
                  -{getSavings()}%
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Plan */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-white/10">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">Free</h2>
            </div>
            <p className="text-white/60 mb-6">
              Ideal para comenzar tu aprendizaje
            </p>
            <div className="mb-8">
              <span className="text-4xl font-bold text-white">0 EUR</span>
              <span className="text-white/60 ml-2">/siempre</span>
            </div>
            <Link
              href="/login?mode=register"
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-white/20 text-white font-medium hover:bg-white/5 transition-colors mb-8"
            >
              Comenzar gratis
              <ArrowRight className="w-4 h-4" />
            </Link>
            <ul className="space-y-4">
              {planFeatures.free.map((feature, i) => (
                <li key={i} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-white/80">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Premium Plan */}
          <div className="relative rounded-2xl border-2 border-brand/50 bg-gradient-to-b from-brand/10 to-transparent p-8 backdrop-blur-sm">
            {/* Badge */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <div className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-brand text-white text-sm font-medium">
                <Star className="w-4 h-4" />
                Mas popular
              </div>
            </div>

            <div className="flex items-center gap-3 mb-4 mt-2">
              <div className="p-2 rounded-lg bg-brand/20">
                <Crown className="w-6 h-6 text-brand" />
              </div>
              <h2 className="text-2xl font-bold text-white">Premium</h2>
            </div>
            <p className="text-white/60 mb-6">
              Acceso completo a todo el contenido
            </p>

            {loading ? (
              <div className="mb-8 h-12 bg-white/10 animate-pulse rounded-lg" />
            ) : (
              <div className="mb-8">
                {billingPeriod === 'annual' && annualPlan ? (
                  <>
                    <span className="text-4xl font-bold text-white">
                      {getMonthlyEquivalent(annualPlan)} EUR
                    </span>
                    <span className="text-white/60 ml-2">/mes</span>
                    <p className="text-sm text-white/40 mt-1">
                      Facturado anualmente ({formatPrice(annualPlan.price_cents)} EUR/ano)
                    </p>
                  </>
                ) : monthlyPlan ? (
                  <>
                    <span className="text-4xl font-bold text-white">
                      {formatPrice(monthlyPlan.price_cents)} EUR
                    </span>
                    <span className="text-white/60 ml-2">/mes</span>
                  </>
                ) : (
                  <span className="text-white/60">Plan no disponible</span>
                )}
              </div>
            )}

            <button
              disabled
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-brand/50 text-white/70 font-medium cursor-not-allowed mb-2"
            >
              Proximamente
            </button>
            <p className="text-center text-white/40 text-sm mb-8">
              Sistema de pagos en desarrollo
            </p>

            <ul className="space-y-4">
              {planFeatures.premium.map((feature, i) => (
                <li key={i} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-brand flex-shrink-0 mt-0.5" />
                  <span className="text-white/80">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Contact CTA */}
        <div className="mt-16 text-center">
          <div className="inline-block rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm max-w-xl">
            <h3 className="text-xl font-bold text-white mb-2">
              Necesitas un plan empresarial?
            </h3>
            <p className="text-white/60 mb-6">
              Contacta con nosotros para planes personalizados para equipos y organizaciones
            </p>
            <a
              href="mailto:team@nodo360.com"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 text-white font-medium hover:bg-white/20 transition-colors"
            >
              Contactar ventas
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-20">
          <h2 className="text-2xl font-bold text-white text-center mb-10">
            Preguntas frecuentes
          </h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
              <h3 className="font-semibold text-white mb-2">
                Puedo cancelar en cualquier momento?
              </h3>
              <p className="text-white/60 text-sm">
                Si, puedes cancelar tu suscripcion en cualquier momento. Mantendras el acceso hasta el final del periodo facturado.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
              <h3 className="font-semibold text-white mb-2">
                Que metodos de pago aceptan?
              </h3>
              <p className="text-white/60 text-sm">
                Aceptaremos tarjetas de credito/debito y PayPal cuando el sistema de pagos este disponible.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
              <h3 className="font-semibold text-white mb-2">
                Los certificados son verificables?
              </h3>
              <p className="text-white/60 text-sm">
                Si, todos los certificados incluyen un codigo QR unico que permite verificar su autenticidad en nuestra plataforma.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
              <h3 className="font-semibold text-white mb-2">
                Hay descuentos para estudiantes?
              </h3>
              <p className="text-white/60 text-sm">
                Estamos trabajando en un programa de descuentos para estudiantes. Contactanos para mas informacion.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 mt-20">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-white/40 text-sm">
            2024 Nodo360. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-6">
            <Link href="/privacidad" className="text-white/40 hover:text-white/60 text-sm transition-colors">
              Privacidad
            </Link>
            <Link href="/terminos" className="text-white/40 hover:text-white/60 text-sm transition-colors">
              Terminos
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
