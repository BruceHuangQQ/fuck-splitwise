export default defineNuxtRouteMiddleware((to) => {
  if (to.path.startsWith("/api/auth")) return

  const { status } = useAuth()
  if (status.value === "loading") return

  if (status.value !== "authenticated" && to.path !== "/login") {
    return navigateTo("/login")
  }
})
