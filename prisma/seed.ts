import { PrismaClient } from '../src/generated/prisma'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đ]/g, 'd')
    .replace(/[ž]/g, 'z')
    .replace(/[č]/g, 'c')
    .replace(/[ć]/g, 'c')
    .replace(/[š]/g, 's')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

async function main() {
  console.log('🥚 Starting Najtvrđe Jaje database seed...')
  console.log('🗑️  Cleaning existing data...')

  await prisma.match.deleteMany()
  await prisma.round.deleteMany()
  await prisma.ranking.deleteMany()
  await prisma.competitorMedia.deleteMany()
  await prisma.competitor.deleteMany()
  await prisma.competition.deleteMany()

  const hashedPassword = await bcrypt.hash('admin123', 10)
  await prisma.admin.upsert({
    where: { email: 'admin@najtvrdjejaje.com' },
    update: { name: 'Admin Najtvrđe Jaje' },
    create: {
      email: 'admin@najtvrdjejaje.com',
      password: hashedPassword,
      name: 'Admin Najtvrđe Jaje',
    },
  })
  console.log('👤 Admin: admin@najtvrdjejaje.com / admin123')

  // ============================================
  // CATEGORIES & ARTICLES
  // ============================================

  const categories = [
    { name: 'Vijesti', slug: 'vijesti', description: 'Najnovije vijesti o natjecanjima i događanjima', order: 1 },
    { name: 'Intervjui', slug: 'intervjui', description: 'Razgovori sa natjecateljima i stručnjacima', order: 2 },
    { name: 'Tehnike', slug: 'tehnike', description: 'Savjeti i tehnike za uspjeh u natjecanju', order: 3 },
    { name: 'Galerija', slug: 'galerija', description: 'Fotografije i video zapisi sa natjecanja', order: 4 },
  ]
  for (const c of categories) {
    await prisma.category.upsert({ where: { slug: c.slug }, update: {}, create: c })
  }

  const vijesti = await prisma.category.findUnique({ where: { slug: 'vijesti' } })
  if (vijesti) {
    await prisma.article.upsert({
      where: { slug: 'dobrodosli-na-najtvrdje-jaje' },
      update: {},
      create: {
        title: 'Dobrodošli na portal Najtvrđe Jaje!',
        slug: 'dobrodosli-na-najtvrdje-jaje',
        content: 'Dobrodošli na službeni portal natjecanja "Najtvrđe Jaje"!\n\nPratite rezultate, statistike, rang liste i vijesti.',
        excerpt: 'Službeni portal natjecanja Najtvrđe Jaje',
        isPublished: true,
        isFeatured: true,
        categoryId: vijesti.id,
      },
    })
  }

  // ============================================
  // 28 COMPETITORS
  // ============================================

  const competitorData = [
    { name: 'Anto Brnada', city: 'Vitez', familyGroup: 'Brnada', bio: 'Uzgajivač, višestruki finalist i pobjednik natjecanja' },
    { name: 'Mirko Brnada', city: 'Vitez', familyGroup: 'Brnada', bio: 'Iz obitelji Brnada, poznate po tvrdim jajima' },
    { name: 'Ana Anić', city: 'Tuzla', familyGroup: null, bio: 'Nova zvijezda na sceni. Brzo napreduje u rangovima.' },
    { name: 'Marko Marković', city: 'Sarajevo', familyGroup: 'Marković', bio: 'Veteran natjecatelj sa 5 godina iskustva.' },
    { name: 'Ivan Marković', city: 'Sarajevo', familyGroup: 'Marković', bio: 'Brat od Marka, jednako tvrd kao i on.' },
    { name: 'Petar Petrović', city: 'Mostar', familyGroup: null, bio: 'Legenda lokalnog natjecanja.' },
    { name: 'Josip Josipović', city: 'Zenica', familyGroup: null, bio: 'Mladi natjecatelj s velikim ambicijama.' },
    { name: 'Luka Lukić', city: 'Travnik', familyGroup: 'Lukić', bio: 'Poznat po čeličnim jajima iz Travnika.' },
    { name: 'Mate Lukić', city: 'Travnik', familyGroup: 'Lukić', bio: 'Bratić Lukićev, obiteljska tradicija.' },
    { name: 'Filip Filipović', city: 'Vitez', familyGroup: null, bio: 'Debitant na sceni ali s jakim rezultatima.' },
    { name: 'Jakov Jakovljević', city: 'Busovača', familyGroup: null, bio: 'Stari majstor tucanja jaja.' },
    { name: 'Tomislav Tomić', city: 'Livno', familyGroup: 'Tomić', bio: 'Prvak Livanjskog kraja tri godine zaredom.' },
    { name: 'Ante Tomić', city: 'Livno', familyGroup: 'Tomić', bio: 'Mlađi brat Tomislava.' },
    { name: 'Stjepan Stjepanović', city: 'Široki Brijeg', familyGroup: null, bio: 'Reprezentativac Širokog Brijega.' },
    { name: 'Gabriel Gabrielić', city: 'Slavonski Brod', country: 'Hrvatska', familyGroup: null, bio: 'Gostujući natjecatelj iz Hrvatske.' },
    { name: 'Martin Martinović', city: 'Kiseljak', familyGroup: null, bio: 'Lokalni prvak Kiseljaka.' },
    { name: 'Nikola Nikolić', city: 'Banja Luka', familyGroup: 'Nikolić', bio: 'Banjalučki majstor za tvrda jaja.' },
    { name: 'Darko Nikolić', city: 'Banja Luka', familyGroup: 'Nikolić', bio: 'Sin Nikole, nasljeđuje obiteljsku tradiciju.' },
    { name: 'Ivica Ivić', city: 'Čapljina', familyGroup: null, bio: 'Heroj iz Čapljine, nikad ne odustaje.' },
    { name: 'Drago Dragović', city: 'Brčko', familyGroup: null, bio: 'Brčanski šampion u tucanju jaja.' },
    { name: 'Zdravko Zdravković', city: 'Doboj', familyGroup: null, bio: 'Poznat po neortodoksnim tehnikama.' },
    { name: 'Boris Borić', city: 'Prijedor', familyGroup: null, bio: 'Tri puta finalist regionalnog natjecanja.' },
    { name: 'Miroslav Mirić', city: 'Bijeljina', familyGroup: null, bio: 'Legenda bijeljinskog natjecanja.' },
    { name: 'Vinko Vinković', city: 'Orašje', familyGroup: null, bio: 'Uzgajivač premium jaja iz Posavine.' },
    { name: 'Robert Robertović', city: 'Konjic', familyGroup: null, bio: 'Konjički majstor, kamen od jajeta.' },
    { name: 'Zoran Zorić', city: 'Cazin', familyGroup: null, bio: 'Krajinski natjecatelj s čvrstim jajima.' },
    { name: 'Damir Damirović', city: 'Goražde', familyGroup: null, bio: 'Goraždanski prvak 2025.' },
    { name: 'Emir Emirović', city: 'Gradačac', familyGroup: null, bio: 'Gradačački šampion, poznat po tehnici.' },
  ]

  const competitors: { id: number; name: string }[] = []
  for (const data of competitorData) {
    const slug = generateSlug(data.name)
    const c = await prisma.competitor.create({
      data: {
        name: data.name,
        slug,
        city: data.city,
        country: data.country || 'Bosna i Hercegovina',
        familyGroup: data.familyGroup || null,
        bio: data.bio,
        isActive: true,
      },
    })
    competitors.push({ id: c.id, name: c.name })
  }
  console.log(`🥚 Created ${competitors.length} competitors`)

  // ============================================
  // HISTORICAL TOURNAMENT - Uskrsnji turnir 2025
  // ============================================

  const comp2025 = await prisma.competition.create({
    data: {
      name: 'Uskršnji turnir 2025',
      slug: 'uskrsnji-turnir-2025',
      description: 'Tradicionalni uskršnji turnir u tucanju jaja 2025. godine u Vitezu.',
      startDate: new Date('2025-04-20'),
      endDate: new Date('2025-04-20'),
      location: 'Vitez, BiH',
      status: 'completed',
      tournamentType: 'group_knockout',
      eggsPerCompetitor: 30,
      numberOfGroups: 4,
      isPublished: true,
      isFeatured: false,
    },
  })

  // 16 competitors for 2025 tournament in 4 groups of 4
  const t2025ids = competitors.slice(0, 16).map(c => c.id)
  const groups2025 = [
    t2025ids.slice(0, 4),
    t2025ids.slice(4, 8),
    t2025ids.slice(8, 12),
    t2025ids.slice(12, 16),
  ]

  let roundCounter = 0
  for (let gi = 0; gi < groups2025.length; gi++) {
    const group = groups2025[gi]
    const groupNumber = gi + 1
    const groupLabel = String.fromCharCode(64 + groupNumber)

    // Round-robin: 3 rounds for 4 competitors
    for (let r = 1; r <= 3; r++) {
      roundCounter++
      const round = await prisma.round.create({
        data: {
          competitionId: comp2025.id,
          roundNumber: roundCounter,
          name: `Grupa ${groupLabel} - ${r}. kolo`,
          roundType: 'group',
          pointMultiplier: 1,
          groupNumber,
        },
      })

      // Generate 2 matches per round for 4 competitors
      const pairs: [number, number][] = []
      if (r === 1) { pairs.push([group[0], group[3]], [group[1], group[2]]) }
      else if (r === 2) { pairs.push([group[0], group[2]], [group[3], group[1]]) }
      else { pairs.push([group[0], group[1]], [group[2], group[3]]) }

      for (const [home, away] of pairs) {
        const hBroken = Math.floor(Math.random() * 8) + 3
        const aBroken = Math.floor(Math.random() * 8) + 3
        const result = hBroken > aBroken ? 'home_win' : (aBroken > hBroken ? 'away_win' : (Math.random() > 0.5 ? 'home_win' : 'away_win'))
        await prisma.match.create({
          data: {
            competitionId: comp2025.id,
            roundId: round.id,
            homeCompetitorId: home,
            awayCompetitorId: away,
            homeEggsBroken: hBroken,
            awayEggsBroken: aBroken,
            result,
            status: 'completed',
          },
        })
      }
    }

    // Create rankings for group
    for (const cid of group) {
      await prisma.ranking.create({
        data: {
          competitionId: comp2025.id,
          competitorId: cid,
          position: 0,
          points: 0,
          weightedPoints: 0,
          wins: 0,
          losses: 0,
          eggsBroken: 0,
          eggsLost: 0,
        },
      })
    }
  }

  console.log(`🏆 Created historical tournament: ${comp2025.name} with ${groups2025.length} groups`)

  // ============================================
  // UPCOMING TOURNAMENT - Uskrsnji turnir 2026
  // ============================================

  await prisma.competition.create({
    data: {
      name: 'Uskršnji turnir 2026',
      slug: 'uskrsnji-turnir-2026',
      description: 'Veliki uskršnji turnir u tucanju jaja 2026. Svi natjecatelji iz cijele regije.',
      startDate: new Date('2026-04-05'),
      endDate: new Date('2026-04-05'),
      location: 'Vitez, BiH',
      status: 'upcoming',
      tournamentType: 'group_knockout',
      eggsPerCompetitor: 30,
      numberOfGroups: 8,
      isPublished: true,
      isFeatured: true,
    },
  })

  console.log('📅 Created upcoming tournament: Uskršnji turnir 2026')

  // ============================================
  // SITE SETTINGS
  // ============================================

  const siteSettings = [
    { key: 'site_name', value: 'Najtvrđe Jaje' },
    { key: 'site_description', value: 'Portal za natjecanje u najtvrđem jajetu - Bergerov sustav, rang liste, rezultati, vijesti' },
    { key: 'contact_email', value: 'info@najtvrdjejaje.com' },
    { key: 'contact_phone', value: '+387 33 123 456' },
    { key: 'contact_address', value: 'Vitez, Bosna i Hercegovina' },
    { key: 'office_hours', value: 'Ponedjeljak - Petak: 09:00 - 17:00' },
    { key: 'about_title', value: 'O Projektu Najtvrđe Jaje' },
    { key: 'about_content', value: 'Dobrodošli na portal "Najtvrđe Jaje" - vašu centralnu destinaciju za sve što se tiče najuzbudljivijeg natjecanja u BiH!' },
    { key: 'mission_statement', value: 'Promovirati i očuvati tradiciju natjecanja u najtvrđem jajetu koristeći fer Bergerov sustav natjecanja.' },
    { key: 'footer_about', value: 'Portal za praćenje natjecanja u najtvrđem jajetu. Bergerov sustav, rang liste, statistike, rezultati.' },
    { key: 'copyright_text', value: '© 2026 Matiela Agencija. Sva prava pridržana.' },
    { key: 'facebook_url', value: 'https://facebook.com/najtvrdjejaje' },
    { key: 'instagram_url', value: 'https://instagram.com/najtvrdjejaje' },
    { key: 'youtube_url', value: 'https://youtube.com/@najtvrdjejaje' },
  ]

  for (const s of siteSettings) {
    await prisma.siteSettings.upsert({ where: { key: s.key }, update: { value: s.value }, create: s })
  }

  // Ad settings
  await prisma.adSettings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      enabledOnHomepage: false,
      enabledOnArticles: false,
      enabledOnCategories: false,
      enabledOnCompetitions: false,
      enabledOnMatches: false,
    },
  })

  console.log('\n🎉 Seeding finished!')
  console.log('📧 Admin login: admin@najtvrdjejaje.com / admin123')
  console.log(`🥚 ${competitors.length} natjecatelja (s obiteljskim grupama: Brnada, Marković, Lukić, Tomić, Nikolić)`)
  console.log('🏆 1 završeni turnir (Uskršnji 2025), 1 nadolazeći (Uskršnji 2026)')
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
