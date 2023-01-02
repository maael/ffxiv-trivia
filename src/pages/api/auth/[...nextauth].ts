import { load } from 'cheerio'
import NextAuth, { User } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import fetch from 'node-fetch'
import UserModel from '~/db/models/user'
import { getRandomArrayItem } from '~/util'

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
          gw2Account: string
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
      }
      return session
    },
    jwt: async ({ user, token }) => {
      if (user) {
        token.uid = user.id
        try {
          // eslint-disable-next-line @typescript-eslint/no-extra-semi
          ;(token as any).style = token.email
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
  credentials: Record<'username' | 'password' | 'gw2Account', string> | undefined
): Promise<User | null> {
  return new Promise(async (resolve, reject) => {
    if (!credentials) return reject(new Error('Credentials required'))
    if (credentials.password.length < 8) return reject(new Error('Password must be more than 8 characters'))
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const avatars = require('../../../../data/avatars.json') as string[]
    const lodestoneData = await getLodestoneData()
    const newUser = new UserModel({
      username: credentials.username,
      password: credentials.password,
      gw2Account: credentials.gw2Account,
      image: getRandomArrayItem(avatars),
      lodestoneData,
    })
    newUser.save((err) => {
      if (err) return reject(err)
      resolve({
        id: newUser._id.toString(),
        name: newUser.username,
        image: newUser.image,
        email: undefined,
      })
    })
  })
}

async function signinFlow(credentials: Record<'username' | 'password', string> | undefined): Promise<User | null> {
  if (!credentials) throw new Error('Credentials required')
  const user = await UserModel.findOne({ username: credentials.username })
  if (!user) throw new Error('No user')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const comparison = await (user as any).comparePassword(credentials.password)
  if (comparison) {
    const lodestoneData = await getLodestoneData()
    await UserModel.updateOne
    return {
      id: user._id.toString(),
      name: user.username,
      image: user.image,
      email: user.style,
    }
  } else {
    return null
  }
}

async function getLodestoneData() {
  const page = await fetch('https://na.finalfantasyxiv.com/lodestone/character/14985627/').then((r) => r.text())
  const $ = load(page)
  const race = $('.character-block__name').first().html()?.split('<br>')[0]?.trim()
  const name = $('.frame__chara__name').text().trim()
  const title = $('.frame__chara__title').text().trim()
  const world = $('.frame__chara__world').text().trim().split(' ')
  const imageUrl = new URL($('.frame__chara__face img').attr('src') || '')
  const image = `${imageUrl.protocol}//${imageUrl.host}${imageUrl.pathname}`
  const freeCompanyUrl = $('.character__freecompany__name h4 a').attr('href')
  const freeCompanyId = freeCompanyUrl?.split('/')[3]
  const freeCompanyName = $('.character__freecompany__name h4').text().trim()
  const freeCompanyCrest = $('.character__freecompany__crest__image')
    .children()
    .map((_idx, el) => $(el).attr('src'))
    .toArray()
  const data = {
    race,
    name,
    title,
    server: {
      world: world[0],
      dataCenter: world[1].replace('[', '').replace(']', '').trim(),
    },
    image,
    freeCompany: {
      url: freeCompanyUrl,
      id: freeCompanyId,
      name: freeCompanyName,
      crest: freeCompanyCrest,
    },
  }
  return data
}

export default NextAuth(authOptions)
