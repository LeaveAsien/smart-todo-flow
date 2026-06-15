: << 'CMDBLOCK'
@echo off
REM Cross-platform polyglot wrapper for hook scripts.
REM On Windows: cmd.exe runs the batch portion, which finds and calls bash.
REM On Unix: the shell interprets this as a script (: is a no-op in bash).
REM
REM Hook scripts use extensionless filenames (e.g. "todo-session-init" not
REM "todo-session-init.sh") so Claude Code's Windows auto-detection -- which
REM prepends "bash" to any command containing .sh -- doesn't interfere.
REM
REM Usage: run-hook.cmd <script-name> [args...]

if "%~1"=="" (
    echo run-hook.cmd: missing script name >&2
    exit /b 1
)

set "HOOK_DIR=%~dp0"
set "HOOK_SCRIPT=%HOOK_DIR%%~1"

REM Capture stdin to a temp file via PowerShell.
REM Direct cmd.exe→bash stdin piping is unreliable on Windows; this ensures
REM the JSON payload from Claude Code reaches the hook script correctly.
set "HOOK_INPUT=%TEMP%\smart-todo-hook-input.json"
powershell -NoProfile -NonInteractive -Command "[IO.File]::WriteAllText('%HOOK_INPUT%', [Console]::In.ReadToEnd(), [Text.Encoding]::UTF8)" 2>nul

REM Try Git for Windows bash in standard locations
if exist "C:\Program Files\Git\bin\bash.exe" (
    "C:\Program Files\Git\bin\bash.exe" "%HOOK_SCRIPT%" %2 %3 %4 %5 %6 %7 %8 %9 < "%HOOK_INPUT%"
    set "HOOK_EXIT=%ERRORLEVEL%"
    del "%HOOK_INPUT%" 2>nul
    exit /b %HOOK_EXIT%
)
if exist "C:\Program Files (x86)\Git\bin\bash.exe" (
    "C:\Program Files (x86)\Git\bin\bash.exe" "%HOOK_SCRIPT%" %2 %3 %4 %5 %6 %7 %8 %9 < "%HOOK_INPUT%"
    set "HOOK_EXIT=%ERRORLEVEL%"
    del "%HOOK_INPUT%" 2>nul
    exit /b %HOOK_EXIT%
)

REM Try bash on PATH (e.g. user-installed Git Bash, MSYS2, Cygwin)
where bash >nul 2>nul
if %ERRORLEVEL% equ 0 (
    bash "%HOOK_SCRIPT%" %2 %3 %4 %5 %6 %7 %8 %9 < "%HOOK_INPUT%"
    set "HOOK_EXIT=%ERRORLEVEL%"
    del "%HOOK_INPUT%" 2>nul
    exit /b %HOOK_EXIT%
)

REM No bash found - exit silently rather than error
REM (plugin still works, just without hook context injection)
del "%HOOK_INPUT%" 2>nul
exit /b 0
CMDBLOCK

# Unix: run the named script directly
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SCRIPT_NAME="$1"
shift
exec bash "${SCRIPT_DIR}/${SCRIPT_NAME}" "$@"
