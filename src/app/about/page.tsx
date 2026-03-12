import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export default async function AboutPage() {
  // Get site settings for about content
  let aboutContent, aboutTitle, missionStatement, teamDescription

  if (process.env.DATABASE_URL) {
    try {
      [aboutContent, aboutTitle, missionStatement, teamDescription] = await Promise.all([
        prisma.siteSettings.findUnique({ where: { key: 'about_content' } }),
        prisma.siteSettings.findUnique({ where: { key: 'about_title' } }),
        prisma.siteSettings.findUnique({ where: { key: 'mission_statement' } }),
        prisma.siteSettings.findUnique({ where: { key: 'team_description' } }),
      ])
    } catch (error) {
      console.warn('Failed to load about page settings:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white shadow-sm">
        <div className="container-custom py-4">
          <nav className="flex" aria-label="Navigacijski put">
            <ol className="inline-flex items-center space-x-1 md:space-x-3">
              <li className="inline-flex items-center">
                <Link 
                  href="/" 
                  className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-primary-600"
                >
                  <svg className="w-3 h-3 mr-2.5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path>
                  </svg>
                  Početna
                </Link>
              </li>
              <li aria-current="page">
                <div className="flex items-center">
                  <svg className="w-3 h-3 text-gray-400 mx-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                  </svg>
                  <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2">
                    O nama
                  </span>
                </div>
              </li>
            </ol>
          </nav>
        </div>
      </div>

      {/* About Content */}
      <div className="container-custom py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {aboutTitle?.value || 'O nama'}
            </h1>
            <div className="w-20 h-1 bg-primary-600 mx-auto"></div>
          </div>

          {/* Main Content */}
          <div className="prose prose-lg max-w-none mb-16">
            <div className="bg-white rounded-lg shadow-md p-8">
              <div className="whitespace-pre-line text-gray-700 leading-relaxed">
                {aboutContent?.value || `Welcome to Video Portal - your premier destination for engaging video stories and news content.

We are passionate about bringing you the latest stories, insights, and entertainment through the power of video. Our platform connects creators and audiences, fostering a community built around compelling visual storytelling.

Whether you're looking for breaking news, educational content, or entertainment, Video Portal provides a curated experience designed to inform, inspire, and engage.`}
              </div>
            </div>
          </div>

          {/* Mission Statement */}
          {missionStatement?.value && (
            <div className="mb-16">
              <div className="bg-primary-50 rounded-lg p-8 text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Naša misija</h2>
                <p className="text-lg text-gray-700 leading-relaxed">
                  {missionStatement.value}
                </p>
              </div>
            </div>
          )}

          {/* Team Section */}
          <div className="mb-16">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Naš tim</h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                {teamDescription?.value || 'We are a dedicated team of content creators, technologists, and storytellers working together to deliver exceptional video experiences.'}
              </p>
            </div>
          </div>

          {/* Contact CTA */}
          <div className="bg-gray-900 rounded-lg p-8 text-center text-white">
            <h2 className="text-2xl font-bold mb-4">Kontakt</h2>
            <p className="text-gray-300 mb-6">
              Imate pitanja ili želite saznati više o našoj platformi?
            </p>
            <Link 
              href="/contact"
              className="inline-block bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
            >
              Kontaktirajte nas
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export const metadata = {
  title: 'O nama - Video Portal',
  description: 'Saznajte više o Video Portalu i našoj misiji pružanja zanimljivog video sadržaja.',
}
