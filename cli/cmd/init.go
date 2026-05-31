package cmd

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/shayan-shojaei/open-tutor/internal/config"
	"github.com/spf13/cobra"
)

var initCmd = &cobra.Command{
	Use:   "init",
	Short: "Create the ~/.tutor/ directory structure",
	RunE: func(cmd *cobra.Command, args []string) error {
		tutorDir := config.TutorDir()
		if _, err := os.Stat(config.ConfigPath()); err == nil {
			fmt.Println("Already initialized:", tutorDir)
			return nil
		}

		dirs := []string{
			tutorDir,
			filepath.Join(config.ModulesDir(), "courses"),
			filepath.Join(config.ModulesDir(), "flashcards"),
			filepath.Join(config.ModulesDir(), "quizzes"),
			config.AppDir(),
			config.CacheDir(),
		}
		for _, d := range dirs {
			if err := os.MkdirAll(d, 0755); err != nil {
				return fmt.Errorf("failed to create %s: %w", d, err)
			}
		}

		cfg := &config.Config{Port: 3000, Repos: []config.Repo{}}
		if err := cfg.Save(); err != nil {
			return fmt.Errorf("failed to write config: %w", err)
		}

		fmt.Println("Initialized Open Tutor at", tutorDir)
		fmt.Println("Run `tutor install` to download the web app.")
		return nil
	},
}
