' run_hidden.vbs
' Starts the Mostakhlasat accounting server silently in the background.
' Called automatically at Windows login by Task Scheduler.
' No window will appear.

Set oFSO   = CreateObject("Scripting.FileSystemObject")
Set oShell = CreateObject("WScript.Shell")

' Always run from the folder where this .vbs file lives
scriptDir = oFSO.GetParentFolderName(WScript.ScriptFullName)
oShell.CurrentDirectory = scriptDir

' Ensure Node.js is in PATH regardless of how this script is launched
' (Task Scheduler may have a stripped-down PATH compared to normal login)
Dim currentPath
currentPath = oShell.ExpandEnvironmentStrings("%PATH%")

Dim nodePaths(3)
nodePaths(0) = "C:\Program Files\nodejs"
nodePaths(1) = "C:\Program Files (x86)\nodejs"
nodePaths(2) = oShell.ExpandEnvironmentStrings("%APPDATA%\npm")
nodePaths(3) = oShell.ExpandEnvironmentStrings("%ProgramFiles%\nodejs")

Dim i
For i = 0 To 3
    If InStr(currentPath, nodePaths(i)) = 0 Then
        If oFSO.FolderExists(nodePaths(i)) Then
            oShell.Environment("PROCESS")("PATH") = currentPath & ";" & nodePaths(i)
            currentPath = currentPath & ";" & nodePaths(i)
        End If
    End If
Next

' If the app was never built, run visible START.bat first
If Not oFSO.FolderExists(scriptDir & "\.next") Then
    oShell.Run "cmd /c """ & scriptDir & "\START.bat""", 1, True
Else
    ' Start the server completely silently (window style 0 = hidden)
    oShell.Run "cmd /c npm start", 0, False
End If
