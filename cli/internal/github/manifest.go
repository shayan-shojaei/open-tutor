package github

import (
	"encoding/json"
	"fmt"
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

// FetchManifest fetches tutor-manifest.json from the default branch of a GitHub repo URL.
func FetchManifest(repoURL string) (*Manifest, error) {
	owner, repo, err := parseRepoURL(repoURL)
	if err != nil {
		return nil, err
	}
	rawURL := fmt.Sprintf("https://raw.githubusercontent.com/%s/%s/HEAD/tutor-manifest.json", owner, repo)
	data, err := downloadBytes(rawURL)
	if err != nil {
		return nil, fmt.Errorf("could not fetch tutor-manifest.json from %s: %w", repoURL, err)
	}
	var m Manifest
	if err := json.Unmarshal(data, &m); err != nil {
		return nil, fmt.Errorf("invalid tutor-manifest.json: %w", err)
	}
	return &m, nil
}

// DownloadModule downloads a single module directory from a GitHub repo into destDir.
func DownloadModule(repoURL, moduleType, moduleID, destDir string) error {
	owner, repo, err := parseRepoURL(repoURL)
	if err != nil {
		return err
	}
	// Use the GitHub API to get a zip archive of just the subdirectory
	// by downloading the full repo zip and extracting the relevant path.
	zipURL := fmt.Sprintf("https://github.com/%s/%s/archive/HEAD.zip", owner, repo)
	fmt.Printf("Downloading repository archive from %s/%s...\n", owner, repo)
	data, err := downloadBytes(zipURL)
	if err != nil {
		return err
	}
	prefix := fmt.Sprintf("%s-HEAD/%s/%s/", repo, moduleType+"s", moduleID)
	return extractZipSubdir(data, prefix, destDir)
}

func parseRepoURL(url string) (owner, repo string, err error) {
	url = strings.TrimSuffix(url, ".git")
	url = strings.TrimPrefix(url, "https://github.com/")
	url = strings.TrimPrefix(url, "http://github.com/")
	parts := strings.Split(url, "/")
	if len(parts) != 2 {
		return "", "", fmt.Errorf("invalid GitHub repo URL: %s (expected https://github.com/owner/repo)", url)
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
