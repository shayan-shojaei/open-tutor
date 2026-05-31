package server

import (
	"fmt"
	"os"
	"os/exec"
	"os/signal"
	"path/filepath"
	"strconv"
	"strings"
	"syscall"

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

func startDetached(cmd *exec.Cmd, port int) error {
	logPath := config.LogFile()
	logFile, err := os.OpenFile(logPath, os.O_CREATE|os.O_WRONLY|os.O_TRUNC, 0644)
	if err != nil {
		return fmt.Errorf("failed to open log file: %w", err)
	}
	defer logFile.Close()

	cmd.Stdout = logFile
	cmd.Stderr = logFile
	cmd.SysProcAttr = &syscall.SysProcAttr{Setsid: true}

	if err := cmd.Start(); err != nil {
		return fmt.Errorf("failed to start server: %w", err)
	}

	pidFile := config.PidFile()
	if err := os.WriteFile(pidFile, []byte(strconv.Itoa(cmd.Process.Pid)), 0644); err != nil {
		cmd.Process.Kill()
		return fmt.Errorf("failed to write pid file: %w", err)
	}

	fmt.Printf("Open Tutor started (pid %d) at http://localhost:%d\n", cmd.Process.Pid, port)
	fmt.Printf("Logs: %s\n", logPath)
	fmt.Println("Run `tutor stop` to shut it down.")
	return nil
}

func startForeground(cmd *exec.Cmd, port int) error {
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

func Stop() error {
	pidFile := config.PidFile()
	data, err := os.ReadFile(pidFile)
	if err != nil {
		if os.IsNotExist(err) {
			return fmt.Errorf("no running tutor server found")
		}
		return fmt.Errorf("failed to read pid file: %w", err)
	}

	pid, err := strconv.Atoi(strings.TrimSpace(string(data)))
	if err != nil {
		return fmt.Errorf("invalid pid file: %w", err)
	}

	proc, err := os.FindProcess(pid)
	if err != nil {
		os.Remove(pidFile)
		return fmt.Errorf("process %d not found", pid)
	}

	if err := proc.Signal(syscall.SIGTERM); err != nil {
		os.Remove(pidFile)
		return fmt.Errorf("failed to stop process %d: %w", pid, err)
	}

	os.Remove(pidFile)
	fmt.Printf("Open Tutor (pid %d) stopped.\n", pid)
	return nil
}
