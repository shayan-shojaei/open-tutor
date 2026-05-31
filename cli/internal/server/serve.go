package server

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"

	"github.com/shayan-shojaei/open-tutor/internal/config"
)

func Start(appDir, modulesDir string, port int, detach bool) error {
	serverJS := filepath.Join(appDir, "server.js")
	if _, err := os.Stat(serverJS); os.IsNotExist(err) {
		return fmt.Errorf("web app not installed — run `tutor install` first")
	}

	node, err := exec.LookPath("node")
	if err != nil {
		return fmt.Errorf("Node.js is required but was not found\nInstall it from https://nodejs.org")
	}

	cmd := exec.Command(node, serverJS)
	cmd.Env = append(os.Environ(),
		fmt.Sprintf("PORT=%d", port),
		fmt.Sprintf("TUTOR_MODULES_DIR=%s", modulesDir),
		"HOSTNAME=0.0.0.0",
	)

	if detach {
		return startDetached(cmd, port)
	}
	return startForeground(cmd, port)
}

func logPath() string { return config.LogFile() }
func pidPath() string { return config.PidFile() }
