import NextAuth, { User } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import UserModel, { User as TUser } from '~/db/models/user'
import { WithDoc } from '~/types'
import { getLodestoneData } from '~/util/lodestone'

export const authOptions: Parameters<typeof NextAuth>[2] = {
  providers: [
    CredentialsProvider({
      name: 'Account',
      credentials: {
        username: { label: 'Username', type: 'text', placeholder: 'Username...' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, _req) {
        const expandedCredentials = credentials as typeof credentials & {
          type: 'register' | 'signin'
          lodestoneUrl: string
        }
        if (expandedCredentials?.type === 'register') {
          return registerFlow(expandedCredentials)
        } else {
          return signinFlow(credentials)
        }
      },
    }),
  ],
  callbacks: {
    session: async ({ session, token }) => {
      if (session?.user) {
        // eslint-disable-next-line @typescript-eslint/no-extra-semi
        ;(session.user as any).id = token.uid
        // eslint-disable-next-line @typescript-eslint/no-extra-semi
        ;(session.user as any).style = token.style
        // eslint-disable-next-line @typescript-eslint/no-extra-semi
        ;(session.user as any).lodestoneData = token.lodestoneData
      }
      return session
    },
    jwt: async ({ user, token }) => {
      if (user) {
        token.uid = user.id
        try {
          // eslint-disable-next-line @typescript-eslint/no-extra-semi
          const data = JSON.parse(token.email || '{}')
          ;(token as any).lodestoneData = data.lodestoneData
          // eslint-disable-next-line @typescript-eslint/no-extra-semi
          ;(token as any).style = data.style
        } catch (e) {
          console.warn('[jwt:style:warn]', e.message)
        } finally {
          token.email = undefined
        }
      }
      return token
    },
  },
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/auth',
  },
}

async function registerFlow(
  credentials: Record<'username' | 'password' | 'lodestoneUrl', string> | undefined
): Promise<User | null> {
  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (resolve, reject) => {
    if (!credentials) return reject(new Error('Credentials required'))
    if (credentials.password.length < 8) return reject(new Error('Password must be more than 8 characters'))
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const lodestoneData = await getLodestoneData(
      credentials.lodestoneUrl || 'https://na.finalfantasyxiv.com/lodestone/character/14985627/'
    )
    const newUser = new UserModel({
      username: credentials.username,
      password: credentials.password,
      lodestoneUrl: credentials.lodestoneUrl,
      image: lodestoneData.image,
      lodestoneData,
    })
    newUser.save((err) => {
      if (err) return reject(err)
      resolve({
        id: newUser._id.toString(),
        name: newUser.username,
        image: lodestoneData.image,
        email: JSON.stringify({ lodestoneData, style: undefined }),
      })
    })
  })
}

async function signinFlow(credentials: Record<'username' | 'password', string> | undefined): Promise<User | null> {
  if (!credentials) throw new Error('Credentials required')
  const user = await UserModel.findOne<WithDoc<TUser>>({ username: credentials.username })
  if (!user) throw new Error('No user')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const comparison = await (user as any).comparePassword(credentials.password)
  if (comparison) {
    const lodestoneData = await getLodestoneData(user.lodestoneUrl)
    await user.updateOne({ lodestoneData })
    return {
      id: user._id.toString(),
      name: user.username,
      image: lodestoneData.image || user.image,
      email: JSON.stringify({ lodestoneData: { ...user.lodestoneData, ...lodestoneData }, style: user.style }),
    }
  } else {
    return null
  }
}

export default NextAuth(authOptions)
