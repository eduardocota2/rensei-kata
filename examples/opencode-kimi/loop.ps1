# loop.ps1 — Smart wrapper for AI Engineering Loop with OpenCode + Kimi K3
# Windows PowerShell version
#
# Usage: .\loop.ps1 <agent> "<prompt>"
# Or add to your PowerShell profile ($PROFILE) for the `loop` function
#
# First time: Set-ExecutionPolicy -Scope CurrentUser RemoteSigned

param(
    [Parameter(Mandatory=$true, Position=0)]
    [ValidateSet("gate","architect","builder","reviewer","sentinel","designer","orchestrator")]
    [string]$Agent,

    [Parameter(Mandatory=$true, Position=1)]
    [string]$Prompt
)

$LoopDir = if ($env:AI_LOOP_DIR) { $env:AI_LOOP_DIR } else { "$env:USERPROFILE\rensei-kata\opencode-kimi" }
$Model = if ($env:AI_LOOP_MODEL) { $env:AI_LOOP_MODEL } else { "openrouter/moonshotai/kimi-k3" }
$ProjectDir = Get-Location

# Variant per agent
$Variant = switch ($Agent) {
    "builder" { "minimal" }
    default { "high" }
}

$SessionFile = "$LoopDir\sessions\$Agent.opencode"
if (-not (Test-Path $SessionFile)) {
    Write-Host "Session not found: $SessionFile" -ForegroundColor Red
    exit 1
}

# Auto-detect project context files
$ContextFiles = @()

function Add-File($path) {
    if (Test-Path $path) { $Script:ContextFiles += $path }
}

function Add-Dir($path) {
    if (Test-Path $path) {
        Get-ChildItem $path -Filter "*.md" -Recurse -Depth 1 | ForEach-Object {
            $Script:ContextFiles += $_.FullName
        }
    }
}

# Design tokens
Add-File "$ProjectDir\DESIGN.md"
Add-File "$ProjectDir\design.md"
Add-File "$ProjectDir\docs\DESIGN.md"

# Project conventions
Add-File "$ProjectDir\AGENTS.md"
Add-File "$ProjectDir\CLAUDE.md"
Add-File "$ProjectDir\.cursorrules"
Add-File "$ProjectDir\.github\copilot-instructions.md"

# Claude Code
Add-File "$ProjectDir\.claude\CLAUDE.md"
Add-File "$ProjectDir\.claude\settings.json"
Add-Dir "$ProjectDir\.claude\agents"
Add-Dir "$ProjectDir\.claude\rules"
Add-Dir "$ProjectDir\.claude\skills"

# Codex
Add-File "$ProjectDir\.codex\config.yaml"
Add-File "$ProjectDir\.codex\instructions.md"
Add-Dir "$ProjectDir\.codex\skills"
Add-Dir "$ProjectDir\.codex\rules"

# OpenCode
Add-File "$ProjectDir\.opencode\config.yaml"

# OpenSpec
Add-File "$ProjectDir\openspec\project.md"

# Generic
Add-File "$ProjectDir\CONTRIBUTING.md"
Add-File "$ProjectDir\README.md"

# Build command
$FileArgs = @()
$FileArgs += $SessionFile
$FileArgs += $ContextFiles

Write-Host "Agent: @$Agent | Model: $Model | Variant: $Variant" -ForegroundColor Cyan
Write-Host "Project: $ProjectDir" -ForegroundColor Cyan
if ($ContextFiles.Count -gt 0) {
    Write-Host "$($ContextFiles.Count) context files detected:" -ForegroundColor Gray
    $ContextFiles | ForEach-Object { Write-Host "   $($_.Replace($ProjectDir, ''))" -ForegroundColor Gray }
}
Write-Host ""

$FileArgString = ($FileArgs | ForEach-Object { "-f `"$_`"" }) -join " "

$FullCmd = "opencode run $FileArgString --model `"$Model`" --variant `"$Variant`" `"$Prompt`""
Invoke-Expression $FullCmd
