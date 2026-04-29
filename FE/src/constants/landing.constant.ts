import { QrCode, Layout, BarChart3 } from 'lucide-vue-next'

export const LANDING_FEATURES = [
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
