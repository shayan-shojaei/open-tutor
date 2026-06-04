#Requires -Version 5.1
[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'

$REPO        = 'shayan-shojaei/open-tutor'
$INSTALL_DIR = if ($env:TUTOR_INSTALL_DIR) { $env:TUTOR_INSTALL_DIR } else { "$env:USERPROFILE\.local\bin" }
$BINARY_NAME = 'tutor.exe'

# ── helpers ────────────────────────────────────────────────────────────────────

function Write-Info  { param($msg) Write-Host "==> $msg" -ForegroundColor Blue }
function Write-Ok    { param($msg) Write-Host "  OK $msg" -ForegroundColor Green }
function Write-Fail  { param($msg) Write-Error "error: $msg" }

# ── check Node.js ──────────────────────────────────────────────────────────────

function Assert-Node {
    $node = Get-Command node -ErrorAction SilentlyContinue
    if ($node) {
        $ver = & node --version 2>$null
        Write-Ok "Node.js found: $ver"
        return
    }

    Write-Host ""
    Write-Host "  Node.js is required but was not found." -ForegroundColor Red

    $winget = Get-Command winget -ErrorAction SilentlyContinue
    if ($winget) {
        Write-Host "  Attempting to install Node.js LTS via winget..." -ForegroundColor Yellow
        winget install -e --id OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements
        # Refresh PATH so the new node binary is visible in this session
        $env:PATH = [System.Environment]::GetEnvironmentVariable('PATH', 'Machine') + ';' +
                    [System.Environment]::GetEnvironmentVariable('PATH', 'User')
        if (Get-Command node -ErrorAction SilentlyContinue) {
            Write-Ok "Node.js installed: $(& node --version 2>$null)"
            return
        }
        Write-Host "  winget finished but 'node' is still not in PATH." -ForegroundColor Yellow
    }

    Write-Host "  Please install Node.js from https://nodejs.org (LTS recommended)" -ForegroundColor Yellow
    Write-Host "  Then re-run this script." -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

# ── resolve latest version ─────────────────────────────────────────────────────

function Get-LatestVersion {
    Write-Info "Fetching latest release..."
    $resp = Invoke-RestMethod "https://api.github.com/repos/$REPO/releases/latest"
    return $resp.tag_name
}

# ── add directory to user PATH ─────────────────────────────────────────────────

function Add-ToUserPath {
    param([string]$Dir)
    $current = [System.Environment]::GetEnvironmentVariable('PATH', 'User')
    if ($current -split ';' -contains $Dir) { return }
    [System.Environment]::SetEnvironmentVariable('PATH', "$current;$Dir", 'User')
    $env:PATH = "$env:PATH;$Dir"
    Write-Host ""
    Write-Host "  Note: $Dir has been added to your user PATH." -ForegroundColor Yellow
    Write-Host "  Restart your terminal (or open a new one) for it to take effect." -ForegroundColor Yellow
}

# ── main ───────────────────────────────────────────────────────────────────────

function Main {
    # Check architecture — only AMD64 is shipped
    if ($env:PROCESSOR_ARCHITECTURE -ne 'AMD64') {
        Write-Fail "Only AMD64 (x86-64) Windows is supported. Got: $env:PROCESSOR_ARCHITECTURE"
        exit 1
    }

    Assert-Node

    $version = if ($env:TUTOR_VERSION) { $env:TUTOR_VERSION } else { Get-LatestVersion }
    Write-Ok "Version: $version"

    $url        = "https://github.com/$REPO/releases/download/$version/tutor-windows-amd64.exe"
    $installDir = $INSTALL_DIR
    $installPath = Join-Path $installDir $BINARY_NAME

    Write-Info "Downloading CLI binary..."
    New-Item -ItemType Directory -Force -Path $installDir | Out-Null
    Invoke-WebRequest -Uri $url -OutFile $installPath -UseBasicParsing
    Write-Ok "Installed to $installPath"

    Add-ToUserPath $installDir

    Write-Info "Initialising tutor directory..."
    & $installPath init

    Write-Info "Downloading web app..."
    & $installPath install

    Write-Host ""
    Write-Host "  All done! " -NoNewline
    Write-Host "Open a new terminal" -ForegroundColor Cyan -NoNewline
    Write-Host " and run " -NoNewline
    Write-Host "tutor start" -ForegroundColor White -NoNewline
    Write-Host " to launch Open Tutor."
    Write-Host ""
}

Main
