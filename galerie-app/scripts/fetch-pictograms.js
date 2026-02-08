import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3'
import { writeFileSync } from 'fs'

const s3Client = new S3Client({
  endpoint: process.env.MINIO_ENDPOINT || 'https://cdn.kerjean.net',
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY || 'admin',
    secretAccessKey: process.env.MINIO_SECRET_KEY || ''
  },
  forcePathStyle: true // Important pour Minio
})

async function fetchPictograms() {
  try {
    console.log('🔍 Fetching pictograms from Minio...')

    const command = new ListObjectsV2Command({
      Bucket: process.env.MINIO_BUCKET || 'media',
      Prefix: process.env.MINIO_PREFIX || 'artwork/pictograms/'
    })

    const response = await s3Client.send(command)

    if (!response.Contents) {
      console.log('⚠️  No files found')
      return
    }

    const pictograms = response.Contents
      .filter(obj => obj.Key?.endsWith('.svg'))
      .map(obj => {
        const filename = obj.Key.split('/').pop()
        const id = filename.replace('.svg', '')
        const name = id
          .replace(/-/g, ' ')
          .replace(/_/g, ' ')
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')

        return {
          id,
          name,
          filename,
          url: `https://cdn.kerjean.net/${obj.Key}`,
          size: obj.Size,
          lastModified: obj.LastModified.toISOString()
        }
      })
      .sort((a, b) => a.name.localeCompare(b.name))

    const manifest = {
      pictograms,
      lastUpdated: new Date().toISOString(),
      totalCount: pictograms.length
    }

    // Écrire le manifest dans public/
    writeFileSync(
      './public/pictograms-manifest.json',
      JSON.stringify(manifest, null, 2)
    )

    console.log(`✅ Successfully fetched ${pictograms.length} pictograms`)
    console.log(`📄 Manifest written to public/pictograms-manifest.json`)

  } catch (error) {
    console.error('❌ Error fetching pictograms:', error)
    process.exit(1)
  }
}

fetchPictograms()
