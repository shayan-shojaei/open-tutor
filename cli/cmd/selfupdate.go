package cmd

import (
	"fmt"
	"os"
	"path/filepath"
	"runtime"
)

// replaceRunningBinary overwrites the currently running executable with the
// given bytes and returns the path it wrote to.
//
// The new bytes are first written to a temp file in the same directory (so the
// final rename stays on one filesystem and is atomic). On Unix the temp file is
// renamed over the running binary — the live process keeps executing the old
// inode, and the next invocation picks up the new one. Windows cannot overwrite
// a running .exe, so the old file is moved aside first.
func replaceRunningBinary(data []byte) (string, error) {
	exe, err := os.Executable()
	if err != nil {
		return "", fmt.Errorf("could not locate running binary: %w", err)
	}
	exe, err = filepath.EvalSymlinks(exe)
	if err != nil {
		return "", fmt.Errorf("could not resolve binary path: %w", err)
	}

	dir := filepath.Dir(exe)
	tmp, err := os.CreateTemp(dir, ".tutor-update-*")
	if err != nil {
		return "", fmt.Errorf("cannot write to %s (try re-running the install script): %w", dir, err)
	}
	tmpName := tmp.Name()
	defer os.Remove(tmpName) // no-op once the rename below consumes it

	if _, err := tmp.Write(data); err != nil {
		tmp.Close()
		return "", err
	}
	if err := tmp.Close(); err != nil {
		return "", err
	}
	if err := os.Chmod(tmpName, 0755); err != nil {
		return "", err
	}

	if runtime.GOOS == "windows" {
		old := exe + ".old"
		os.Remove(old)
		if err := os.Rename(exe, old); err != nil {
			return "", fmt.Errorf("cannot replace running binary: %w", err)
		}
		if err := os.Rename(tmpName, exe); err != nil {
			os.Rename(old, exe) // best-effort rollback
			return "", fmt.Errorf("cannot install new binary: %w", err)
		}
		os.Remove(old)
		return exe, nil
	}

	if err := os.Rename(tmpName, exe); err != nil {
		return "", fmt.Errorf("cannot replace %s (try re-running the install script): %w", exe, err)
	}
	return exe, nil
}
