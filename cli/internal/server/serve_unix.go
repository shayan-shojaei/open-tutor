//go:build !windows

package server

import (
	"fmt"
	"os"
	"os/exec"
	"os/signal"
	"strconv"
	"strings"
	"syscall"
	"time"
)

func startDetached(cmd *exec.Cmd, port int, onReady func()) error {
	logFile, err := os.OpenFile(logPath(), os.O_CREATE|os.O_WRONLY|os.O_TRUNC, 0644)
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

	if err := os.WriteFile(pidPath(), []byte(strconv.Itoa(cmd.Process.Pid)), 0644); err != nil {
		cmd.Process.Kill()
		return fmt.Errorf("failed to write pid file: %w", err)
	}

	fmt.Printf("Open Tutor started (pid %d) at http://localhost:%d\n", cmd.Process.Pid, port)
	fmt.Printf("Logs: %s\n", logPath())
	fmt.Println("Run `tutor stop` to shut it down.")

	if onReady != nil {
		time.Sleep(1 * time.Second)
		onReady()
	}

	return nil
}

func startForeground(cmd *exec.Cmd, port int, onReady func()) error {
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	if err := cmd.Start(); err != nil {
		return fmt.Errorf("failed to start server: %w", err)
	}

	fmt.Printf("Open Tutor is running at http://localhost:%d\n", port)
	fmt.Println("Press Ctrl-C to stop.")

	if onReady != nil {
		go func() {
			time.Sleep(1 * time.Second)
			onReady()
		}()
	}

	sig := make(chan os.Signal, 1)
	signal.Notify(sig, syscall.SIGINT, syscall.SIGTERM)
	<-sig

	fmt.Println("\nShutting down...")
	cmd.Process.Signal(syscall.SIGTERM)
	cmd.Wait()
	return nil
}

func Stop() error {
	pf := pidPath()
	data, err := os.ReadFile(pf)
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
		os.Remove(pf)
		return fmt.Errorf("process %d not found", pid)
	}

	if err := proc.Signal(syscall.SIGTERM); err != nil {
		os.Remove(pf)
		return fmt.Errorf("failed to stop process %d: %w", pid, err)
	}

	os.Remove(pf)
	fmt.Printf("Open Tutor (pid %d) stopped.\n", pid)
	return nil
}
