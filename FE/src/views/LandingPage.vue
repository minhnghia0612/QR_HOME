<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
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

const router = useRouter()
const authStore = useAuthStore()

// --- Modal Logic ---
const showAuthModal = ref(false)
const authMode = ref<'login' | 'register'>('login')
const showPassword = ref(false)
const loading = ref(false)
const error = ref('')

// Form State
const loginForm = ref({ username: '', password: '' })
const registerForm = ref({
  username: '',
  email: '',
  password: '',
})

function openAuth(mode: 'login' | 'register') {
  authMode.value = mode
  showAuthModal.value = true
  error.value = ''
}

function closeAuth() {
  showAuthModal.value = false
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
    window.location.href = '/admin/dashboard'
    
    closeAuth()
  } catch (err) {
    console.error('Redirect error:', err)
    window.location.href = '/admin/dashboard'
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
  if (authStore.isAuthenticated) {
     // Optional: Redirect if already logged in? 
     // router.push('/admin/dashboard')
  }
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
    <section class="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
      <div class="mx-auto max-w-7xl px-6">
        <div class="flex flex-col lg:flex-row items-center gap-16">
          <!-- Left Content -->
          <div class="flex-1 text-center lg:text-left">
            <div class="inline-flex items-center rounded-full bg-primary-50 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-primary-600 mb-6">
              NEXT-GEN DIGITAL MENUS
            </div>
            <h1 class="text-5xl lg:text-7xl font-black leading-[1.1] tracking-tight mb-8">
              Power Your Business with <span class="text-primary-600">Dynamic QR Menus.</span>
            </h1>
            <p class="text-lg lg:text-xl text-text-secondary leading-relaxed mb-10 max-w-2xl mx-auto lg:mx-0">
              Ditch the printing costs and go fully digital. Create, manage, and scale beautiful contactless menus for any service in minutes. Engage your customers instantly.
            </p>
            
            <div class="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <button @click="openAuth('register')" class="group flex items-center gap-3 rounded-2xl bg-primary-600 px-8 py-4 text-base font-black text-white shadow-button hover:brightness-110 active:scale-95 transition-all">
                Get Started for Free
                <ArrowRight class="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </button>
              <!-- <button class="flex items-center gap-3 rounded-2xl border border-border px-8 py-4 text-base font-bold text-text-primary hover:bg-surface-input transition-all">
                <Play class="h-4 w-4 fill-primary-600 text-primary-600" />
                See how it works
              </button> -->
            </div>
          </div>

          <!-- Right Image Decor -->
          <!-- <div class="flex-1 relative"> -->
            <!-- <div class="relative z-10 rounded-[3rem] overflow-hidden shadow-2xl border-8 border-white">
              <img src="https://images.unsplash.com/photo-1544161515-436cead54573?q=80&w=2070&auto=format&fit=crop" alt="Spa Experience" class="w-full h-auto" />
            </div> -->
            <!-- Floating Tablet Preview -->
            <!-- <div class="absolute -bottom-10 -left-10 z-20 w-3/4 rounded-3xl overflow-hidden shadow-2xl border-4 border-white hidden sm:block">
              <img src="https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?q=80&w=2070&auto=format&fit=crop" alt="Digital Menu Preview" />
            </div> -->
            <!-- Decor -->
            <!-- <div class="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] bg-primary-600/5 blur-[120px] rounded-full"></div> -->
          <!-- </div> -->
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="py-24 bg-[#F8FAFC]">
      <div class="mx-auto max-w-7xl px-6">
        <div class="text-center mb-16">
          <h2 class="text-3xl lg:text-4xl font-black mb-4">Crafted for Excellence</h2>
          <p class="text-text-muted font-medium">Sophisticated tools to manage your spa's digital identity.</p>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div v-for="f in features" :key="f.title" class="group p-8 rounded-[32px] bg-white border border-border/50 shadow-sm hover:shadow-xl transition-all duration-500">
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
    <section class="py-32 overflow-hidden">
      <div class="mx-auto max-w-7xl px-6">
        <div class="flex flex-col lg:flex-row items-center gap-24">
          <div class="flex-1 space-y-12">
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
          
          <div class="flex-1">
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
.fade-enter-active, .fade-leave-active { transition: opacity 0.4s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.zoom-enter-active { transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1); }
.zoom-leave-active { transition: all 0.3s ease-in; }
.zoom-enter-from { opacity: 0; transform: scale(0.9) translateY(20px); }
.zoom-leave-to { opacity: 0; transform: scale(0.95); }
</style>
