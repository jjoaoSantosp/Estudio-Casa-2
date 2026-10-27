Option Explicit

' ---------------------------------------------------------------
' Agenda Casa 2 Studio - iniciador com bloqueio de janela unica
' ---------------------------------------------------------------

Const URL = "http://127.0.0.1:3000"

Dim shell, fso, pasta, nodeExe, i
Dim pastaBloqueio, pastaPerfil, codigoErro

Set shell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

pasta = fso.GetParentFolderName(WScript.ScriptFullName)
shell.CurrentDirectory = pasta

pastaPerfil = pasta & "\perfil_chrome"

' ---------------------------------------------------------------
' Funcoes
' ---------------------------------------------------------------

Function ServidorRespondendo()
    Dim http

    ServidorRespondendo = False

    On Error Resume Next
    Err.Clear

    Set http = CreateObject("MSXML2.ServerXMLHTTP.6.0")
    http.setTimeouts 1000, 1000, 1000, 2000
    http.Open "GET", URL, False
    http.Send

    If Err.Number = 0 Then
        If http.Status = 200 Then
            ServidorRespondendo = True
        End If
    End If

    Set http = Nothing
    On Error GoTo 0
End Function

' Verifica se ja existe uma janela do app aberta
' (procura chrome/msedge usando o perfil exclusivo da agenda)
Function JanelaJaAberta()
    Dim wmi, procs, p, cmd

    JanelaJaAberta = False

    On Error Resume Next
    Set wmi = GetObject("winmgmts:\\.\root\cimv2")
    Set procs = wmi.ExecQuery( _
        "SELECT CommandLine FROM Win32_Process " & _
        "WHERE Name='chrome.exe' OR Name='msedge.exe'")

    For Each p In procs
        cmd = p.CommandLine
        If Not IsNull(cmd) Then
            If InStr(1, cmd, pastaPerfil, vbTextCompare) > 0 Then
                JanelaJaAberta = True
                Exit For
            End If
        End If
    Next
    On Error GoTo 0
End Function

' ---------------------------------------------------------------
' 1. Bloqueio contra duplo clique (duas execucoes ao mesmo tempo)
' ---------------------------------------------------------------

pastaBloqueio = shell.ExpandEnvironmentStrings("%TEMP%") & "\agenda_casa_instancia.lock"

' Bloqueio com mais de 60 s e resto de uma execucao que travou
If fso.FolderExists(pastaBloqueio) Then
    If DateDiff("s", fso.GetFolder(pastaBloqueio).DateCreated, Now) > 60 Then
        On Error Resume Next
        fso.DeleteFolder pastaBloqueio, True
        On Error GoTo 0
    End If
End If

' ---------------------------------------------------------------
' 2. Se a janela da agenda ja esta aberta, nao abre outra
' ---------------------------------------------------------------

If JanelaJaAberta() Then
    On Error Resume Next
    fso.DeleteFolder pastaBloqueio, True
    On Error GoTo 0
    WScript.Quit
End If

' ---------------------------------------------------------------
' 3. Define o Node.js
' ---------------------------------------------------------------

If fso.FileExists(pasta & "\runtime\node.exe") Then
    nodeExe = """" & pasta & "\runtime\node.exe"""
Else
    nodeExe = "node"
End If

' ---------------------------------------------------------------
' 4. Inicia o servidor se necessario
' ---------------------------------------------------------------

If Not ServidorRespondendo() Then

    shell.Run "cmd /c """ & nodeExe & _
        " server.js >> servidor.log 2>&1""", 0, False

    For i = 1 To 40
        WScript.Sleep 500
        If ServidorRespondendo() Then Exit For
    Next

End If

' ---------------------------------------------------------------
' 5. Abre o aplicativo (com perfil exclusivo)
' ---------------------------------------------------------------

If ServidorRespondendo() Then

    On Error Resume Next
    Err.Clear

    shell.Run "chrome --app=" & URL & _
        " --user-data-dir=""" & pastaPerfil & """" & _
        " --window-size=1280,800", 1, False

    codigoErro = Err.Number
    On Error GoTo 0

    If codigoErro <> 0 Then

        On Error Resume Next
        Err.Clear

        shell.Run "msedge --app=" & URL & _
            " --user-data-dir=""" & pastaPerfil & """" & _
            " --window-size=1280,800", 1, False

        codigoErro = Err.Number
        On Error GoTo 0

    End If

    If codigoErro <> 0 Then
        MsgBox "Nao foi possivel abrir o navegador.", _
            16, "Agenda Casa 2 Studio"
    End If

Else

    MsgBox "Nao foi possivel iniciar o servidor." & _
        vbCrLf & "Abra servidor.log para verificar o erro.", _
        16, "Agenda Casa 2 Studio"

End If

' ---------------------------------------------------------------
' 6. Libera o bloqueio ao terminar o iniciador
' ---------------------------------------------------------------

On Error Resume Next
fso.DeleteFolder pastaBloqueio, True
On Error GoTo 0

Set fso = Nothing
Set shell = Nothing