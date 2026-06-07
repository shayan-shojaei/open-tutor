package github

import (
	"archive/tar"
	"compress/gzip"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"runtime"
	"strings"
)

const releaseRepo = "shayan-shojaei/open-tutor"

type release struct {
	TagName string  `json:"tag_name"`
	Assets  []asset `json:"assets"`
}

type asset struct {
	Name               string `json:"name"`
	BrowserDownloadURL string `json:"browser_download_url"`
}

func LatestReleaseTag() (string, error) {
	url := fmt.Sprintf("https://api.github.com/repos/%s/releases/latest", releaseRepo)
	resp, err := httpGet(url)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	var r release
	if err := json.NewDecoder(resp.Body).Decode(&r); err != nil {
		return "", err
	}
	return r.TagName, nil
}

// cliAssetName returns the release asset name for the tutor CLI binary on the
// current platform (e.g. "tutor-darwin-arm64"). It mirrors the asset names
// produced by the release workflow.
func cliAssetName() (string, error) {
	switch runtime.GOOS {
	case "darwin":
		switch runtime.GOARCH {
		case "amd64":
			return "tutor-darwin-amd64", nil
		case "arm64":
			return "tutor-darwin-arm64", nil
		}
	case "linux":
		if runtime.GOARCH == "amd64" {
			return "tutor-linux-amd64", nil
		}
	case "windows":
		if runtime.GOARCH == "amd64" {
			return "tutor-windows-amd64.exe", nil
		}
	}
	return "", fmt.Errorf("no prebuilt tutor binary for %s/%s", runtime.GOOS, runtime.GOARCH)
}

// DownloadCLIBinary fetches the tutor CLI binary asset for the current platform
// from the given release and returns its raw bytes. Unlike the web-app tarball,
// the CLI binaries ship without a checksum asset, so none is verified here.
func DownloadCLIBinary(version string) ([]byte, error) {
	assetName, err := cliAssetName()
	if err != nil {
		return nil, err
	}

	var url string
	if version == "" || version == "latest" {
		url = fmt.Sprintf("https://api.github.com/repos/%s/releases/latest", releaseRepo)
	} else {
		url = fmt.Sprintf("https://api.github.com/repos/%s/releases/tags/%s", releaseRepo, version)
	}

	resp, err := httpGet(url)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var r release
	if err := json.NewDecoder(resp.Body).Decode(&r); err != nil {
		return nil, err
	}

	var binURL string
	for _, a := range r.Assets {
		if a.Name == assetName {
			binURL = a.BrowserDownloadURL
			break
		}
	}
	if binURL == "" {
		return nil, fmt.Errorf("no %s asset found in release %s", assetName, r.TagName)
	}

	fmt.Printf("Downloading tutor CLI %s (%s)...\n", r.TagName, assetName)
	return downloadBytes(binURL)
}

func DownloadRelease(version, destDir string) error {
	var url string
	if version == "" || version == "latest" {
		url = fmt.Sprintf("https://api.github.com/repos/%s/releases/latest", releaseRepo)
	} else {
		url = fmt.Sprintf("https://api.github.com/repos/%s/releases/tags/%s", releaseRepo, version)
	}

	resp, err := httpGet(url)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	var r release
	if err := json.NewDecoder(resp.Body).Decode(&r); err != nil {
		return err
	}

	var tarURL, checksumURL string
	for _, a := range r.Assets {
		if strings.HasSuffix(a.Name, ".tar.gz") && strings.HasPrefix(a.Name, "web-standalone") {
			tarURL = a.BrowserDownloadURL
		}
		if strings.HasSuffix(a.Name, ".sha256") {
			checksumURL = a.BrowserDownloadURL
		}
	}

	if tarURL == "" {
		return fmt.Errorf("no web-standalone asset found in release %s", r.TagName)
	}

	fmt.Printf("Downloading Open Tutor %s...\n", r.TagName)
	tarData, err := downloadBytes(tarURL)
	if err != nil {
		return fmt.Errorf("download failed: %w", err)
	}

	if checksumURL != "" {
		fmt.Println("Verifying checksum...")
		checksumData, err := downloadBytes(checksumURL)
		if err == nil {
			expected := strings.Fields(string(checksumData))[0]
			sum := sha256.Sum256(tarData)
			got := hex.EncodeToString(sum[:])
			if got != expected {
				return fmt.Errorf("checksum mismatch: expected %s, got %s", expected, got)
			}
		}
	}

	if err := os.RemoveAll(destDir); err != nil {
		return err
	}
	if err := os.MkdirAll(destDir, 0755); err != nil {
		return err
	}

	fmt.Println("Extracting...")
	return extractTarGz(tarData, destDir)
}

func extractTarGz(data []byte, destDir string) error {
	gr, err := gzip.NewReader(strings.NewReader(string(data)))
	if err != nil {
		// try without gzip (raw tar)
		return extractTar(data, destDir)
	}
	defer gr.Close()
	return extractTarReader(gr, destDir)
}

func extractTar(data []byte, destDir string) error {
	r := strings.NewReader(string(data))
	return extractTarReader(r, destDir)
}

func extractTarReader(r io.Reader, destDir string) error {
	tr := tar.NewReader(r)
	for {
		hdr, err := tr.Next()
		if err == io.EOF {
			break
		}
		if err != nil {
			return err
		}
		// strip first path component (e.g. "standalone/")
		parts := strings.SplitN(hdr.Name, "/", 2)
		rel := hdr.Name
		if len(parts) == 2 {
			rel = parts[1]
		}
		if rel == "" {
			continue
		}
		target := filepath.Join(destDir, filepath.FromSlash(rel))
		switch hdr.Typeflag {
		case tar.TypeDir:
			os.MkdirAll(target, 0755)
		case tar.TypeReg:
			os.MkdirAll(filepath.Dir(target), 0755)
			f, err := os.OpenFile(target, os.O_CREATE|os.O_WRONLY|os.O_TRUNC, os.FileMode(hdr.Mode))
			if err != nil {
				return err
			}
			io.Copy(f, tr)
			f.Close()
		}
	}
	return nil
}

func downloadBytes(url string) ([]byte, error) {
	resp, err := httpGet(url)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	return io.ReadAll(resp.Body)
}

func httpGet(url string) (*http.Response, error) {
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("User-Agent", "tutor-cli")
	req.Header.Set("Accept", "application/vnd.github+json")
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	if resp.StatusCode >= 400 {
		resp.Body.Close()
		return nil, fmt.Errorf("HTTP %d from %s", resp.StatusCode, url)
	}
	return resp, nil
}
