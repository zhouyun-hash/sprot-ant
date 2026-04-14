# 在仓库根目录执行（首次请在根目录运行 npm install 以安装 concurrently）
# 示例：.\scripts\start.ps1 infra
param(
  [Parameter(Position = 0)]
  [ValidateSet('infra', 'backend', 'h5', 'pc', 'stack', 'all', 'help')]
  [string]$Action = 'help'
)

$ErrorActionPreference = 'Stop'
$Root = Resolve-Path (Join-Path $PSScriptRoot '..')
Set-Location $Root

switch ($Action) {
  'infra' {
    docker compose up -d
    Write-Host '已启动 Docker：MySQL(3306)、Redis(6379)。数据库 smart_sports，见 docker-compose.yml。'
  }
  'backend' { npm run dev:backend }
  'h5' { npm run dev:h5 }
  'pc' { npm run dev:pc }
  'stack' { npm run dev:stack }
  'all' { npm run dev:all }
  'help' {
    @'
用法（在仓库根目录）：
  首次：npm install
  .\scripts\start.ps1 infra     启动 MySQL + Redis（docker compose）
  .\scripts\start.ps1 backend   仅 Nest API（默认 http://localhost:3000）
  .\scripts\start.ps1 h5        仅 uni-app H5（学生/家长端）
  .\scripts\start.ps1 pc        仅 PC 管理端 Vite
  .\scripts\start.ps1 stack     同时：API + H5
  .\scripts\start.ps1 all       同时：API + H5 + PC

等价 npm：npm run dev:backend | dev:h5 | dev:pc | dev:stack | dev:all
'@ | Write-Host
  }
}
