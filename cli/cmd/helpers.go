package cmd

import (
	"fmt"
	"os"
	"net"
    "os/exec"
    "runtime"

	"github.com/shayan-shojaei/open-tutor/internal/config"
)

// ensureInit checks ~/.tutor/ exists and offers to create it.
func ensureInit() error {
	if _, err := os.Stat(config.TutorDir()); os.IsNotExist(err) {
		return fmt.Errorf("Open Tutor is not initialized. Run `tutor init` first")
	}
	return nil
}

// find first available port 
func findAvailablePort(preferred int) int {
    ln, err := net.Listen("tcp", fmt.Sprintf(":%d", preferred))
    if err != nil {
        return preferred + 1 // try the next port
    }
    ln.Close()
    return preferred
}

// open the given URL in the browser
func openBrowser(url string) {
    var cmd *exec.Cmd
    switch runtime.GOOS {
    case "darwin":
        cmd = exec.Command("open", url)
    case "windows":
        cmd = exec.Command("rundll32", "url.dll,FileProtocolHandler", url)
    default:
        cmd = exec.Command("xdg-open", url)
    }
    _ = cmd.Start()
}