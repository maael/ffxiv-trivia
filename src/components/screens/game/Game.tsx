import * as React from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { EVENTS, Fathom } from '~/components/hooks/useFathom'
import { CHALLENGE, ChallengeOption } from '~/types'
import { OptionsProps } from './Start'
import Countdown from 'react-countdown'
import { FaTwitter } from 'react-icons/fa'
import cls from 'classnames'

export type Game = Array<
  ChallengeOption & {
    _id: string
    score?: null | number
  }
>

async function saveGame(gameType: CHALLENGE, gameId: string | undefined, game: Game, timeMs: number) {
  fetch('/api/internal/game', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      challenge: gameId,
      challengeType: gameType,
      totalScore: sumScore(game),
      timeMs,
    }),
  })
}

function sumScore(game: Game) {
  return game.reduce((acc, g) => acc + (g.score || 0), 0)
}

export interface TGame {
  _id: undefined | string
  name?: string
  prizes?: any
  settings?: any
  options: any[]
  error: string
}

const TimeLimit = React.memo(function TimeLimit({
  time,
  onComplete,
  isFinished,
}: {
  time: number
  onComplete: () => void
  isFinished: boolean
}) {
  return !isFinished && time ? (
    <Countdown
      date={Date.now() + time}
      renderer={(props) => {
        return `${props.formatted.hours === '00' ? '' : `${props.formatted.hours}:`}${props.formatted.minutes}:${
          props.formatted.seconds
        }`
      }}
      onComplete={onComplete}
    />
  ) : null
})

export default function GameScreen({
  options,
  gameType,
  gameId,
  fathom,
  reset,
  stopTimer,
  timer,
  questionTime,
  roundTime,
}: {
  options: any
  gameType: CHALLENGE
  gameId: string | undefined
  fathom: Fathom
  reset: () => Promise<TGame | undefined>
  stopTimer: () => void
  timer: {
    formatted: string
    differenceMs: number
  }
} & OptionsProps) {
  const { data: session } = useSession()
  const [game, setGame] = React.useState<Game>([options[0]])
  const [showFinished, setShowFinished] = React.useState(false)
  const maxRounds = options.length || 0
  const lastItem = game[game.length - 1]
  const total = sumScore(game)
  function isFinished(g: Game) {
    return g.length === maxRounds && g.every((gi) => typeof gi?.score === 'number')
  }
  const currentGameIsFinished = isFinished(game)
  React.useEffect(() => {
    fathom.trackGoal(EVENTS.StartGame, 0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const [questionVisible, setQuestionVisible] = React.useState(true)
  const onRoundLimitComplete = React.useCallback(() => {
    setGame((g) => {
      const last = { ...g[g.length - 1], score: 0 }
      const updatedGame = g.slice(0, -1).concat(last)
      const canFinish = isFinished(updatedGame)
      console.info('[round:limit]', { canFinish, updatedGame })
      if (canFinish) {
        stopTimer()
        fathom.trackGoal(EVENTS.FinishGame, 0)
        if (session) void saveGame(gameType, gameId, updatedGame, timer.differenceMs)
      }
      return updatedGame
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session])
  const onQuestionLimitComplete = React.useCallback(() => {
    console.info('[question:limit]')
    setQuestionVisible(false)
  }, [])
  const hasGuessed = typeof lastItem?.score === 'number'
  return (
    <div
      suppressHydrationWarning
      className="bg-black-brushed bg-gray-900 flex flex-col justify-center items-center flex-1 w-full relative"
    >
      <div className="bg-brown-brushed flex flex-col justify-center items-center gap-0 md:absolute top-4 right-4 text-white px-8 lg:px-12 lg:text-2xl pt-2 pb-4 text-lg rounded-lg my-4 md:my-0 mx-2 drop-shadow-xl">
        <div className="flex flex-col gap-1 sm:gap-10 lg:gap-0 justify-center lg:items-start items-center w-full">
          <div>
            Round: {game.length}/{maxRounds}
          </div>
          <div>Score: {total}</div>
          <div>
            Time:{' '}
            <span className="tabular-nums" style={{ fontFamily: 'Arial' }}>
              {timer.formatted}
            </span>
          </div>
        </div>
        {roundTime || questionTime ? (
          <div className="flex flex-col gap-1 sm:gap-10 lg:gap-0 justify-center lg:items-start items-center w-full">
            {roundTime ? (
              <div>
                Round Limit:{' '}
                <span className="tabular-nums" style={{ fontFamily: 'Arial' }}>
                  {typeof lastItem.score === 'number' ? (
                    '00:00'
                  ) : (
                    <TimeLimit
                      key={lastItem._id}
                      time={roundTime}
                      onComplete={onRoundLimitComplete}
                      isFinished={typeof lastItem.score === 'number'}
                    />
                  )}
                </span>
              </div>
            ) : null}
            {questionTime ? (
              <div className="tabular-nums" style={{ fontFamily: 'Arial' }}>
                Image Limit:{' '}
                <span className="tabular-nums" style={{ fontFamily: 'Arial' }}>
                  {typeof lastItem.score === 'number' ? (
                    '00:00'
                  ) : (
                    <TimeLimit
                      key={lastItem._id}
                      time={questionTime}
                      onComplete={onQuestionLimitComplete}
                      isFinished={typeof lastItem.score === 'number'}
                    />
                  )}
                </span>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
      <div className="flex flex-col gap-6 w-full h-full justify-start mt-2 sm:mt-0 sm:justify-center items-center text-white text-5xl sm:text-6xl">
        <h2 className={cls('text-center', { hidden: !questionVisible })}>{lastItem?.question}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full px-2 sm:px-10 text-4xl">
          {lastItem?.options.map((o) => (
            <button
              key={o.option}
              className={cls('bg-brown-brushed px-10 py-2 rounded-full opacity-90 hover:opacity-100', {
                'bg-green-600': hasGuessed && o.correct,
                'bg-red-600': hasGuessed && !o.correct,
              })}
              onClick={() => {
                const score = o.correct ? 1 : 0
                setGame((g) => {
                  const last = { ...g[g.length - 1], score }
                  const updatedGame = g.slice(0, -1).concat(last)
                  const canFinish = isFinished(updatedGame)
                  console.info('[guess]', { canFinish, updatedGame })
                  if (canFinish) {
                    stopTimer()
                    fathom.trackGoal(EVENTS.FinishGame, 0)
                    if (session) void saveGame(gameType, gameId, updatedGame, timer.differenceMs)
                  }
                  return updatedGame
                })
              }}
            >
              {o.option}
            </button>
          ))}
        </div>
      </div>
      {!showFinished && lastItem?.score !== null && lastItem?.score !== undefined && game.length <= maxRounds ? (
        <button
          className="z-50 isolate font-trajan bg-brown-brushed text-white left-auto sm:left-2 lg:left-auto lg:hover:scale-125 transition-transform flex flex-col absolute bottom-1.5 sm:bottom-0.5 lg:bottom-4 px-10 py-2 text-2xl lg:text-5xl drop-shadow-md rounded-full"
          onClick={() => {
            if (currentGameIsFinished) {
              setShowFinished(true)
            } else {
              setGame((g) => g.concat(options[game.length % options.length]))
            }
            setQuestionVisible(true)
          }}
        >
          {currentGameIsFinished ? 'Show Results' : 'Next'}
        </button>
      ) : null}
      {showFinished ? (
        <div className="bg-opacity-50 bg-gray-800 absolute inset-0 flex flex-col justify-center items-center">
          <div className="flex flex-col text-white bg-brown-brushed drop-shadow-xl px-2 md:px-10 py-5 justify-center text-xl md:w-1/3 m-3">
            <h2 className="font-trajan text-5xl text-center">Finished!</h2>
            <h3 className="font-trajan text-3xl text-center">Time: {timer.formatted}</h3>
            <div className="flex flex-col gap-1 mt-3 mb-1">
              {game.map((g, i) => (
                <div key={g._id} className="flex flex-row items-center gap-2 bg-black-brushed px-3 md:px-10 py-2">
                  <div className="pr-2 md:pr-5">{i + 1}.</div>
                  <div className="overflow-hidden text-ellipsis flex-1 whitespace-nowrap font-trajan">{g.question}</div>
                  <div className="text-right flex-0">Correct: {g.score ? 'Y' : 'N'}</div>
                </div>
              ))}
            </div>
            <div className="font-trajan text-4xl text-center py-3">
              Total: {total} / {maxRounds}
            </div>
            <div className="flex flex-col xl:flex-row justify-center items-center mt-1 gap-2 xl:gap-5 text-lg lg:text-2xl">
              {gameType === CHALLENGE.random ? (
                <button
                  className="w-full lg:w-auto font-trajan bg-black-brushed text-white hover:scale-110 transition-transform flex flex-col px-10 py-2 drop-shadow-md rounded-full items-center"
                  onClick={async () => {
                    fathom.trackGoal(EVENTS.StartGame, 0)
                    const newGame = await reset()
                    setGame([newGame?.options[0]].filter(Boolean))
                  }}
                >
                  New Game
                </button>
              ) : gameId ? (
                <Link href={`/leaderboard/${gameId}`}>
                  <a className="w-full lg:w-auto font-trajan bg-black-brushed text-white hover:scale-110 transition-transform flex flex-col px-10 py-2 drop-shadow-md rounded-full items-center">
                    Leaderboard
                  </a>
                </Link>
              ) : null}
              <a
                className="w-full lg:w-auto font-trajan bg-black-brushed text-white hover:scale-110 transition-transform flex flex-row gap-2 justify-center items-center px-10 py-2 drop-shadow-md rounded-full"
                target="_blank"
                rel="noreferrer"
                href={`https://twitter.com/intent/tweet?text=I just got ${total} points in FFXIV Trivia${
                  gameType === CHALLENGE.daily
                    ? "'s daily challenge"
                    : gameType === CHALLENGE.weekly
                    ? "'s weekly challenge"
                    : gameType === CHALLENGE.monthly
                    ? "'s monthly challenge"
                    : ''
                } in ${
                  timer.formatted
                }! Think you can beat me?&hashtags=FFXIV,ffxivtrivia&url=https://ffxiv-trivia.mael.tech/&via=GW2Geoguesser`}
              >
                <FaTwitter /> Tweet <span className="hidden lg:block">score</span>
              </a>
              <Link href="/">
                <a className="w-full lg:w-auto font-trajan bg-black-brushed text-white hover:scale-110 transition-transform flex flex-col px-10 py-2 drop-shadow-md rounded-full items-center">
                  Finish
                </a>
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
