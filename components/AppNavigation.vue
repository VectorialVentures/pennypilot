<template>
  <nav class="glass border-b border-white/20 sticky top-0 z-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-16">
        <!-- Logo -->
        <div class="flex items-center">
          <NuxtLink to="/" class="flex items-center space-x-2">
            <div class="w-8 h-8 bg-gradient-to-r from-primary-500 to-accent-500 rounded-lg flex items-center justify-center">
              <span class="text-white font-bold text-lg">S</span>
            </div>
            <span class="text-xl font-bold gradient-text">PennyPilot</span>
          </NuxtLink>
        </div>

        <!-- Desktop Navigation -->
        <div class="hidden md:block">
          <div class="ml-10 flex items-baseline space-x-4">
            <NuxtLink
              v-for="item in navigation"
              :key="item.name"
              :to="item.href"
              :class="[
                $route.path === item.href ? 'nav-link-active' : 'nav-link'
              ]"
            >
              <component :is="item.icon" class="w-4 h-4 mr-2" />
              {{ item.name }}
            </NuxtLink>
          </div>
        </div>

        <!-- User Menu -->
        <div class="flex items-center space-x-4">
          <!-- Plan Badge -->
          <div v-if="subscription.currentPlan.value" class="hidden sm:block">
            <div class="flex items-center space-x-2">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    :class="getPlanBadgeClass(subscription.currentPlan.value.name)">
                {{ subscription.currentPlan.value.name }}
              </span>
              <div v-if="subscription.isTrialing.value && subscription.trialDaysLeft.value > 0" 
                   class="text-xs text-orange-600 font-medium">
                {{ subscription.trialDaysLeft.value }} days left
              </div>
            </div>
          </div>

          <!-- Notifications -->
          <button
            class="p-2 text-secondary-600 hover:text-primary-600 transition-colors duration-200"
            @click="showNotifications = !showNotifications"
          >
            <BellIcon class="w-6 h-6" />
          </button>

          <!-- User Dropdown -->
          <div class="relative">
            <button
              @click="showUserMenu = !showUserMenu"
              class="flex items-center space-x-2 p-2 rounded-lg hover:bg-secondary-50 transition-colors duration-200"
            >
              <img
                :src="user?.user_metadata?.avatar_url || '/default-avatar.png'"
                :alt="user?.user_metadata?.full_name || 'User'"
                class="w-8 h-8 rounded-full"
              />
              <ChevronDownIcon class="w-4 h-4 text-secondary-600" />
            </button>

            <!-- User Dropdown Menu -->
            <div
              v-show="showUserMenu"
              class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-strong border border-secondary-100 py-1 z-50"
            >
              <div class="px-4 py-2 border-b border-secondary-100">
                <p class="text-sm font-medium text-secondary-900">{{ user?.user_metadata?.full_name || 'User' }}</p>
                <p class="text-sm text-secondary-500">{{ user?.email }}</p>
              </div>
              <NuxtLink
                v-for="item in userMenuItems"
                :key="item.name"
                :to="item.href"
                class="flex items-center px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50 transition-colors duration-200"
                @click="showUserMenu = false"
              >
                <component :is="item.icon" class="w-4 h-4 mr-3" />
                {{ item.name }}
              </NuxtLink>
              <button
                @click="handleSignOut"
                class="flex items-center w-full px-4 py-2 text-sm text-danger-600 hover:bg-danger-50 transition-colors duration-200"
              >
                <ArrowRightOnRectangleIcon class="w-4 h-4 mr-3" />
                Sign out
              </button>
            </div>
          </div>
        </div>

        <!-- Mobile menu button -->
        <div class="md:hidden">
          <button
            @click="showMobileMenu = !showMobileMenu"
            class="p-2 rounded-lg text-secondary-600 hover:text-primary-600 transition-colors duration-200"
          >
            <Bars3Icon v-if="!showMobileMenu" class="w-6 h-6" />
            <XMarkIcon v-else class="w-6 h-6" />
          </button>
        </div>
      </div>

      <!-- Mobile Navigation -->
      <div v-show="showMobileMenu" class="md:hidden border-t border-white/20 pt-4 pb-4">
        <div class="space-y-1">
          <NuxtLink
            v-for="item in navigation"
            :key="item.name"
            :to="item.href"
            :class="[
              'flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200',
              $route.path === item.href
                ? 'text-primary-600 bg-primary-50'
                : 'text-secondary-600 hover:text-primary-600 hover:bg-secondary-50'
            ]"
            @click="showMobileMenu = false"
          >
            <component :is="item.icon" class="w-4 h-4 mr-3" />
            {{ item.name }}
          </NuxtLink>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import {
  HomeIcon,
  ChartBarIcon,
  CogIcon,
  UserIcon,
  BellIcon,
  ChevronDownIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
  CreditCardIcon
} from '@heroicons/vue/24/outline'

const supabase = useSupabaseClient()
const router = useRouter()
const user = useSupabaseUser()

const showUserMenu = ref(false)
const showMobileMenu = ref(false)
const showNotifications = ref(false)

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Portfolio', href: '/portfolio', icon: ChartBarIcon },
  { name: 'Settings', href: '/settings', icon: CogIcon },
]

const userMenuItems = [
  { name: 'Profile', href: '/profile', icon: UserIcon },
  { name: 'Subscription', href: '/subscription', icon: CreditCardIcon },
]

const subscription = useSubscription()

const getPlanBadgeClass = (planName: string) => {
  switch (planName?.toLowerCase()) {
    case 'free':
      return 'bg-gray-100 text-gray-800'
    case 'basic':
      return 'bg-blue-100 text-blue-800'
    case 'premium':
      return 'bg-purple-100 text-purple-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const handleSignOut = async () => {
  showUserMenu.value = false
  await supabase.auth.signOut()
  await router.push('/')
}

// Close dropdowns when clicking outside
onMounted(() => {
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.relative')) {
      showUserMenu.value = false
      showNotifications.value = false
    }
  })
})
</script>
