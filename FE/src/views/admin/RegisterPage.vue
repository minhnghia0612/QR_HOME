<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth.store'
import { Eye, EyeOff, UserPlus, ArrowRight } from 'lucide-vue-next'
import { qrConfigApi } from '@/api/qr-config.api'
import { categoriesApi } from '@/api/categories.api'

const router = useRouter()
const authStore = useAuthStore()
const { t } = useI18n({ useScope: 'global' })

const form = ref({
  username: '',
  fullName: '',
  spaName: '',
  email: '',
  password: '',
})

const showPassword = ref(false)
const loading = ref(false)
const error = ref('')
const agreeToTerms = ref(false)

async function handleRegister() {
  if (!form.value.username || !form.value.password || !form.value.fullName || !form.value.email) {
    error.value = t('admin.register.errors.required')
    return
  }
  if (!agreeToTerms.value) {
    error.value = t('admin.register.errors.terms')
    return
  }

  loading.value = true
  error.value = ''
  
  try {
    const success = await authStore.register(form.value)
    if (success) {
      // Redirect to settings since they just registered (and likely need to finish setup)
      router.push('/admin/qr')
    } else {
      error.value = t('admin.register.errors.failed')
    }
  } catch (err: any) {
    error.value = err.response?.data?.message || t('admin.register.errors.failedShort')
    setTimeout(() => { error.value = '' }, 4000)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-[#F8FAFC] px-4 py-12">
    <div class="w-full max-w-md">
      <!-- Header -->
      <div class="mb-10 text-center">
        <h2 class="text-xs font-black uppercase tracking-[0.2em] text-text-muted">{{ t('admin.register.brand') }}</h2>
        <p class="mt-2 text-xs font-medium text-text-muted">{{ t('admin.register.brandTagline') }}</p>
      </div>

      <!-- Card -->
      <div class="rounded-[40px] bg-white p-10 shadow-[0_20px_50px_rgba(0,0,0,0.04)]">
        <div class="mb-8">
          <h1 class="text-2xl font-black tracking-tight text-text-primary">{{ t('admin.register.title') }}</h1>
          <p class="mt-2 text-sm font-medium text-text-muted">{{ t('admin.register.subtitle') }}</p>
        </div>

        <form @submit.prevent="handleRegister" class="space-y-6">
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
              class="fixed top-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4"
            >
              <div class="rounded-2xl bg-[#0F172A] px-6 py-4 text-center text-sm font-bold text-white shadow-2xl ring-1 ring-white/10">
                <div class="flex items-center justify-center gap-3">
                  <span class="flex h-5 w-5 items-center justify-center rounded-full bg-danger text-[10px] text-white">✕</span>
                  {{ error }}
                </div>
              </div>
            </div>
          </Transition>

          <!-- Full Name -->
          <div>
            <label class="mb-2 block text-[10px] font-black uppercase tracking-wider text-text-muted">{{ t('admin.common.fullName') }}</label>
            <div class="relative">
              <span class="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </span>
              <input
                v-model="form.fullName"
                type="text"
                :placeholder="t('admin.register.fullNamePlaceholder')"
                class="w-full rounded-2xl border-0 bg-[#F1F5F9] py-4 pl-12 pr-4 text-sm font-bold text-text-primary outline-none transition-all focus:bg-white focus:ring-2 focus:ring-primary-600"
              />
            </div>
          </div>

          <!-- Spa Name -->
          <div>
            <label class="mb-2 block text-[10px] font-black uppercase tracking-wider text-text-muted">{{ t('admin.common.spaName') }}</label>
            <div class="relative">
              <span class="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </span>
              <input
                v-model="form.spaName"
                type="text"
                :placeholder="t('admin.register.spaNamePlaceholder')"
                class="w-full rounded-2xl border-0 bg-[#F1F5F9] py-4 pl-12 pr-4 text-sm font-bold text-text-primary outline-none transition-all focus:bg-white focus:ring-2 focus:ring-primary-600"
              />
            </div>
          </div>

          <!-- Username (used for Login) -->
           <div>
            <label class="mb-2 block text-[10px] font-black uppercase tracking-wider text-text-muted">Username</label>
            <div class="relative">
              <span class="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              <input
                v-model="form.username"
                type="text"
                :placeholder="t('admin.register.usernamePlaceholder')"
                class="w-full rounded-2xl border-0 bg-[#F1F5F9] py-4 pl-12 pr-4 text-sm font-bold text-text-primary outline-none transition-all focus:bg-white focus:ring-2 focus:ring-primary-600"
              />
            </div>
          </div>

          <!-- Email -->
          <div>
            <label class="mb-2 block text-[10px] font-black uppercase tracking-wider text-text-muted">{{ t('admin.common.email') }}</label>
            <div class="relative">
              <span class="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </span>
              <input
                v-model="form.email"
                type="email"
                :placeholder="t('admin.register.emailPlaceholder')"
                class="w-full rounded-2xl border-0 bg-[#F1F5F9] py-4 pl-12 pr-4 text-sm font-bold text-text-primary outline-none transition-all focus:bg-white focus:ring-2 focus:ring-primary-600"
              />
            </div>
          </div>

          <!-- Password -->
          <div>
            <label class="mb-2 block text-[10px] font-black uppercase tracking-wider text-text-muted">{{ t('admin.register.createPassword') }}</label>
            <div class="relative">
              <span class="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </span>
              <input
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="••••••••••••"
                class="w-full rounded-2xl border-0 bg-[#F1F5F9] py-4 pl-12 pr-12 text-sm font-bold text-text-primary outline-none transition-all focus:bg-white focus:ring-2 focus:ring-primary-600"
              />
              <button
                type="button"
                class="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                @click="showPassword = !showPassword"
              >
                <Eye v-if="!showPassword" class="h-4 w-4" />
                <EyeOff v-else class="h-4 w-4" />
              </button>
            </div>
          </div>

          <!-- Terms -->
          <div class="flex items-start gap-3">
            <input
              v-model="agreeToTerms"
              type="checkbox"
              id="terms"
              class="mt-1 h-4 w-4 rounded border-0 bg-[#F1F5F9] text-primary-600 transition-all focus:ring-primary-600"
            />
            <label for="terms" class="text-xs font-medium leading-relaxed text-text-muted">
              {{ t('admin.register.agreePrefix') }} <a href="#" class="font-bold text-primary-600 hover:underline">{{ t('admin.register.terms') }}</a> {{ t('admin.register.and') }} <a href="#" class="font-bold text-primary-600 hover:underline">{{ t('admin.register.privacy') }}</a> {{ t('admin.register.agreeSuffix') }}
            </label>
          </div>

          <!-- Submit -->
          <button
            type="submit"
            :disabled="loading"
            class="flex w-full items-center justify-center gap-3 rounded-[20px] bg-primary-600 py-4 text-sm font-black text-white shadow-[0_10px_20px_rgba(37,99,235,0.2)] transition-all hover:bg-primary-700 active:scale-[0.98] disabled:opacity-70 disabled:cursor-wait"
          >
            <template v-if="!loading">
              {{ t('admin.register.createAccount') }}
              <ArrowRight class="h-4 w-4" />
            </template>
            <template v-else>
              <div class="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white"></div>
              {{ t('admin.register.creating') }}
            </template>
          </button>
        </form>

        <div class="mt-8 text-center text-sm font-medium">
          <span class="text-text-muted">{{ t('admin.register.haveAccount') }} </span>
          <RouterLink to="/admin/login" class="font-black text-primary-600 hover:underline">{{ t('admin.register.logIn') }}</RouterLink>
        </div>
      </div>

      <div class="mt-12 text-center">
        <p class="text-[10px] font-black uppercase tracking-[0.3em] text-text-muted opacity-30">{{ t('admin.register.footerTagline') }}</p>
      </div>
    </div>
  </div>
</template>
