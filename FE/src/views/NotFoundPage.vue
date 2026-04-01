<template>
  <div class="flex min-h-screen flex-col items-center justify-center bg-surface-dim px-4 text-center">
    <h1 class="text-8xl font-bold text-navy-200">404</h1>
    <p class="mt-4 text-xl font-semibold text-navy-900">Page Not Found</p>
    <p class="mt-2 text-text-muted">The page you're looking for doesn't exist.</p>
    <RouterLink
      to="/"
      class="mt-6 rounded-xl bg-navy-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-navy-800"
    >
      Go Home
    </RouterLink>
  </div>
</template>
