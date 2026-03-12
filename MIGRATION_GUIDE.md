# Complete Migration Guide: Local to Production

This guide will help you migrate all your local development data to your production database on flash.ba hosting.

## 📋 Overview

The migration process involves:
1. **Exporting** your local database data
2. **Setting up** your production database
3. **Importing** data to production
4. **Migrating** uploaded files
5. **Testing** the production environment

## 🚀 Step 1: Export Local Data

First, export all your local development data:

```bash
# Export all local data to JSON files
pnpm migrate:export

# Or run directly with tsx
tsx scripts/export-local-data.ts
```

This will create:
- `exports/latest-export.json` - Complete data export
- `exports/local-data-export-[timestamp].json` - Timestamped backup
- Individual files for each data type (admins, categories, articles, settings)

**What gets exported:**
- ✅ Admin users (with hashed passwords)
- ✅ Categories and their relationships
- ✅ Articles with all content and metadata
- ✅ Site settings and configuration
- ✅ Timestamps and relationships preserved

## 🗄️ Step 2: Set Up Production Database

### Option A: Using the Setup Guide (Recommended)

Follow the complete setup in `DATABASE_SETUP_FLASH_BA.md`:

1. **Access cPanel:**
   - URL: `http://185.164.35.72:2082`
   - Username: `flashba`
   - Password: `PmvB0Zyu0v3YiS`

2. **Create Database:**
   - Database name: `flashba_video_portal`
   - Username: `flashba_dbuser`
   - Password: [create strong password]

3. **Configure Vercel:**
   ```
   DATABASE_URL=mysql://flashba_dbuser:YOUR_PASSWORD@185.164.35.72:3306/flashba_video_portal?sslaccept=strict
   ```

4. **Deploy Schema:**
   ```bash
   vercel env pull .env.local
   pnpm db:generate
   pnpm db:push
   ```

### Option B: Manual SQL Setup

Run the SQL file in phpMyAdmin:
```bash
# Use the provided SQL file
cat flash-ba-database-setup.sql
```

## 📥 Step 3: Import Data to Production

**Important:** Make sure your `DATABASE_URL` environment variable points to your production database before running the import.

```bash
# Import using latest export
pnpm migrate:import

# Or import specific export file
pnpm migrate:import exports/local-data-export-2024-01-15T10-30-00.json

# Or run directly
tsx scripts/import-to-production.ts
```

**What happens during import:**
1. 📂 Categories are imported first (maintaining relationships)
2. ⚙️ Site settings are updated/created
3. 👤 Admin users are imported (passwords re-hashed for security)
4. 📰 Articles are imported with updated category references
5. 🔗 All relationships and references are preserved

**Safety Features:**
- ✅ Upsert operations (update if exists, create if new)
- ✅ Relationship mapping (old IDs → new IDs)
- ✅ Password security (re-hashing)
- ✅ Duplicate prevention by unique fields (email, slug)

## 📁 Step 4: Migrate Uploaded Files

If you have uploaded images or videos in your local `public/uploads` directory:

```bash
# Scan and generate upload scripts
pnpm migrate:uploads

# Or run directly
tsx scripts/migrate-uploads.ts
```

This generates:
- **Bash script** (`upload-migration-[timestamp].sh`) for Linux/Mac
- **PowerShell script** (`upload-migration-[timestamp].ps1`) for Windows
- **File listing** (`uploaded-files-list.json`) for reference

### Upload Methods:

#### Method 1: FTP Scripts (Automated)
```bash
# Linux/Mac
chmod +x exports/upload-migration-[timestamp].sh
./exports/upload-migration-[timestamp].sh

# Windows PowerShell
.\exports\upload-migration-[timestamp].ps1
```

#### Method 2: cPanel File Manager (Manual)
1. Login to cPanel: `http://185.164.35.72:2082`
2. Open File Manager → `public_html`
3. Create `uploads` folder
4. Upload files from your local `public/uploads` directory

#### Method 3: FTP Client
- **Host:** `185.164.35.72` or `ftp.flash.ba`
- **Username:** `flashba`
- **Password:** `PmvB0Zyu0v3YiS`
- **Directory:** `/public_html/uploads`

## 🧪 Step 5: Test Production Environment

After migration, test your production application:

### 1. Database Connection Test
Visit: `https://your-domain.vercel.app/api/test-db`

### 2. Admin Panel Test
1. Go to: `https://your-domain.vercel.app/admin`
2. Login with your migrated admin credentials
3. Test creating/editing content

### 3. Content Display Test
1. Visit your homepage
2. Check category pages
3. Verify article pages load correctly
4. Test image/video displays

### 4. Data Integrity Check
```bash
# Connect to production and verify counts
vercel env pull .env.local
tsx -e "
import { PrismaClient } from './src/generated/prisma';
const prisma = new PrismaClient();
(async () => {
  const counts = {
    admins: await prisma.admin.count(),
    categories: await prisma.category.count(),
    articles: await prisma.article.count(),
    settings: await prisma.siteSettings.count()
  };
  console.log('Production Data Counts:', counts);
  await prisma.\$disconnect();
})();
"
```

## 🔧 Troubleshooting

### Database Connection Issues
```bash
# Test connection
tsx -e "
import { PrismaClient } from './src/generated/prisma';
const prisma = new PrismaClient();
prisma.\$connect().then(() => console.log('✅ Connected')).catch(console.error);
"
```

### Import Failures
- **Duplicate key errors:** Normal for upsert operations
- **Foreign key errors:** Check category relationships
- **Connection timeouts:** Retry with smaller batches

### File Upload Issues
- **FTP errors:** Check credentials and network connectivity
- **Permission errors:** Ensure upload directory has write permissions
- **Large files:** Consider uploading in batches

### Common Solutions
1. **SSL Issues:** Try DATABASE_URL without SSL parameters
2. **Timeout Issues:** Increase connection timeout in Prisma
3. **Memory Issues:** Import data in smaller batches
4. **Permission Issues:** Check database user privileges

## 📊 Migration Checklist

- [ ] Local data exported successfully
- [ ] Production database created and configured
- [ ] Vercel environment variables updated
- [ ] Database schema deployed (`pnpm db:push`)
- [ ] Data imported to production (`pnpm migrate:import`)
- [ ] Uploaded files migrated (`pnpm migrate:uploads`)
- [ ] Admin login tested
- [ ] Content display verified
- [ ] Image/video uploads working
- [ ] All functionality tested

## 🔐 Post-Migration Security

1. **Change Admin Passwords:**
   - Login to admin panel
   - Update all admin user passwords
   - Use strong, unique passwords

2. **Review Site Settings:**
   - Update contact information
   - Verify email addresses
   - Check domain-specific settings

3. **Test Backups:**
   - Set up regular database backups
   - Test backup restoration process
   - Document backup procedures

## 📞 Support

### Migration Issues
- Check Vercel deployment logs
- Review database connection settings
- Verify environment variables

### Hosting Issues
- Contact flash.ba support for server-related problems
- Use cPanel for database management
- Check server resource usage

### Application Issues
- Review application logs
- Test API endpoints individually
- Check Prisma client generation

---

## 🎉 Success!

Your local development data has been successfully migrated to production! Your flash.ba video portal is now live with all your content, users, and settings.

**Next Steps:**
1. Set up regular backups
2. Monitor application performance
3. Plan content updates and maintenance
4. Consider implementing additional security measures

Happy publishing! 🚀
