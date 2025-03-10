/* 
Run scripts using the script runner using the following command:
NODE_ENV=production yarn tsx scripts/example.ts

The script runner does the following:
 - Pulls environment variables from Vercel based on target env chosen
 - Connects to the database
 - Runs the script provided

Post script run regardless of the script's success or failure, the script runner will pull development environment variables from Vercel
*/

import core from '@/utils/core'
import { loadEnvConfig } from '@next/env'
import { execSync } from 'child_process'
import { PostgresJsDatabase, drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

function pullDevelopmentEnvVars() {
  execSync('pnpm vercel:env-pull', {
    stdio: 'inherit',
  })
  console.info(
    '📥 Successfully pulled development environment variables'
  )
}

function rmDevelopmentEnvVars() {
  execSync('pnpm vercel:env-rm', {
    stdio: 'inherit',
  })
}

export default async function runScript(
  scriptMethod: (db: PostgresJsDatabase) => Promise<void>
) {
  const env = process.env.NODE_ENV ?? 'development'

  try {
    rmDevelopmentEnvVars()
    execSync(`vercel env pull --environment=${env}`, {
      stdio: 'inherit',
    })
    console.info(
      `📥 Successfully ran vercel env pull command for ${env}`
    )
  } catch (error) {
    console.error(
      `❌ Error running vercel env pull command for ${env}:`,
      error
    )
    pullDevelopmentEnvVars()
    process.exit(1)
  }

  const projectDir = process.cwd()
  // To load env vars in the script
  loadEnvConfig(projectDir)

  const client = postgres(core.envVariable('DATABASE_URL'))
  const db = drizzle(client, { logger: true })

  try {
    await scriptMethod(db)
  } catch (error) {
    console.error('❌ Error running script:', error)
    pullDevelopmentEnvVars()
    process.exit(1)
  } finally {
    console.log('Script has finished running successfully.')
    pullDevelopmentEnvVars()
    process.exit(0)
  }
}
