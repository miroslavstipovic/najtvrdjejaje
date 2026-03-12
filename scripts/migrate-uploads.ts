#!/usr/bin/env tsx

/**
 * Migrate Uploaded Files
 * This script helps migrate uploaded files from local development to production.
 * It can upload files to your hosting provider or cloud storage.
 */

import fs from 'fs'
import path from 'path'

interface FileInfo {
  filename: string
  path: string
  size: number
  type: 'image' | 'video' | 'other'
}

async function scanUploads(): Promise<FileInfo[]> {
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
  const files: FileInfo[] = []

  if (!fs.existsSync(uploadsDir)) {
    console.log('📁 No uploads directory found')
    return files
  }

  function scanDirectory(dir: string, relativePath: string = '') {
    const items = fs.readdirSync(dir)
    
    for (const item of items) {
      const fullPath = path.join(dir, item)
      const relativeFilePath = path.join(relativePath, item)
      const stat = fs.statSync(fullPath)

      if (stat.isDirectory()) {
        scanDirectory(fullPath, relativeFilePath)
      } else {
        const ext = path.extname(item).toLowerCase()
        let type: 'image' | 'video' | 'other' = 'other'
        
        if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(ext)) {
          type = 'image'
        } else if (['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm'].includes(ext)) {
          type = 'video'
        }

        files.push({
          filename: item,
          path: relativeFilePath,
          size: stat.size,
          type
        })
      }
    }
  }

  scanDirectory(uploadsDir)
  return files
}

async function generateUploadScript(files: FileInfo[]) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const scriptPath = path.join(process.cwd(), 'exports', `upload-migration-${timestamp}.sh`)
  
  let script = `#!/bin/bash
# Upload Migration Script
# Generated on ${new Date().toISOString()}
# 
# This script uploads your local files to your hosting provider via FTP
# Update the FTP credentials below before running

# FTP Configuration (update these values)
FTP_HOST="185.164.35.72"
FTP_USER="flashba"
FTP_PASS="PmvB0Zyu0v3YiS"
FTP_REMOTE_DIR="/public_html/uploads"

# Create remote uploads directory
echo "Creating remote uploads directory..."
lftp -c "open ftp://$FTP_USER:$FTP_PASS@$FTP_HOST; mkdir -p $FTP_REMOTE_DIR"

# Upload files
echo "Uploading files..."

`

  for (const file of files) {
    const localPath = path.join('public', 'uploads', file.path)
    const remotePath = `$FTP_REMOTE_DIR/${file.path.replace(/\\/g, '/')}`
    const remoteDir = path.dirname(remotePath)
    
    script += `# Upload ${file.filename} (${(file.size / 1024).toFixed(1)}KB)\n`
    script += `lftp -c "open ftp://$FTP_USER:$FTP_PASS@$FTP_HOST; mkdir -p ${remoteDir}; put '${localPath}' -o '${remotePath}'";\n\n`
  }

  script += `echo "Upload completed!"
echo "Files uploaded: ${files.length}"
echo "Total size: ${(files.reduce((sum, f) => sum + f.size, 0) / 1024 / 1024).toFixed(2)}MB"
`

  // Ensure exports directory exists
  const exportsDir = path.join(process.cwd(), 'exports')
  if (!fs.existsSync(exportsDir)) {
    fs.mkdirSync(exportsDir, { recursive: true })
  }

  fs.writeFileSync(scriptPath, script)
  
  // Make script executable (Unix/Linux/Mac)
  try {
    fs.chmodSync(scriptPath, 0o755)
  } catch (error) {
    // Ignore on Windows
  }

  return scriptPath
}

async function generatePowerShellScript(files: FileInfo[]) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const scriptPath = path.join(process.cwd(), 'exports', `upload-migration-${timestamp}.ps1`)
  
  let script = `# Upload Migration Script (PowerShell)
# Generated on ${new Date().toISOString()}
# 
# This script uploads your local files to your hosting provider via FTP
# Update the FTP credentials below before running

# FTP Configuration (update these values)
$FtpHost = "185.164.35.72"
$FtpUser = "flashba"
$FtpPass = "PmvB0Zyu0v3YiS"
$RemoteBaseDir = "/public_html/uploads"

Write-Host "Starting file upload migration..." -ForegroundColor Green

`

  for (const file of files) {
    const localPath = path.join('public', 'uploads', file.path).replace(/\\/g, '/')
    const remotePath = `$RemoteBaseDir/${file.path.replace(/\\/g, '/')}`
    
    script += `
# Upload ${file.filename} (${(file.size / 1024).toFixed(1)}KB)
try {
    $LocalFile = "${localPath}"
    $RemoteFile = "${remotePath}"
    
    $FtpRequest = [System.Net.FtpWebRequest]::Create("ftp://$FtpHost$RemoteFile")
    $FtpRequest.Method = [System.Net.WebRequestMethods+Ftp]::UploadFile
    $FtpRequest.Credentials = New-Object System.Net.NetworkCredential($FtpUser, $FtpPass)
    
    $FileContent = [System.IO.File]::ReadAllBytes($LocalFile)
    $FtpRequest.ContentLength = $FileContent.Length
    
    $RequestStream = $FtpRequest.GetRequestStream()
    $RequestStream.Write($FileContent, 0, $FileContent.Length)
    $RequestStream.Close()
    
    $Response = $FtpRequest.GetResponse()
    Write-Host "✓ Uploaded: ${file.filename}" -ForegroundColor Green
    $Response.Close()
} catch {
    Write-Host "✗ Failed to upload: ${file.filename} - $_" -ForegroundColor Red
}
`
  }

  script += `
Write-Host "Upload completed!" -ForegroundColor Green
Write-Host "Files processed: ${files.length}" -ForegroundColor Cyan
Write-Host "Total size: ${(files.reduce((sum, f) => sum + f.size, 0) / 1024 / 1024).toFixed(2)}MB" -ForegroundColor Cyan
`

  fs.writeFileSync(scriptPath, script)
  return scriptPath
}

async function migrateUploads() {
  try {
    console.log('🚀 Starting uploads migration scan...\n')

    const files = await scanUploads()

    if (files.length === 0) {
      console.log('📁 No uploaded files found to migrate')
      return
    }

    console.log('📊 Upload Files Summary:')
    console.log(`   📄 Total Files: ${files.length}`)
    
    const byType = files.reduce((acc, file) => {
      acc[file.type] = (acc[file.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    Object.entries(byType).forEach(([type, count]) => {
      const icon = type === 'image' ? '🖼️' : type === 'video' ? '🎥' : '📄'
      console.log(`   ${icon} ${type}: ${count}`)
    })
    
    const totalSize = files.reduce((sum, file) => sum + file.size, 0)
    console.log(`   📦 Total Size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`)
    console.log()

    // Generate migration scripts
    console.log('📝 Generating migration scripts...')
    
    const bashScript = await generateUploadScript(files)
    const psScript = await generatePowerShellScript(files)
    
    console.log(`   🐧 Bash script: ${bashScript}`)
    console.log(`   🪟 PowerShell script: ${psScript}`)
    console.log()

    // Generate file listing
    const listingPath = path.join(process.cwd(), 'exports', 'uploaded-files-list.json')
    fs.writeFileSync(listingPath, JSON.stringify(files, null, 2))
    console.log(`   📋 File listing: ${listingPath}`)
    console.log()

    console.log('✅ Migration scripts generated successfully!')
    console.log()
    console.log('📝 Next steps:')
    console.log('   1. Review the generated scripts')
    console.log('   2. Update FTP credentials if needed')
    console.log('   3. Run the appropriate script for your OS:')
    console.log(`      - Linux/Mac: chmod +x ${bashScript} && ${bashScript}`)
    console.log(`      - Windows: ${psScript}`)
    console.log('   4. Verify files are uploaded correctly')
    console.log()
    console.log('🔗 Alternative: Manual upload via cPanel File Manager')
    console.log('   - Login to cPanel: http://185.164.35.72:2082')
    console.log('   - Go to File Manager → public_html')
    console.log('   - Create "uploads" folder')
    console.log('   - Upload files from your local public/uploads directory')

  } catch (error) {
    console.error('❌ Migration scan failed:', error)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  migrateUploads()
}

export { migrateUploads, scanUploads }
