<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { 
  ArrowRight, 
  Play, 
  CheckCircle2, 
  QrCode, 
  Layout, 
  BarChart3, 
  X,
  Eye,
  EyeOff,
  LogIn,
  UserPlus
} from 'lucide-vue-next'
import { qrConfigApi } from '@/api/qr-config.api'
import { categoriesApi } from '@/api/categories.api'
import { servicesApi } from '@/api/services.api'
import Toast from '@/components/Toast.vue'
import heroImg from '@/assets/screen.png'
import stepsShowcaseImg from '@/assets/landing-product-showcase.svg'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// --- Modal Logic ---
const showAuthModal = ref(false)
const authMode = ref<'login' | 'register'>('login')
const showPassword = ref(false)
const loading = ref(false)
const error = ref('')
const googleAuthUrl = String(
  import.meta.env.VITE_GOOGLE_AUTH_URL || '/api/auth/google',
).trim()
const isGoogleLoginEnabled = computed(() => Boolean(googleAuthUrl))
const heroTiltX = ref(0)
const heroTiltY = ref(0)
const revealObserver = ref<IntersectionObserver | null>(null)
const heroCardStyle = computed(() => ({
  transform: `perspective(1200px) rotateX(${heroTiltX.value}deg) rotateY(${heroTiltY.value}deg)`,
}))

// Form State
const loginForm = ref({ username: '', password: '' })
const registerForm = ref({
  username: '',
  email: '',
  password: '',
})

function handleHeroMouseMove(event: MouseEvent) {
  const el = event.currentTarget as HTMLElement | null
  if (!el) return

  const rect = el.getBoundingClientRect()
  const px = (event.clientX - rect.left) / rect.width
  const py = (event.clientY - rect.top) / rect.height

  heroTiltY.value = (px - 0.5) * 8
  heroTiltX.value = (0.5 - py) * 7
}

function resetHeroTilt() {
  heroTiltX.value = 0
  heroTiltY.value = 0
}

function initScrollReveal() {
  if (typeof window === 'undefined') return

  const elements = document.querySelectorAll<HTMLElement>('[data-reveal]')
  if (!elements.length) return

  revealObserver.value = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const target = entry.target as HTMLElement
          const delay = target.dataset.revealDelay
          if (delay) target.style.transitionDelay = delay
          target.classList.add('is-visible')
          revealObserver.value?.unobserve(target)
        }
      })
    },
    { threshold: 0.2 },
  )

  elements.forEach((el) => revealObserver.value?.observe(el))
}

function openAuth(mode: 'login' | 'register') {
  authMode.value = mode
  showAuthModal.value = true
  error.value = ''
}

function closeAuth() {
  showAuthModal.value = false
}

function handleGoogleAuth() {
  if (googleAuthUrl) {
    window.location.href = googleAuthUrl
    console.log('Redirecting to Google auth URL:', googleAuthUrl)
    return
  }
  error.value = 'Google login is not configured yet. Please use username/password for now.'
}

async function handleLogin() {
  loading.value = true
  error.value = ''
  const result = await authStore.login(loginForm.value.username, loginForm.value.password)
  if (result.success) {
    handlePostAuthRedirect()
  } else {
    error.value = result.message || 'Invalid credentials'
    loading.value = false
  }
}

async function handleRegister() {
  if (!registerForm.value.username || !registerForm.value.email || !registerForm.value.password) {
    error.value = 'Please fill in all fields'
    return
  }
  loading.value = true
  error.value = ''
  const result = await authStore.register(registerForm.value)
  if (result.success) {
    handlePostAuthRedirect()
  } else {
    error.value = result.message || 'Registration failed'
    loading.value = false
  }
}

async function handlePostAuthRedirect() {
  try {
    await authStore.fetchProfile()
    
    // Get all necessary data to determine onboarding state
    const configRes = await qrConfigApi.getConfig()
    const config = configRes.data?.data || configRes.data
    
    // Step 1: Spa Name AND Spa Phone are required
    const isConfigDone = !!config?.spaName && !!config?.spaPhone
    if (!isConfigDone) {
      router.push('/admin/qr')
      return
    }

    // Step 2: Categories
    const catsRes = await categoriesApi.getAll()
    const catsData = catsRes.data?.data || catsRes.data || []
    const isCategoryDone = catsData.length > 0
    if (!isCategoryDone) {
      router.push('/admin/categories')
      return
    }

    // Step 3: Services
    const servicesRes = await servicesApi.getAll({ limit: 1 })
    const raw: any = servicesRes.data
    const servicesData = raw?.data?.items || raw?.items || raw?.data || []
    const isServiceDone = (Array.isArray(servicesData) ? servicesData.length : 0) > 0
    if (!isServiceDone) {
      router.push('/admin/services')
      return
    }

    // If all steps done, go to dashboard
    router.push('/admin/dashboard')
    
    closeAuth()
  } catch (err) {
    console.error('Redirect error:', err)
    router.push('/admin/dashboard')
    closeAuth()
  }
}

// Features Scroll
const features = [
  {
    title: 'Easy QR Setup',
    desc: 'Generate brand-aligned QR codes that feel like a design choice, not a technical necessity. Instant updates without reprinting.',
    icon: QrCode,
    color: 'bg-primary-50 text-primary-600'
  },
  {
    title: 'Beautiful Menus',
    desc: 'Editorial-grade digital menus that highlight your treatments with high-resolution imagery and sensory descriptions.',
    icon: Layout,
    color: 'bg-purple-50 text-purple-600'
  },
  {
    title: 'Real-time Analytics',
    desc: 'Understand guest behavior. Track which treatments are most viewed and optimize your offerings based on real data.',
    icon: BarChart3,
    color: 'bg-success/10 text-success'
  }
]

onMounted(() => {
  // 1. Handle explicit error from URL (e.g. backend redirects back with error)
  const queryErr = route.query.error
  if (queryErr) {
    const errorMsg = String(queryErr)
    if (errorMsg === 'access_denied') {
      error.value = 'Login canceled. Please try again.'
    } else {
      error.value = errorMsg
    }
    // Clean URL
    window.history.replaceState({}, document.title, '/')
  }

  // 2. Handle OAuth Success Completion
  const oauth = String(route.query.oauth || '').toLowerCase()
  if (oauth === 'google' && isGoogleLoginEnabled.value) {
    authStore.completeGoogleLoginFromCookie().then((result) => {
      if (result.success) {
        window.history.replaceState({}, document.title, '/')
        handlePostAuthRedirect()
      } else {
        error.value = result.message || 'Google login failed'
      }
    })
    return
  }

  if (authStore.isAuthenticated) {
    router.push('/admin/dashboard')
  }

  initScrollReveal()
})

onBeforeUnmount(() => {
  revealObserver.value?.disconnect()
})
</script>

<template>
  <div class="min-h-screen bg-white font-sans text-text-primary selection:bg-primary-100">
    <!-- Navbar -->
    <nav class="fixed top-0 z-40 w-full border-b border-border/40 bg-white/80 backdrop-blur-md">
      <div class="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div class="flex items-center gap-2">
          <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-white font-black">Q</div>
          <span class="text-xl font-black tracking-tight">QR-Home</span>
        </div>
        
        <div class="flex items-center gap-6">
          <button @click="openAuth('login')" class="text-sm font-bold text-text-secondary hover:text-primary-600 transition-colors">Login</button>
          <button @click="openAuth('register')" class="rounded-xl bg-primary-600 px-6 py-2.5 text-sm font-black text-white shadow-button hover:brightness-110 active:scale-95 transition-all">
            Get Started
          </button>
        </div>
      </div>
    </nav>

    <!-- Hero Section -->
    <section class="relative min-h-screen flex items-center overflow-hidden">
      <!-- Background Mesh Glows -->
      <div class="absolute -top-24 -left-20 h-[500px] w-[500px] rounded-full bg-primary-100/30 blur-[120px] animate-pulse-slow"></div>
      <div class="absolute top-1/2 -right-40 h-[600px] w-[600px] rounded-full bg-purple-100/20 blur-[140px] animate-pulse-slow banner-delay"></div>

      <div class="mx-auto max-w-7xl px-6 relative z-10 w-full py-24 pt-0">
        <div class="flex flex-col lg:flex-row items-center gap-16">
          <!-- Left Content -->
          <div class="flex-1 text-center lg:text-left reveal-fade-up">
            <div class="inline-flex items-center rounded-full bg-primary-50 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-primary-600 mb-6">
              NEXT-GEN DIGITAL MENUS
            </div>
            <h1 class="text-5xl lg:text-7xl font-black leading-[1.1] tracking-tight mb-8 reveal-fade-up-2">
              Power Your Business with <span class="text-primary-600 headline-gradient">Dynamic QR Menus.</span>
            </h1>
            <p class="text-lg lg:text-xl text-text-secondary leading-relaxed mb-10 max-w-2xl mx-auto lg:mx-0 reveal-fade-up-3">
              Ditch the printing costs and go fully digital. Create, manage, and scale beautiful contactless menus for any service in minutes. Engage your customers instantly.
            </p>
            
            <div class="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 reveal-fade-up-4">
              <button @click="openAuth('register')" class="group flex items-center gap-3 rounded-2xl bg-primary-600 px-8 py-4 text-base font-black text-white shadow-button hover:brightness-110 active:scale-95 transition-all">
                Get Started for Free
                <ArrowRight class="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>

          <!-- Right Product Showcase -->
          <div
            class="relative flex-1 w-full max-w-xl lg:max-w-none reveal-fade-right"
            @mousemove="handleHeroMouseMove"
            @mouseleave="resetHeroTilt"
          >
            <div class="absolute -right-8 -top-8 h-48 w-48 rounded-full bg-primary-200/50 blur-3xl animate-pulse"></div>
            <div class="absolute -bottom-12 -left-10 h-56 w-56 rounded-full bg-primary-600/10 blur-3xl"></div>

            <div
              class="relative z-10 overflow-hidden rounded-[2.5rem] border border-primary-100/60 bg-white p-3 shadow-[0_24px_90px_rgba(2,83,205,0.22)] animate-float will-change-transform transition-transform duration-300"
              :style="heroCardStyle"
            >
              <div class="relative overflow-hidden rounded-[2rem]">
                <img
                  :src="heroImg"
                  alt="Customer menu preview"
                  class="h-[340px] w-full object-cover object-center brightness-[0.92] sm:h-[460px] hover:scale-105"
                />
                <div class="hero-shine"></div>
                <div class="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-60 animate-bounce">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-text-primary"><rect x="5" y="2" width="14" height="20" rx="7"/><path d="M12 6v4"/></svg>
        <p class="text-[10px] font-bold uppercase tracking-widest text-text-primary">scroll to see more</p>
      </div>
    </section>

    <!-- Features Section -->
    <section class="py-24 bg-[#F8FAFC]" data-reveal>
      <div class="mx-auto max-w-7xl px-6">
        <div class="text-center mb-16" data-reveal data-reveal-delay="60ms">
          <h2 class="text-3xl lg:text-4xl font-black mb-4">Crafted for Excellence</h2>
          <p class="text-text-muted font-medium">Sophisticated tools to manage your spa's digital identity.</p>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div
            v-for="(f, index) in features"
            :key="f.title"
            class="group p-8 rounded-[32px] bg-white border border-border/50 shadow-sm hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(15,23,42,0.1)] transition-all duration-500"
            data-reveal
            :data-reveal-delay="`${160 + index * 90}ms`"
          >
            <div :class="['w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 duration-500', f.color]">
              <component :is="f.icon" class="h-6 w-6" />
            </div>
            <h3 class="text-xl font-bold mb-4">{{ f.title }}</h3>
            <p class="text-text-secondary leading-relaxed tracking-tight">{{ f.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Steps Section -->
    <section class="py-32 overflow-hidden" data-reveal>
      <div class="mx-auto max-w-7xl px-6">
        <div class="flex flex-col lg:flex-row items-center gap-24">
          <div class="flex-1 space-y-12" data-reveal data-reveal-delay="100ms">
            <div class="max-w-md">
              <h2 class="text-4xl lg:text-5xl font-black leading-tight mb-6">Effortless implementation in three simple steps.</h2>
              <p class="text-text-muted font-medium mb-12">We've removed the complexity of tech, leaving only the benefits of digital transformation.</p>
            </div>
            
            <div class="space-y-10 relative">
              <div class="absolute left-6 top-10 bottom-10 w-0.5 bg-primary-100"></div>
              
              <div class="relative flex gap-8">
                <div class="z-10 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-white text-xl font-black text-primary-600 ring-4 ring-primary-50">01</div>
                <div>
                  <h4 class="text-xl font-bold mb-2">Create Your Menu</h4>
                  <p class="text-text-secondary leading-relaxed">Upload your services, define categories, and add stunning visuals. Our editor makes it feel like curating a magazine.</p>
                </div>
              </div>

               <div class="relative flex gap-8">
                <div class="z-10 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-white text-xl font-black text-primary-600 ring-4 ring-primary-50">02</div>
                <div>
                  <h4 class="text-xl font-bold mb-2">Generate QR Codes</h4>
                  <p class="text-text-secondary leading-relaxed">Customize your QR design to match your brand. Print them for reception, suites, or relaxation lounges.</p>
                </div>
              </div>

               <div class="relative flex gap-8">
                <div class="z-10 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-white text-xl font-black text-primary-600 ring-4 ring-primary-50">03</div>
                <div>
                  <h4 class="text-xl font-bold mb-2">Guest Scans & Relaxes</h4>
                  <p class="text-text-secondary leading-relaxed">Guests access your full menu instantly on their mobile devices. No apps, no friction, just pure tranquility.</p>
                </div>
              </div>
            </div>
          </div>
          
          <div class="flex-1 w-full" data-reveal data-reveal-delay="240ms">
            <div class="mx-auto w-full max-w-[560px] overflow-hidden rounded-[2.5rem] border border-border/60 bg-white p-3 shadow-[0_20px_60px_rgba(15,23,42,0.14)] hover:-translate-y-1 hover:shadow-[0_28px_70px_rgba(15,23,42,0.16)] transition-all duration-500">
              <img
                :src="stepsShowcaseImg"
                alt="Digital service catalog preview"
                class="h-auto w-full rounded-[2rem] object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="border-t border-border/40 py-12">
      <div class="mx-auto max-w-7xl px-6 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
        <div>
          <div class="flex items-center justify-center md:justify-start gap-2 mb-4">
            <div class="flex h-6 w-6 items-center justify-center rounded-md bg-primary-600 text-white text-[10px] font-black">Q</div>
            <span class="text-lg font-black tracking-tight">QR-Home</span>
          </div>
          <p class="text-sm text-text-muted">© 2026 QRHome · Premium Wellness Platform</p>
        </div>
        <div class="flex items-center gap-8 text-sm font-bold text-text-secondary">
          <a href="#" class="hover:text-primary-600 transition-colors">Privacy</a>
          <a href="#" class="hover:text-primary-600 transition-colors">Terms</a>
          <a href="#" class="hover:text-primary-600 transition-colors">Documentation</a>
        </div>
      </div>
    </footer>

    <!-- --- Auth Modal (Portal) --- -->
    <Teleport to="body">
       <Transition name="fade">
        <div v-if="showAuthModal" class="fixed inset-0 z-50 flex items-center justify-center p-4" @click.self="closeAuth">
          <!-- Backdrop -->
          <div class="absolute inset-0 bg-black/60 backdrop-blur-md"></div>
          
          <!-- Modal Content -->
          <Transition name="zoom">
            <div v-if="showAuthModal" class="relative w-full max-w-md rounded-[40px] bg-white p-10 shadow-2xl">
              <button @click="closeAuth" class="absolute right-6 top-6 rounded-full p-2 text-text-muted hover:bg-surface-input transition-colors">
                <X class="h-5 w-5" />
              </button>

              <!-- Modal Header -->
              <div class="mb-8 text-center pt-4">
                <div class="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-600 shadow-button">
                  <span class="text-2xl font-black text-white">Q</span>
                </div>
                <h2 class="text-2xl font-black text-text-primary">{{ authMode === 'login' ? 'Welcome Back' : 'Create Account' }}</h2>
                <p class="mt-2 text-sm font-medium text-text-muted">
                  {{ authMode === 'login' ? 'Sign in to manage all your services' : 'Join the network of premium wellness providers' }}
                </p>
              </div>

              <!-- Toast Error (Floating) -->
              <Transition
                enter-active-class="transition duration-300 ease-out"
                enter-from-class="transform -translate-y-4 opacity-0"
                enter-to-class="transform translate-y-0 opacity-100"
                leave-active-class="transition duration-200 ease-in"
                leave-from-class="opacity-100"
                leave-to-class="opacity-0"
              >
                <div 
                  v-if="error" 
                  class="fixed top-8 left-1/2 -translate-x-1/2 z-[60] w-full max-w-sm px-4"
                >
                  <div class="rounded-2xl bg-[#0F172A] px-6 py-4 text-center text-sm font-bold text-white shadow-2xl ring-1 ring-white/10">
                    <div class="flex items-center justify-center gap-3">
                      <span class="flex h-5 w-5 items-center justify-center rounded-full bg-danger text-[10px] text-white">✕</span>
                      {{ error }}
                    </div>
                  </div>
                </div>
              </Transition>

              <!-- LOGIN FORM -->
              <form v-if="authMode === 'login'" @submit.prevent="handleLogin" class="space-y-4">
                <div>
                  <label class="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-text-muted">Username</label>
                  <input v-model="loginForm.username" type="text" placeholder="alex_wright" class="w-full rounded-2xl border-0 bg-[#F1F5F9] py-3.5 px-5 text-sm font-bold outline-none focus:bg-white focus:ring-2 focus:ring-primary-600 transition-all" />
                </div>
                <div>
                  <label class="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-text-muted">Password</label>
                  <div class="relative">
                    <input v-model="loginForm.password" :type="showPassword ? 'text' : 'password'" placeholder="••••••••" class="w-full rounded-2xl border-0 bg-[#F1F5F9] py-3.5 px-5 text-sm font-bold outline-none focus:bg-white focus:ring-2 focus:ring-primary-600 transition-all" />
                    <button type="button" @click="showPassword = !showPassword" class="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted">
                      <Eye v-if="!showPassword" class="h-4 w-4" />
                      <EyeOff v-else class="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <button type="submit" :disabled="loading" class="w-full flex items-center justify-center gap-3 rounded-2xl bg-primary-600 py-4 text-sm font-black text-white shadow-button hover:brightness-110 active:scale-95 disabled:opacity-70 disabled:cursor-wait transition-all">
                  <template v-if="!loading">
                    <LogIn class="h-4 w-4" />
                    Sign In
                  </template>
                  <template v-else>
                    <div class="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white"></div>
                    Signing in...
                  </template>
                </button>

                <template v-if="isGoogleLoginEnabled">
                  <div class="relative py-1">
                    <span class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 px-3 text-[11px] font-bold uppercase tracking-wide text-text-muted">or</span>
                  </div>

                  <button
                    type="button"
                    @click="handleGoogleAuth"
                    class="w-full flex items-center justify-center gap-3 rounded-2xl border border-border bg-white py-3.5 text-sm font-bold text-text-primary shadow-sm transition-all hover:bg-surface-input active:scale-95"
                  >
                    <svg class="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.2-1.4 3.6-5.5 3.6-3.3 0-6-2.8-6-6.2s2.7-6.2 6-6.2c1.9 0 3.2.8 3.9 1.5l2.7-2.7C16.8 2.5 14.6 1.5 12 1.5 6.8 1.5 2.6 5.8 2.6 11s4.2 9.5 9.4 9.5c5.4 0 9-3.8 9-9.2 0-.6-.1-1-.2-1.4H12z"/>
                    </svg>
                    Continue with Google
                  </button>
                </template>
              </form>

              <!-- REGISTER FORM -->
              <form v-else @submit.prevent="handleRegister" class="space-y-4">
                <div>
                  <label class="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-text-muted">Username</label>
                  <input v-model="registerForm.username" type="text" placeholder="alex" class="w-full rounded-2xl border-0 bg-[#F1F5F9] py-3.5 px-5 text-sm font-bold outline-none focus:bg-white focus:ring-2 focus:ring-primary-600 transition-all" />
                </div>
                <div>
                  <label class="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-text-muted">Email</label>
                  <input v-model="registerForm.email" type="email" placeholder="alex@gmail.com" class="w-full rounded-2xl border-0 bg-[#F1F5F9] py-3.5 px-5 text-sm font-bold outline-none focus:bg-white focus:ring-2 focus:ring-primary-600 transition-all" />
                </div>
                <div>
                  <label class="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-text-muted">Password</label>
                  <input v-model="registerForm.password" :type="showPassword ? 'text' : 'password'" placeholder="••••••••" class="w-full rounded-2xl border-0 bg-[#F1F5F9] py-3.5 px-5 text-sm font-bold outline-none focus:bg-white focus:ring-2 focus:ring-primary-600 transition-all" />
                </div>
                <button type="submit" :disabled="loading" class="w-full flex items-center justify-center gap-3 rounded-2xl bg-primary-600 py-4 text-sm font-black text-white shadow-button hover:brightness-110 active:scale-95 disabled:opacity-70 disabled:cursor-wait transition-all">
                  <template v-if="!loading">
                    <UserPlus class="h-4 w-4" />
                    Create Account
                  </template>
                  <template v-else>
                    <div class="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white"></div>
                    Creating Account...
                  </template>
                </button>

                <template v-if="isGoogleLoginEnabled">
                  <div class="relative py-1">
                    <span class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 px-3 text-[11px] font-bold uppercase tracking-wide text-text-muted">or</span>
                  </div>

                  <button
                    type="button"
                    @click="handleGoogleAuth"
                    class="w-full flex items-center justify-center gap-3 rounded-2xl border border-border bg-white py-3.5 text-sm font-bold text-text-primary shadow-sm transition-all hover:bg-surface-input active:scale-95"
                  >
                    <svg class="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.2-1.4 3.6-5.5 3.6-3.3 0-6-2.8-6-6.2s2.7-6.2 6-6.2c1.9 0 3.2.8 3.9 1.5l2.7-2.7C16.8 2.5 14.6 1.5 12 1.5 6.8 1.5 2.6 5.8 2.6 11s4.2 9.5 9.4 9.5c5.4 0 9-3.8 9-9.2 0-.6-.1-1-.2-1.4H12z"/>
                    </svg>
                    Continue with Google
                  </button>
                </template>
              </form>

              <div class="mt-8 text-center text-sm font-medium">
                <span class="text-text-muted">{{ authMode === 'login' ? "Don't have an account?" : "Already have an account?" }} </span>
                <button @click="authMode = authMode === 'login' ? 'register' : 'login'" class="font-black text-primary-600 hover:underline">
                  {{ authMode === 'login' ? 'Sign Up' : 'Log In' }}
                </button>
              </div>
            </div>
          </Transition>
        </div>
       </Transition>
    </Teleport>

    <!-- Global Toast for Alerts -->
    <Toast 
      :show="!!error" 
      :message="error" 
      type="danger" 
      @close="error = ''" 
    />
  </div>
</template>

<style scoped>
.headline-gradient {
  background: linear-gradient(135deg, var(--color-primary-600) 0%, #B44CFF 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.4s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.zoom-enter-active { transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1); }
.zoom-leave-active { transition: all 0.3s ease-in; }
.zoom-enter-from { opacity: 0; transform: scale(0.9) translateY(20px); }
.zoom-leave-to { opacity: 0; transform: scale(0.95); }

.scroll-reveal,
[data-reveal] {
  opacity: 0;
  transform: translateY(24px);
  transition: opacity 0.8s cubic-bezier(0.22, 1, 0.36, 1), transform 0.8s cubic-bezier(0.22, 1, 0.36, 1);
}

.scroll-reveal.is-visible,
[data-reveal].is-visible {
  opacity: 1;
  transform: translateY(0);
}

.hero-shine {
  pointer-events: none;
  position: absolute;
  inset: -120% -20%;
  background: linear-gradient(110deg, rgba(255, 255, 255, 0) 30%, rgba(255, 255, 255, 0.35) 50%, rgba(255, 255, 255, 0) 70%);
  animation: hero-shine 6.8s ease-in-out infinite;
}

/* Custom Animations */
@keyframes fade-up {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes fade-right {
  from { opacity: 0; transform: translateX(40px); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes float {
  0% { transform: translateY(0px); }
  50% { transform: translateY(-15px); }
  100% { transform: translateY(0px); }
}

@keyframes pulse-slow {
  0%, 100% { opacity: 0.3; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.1); }
}

@keyframes bounce-slow {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

@keyframes hero-shine {
  0% { transform: translateX(-65%) rotate(4deg); opacity: 0; }
  16% { opacity: 1; }
  42% { transform: translateX(65%) rotate(4deg); opacity: 0; }
  100% { transform: translateX(65%) rotate(4deg); opacity: 0; }
}

.reveal-fade-up { animation: fade-up 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
.reveal-fade-up-2 { animation: fade-up 1s cubic-bezier(0.2, 0.8, 0.2, 1) 0.1s forwards; opacity: 0; }
.reveal-fade-up-3 { animation: fade-up 1s cubic-bezier(0.2, 0.8, 0.2, 1) 0.2s forwards; opacity: 0; }
.reveal-fade-up-4 { animation: fade-up 1s cubic-bezier(0.2, 0.8, 0.2, 1) 0.3s forwards; opacity: 0; }
.reveal-fade-right { animation: fade-right 1.2s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }

.animate-float { animation: float 6s ease-in-out infinite; }
.animate-pulse-slow { animation: pulse-slow 8s ease-in-out infinite; }
.animate-bounce-slow { animation: bounce-slow 4s ease-in-out infinite; }
.banner-delay { animation-delay: 2s; }

@media (prefers-reduced-motion: reduce) {
  .reveal-fade-up,
  .reveal-fade-up-2,
  .reveal-fade-up-3,
  .reveal-fade-up-4,
  .reveal-fade-right,
  .animate-float,
  .animate-pulse-slow,
  .animate-bounce-slow,
  .hero-shine,
  [data-reveal] {
    animation: none !important;
    transition: none !important;
    transform: none !important;
    opacity: 1 !important;
  }
}
</style>
