import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import * as React from 'react'
import { FaPlusSquare, FaSave, FaSpinner } from 'react-icons/fa'

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
  return data?.user?.name === 'Mael' ? (
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
    <div className="flex flex-col justify-center items-center mt-5 max-w-xl w-full mx-auto gap-2">
      <h1 className="text-4xl text-center">Questions</h1>
      <form
        className="bg-brown-brushed w-full mx-2 justify-center items-center rounded-md drop-shadow-lg px-4 py-2 gap-2 flex flex-col font-sans"
        onSubmit={async (e) => {
          try {
            setIsSaving(true)
            e.preventDefault()
            const optionCount = Number((e.currentTarget.elements.namedItem('option-count') as any).value)
            const options: any[] = []
            for (let i = 0; i < optionCount; i++) {
              options.push({
                correct: (e.currentTarget.elements.namedItem(`option-${i}-correct`) as any).checked,
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
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
          <option value="expert">Expert</option>
        </select>
        <select name="spoilers" className="text-black w-full px-2 py-1 h-40" placeholder="Spoilers..." multiple>
          <option disabled>Spoilers...</option>
          <option value="arr">A Realm Reborn</option>
          <option value="hw">Heavensward</option>
          <option value="sb">Stormblood</option>
          <option value="shb">Shadowbringers</option>
          <option value="ew">Endwalkers</option>
        </select>
        <button
          className="bg-black w-full rounded-md drop-shadow-lg text-2xl uppercase mt-4 flex flex-row justify-center items-center gap-2 p-2"
          type="submit"
        >
          {isSaving ? <FaSpinner className="animate-spin" /> : <FaSave />} Save
        </button>
      </form>
      <h1 className="text-4xl text-center mt-3 -mb-2">
        {data?.length} Existing Question{data?.length === 1 ? '' : 's'}
      </h1>
      <div className="flex flex-col gap-2 w-full text-xl">
        {data?.map((d) => (
          <div key={d._id}>{d.question}</div>
        ))}
      </div>
    </div>
  )
}
