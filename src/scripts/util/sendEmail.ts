import nodemailer from 'nodemailer'
import subtract from 'date-fns/subHours'
import { Challenge, WithDoc } from '~/types'
import User from '../../db/models/user'
import Game from '../../db/models/games'

interface ChallengeResult {
  newChallenge: WithDoc<Challenge> | null
  existingChallenge: WithDoc<Challenge> | null
  winners: Winners | null
}

async function getStats() {
  const [users, games] = await Promise.all([
    User.find({ createdAt: { $gte: subtract(new Date(), 24) } }).count(),
    Game.find({ createdAt: { $gte: subtract(new Date(), 24) } }).count(),
  ])
  return { users, games }
}

export interface Winner {
  userId: null | string
  username: null | string
  image: null | string
  gw2Account: null | string
}
export type Winners = Record<'first' | 'second' | 'third' | 'entry', Winner | null>

export async function sendChallengeEmail(daily: ChallengeResult, weekly: ChallengeResult, monthly: ChallengeResult) {
  const client = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: 'matt.a.elphy@gmail.com',
      pass: process.env.EMAIL_APP_PASSWORD,
    },
  })

  const stats = await getStats()

  await client.sendMail({
    from: 'ffxiv-trivia-no-reply@gmail.com',
    to: 'matt.a.elphy@gmail.com',
    subject: '🎉 FFXIV Trivia Challenges and Winners',
    html: `
      <h1>FFXIV Trivia Challenges and Winners</h1>
      <h2>New users in last 24 hours</h2>
      <p>${stats.users}</p>
      <h2>New games in last 24 hours</h2>
      <p>${stats.games}</p>
      <h2>New Challenges</h2>
      ${challengeEntry('new', 'daily', daily.newChallenge)}
      ${challengeEntry('new', 'weekly', weekly.newChallenge)}
      ${challengeEntry('new', 'monthly', monthly.newChallenge)}
      <h2>Current Challenges</h2>
      ${challengeEntry('existing', 'daily', daily.existingChallenge)}
      ${challengeWinners(daily.winners)}
      ${challengeEntry('existing', 'weekly', weekly.existingChallenge)}
      ${challengeWinners(weekly.winners)}
      ${challengeEntry('existing', 'monthly', monthly.existingChallenge)}
      ${challengeWinners(monthly.winners)}
    `.trim(),
  })

  client.close()
}

function challengeEntry(type: 'new' | 'existing', challengeType: string, challenge?: WithDoc<Challenge> | null) {
  return challenge
    ? `<p><a href="https://ffxiv-trivia.mael.tech/leaderboard/${challenge._id}">${challenge.name}</a></p>`
    : `<p>No ${type} ${challengeType} challenge</p>`
}

function challengeWinners(winners: Winners | null) {
  if (!winners) return null
  const text = [
    winners.first ? challengeWinner('First', winners.first) : null,
    winners.second ? challengeWinner('Second', winners.second) : null,
    winners.third ? challengeWinner('Third', winners.third) : null,
    winners.entry ? challengeWinner('Entry', winners.entry) : null,
  ]
    .filter(Boolean)
    .join('\n')
  return text
    ? `
    <h3>Winners</h3>
    ${text}
  `
    : text
}

function challengeWinner(label: string, winner: Winner) {
  return winner.username
    ? `<p>${label}: <a href="https://ffxiv-trivia.mael.tech/user/${winner.username}">${winner.username} (${winner.gw2Account})</a></p>`
    : null
}
