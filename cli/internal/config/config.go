package config

import (
	"encoding/json"
	"os"
	"path/filepath"
)

const Version = "0.1.0"

type Repo struct {
	Alias string `json:"alias"`
	URL   string `json:"url"`
}

type Config struct {
	Port  int    `json:"port"`
	Repos []Repo `json:"repos"`
}

func TutorDir() string {
	home, _ := os.UserHomeDir()
	return filepath.Join(home, ".tutor")
}

func ModulesDir() string {
	return filepath.Join(TutorDir(), "modules")
}

func AppDir() string {
	return filepath.Join(TutorDir(), "app")
}

func ConfigPath() string {
	return filepath.Join(TutorDir(), "config.json")
}

func CacheDir() string {
	return filepath.Join(TutorDir(), "cache")
}

func Load() (*Config, error) {
	data, err := os.ReadFile(ConfigPath())
	if err != nil {
		if os.IsNotExist(err) {
			return &Config{Port: 3000, Repos: []Repo{}}, nil
		}
		return nil, err
	}
	var cfg Config
	if err := json.Unmarshal(data, &cfg); err != nil {
		return nil, err
	}
	if cfg.Port == 0 {
		cfg.Port = 3000
	}
	return &cfg, nil
}

func (c *Config) Save() error {
	data, err := json.MarshalIndent(c, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(ConfigPath(), data, 0644)
}
