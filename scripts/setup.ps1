$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root
$requiredNode = [version]'22.13'

function Refresh-Path {
    $machine = [Environment]::GetEnvironmentVariable('Path', 'Machine')
    $user = [Environment]::GetEnvironmentVariable('Path', 'User')
    $env:Path = "$machine;$user;$env:ProgramFiles\nodejs;$env:APPDATA\npm"
}

function Invoke-Native([scriptblock]$block) {
    $previous = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try { & $block } finally { $ErrorActionPreference = $previous }
}

function Get-NodeVersion {
    $command = Get-Command node -ErrorAction SilentlyContinue
    if (-not $command) { return $null }
    $raw = & $command.Source -v
    if ($raw -match '^v(\d+)\.(\d+)') { return [version]"$($matches[1]).$($matches[2])" }
    return $null
}

function Install-NodeWithWinget {
    $winget = Get-Command winget -ErrorAction SilentlyContinue
    if (-not $winget) { return $false }
    Invoke-Native { & $winget.Source install -e --id OpenJS.NodeJS.LTS --silent --accept-source-agreements --accept-package-agreements }
    return ($LASTEXITCODE -eq 0)
}

function Install-NodeWithMsi {
    $index = Invoke-RestMethod 'https://nodejs.org/dist/index.json'
    $lts = $index | Where-Object { $_.lts } | Select-Object -First 1
    if (-not $lts) { throw 'Could not find a Node.js LTS release.' }
    $arch = if ($env:PROCESSOR_ARCHITECTURE -eq 'ARM64') { 'arm64' } else { 'x64' }
    $file = "node-$($lts.version)-$arch.msi"
    $msi = Join-Path $env:TEMP $file
    Write-Host "Downloading $file..."
    Invoke-WebRequest "https://nodejs.org/dist/$($lts.version)/$file" -OutFile $msi
    $process = Start-Process msiexec.exe -ArgumentList "/i `"$msi`" /qn /norestart" -Wait -PassThru
    if ($process.ExitCode -ne 0) { throw "Node.js installer exited with code $($process.ExitCode)." }
}

function Ensure-Node {
    $version = Get-NodeVersion
    if ($version -and $version -ge $requiredNode) {
        Write-Host "Node.js $version found."
        return
    }
    Write-Host 'Installing Node.js LTS...'
    if (-not (Install-NodeWithWinget)) { Install-NodeWithMsi }
    Refresh-Path
    $version = Get-NodeVersion
    if (-not $version -or $version -lt $requiredNode) {
        throw "Node.js $requiredNode or newer is required. Install it from https://nodejs.org and run iniciar.bat again."
    }
    Write-Host "Node.js $version installed."
}

function Install-Dependencies {
    Write-Host 'Installing project dependencies...'
    Invoke-Native { & npm.cmd install --no-audit --no-fund }
    if ($LASTEXITCODE -ne 0) { throw 'npm install failed.' }
}

function Test-Browser {
    $paths = @(
        "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
        "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
        "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe",
        "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe",
        "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe"
    )
    foreach ($path in $paths) { if (Test-Path $path) { return $true } }
    return $false
}

function Ensure-Browser {
    if (Test-Browser) {
        Write-Host 'Chrome or Edge found.'
        return
    }
    Write-Host 'No Chrome or Edge found. Installing Chrome...'
    $winget = Get-Command winget -ErrorAction SilentlyContinue
    if ($winget) {
        Invoke-Native { & $winget.Source install -e --id Google.Chrome --silent --accept-source-agreements --accept-package-agreements }
    }
    if (Test-Browser) { return }
    Write-Host 'Downloading bundled Chromium through Playwright...'
    Invoke-Native { & npx.cmd playwright install chromium }
    if ($LASTEXITCODE -ne 0) { throw 'Could not install a browser.' }
}

function Ensure-Files {
    if (-not (Test-Path 'config.json')) {
        Copy-Item 'config.example.json' 'config.json'
        Write-Host 'Created config.json. Edit it to set your interests and filters.'
    }
    if (-not (Test-Path '.env')) { Copy-Item '.env.example' '.env' }
    $envText = Get-Content '.env' -Raw
    if ($envText -match '(?m)^DISCORD_WEBHOOK_URL=\s*$') {
        $webhook = (Read-Host 'Paste your Discord webhook URL (leave empty to fill .env later)').Trim()
        if ($webhook) {
            $envText = $envText -replace '(?m)^DISCORD_WEBHOOK_URL=.*$', "DISCORD_WEBHOOK_URL=$webhook"
            Set-Content '.env' $envText -Encoding ascii
        }
    }
    New-Item -ItemType Directory -Force 'data' | Out-Null
}

Write-Host '=== AliExpress Finder setup ==='
Refresh-Path
Ensure-Node
Install-Dependencies
Ensure-Browser
Ensure-Files
Write-Host 'Setup complete.'
exit 0
