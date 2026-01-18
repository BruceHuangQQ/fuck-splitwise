export default defineNuxtRouteMiddleware((to) => {
  if (to.path.startsWith('/api/_auth')) return
  if (to.path.startsWith('/api/auth/')) return

  const { loggedIn, ready } = useUserSession()
  if (!ready.value) return

  if (!loggedIn.value && to.path !== '/login') {
    return navigateTo('/login')
  }
})
