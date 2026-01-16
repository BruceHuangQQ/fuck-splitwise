// @ts-expect-error - defineNuxtRouteMiddleware is auto-imported by Nuxt (available at runtime)
export default defineNuxtRouteMiddleware((to) => {
    // Skip auth check for login page and auth API routes
    if (to.path === "/login" || to.path.startsWith("/api/auth/")) {
      return;
    }
    
    // @ts-expect-error - useAuth is auto-imported by Nuxt (available at runtime)
    const { status } = useAuth();
    
    // Only redirect if we're definitely unauthenticated (not loading)
    if (status.value === "unauthenticated") {
      // @ts-expect-error - navigateTo is auto-imported by Nuxt (available at runtime)
      return navigateTo("/login");
    }
    
    // If status is still loading, let the page render (it will handle the loading state)
  });