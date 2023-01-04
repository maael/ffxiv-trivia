import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import * as React from 'react'
import { FaBroom, FaEye, FaEyeSlash, FaPencilAlt, FaPlusSquare, FaSave, FaSpinner } from 'react-icons/fa'
import cls from 'classnames'
import { ADMINS } from '~/util'

function getSelectValues(select: HTMLSelectElement) {
  const result: any = []
  const options = select && select.options
  let opt

  for (let i = 0, iLen = options.length; i < iLen; i++) {
    opt = options[i]

    if (opt.selected) {
      result.push(opt.value || opt.text)
    }
  }
  return result
}

export default function Questions() {
  const { data } = useSession()
  return ADMINS.includes(`${data?.user?.name}`) ? (
    <AuthenticatedQuestions />
  ) : (
    <div className="text-center my-5 text-red-600 text-4xl">You cannot edit questions</div>
  )
}

function AuthenticatedQuestions() {
  const [optionCount, setOptionCount] = React.useState(0)
  const { data = [], refetch } = useQuery({
    queryKey: ['questions'],
    queryFn: () => fetch('/api/internal/challenge').then((r) => r.json()),
  })
  const [isSaving, setIsSaving] = React.useState(false)
  return (
    <div className="flex flex-col justify-center items-center mt-5 max-w-2xl w-full mx-auto gap-2">
      <h1 className="text-4xl text-center">Questions</h1>
      <form
        className="bg-brown-brushed w-full mx-2 justify-center items-center rounded-md drop-shadow-lg px-4 py-2 gap-2 flex flex-col font-sans"
        onSubmit={async (e) => {
          e.preventDefault()
          if ((e.nativeEvent as any).submitter.name === 'resetBtn') {
            e.currentTarget?.reset()
            setOptionCount(0)
            return
          }
          try {
            setIsSaving(true)
            const optionCount = Number((e.currentTarget.elements.namedItem('option-count') as any).value)
            const options: any[] = []
            for (let i = 0; i < optionCount; i++) {
              options.push({
                correct: (e.currentTarget.elements.namedItem(`option-${i}-correct`) as any).checked,
                type: (e.currentTarget.elements.namedItem(`option-${i}-option`) as any).type,
                option: (e.currentTarget.elements.namedItem(`option-${i}-option`) as any).value,
              })
            }
            const form = {
              question: (e.currentTarget.elements.namedItem('question') as any).value,
              difficulty: (e.currentTarget.elements.namedItem('difficulty') as any).value,
              spoilers: getSelectValues(e.currentTarget.elements.namedItem('spoilers') as any),
              options,
            }
            console.info({ form })
            await fetch('/api/internal/question', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(form),
            })
            e.currentTarget?.reset()
            setOptionCount(0)
            await refetch()
          } finally {
            setIsSaving(false)
          }
        }}
      >
        <h2 className="text-2xl text-center">New Question</h2>
        <textarea className="w-full p-2 text-black" name="question" placeholder="Question..."></textarea>
        <input type="hidden" name="option-count" value={optionCount} />
        {Array.from({ length: optionCount }).map((_, i) => (
          <div className="w-full flex flex-row gap-2 justify-center items-center" key={i}>
            <div>{i + 1}.</div>
            <input
              name={`option-${i}-option`}
              type="text"
              className="flex-1 px-2 py-1 text-black"
              placeholder="Option..."
            />
            <input name={`option-${i}-type`} type="hidden" value="text" />
            <input name={`option-${i}-correct`} type="checkbox" className="flex-0 w-10" />
          </div>
        ))}
        <button
          type="button"
          className="bg-black w-full rounded-md drop-shadow-lg text-xl uppercase flex flex-row justify-center items-center gap-2 p-2"
          onClick={(e) => {
            e.preventDefault()
            setOptionCount((c) => c + 1)
          }}
        >
          <FaPlusSquare /> Add Answer
        </button>
        <select name="difficulty" className="text-black w-full px-2 py-1" placeholder="Difficulty...">
          <option disabled>Difficulty...</option>
          <option value="sprout">Sprout</option>
          <option value="normal">Normal</option>
          <option value="hard">Hard</option>
          <option value="Extreme">Extreme</option>
          <option value="unreal">Unreal</option>
        </select>
        <select name="spoilers" className="text-black w-full px-2 py-1 h-40" placeholder="Spoilers..." multiple>
          <option disabled>Spoilers...</option>
          <option value="arr">A Realm Reborn</option>
          <option value="hw">Heavensward</option>
          <option value="post-hw">Post Heavensward</option>
          <option value="sb">Stormblood</option>
          <option value="post-sb">Post Stormblood</option>
          <option value="shb">Shadowbringers</option>
          <option value="post-shb">Post Shadowbringers</option>
          <option value="ew">Endwalkers</option>
          <option value="post-ew">Post Endwalkers</option>
        </select>
        <button
          className="bg-black w-full rounded-md drop-shadow-lg text-2xl uppercase mt-4 flex flex-row justify-center items-center gap-2 p-2"
          type="submit"
          name="submitBtn"
        >
          {isSaving ? <FaSpinner className="animate-spin" /> : <FaSave />} Save
        </button>
        <button
          className="bg-black w-full rounded-md drop-shadow-lg text-xl uppercase flex flex-row justify-center items-center gap-2 p-2 opacity-80"
          type="submit"
          name="resetBtn"
        >
          <FaBroom /> Reset
        </button>
      </form>
      <h1 className="text-4xl text-center mt-3 -mb-2">
        {data?.length} Existing Question{data?.length === 1 ? '' : 's'}
      </h1>
      <div className="mt-2 flex flex-col gap-5 w-full text-xl mb-5">
        {data?.map((q) => (
          <Question key={q._id} {...q} />
        ))}
      </div>
    </div>
  )
}

const DIFFICULTY_MAP = {
  unknown: {
    bg: 'bg-gray-400',
    text: 'text-black',
    label: '???',
  },
  easy: {
    bg: 'bg-green-400',
    text: 'text-black',
    label: 'Sprout',
  },
  sprout: {
    bg: 'bg-green-400',
    text: 'text-black',
    label: 'Sprout',
  },
  normal: {
    bg: 'bg-blue-400',
    text: 'text-black',
    label: 'NM',
  },
  hard: {
    bg: 'bg-yellow-400',
    text: 'text-black',
    label: 'HM',
  },
  extreme: {
    bg: 'bg-red-400',
    text: 'text-black',
    label: 'EX',
  },
  expert: {
    bg: 'bg-red-400',
    text: 'text-black',
    label: 'EX',
  },
  unreal: {
    bg: 'bg-red-600',
    text: 'text-black',
    label: 'Unreal',
  },
  savage: {
    bg: 'bg-red-600',
    text: 'text-black',
    label: 'Unreal',
  },
}

function Question(q: any) {
  const [showOptions, setShowOptions] = React.useState(false)
  return (
    <div className="flex flex-col gap-2 justify-start items-start bg-brown-brushed px-3 py-2 rounded-md shadow-md font-sans">
      <div>{q.question}</div>
      {showOptions ? (
        <div className="mb-2 grid grid-cols-2 gap-2 w-full font-bold">
          {q.options.map((o, i) => (
            <div
              key={o.option}
              className={cls('bg-opacity-50 px-2 py-1 rounded-md', {
                'bg-red-800': !o.correct,
                'bg-green-300': o.correct,
              })}
            >
              {i + 1}. {o.option}
            </div>
          ))}
        </div>
      ) : null}
      <div className="flex flex-col sm:flex-row gap-2 justify-center items-start w-full">
        <div
          className={cls(
            'bg-red-200 text-sm px-2 py-1 rounded-md shadow-md',
            DIFFICULTY_MAP[q.difficulty || 'unknown'].bg,
            DIFFICULTY_MAP[q.difficulty || 'unknown'].text
          )}
        >
          Difficulty: {DIFFICULTY_MAP[q.difficulty || 'unknown'].label}
        </div>
        <div className={cls('bg-gray-600 text-sm px-2 py-1 rounded-md shadow-md')}>
          Spoilers: {q.spoilers.join(', ') || 'None'}
        </div>
        <div className="flex-1 gap-2 flex flex-row justify-end items-center">
          <div className={cls('bg-gray-600 text-sm px-2 py-1 rounded-md shadow-md')}>
            Options: {q.options.length || '0'}
          </div>
          <div className={cls('bg-gray-600 text-sm px-2 py-1 rounded-md shadow-md')}>
            Answers: {q.options.filter((o) => o.correct).length || '0'}
          </div>
          <button
            className={cls('bg-gray-800 text-xs px-2 py-2 rounded-md shadow-md hover:scale-110 transition-all')}
            onClick={() => setShowOptions((s) => !s)}
          >
            {showOptions ? <FaEyeSlash /> : <FaEye />}
          </button>
          <button
            className={cls('bg-gray-800 text-xs px-2 py-2 rounded-md shadow-md hover:scale-110 transition-all')}
            onClick={() => alert('Does nothing for now')}
          >
            <FaPencilAlt />
          </button>
        </div>
      </div>
    </div>
  )
}
