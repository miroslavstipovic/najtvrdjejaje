import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import Image from 'next/image'

export default async function DynamicFooter() {
  // Get footer settings
  let siteName, siteDescription, contactEmail, contactPhone, socialFacebook, socialTwitter, socialInstagram, socialYoutube, socialLinkedin, socialTiktok, copyrightText, footerAbout, logoUrl

  if (process.env.PRISMA_POSTGRES) {
    try {
      [
        siteName,
        siteDescription,
        contactEmail,
        contactPhone,
        socialFacebook,
        socialTwitter,
        socialInstagram,
        socialYoutube,
        socialLinkedin,
        socialTiktok,
        copyrightText,
        footerAbout,
        logoUrl,
      ] = await Promise.all([
        prisma.siteSettings.findUnique({ where: { key: 'site_name' } }),
        prisma.siteSettings.findUnique({ where: { key: 'site_description' } }),
        prisma.siteSettings.findUnique({ where: { key: 'contact_email' } }),
        prisma.siteSettings.findUnique({ where: { key: 'contact_phone' } }),
        prisma.siteSettings.findUnique({ where: { key: 'social_facebook' } }),
        prisma.siteSettings.findUnique({ where: { key: 'social_twitter' } }),
        prisma.siteSettings.findUnique({ where: { key: 'social_instagram' } }),
        prisma.siteSettings.findUnique({ where: { key: 'social_youtube' } }),
        prisma.siteSettings.findUnique({ where: { key: 'social_linkedin' } }),
        prisma.siteSettings.findUnique({ where: { key: 'social_tiktok' } }),
        prisma.siteSettings.findUnique({ where: { key: 'copyright_text' } }),
        prisma.siteSettings.findUnique({ where: { key: 'footer_about' } }),
        prisma.siteSettings.findUnique({ where: { key: 'logo_url' } }),
      ])
    } catch (error) {
      console.warn('Failed to load footer settings:', error)
      // All variables will be undefined, which is handled below
    }
  }

  return (
    <footer className="bg-primary-800 text-cream-100">
      <div className="container-custom py-16 sm:py-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 lg:gap-12">
          <div className="space-y-4">
            {/* Logo/Branding */}
            <Link href="/" className="inline-block mb-4">
              {logoUrl?.value ? (
                <Image
                  src={logoUrl.value}
                  alt={siteName?.value || 'Najtvrđe Jaje'}
                  width={200}
                  height={80}
                  className="h-16 w-auto object-contain brightness-110"
                />
              ) : (
                <h3 className="text-2xl sm:text-3xl font-bold text-gold-400">
                  🥚 {siteName?.value || 'Najtvrđe Jaje'}
                </h3>
              )}
            </Link>
            <p className="text-cream-200 text-base sm:text-lg leading-relaxed">
              {footerAbout?.value || siteDescription?.value || 'Portal za natjecanje u najtvrđem jajetu - rezultati, rang liste i vijesti.'}
            </p>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-xl sm:text-2xl font-semibold mb-6 text-gold-400">Brze poveznice</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/" className="text-cream-200 hover:text-gold-300 transition-colors text-base sm:text-lg inline-flex items-center min-h-[44px]">
                  Početna
                </Link>
              </li>
              <li>
                <Link href="/natjecatelji" className="text-cream-200 hover:text-gold-300 transition-colors text-base sm:text-lg inline-flex items-center min-h-[44px]">
                  Natjecatelji
                </Link>
              </li>
              <li>
                <Link href="/turniri" className="text-cream-200 hover:text-gold-300 transition-colors text-base sm:text-lg inline-flex items-center min-h-[44px]">
                  Turniri
                </Link>
              </li>
              <li>
                <Link href="/rang-lista" className="text-cream-200 hover:text-gold-300 transition-colors text-base sm:text-lg inline-flex items-center min-h-[44px]">
                  Rang lista
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-cream-200 hover:text-gold-300 transition-colors text-base sm:text-lg inline-flex items-center min-h-[44px]">
                  O nama
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-cream-200 hover:text-gold-300 transition-colors text-base sm:text-lg inline-flex items-center min-h-[44px]">
                  Kontakt
                </Link>
              </li>
            </ul>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-xl sm:text-2xl font-semibold mb-6 text-gold-400">Kontakt</h3>
            <div className="text-cream-200 space-y-3">
              {contactEmail?.value && (
                <p className="text-base sm:text-lg text-cream-200">
                  E-pošta: <a href={`mailto:${contactEmail.value}`} className="text-cream-100 hover:text-gold-300 transition-colors">
                    {contactEmail.value}
                  </a>
                </p>
              )}
              {contactPhone?.value && (
                <p className="text-base sm:text-lg text-cream-200">
                  Telefon: <a href={`tel:${contactPhone.value}`} className="text-cream-100 hover:text-gold-300 transition-colors">
                    {contactPhone.value}
                  </a>
                </p>
              )}
              {(socialFacebook?.value || socialTwitter?.value || socialInstagram?.value || socialYoutube?.value || socialLinkedin?.value || socialTiktok?.value) && (
                <div className="pt-4">
                  <p className="text-sm font-medium text-cream-300 mb-3">Pratite nas:</p>
                  <div className="flex flex-wrap gap-3">
                    {socialFacebook?.value && (
                      <Link href={socialFacebook.value} target="_blank" className="tap-target bg-primary-700 hover:bg-gold-600 text-cream-200 hover:text-white rounded-xl transition-colors px-4 py-2">Facebook</Link>
                    )}
                    {socialTwitter?.value && (
                      <Link href={socialTwitter.value} target="_blank" className="tap-target bg-primary-700 hover:bg-gold-600 text-cream-200 hover:text-white rounded-xl transition-colors px-4 py-2">Twitter</Link>
                    )}
                    {socialInstagram?.value && (
                      <Link href={socialInstagram.value} target="_blank" className="tap-target bg-primary-700 hover:bg-gold-600 text-cream-200 hover:text-white rounded-xl transition-colors px-4 py-2">Instagram</Link>
                    )}
                    {socialYoutube?.value && (
                      <Link href={socialYoutube.value} target="_blank" className="tap-target bg-primary-700 hover:bg-gold-600 text-cream-200 hover:text-white rounded-xl transition-colors px-4 py-2">YouTube</Link>
                    )}
                    {socialLinkedin?.value && (
                      <Link href={socialLinkedin.value} target="_blank" className="tap-target bg-primary-700 hover:bg-gold-600 text-cream-200 hover:text-white rounded-xl transition-colors px-4 py-2">LinkedIn</Link>
                    )}
                    {socialTiktok?.value && (
                      <Link href={socialTiktok.value} target="_blank" className="tap-target bg-primary-700 hover:bg-gold-600 text-cream-200 hover:text-white rounded-xl transition-colors px-4 py-2">TikTok</Link>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="border-t border-primary-600 mt-12 pt-10 text-center">
          <p className="text-cream-300 text-base sm:text-lg">
            © 2026 Matiela Agencija. Sva prava pridržana.
          </p>
        </div>
      </div>
    </footer>
  )
}
