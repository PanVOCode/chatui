const API_BASE = import.meta.env.VITE_GENERATE_API_URL as string ?? 'https://api.progressusbot.ru'
const ASSISTANT_ID = 'unified'
const POLL_INTERVAL_MS = 3000
const POLL_TIMEOUT_MS = 30 * 60 * 1000 // 30 минут

export interface DocEntry {
  text: string
  files: Array<{ url: string; fileName: string; content?: string }>
}

export interface GenerateInput {
  business: DocEntry
  guideline: DocEntry
  wishes: DocEntry
}

export interface GenerateResult {
  deploy_url: string | null
  repo_name: string | null
  project_path: string | null
}

export async function generateSite(input: GenerateInput): Promise<GenerateResult> {
  // 1. Создаём тред
  const threadRes = await fetch(`${API_BASE}/threads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  })
  if (!threadRes.ok) throw new Error(`Ошибка создания треда: ${threadRes.status}`)
  const { thread_id } = await threadRes.json()

  // 2. Запускаем ран асинхронно (без /wait — Studio видит его в реальном времени)
  const runRes = await fetch(`${API_BASE}/threads/${thread_id}/runs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      assistant_id: ASSISTANT_ID,
      input: {
        messages: [{ type: 'human', content: 'Сгенерируй прототип по предоставленным данным.' }],
        json_data: {
          business: input.business,
          guideline: input.guideline,
          wishes: input.wishes,
        },
        iteration_count: 0,
        files_created: [],
      },
    }),
  })

  if (!runRes.ok) {
    const err = await runRes.json().catch(() => ({}))
    throw new Error(err?.detail ?? `Ошибка запуска: ${runRes.status}`)
  }

  const { run_id } = await runRes.json()

  // 3. Поллим статус рана до завершения
  const deadline = Date.now() + POLL_TIMEOUT_MS
  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, POLL_INTERVAL_MS))

    const statusRes = await fetch(`${API_BASE}/threads/${thread_id}/runs/${run_id}`)
    if (!statusRes.ok) throw new Error(`Ошибка статуса: ${statusRes.status}`)
    const run = await statusRes.json()

    if (run.status === 'error' || run.status === 'timeout') {
      throw new Error(run.error ?? `Ран завершился с ошибкой: ${run.status}`)
    }

    if (run.status === 'success') {
      // 4. Получаем финальный стейт треда
      const stateRes = await fetch(`${API_BASE}/threads/${thread_id}/state`)
      if (!stateRes.ok) throw new Error(`Ошибка получения стейта: ${stateRes.status}`)
      const { values } = await stateRes.json()
      return {
        deploy_url: values?.deploy_url ?? null,
        repo_name: values?.repo_name ?? null,
        project_path: values?.project_path ?? null,
      }
    }
  }

  throw new Error('Таймаут генерации (30 минут)')
}
