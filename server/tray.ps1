Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$serverDir = "D:\BOT\ytbot\server"
$iconPath = "D:\BOT\ytbot\electron\build\icon.ico"
$url = "http://localhost:3001"

$psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.FileName = "C:\Program Files\nodejs\node.exe"
$psi.Arguments = """$serverDir\index.js"""
$psi.WorkingDirectory = $serverDir
$psi.UseShellExecute = $false
$psi.CreateNoWindow = $true
$psi.EnvironmentVariables["CLIENT_DIST"] = "D:\BOT\ytbot\client\dist"
$serverProcess = [System.Diagnostics.Process]::Start($psi)

$trayIcon = New-Object System.Windows.Forms.NotifyIcon
$trayIcon.Icon = New-Object System.Drawing.Icon($iconPath)
$trayIcon.Text = "YouTube Downloader Server"
$trayIcon.Visible = $true

$menu = New-Object System.Windows.Forms.ContextMenuStrip
$openItem = $menu.Items.Add("Open Dashboard")
$quitItem = $menu.Items.Add("Quit")
$trayIcon.ContextMenuStrip = $menu

$openItem.Add_Click({ Start-Process $url })
$quitItem.Add_Click({
    if (-not $serverProcess.HasExited) { Stop-Process -Id $serverProcess.Id -Force }
    $trayIcon.Visible = $false
    [System.Windows.Forms.Application]::Exit()
})
$trayIcon.Add_DoubleClick({ Start-Process $url })

[System.Windows.Forms.Application]::Run()
