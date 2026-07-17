' run_hidden.vbs
' Starts the Mostakhlasat server silently in the background.
' Called automatically at Windows login by Task Scheduler.
' No window will appear.

Set oFSO  = CreateObject("Scripting.FileSystemObject")
Set oShell = CreateObject("WScript.Shell")

' Always run from the folder where this .vbs file lives
scriptDir = oFSO.GetParentFolderName(WScript.ScriptFullName)
oShell.CurrentDirectory = scriptDir

' If the app was never built, run the visible setup first
If Not oFSO.FolderExists(scriptDir & "\.next") Then
    ' Show START.bat so the user can see what's happening
    oShell.Run "cmd /c """ & scriptDir & "\START.bat""", 1, True
Else
    ' Start the server completely silently (window style 0 = hidden)
    oShell.Run "cmd /c npm start", 0, False
End If
