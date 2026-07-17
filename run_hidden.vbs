' run_hidden.vbs
' Starts the Mostakhlasat server silently at Windows login.
' Uses the full path to node.exe — no PATH variable needed.

Set oFSO   = CreateObject("Scripting.FileSystemObject")
Set oShell = CreateObject("WScript.Shell")

' Run from this script's own folder (works regardless of where it's placed)
scriptDir = oFSO.GetParentFolderName(WScript.ScriptFullName)
oShell.CurrentDirectory = scriptDir

' ── Find node.exe by checking every common install location ──────────────────
Dim nodePath
nodePath = ""

Dim candidates(7)
candidates(0) = "C:\Program Files\nodejs\node.exe"
candidates(1) = "C:\Program Files (x86)\nodejs\node.exe"
candidates(2) = oShell.ExpandEnvironmentStrings("%ProgramFiles%\nodejs\node.exe")
candidates(3) = oShell.ExpandEnvironmentStrings("%ProgramFiles(x86)%\nodejs\node.exe")
candidates(4) = oShell.ExpandEnvironmentStrings("%LOCALAPPDATA%\Programs\nodejs\node.exe")
candidates(5) = oShell.ExpandEnvironmentStrings("%APPDATA%\nvm\current\node.exe")
candidates(6) = oShell.ExpandEnvironmentStrings("%NVM_HOME%\current\node.exe")
candidates(7) = oShell.ExpandEnvironmentStrings("%NVM_SYMLINK%\node.exe")

Dim i
For i = 0 To 7
    If oFSO.FileExists(candidates(i)) Then
        nodePath = candidates(i)
        Exit For
    End If
Next

' Last resort: ask Windows where node is
If nodePath = "" Then
    On Error Resume Next
    Dim oExec
    Set oExec = oShell.Exec("where node.exe")
    If Err.Number = 0 Then
        Dim foundLine
        foundLine = Trim(oExec.StdOut.ReadLine())
        If oFSO.FileExists(foundLine) Then nodePath = foundLine
    End If
    On Error GoTo 0
End If

' ── node.exe not found at all ─────────────────────────────────────────────────
If nodePath = "" Then
    MsgBox "Node.js was not found on this machine." & vbCrLf & vbCrLf & _
           "Please install Node.js from: https://nodejs.org" & vbCrLf & _
           "(Choose the LTS version)" & vbCrLf & vbCrLf & _
           "After installing, restart Windows.", _
           vbCritical, "Mostakhlasat - Setup Required"
    WScript.Quit 1
End If

' ── First time: .next folder missing — run visible setup ─────────────────────
If Not oFSO.FolderExists(scriptDir & "\.next") Then
    oShell.Run "cmd /c """ & scriptDir & "\START.bat""", 1, True
    WScript.Quit 0
End If

' ── Start the server silently using direct node call (no npm needed) ──────────
Dim nextBin
nextBin = scriptDir & "\node_modules\next\dist\bin\next"

' Window style 0 = completely hidden, False = don't wait (fire and forget)
oShell.Run """" & nodePath & """ """ & nextBin & """ start", 0, False
