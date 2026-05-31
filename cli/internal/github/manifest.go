package github

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

type ModuleEntry struct {
	Type        string `json:"type"`
	ID          string `json:"id"`
	Title       string `json:"title"`
	Description string `json:"description"`
}

type Manifest struct {
	Name        string        `json:"name"`
	Description string        `json:"description"`
	Modules     []ModuleEntry `json:"modules"`
}

// FetchManifest clones or updates the repo and reads its tutor-manifest.json.
func FetchManifest(cacheRoot, repoURL string) (*Manifest, error) {
	dir, err := EnsureRepo(cacheRoot, repoURL)
	if err != nil {
		return nil, err
	}
	data, err := os.ReadFile(filepath.Join(dir, "tutor-manifest.json"))
	if err != nil {
		return nil, fmt.Errorf("%s does not contain a tutor-manifest.json", repoURL)
	}
	var m Manifest
	if err := json.Unmarshal(data, &m); err != nil {
		return nil, fmt.Errorf("invalid tutor-manifest.json: %w", err)
	}
	return &m, nil
}

// DownloadModule copies a module directory out of a (already cloned) repo into destDir.
func DownloadModule(cacheRoot, repoURL, moduleType, moduleID, destDir string) error {
	dir, err := EnsureRepo(cacheRoot, repoURL)
	if err != nil {
		return err
	}
	src := filepath.Join(dir, moduleType+"s", moduleID)
	if _, err := os.Stat(src); os.IsNotExist(err) {
		return fmt.Errorf("module %q not found in repository (looked for %s)", moduleID, src)
	}
	return copyDir(src, destDir)
}

func copyDir(src, dst string) error {
	return filepath.WalkDir(src, func(path string, d os.DirEntry, err error) error {
		if err != nil {
			return err
		}
		rel, _ := filepath.Rel(src, path)
		target := filepath.Join(dst, rel)
		if d.IsDir() {
			return os.MkdirAll(target, 0755)
		}
		data, err := os.ReadFile(path)
		if err != nil {
			return err
		}
		return os.WriteFile(target, data, 0644)
	})
}

// parseRepoURL accepts HTTPS and SSH GitHub URLs:
//
//	https://github.com/owner/repo
//	http://github.com/owner/repo
//	git@github.com:owner/repo
//	git@github.com:owner/repo.git
func parseRepoURL(rawURL string) (owner, repo string, err error) {
	s := strings.TrimSuffix(rawURL, ".git")

	// SSH format: git@github.com:owner/repo
	if strings.HasPrefix(s, "git@github.com:") {
		s = strings.TrimPrefix(s, "git@github.com:")
	} else {
		s = strings.TrimPrefix(s, "https://github.com/")
		s = strings.TrimPrefix(s, "http://github.com/")
	}

	parts := strings.SplitN(s, "/", 2)
	if len(parts) != 2 || parts[0] == "" || parts[1] == "" {
		return "", "", fmt.Errorf(
			"invalid GitHub repo URL %q\nAccepted formats:\n  https://github.com/owner/repo\n  git@github.com:owner/repo",
			rawURL,
		)
	}
	return parts[0], parts[1], nil
}

func RepoAlias(repoURL string) string {
	_, repo, err := parseRepoURL(repoURL)
	if err != nil {
		return repoURL
	}
	return repo
}
