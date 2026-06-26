# AI Dungeon Master — 一键启动脚本
Write-Host "🚀 AI Dungeon Master 启动中..." -ForegroundColor Cyan

# 1. 启动 WSL2 数据库服务
Write-Host "[1/3] 启动 PostgreSQL 和 Redis..." -ForegroundColor Yellow
wsl -d Ubuntu sudo service postgresql start 2>$null
wsl -d Ubuntu sudo service redis-server start 2>$null
Start-Sleep 2

# 2. 启动项目前后端
Write-Host "[2/3] 启动项目..." -ForegroundColor Yellow
$projectPath = "D:\MyC\AILearn\AIDungeonRPG"
Start-Process powershell -ArgumentList "-NoExit cd $projectPath; pnpm dev" -WindowStyle Normal

Start-Sleep 5

# 3. 启动 ngrok 公网隧道
Write-Host "[3/3] 启动 ngrok 公网隧道..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit ngrok http 3000" -WindowStyle Normal

Write-Host "✅ 启动完成！" -ForegroundColor Green
Write-Host "  后端: http://localhost:4000" -ForegroundColor Gray
Write-Host "  前端: http://localhost:3000" -ForegroundColor Gray
Write-Host "  ngrok 公网链接请查看新弹出的窗口" -ForegroundColor Gray
