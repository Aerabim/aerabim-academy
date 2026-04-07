import { createServerClient } from '@/lib/supabase/server'
import SplashPage from '@/components/SplashPage'

export default async function Home() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  return <SplashPage isLoggedIn={!!user} />
}
