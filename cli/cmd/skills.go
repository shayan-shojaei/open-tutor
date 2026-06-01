package cmd

import (
	"embed"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"

	"github.com/spf13/cobra"
)

//go:embed skills
var skillsFS embed.FS

var skillsCmd = &cobra.Command{
	Use:   "skills",
	Short: "Install Claude Code skills for generating courses, flashcards, and quizzes",
	RunE: func(cmd *cobra.Command, args []string) error {
		homeDir, err := os.UserHomeDir()
		if err != nil {
			return fmt.Errorf("could not find home directory: %w", err)
		}
		destBase := filepath.Join(homeDir, ".claude", "skills")

		installed := 0
		err = fs.WalkDir(skillsFS, "skills", func(path string, d fs.DirEntry, err error) error {
			if err != nil {
				return err
			}
			// path is like "skills/new-course/SKILL.md"
			// rel will be "new-course/SKILL.md"
			rel, _ := filepath.Rel("skills", path)
			dest := filepath.Join(destBase, rel)

			if d.IsDir() {
				return os.MkdirAll(dest, 0755)
			}

			data, err := skillsFS.ReadFile(path)
			if err != nil {
				return err
			}
			if err := os.WriteFile(dest, data, 0644); err != nil {
				return fmt.Errorf("failed to write %s: %w", dest, err)
			}
			installed++
			return nil
		})
		if err != nil {
			return fmt.Errorf("failed to install skills: %w", err)
		}

		fmt.Printf("Installed %d skill(s) to %s\n", installed, destBase)
		fmt.Println("Open a new Claude Code session to use /new-course, /new-flash-card, /new-quiz, /new-recap, /course-images.")
		return nil
	},
}
