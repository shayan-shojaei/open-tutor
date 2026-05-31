package server

import (
	"fmt"
	"os"
	"os/exec"
	"os/signal"
	"path/filepath"
	"syscall"
)

func Start(appDir, modulesDir string, port int) error {
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
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	if err := cmd.Start(); err != nil {
		return fmt.Errorf("failed to start server: %w", err)
	}

	fmt.Printf("Open Tutor is running at http://localhost:%d\n", port)
	fmt.Println("Press Ctrl-C to stop.")

	sig := make(chan os.Signal, 1)
	signal.Notify(sig, syscall.SIGINT, syscall.SIGTERM)
	<-sig

	fmt.Println("\nShutting down...")
	cmd.Process.Signal(syscall.SIGTERM)
	cmd.Wait()
	return nil
}
