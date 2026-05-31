package cmd

import (
	"github.com/spf13/cobra"
)

var rootCmd = &cobra.Command{
	Use:     "tutor",
	Short:   "Open Tutor — self-hosted interactive learning",
	Long:    "Open Tutor lets you install, manage, and serve learning modules (courses, flashcards, quizzes) locally.",
	Version: "0.1.0",
}

func Execute() error {
	return rootCmd.Execute()
}

func init() {
	rootCmd.AddCommand(initCmd)
	rootCmd.AddCommand(installCmd)
	rootCmd.AddCommand(startCmd)
	rootCmd.AddCommand(upgradeCmd)
	rootCmd.AddCommand(moduleCmd)
	rootCmd.AddCommand(repoCmd)
}
