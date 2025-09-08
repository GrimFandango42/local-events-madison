$gitSh = "C:\\Program Files\\Git\\usr\\bin"
if (Test-Path $gitSh) {
  $env:PATH = "$gitSh;" + $env:PATH
}

codex --approval-mode auto-edit
