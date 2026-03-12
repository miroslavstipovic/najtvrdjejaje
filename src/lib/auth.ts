import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export interface AdminTokenPayload {
  adminId: number
  email: string
  name: string
  iat: number
  exp: number
}

export function verifyToken(token: string): AdminTokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AdminTokenPayload
    return decoded
  } catch (error) {
    console.error('Token verification failed:', error)
    return null
  }
}

export function generateToken(admin: { id: number; email: string; name: string }): string {
  return jwt.sign(
    {
      adminId: admin.id,
      email: admin.email,
      name: admin.name,
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  )
}

export function isTokenExpired(token: string): boolean {
  try {
    const decoded = jwt.decode(token) as AdminTokenPayload
    if (!decoded || !decoded.exp) return true
    
    const currentTime = Math.floor(Date.now() / 1000)
    return decoded.exp < currentTime
  } catch (error) {
    return true
  }
}

export function getTokenExpirationTime(token: string): Date | null {
  try {
    const decoded = jwt.decode(token) as AdminTokenPayload
    if (!decoded || !decoded.exp) return null
    
    return new Date(decoded.exp * 1000)
  } catch (error) {
    return null
  }
}
