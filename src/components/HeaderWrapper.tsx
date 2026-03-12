import Header from './Header'
import { getSiteSettings } from '@/lib/services/settingsService'

export default async function HeaderWrapper() {
  const { logoUrl, siteName } = await getSiteSettings()

  return <Header logoUrl={logoUrl} siteName={siteName} />
}
