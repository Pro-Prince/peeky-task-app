Add-Type @"
using System;
using System.Text;
using System.Runtime.InteropServices;
public class WinApi {
    [DllImport("user32.dll")]
    public static extern IntPtr GetForegroundWindow();
    [DllImport("user32.dll")]
    public static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);
    [DllImport("user32.dll", CharSet = CharSet.Auto)]
    public static extern int GetClassName(IntPtr hWnd, StringBuilder lpClassName, int nMaxCount);
    [StructLayout(LayoutKind.Sequential)]
    public struct RECT {
        public int Left; public int Top; public int Right; public int Bottom;
    }
}
"@

Add-Type -AssemblyName System.Windows.Forms

$sb = New-Object System.Text.StringBuilder 256

while ($true) {
    try {
        $hwnd = [WinApi]::GetForegroundWindow()
        if ($hwnd -ne [IntPtr]::Zero) {
            $rect = New-Object WinApi+RECT
            if ([WinApi]::GetWindowRect($hwnd, [ref]$rect)) {
                $w = $rect.Right - $rect.Left
                $h = $rect.Bottom - $rect.Top
                $screen = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds

                $sb.Clear() | Out-Null
                [WinApi]::GetClassName($hwnd, $sb, 256) | Out-Null
                $cls = $sb.ToString()

                $isDesktop = ($cls -eq "Progman" -or $cls -eq "WorkerW" -or $cls -eq "Shell_TrayWnd")
                $isFs = (-not $isDesktop -and $w -ge $screen.Width -and $h -ge $screen.Height -and $rect.Left -le 0 -and $rect.Top -le 0)

                if ($isFs) {
                    [Console]::WriteLine("FS:1")
                } else {
                    [Console]::WriteLine("FS:0")
                }
                [Console]::Out.Flush()
            }
        }
    } catch {}
    [System.Threading.Thread]::Sleep(1200)
}
