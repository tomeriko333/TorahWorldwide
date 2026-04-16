import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'fs'
import path from 'path'

function syncSavePlugin() {
  const audioDir = path.resolve(__dirname, 'public', 'audio')
  const transDir = path.resolve(__dirname, 'public', 'translations')
  return {
    name: 'sync-save',
    configureServer(server) {
      // Save translation edits
      server.middlewares.use('/api/save-translation', (req, res) => {
        if (req.method === 'OPTIONS') {
          res.writeHead(200, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'Content-Type' })
          res.end()
          return
        }
        if (req.method !== 'POST') { res.writeHead(405); res.end(); return }
        let body = ''
        req.on('data', chunk => { body += chunk })
        req.on('end', () => {
          try {
            const { book, chapter, translations } = JSON.parse(body)
            const filename = `${book}_${chapter}.json`
            const filepath = path.join(transDir, filename)
            fs.writeFileSync(filepath, JSON.stringify(translations, null, 2))
            console.log(`  [translation-save] Saved ${filename}`)
            res.writeHead(200, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ ok: true }))
          } catch (e) {
            res.writeHead(400, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: e.message }))
          }
        })
      })

      server.middlewares.use('/api/save-sync', (req, res) => {
        if (req.method === 'OPTIONS') {
          res.writeHead(200, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'Content-Type' })
          res.end()
          return
        }
        if (req.method !== 'POST') { res.writeHead(405); res.end(); return }
        let body = ''
        req.on('data', chunk => { body += chunk })
        req.on('end', () => {
          try {
            const { book, chapter, syncData } = JSON.parse(body)
            const filename = `${book}_${chapter}.sync.json`
            const filepath = path.join(audioDir, filename)
            // Backup original once
            const backupPath = filepath.replace('.sync.json', '.sync.backup.json')
            if (fs.existsSync(filepath) && !fs.existsSync(backupPath)) {
              fs.copyFileSync(filepath, backupPath)
            }
            fs.writeFileSync(filepath, JSON.stringify(syncData))
            console.log(`  [sync-save] Saved ${filename} (${syncData.length} words)`)
            res.writeHead(200, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ ok: true }))
          } catch (e) {
            res.writeHead(400, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: e.message }))
          }
        })
      })
    }
  }
}

function translatePlugin() {
  return {
    name: 'translate',
    configureServer(server) {
      // Load API key from .env
      const envPath = path.resolve(__dirname, '.env')
      let apiKey = ''
      if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf-8')
        const match = envContent.match(/ANTHROPIC_API_KEY=(.+)/)
        if (match) apiKey = match[1].trim()
      }

      // Load the full Biblical Hebrew guide as system prompt
      const guidePath = path.resolve(__dirname, 'biblical-hebrew-guide.txt')
      const bhGuide = fs.existsSync(guidePath) ? fs.readFileSync(guidePath, 'utf-8') : ''

      server.middlewares.use('/api/translate', (req, res) => {
        if (req.method === 'OPTIONS') {
          res.writeHead(200, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'Content-Type' })
          res.end()
          return
        }
        if (req.method !== 'POST') { res.writeHead(405); res.end(); return }
        if (!apiKey) {
          res.writeHead(500, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'ANTHROPIC_API_KEY not set in .env' }))
          return
        }

        let body = ''
        req.on('data', chunk => { body += chunk })
        req.on('end', async () => {
          try {
            const { text } = JSON.parse(body)
            console.log(`  [translate] Translating: "${text.substring(0, 50)}..."`)

            const response = await fetch('https://api.anthropic.com/v1/messages', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
              },
              body: JSON.stringify({
                model: 'claude-opus-4-6',
                max_tokens: 2048,
                system: bhGuide,
                messages: [
                  { role: 'user', content: `תרגם מעברית מקראית לעברית מודרנית. שמור על פורמט [N] לכל פסוק. כל [N] חייב להופיע בתשובה בשורה נפרדת.

⚠️ תזכורת קריטית: אל תעתיק ביטויים מהמקור! תרגם כאילו אתה מסביר לילד בן 12. כל מילה חייבת להיות מובנת לישראלי מודרני. שמור על ו׳ בתחילת משפט. הסבר שמות ומושגים לא מוכרים בסוגריים. כָּל מִילָה חַיֶּבֶת לִהְיוֹת עִם נִיקּוּד מוֹדֶרְנִי מָלֵא!

${text}` }
                ],
              }),
            })

            const data = await response.json()
            if (data.error) {
              console.log(`  [translate] API error: ${data.error.message}`)
              res.writeHead(400, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({ error: data.error.message }))
              return
            }

            const translation = data.content?.[0]?.text || ''
            console.log(`  [translate] Done: "${translation.substring(0, 50)}..."`)
            res.writeHead(200, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ translation }))
          } catch (e) {
            console.log(`  [translate] Error: ${e.message}`)
            res.writeHead(500, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: e.message }))
          }
        })
      })
    }
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), syncSavePlugin(), translatePlugin()],
  server: {
    host: true,
  },
})
