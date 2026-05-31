package github

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
)

// cloneDir returns the local cache path for a repo: ~/.tutor/cache/repos/{owner}-{repo}
func cloneDir(cacheRoot, repoURL string) (string, error) {
	owner, repo, err := parseRepoURL(repoURL)
	if err != nil {
		return "", err
	}
	return filepath.Join(cacheRoot, "repos", owner+"-"+repo), nil
}

// EnsureRepo clones the repo if it hasn't been cloned yet, or pulls the latest
// changes if it has. Returns the path to the local clone.
func EnsureRepo(cacheRoot, repoURL string) (string, error) {
	dir, err := cloneDir(cacheRoot, repoURL)
	if err != nil {
		return "", err
	}

	if _, err := os.Stat(filepath.Join(dir, ".git")); os.IsNotExist(err) {
		fmt.Printf("Cloning %s...\n", repoURL)
		if err := git("", "clone", "--depth=1", repoURL, dir); err != nil {
			return "", fmt.Errorf("git clone failed: %w", err)
		}
	} else {
		fmt.Printf("Updating %s...\n", repoURL)
		if err := git(dir, "fetch", "--depth=1", "origin"); err != nil {
			return "", fmt.Errorf("git fetch failed: %w", err)
		}
		if err := git(dir, "reset", "--hard", "origin/HEAD"); err != nil {
			return "", fmt.Errorf("git reset failed: %w", err)
		}
	}

	return dir, nil
}

// git runs a git command, optionally inside a working directory.
func git(dir string, args ...string) error {
	cmd := exec.Command("git", args...)
	if dir != "" {
		cmd.Dir = dir
	}
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	if err := cmd.Run(); err != nil {
		return fmt.Errorf("git %s: %w", strings.Join(args, " "), err)
	}
	return nil
}
