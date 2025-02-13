import { exec } from 'child_process'
import chokidar from 'chokidar'
import debounce from 'debounce'

// Define dependency graph
const dependencyGraph: Record<string, string[]> = {
  '@flowglad/shared': [],
  '@flowglad/react': ['@flowglad/shared'],
  '@flowglad/server': ['@flowglad/shared'],
  '@flowglad/nextjs': ['@flowglad/react', '@flowglad/server'],
}

// Get all dependencies that need to be rebuilt when a package changes
const getDependentPackages = (packageName: string): string[] => {
  const dependents: string[] = []

  for (const [pkg, deps] of Object.entries(dependencyGraph)) {
    if (deps.includes(packageName)) {
      dependents.push(pkg)
      // Recursively get packages that depend on this one
      dependents.push(...getDependentPackages(pkg))
    }
  }

  return [...new Set(dependents)]
}

const buildAndPushPackage = async (packageName: string) => {
  const packagePath = `packages/${packageName.replace('@flowglad/', '')}`

  console.log(`📦 Building ${packageName}...`)

  try {
    // Build the package
    await exec(`cd ${packagePath} && pnpm build`)

    // Push to yalc
    await exec(`cd ${packagePath} && yalc push --changed`)

    console.log(`✅ Built and pushed ${packageName}`)

    // Get dependent packages that need to be rebuilt
    const dependents = getDependentPackages(packageName)

    // Rebuild and push all dependent packages
    for (const dependent of dependents) {
      await buildAndPushPackage(dependent)
    }
  } catch (error) {
    console.error(`Error building ${packageName}:`, error)
  }
}

const getPackageFromPath = (path: string) => {
  // Extract package name from path like packages/react/src/...
  const match = path.match(/packages\/([^/]+)/)
  return match ? `@flowglad/${match[1]}` : null
}

const rebuildAndPush = debounce(async (path: string) => {
  const packageName = getPackageFromPath(path)
  if (!packageName) return

  await buildAndPushPackage(packageName)
}, 500)

// Watch all package source files
chokidar
  .watch('packages/*/src/**/*', {
    ignored: /(^|[\/\\])\../,
  })
  .on('change', (path) => {
    console.log(`🔄 File changed: ${path}`)
    rebuildAndPush(path)
  })
