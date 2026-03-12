import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('=== Upload Test Debug ===')
    
    const formData = await request.formData()
    const file = formData.get('image') as File
    
    console.log('File received:', {
      name: file?.name,
      size: file?.size,
      type: file?.type
    })

    if (!file) {
      return NextResponse.json({
        status: 'error',
        message: 'No file received'
      })
    }

    // Test the upload endpoint
    const uploadFormData = new FormData()
    uploadFormData.append('image', file)

    const uploadResponse = await fetch(`${request.nextUrl.origin}/api/upload/image`, {
      method: 'POST',
      body: uploadFormData
    })

    const uploadResult = await uploadResponse.json()
    
    console.log('Upload response:', {
      status: uploadResponse.status,
      result: uploadResult
    })

    return NextResponse.json({
      status: 'success',
      upload_response_status: uploadResponse.status,
      upload_result: uploadResult,
      file_info: {
        name: file.name,
        size: file.size,
        type: file.type
      }
    })

  } catch (error) {
    console.error('Upload test error:', error)
    return NextResponse.json({
      status: 'error',
      message: 'Upload test failed',
      error: (error as any)?.message
    }, { status: 500 })
  }
}
