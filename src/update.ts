import type { Location, Terminal } from 'vscode'
import type { UpgradeVersionParams } from './data'
import type { PackageManager } from './types'
import { Position, Range, Uri, window, workspace, WorkspaceEdit } from 'vscode'
import { commands } from './generated/meta'

export interface UpdateProps {
  cwd: string
  definition: Location
  manager: PackageManager
  packageName: string
  workspacePath: string
  version: string
  latestVersion: string
}

interface ForceVersionParams {
  cwd: string
  manager: PackageManager
  newVersion: string
  packageName: string
  workspacePath: string
  versionRange: {
    end: { character: number, line: number }
    start: { character: number, line: number }
  }
}

type UpdateToLatestParams = Pick<ForceVersionParams, 'cwd' | 'manager' | 'packageName'>

// We use a terminal because `install` might trigger a prompt or show feedback, like new scripts to approve
let terminal: Terminal | undefined
const versionRangePrefixRe = /^\D*/

function getInstallCommand(manager: PackageManager) {
  switch (manager) {
    case 'pnpm':
      return 'pnpm install'
    case 'yarn':
      return 'yarn install'
    case 'bun':
      return 'bun install'
  }
}

function getUpdateToLatestCommand(manager: PackageManager, packageName: string) {
  switch (manager) {
    case 'pnpm':
      return `pnpm update --latest ${packageName}`
    case 'yarn':
      return `yarn up ${packageName}`
    case 'bun':
      return `bun update --latest ${packageName}`
  }
}

export function getForceCommandUri({ cwd, definition, manager, packageName, version, latestVersion }: UpdateProps) {
  const forceArgs = [
    {
      cwd,
      manager,
      newVersion: `${version.match(versionRangePrefixRe)?.[0] ?? ''}${latestVersion}`,
      packageName,
      workspacePath: definition.uri.fsPath,
      versionRange: {
        end: { character: definition.range.end.character, line: definition.range.end.line },
        start: { character: definition.range.start.character, line: definition.range.start.line },
      },
    } satisfies ForceVersionParams,
  ]
  return Uri.parse(
    `command:${commands.forceVersion}?${encodeURIComponent(JSON.stringify(forceArgs))}`,
  )
}

export function getUpdateToLatestCommandUri({ cwd, manager, packageName }: UpdateProps) {
  const updateToLatestArgs = [
    {
      cwd,
      manager,
      packageName,
    } satisfies UpdateToLatestParams,
  ]
  return Uri.parse(
    `command:${commands.updateToLatest}?${encodeURIComponent(JSON.stringify(updateToLatestArgs))}`,
  )
}

export async function forceVersionCommand({ cwd, manager: packageManager, newVersion, workspacePath, versionRange }: UpgradeVersionParams) {
  const uri = Uri.file(workspacePath)
  const document = await workspace.openTextDocument(uri)
  const range = new Range(
    new Position(versionRange.start.line, versionRange.start.character),
    new Position(versionRange.end.line, versionRange.end.character),
  )
  const edit = new WorkspaceEdit()
  edit.replace(uri, range, newVersion)
  await workspace.applyEdit(edit)
  await document.save()

  const command = getInstallCommand(packageManager)
  terminal ??= window.createTerminal({ name: 'Catalog Lens', cwd })
  terminal.show()
  terminal.sendText(command)
}

export function updateToLatestCommand({ cwd, manager: packageManager, packageName }: UpdateToLatestParams) {
  const command = getUpdateToLatestCommand(packageManager, packageName)
  terminal ??= window.createTerminal({ name: 'Catalog Lens', cwd })
  terminal.show()
  terminal.sendText(command)
}
