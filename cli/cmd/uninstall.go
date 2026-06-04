package cmd

import (
	"bufio"
	"fmt"
	"os"
	"strings"

	"github.com/shayan-shojaei/open-tutor/internal/config"
	"github.com/shayan-shojaei/open-tutor/internal/server"
	"github.com/spf13/cobra"
)

var uninstallCmd = &cobra.Command{
	Use:   "uninstall",
	Short: "Remove Open Tutor from your machine",
	Long:  "Stops the server, removes the installed web app, and optionally deletes all your learning modules and settings.",
	RunE: func(cmd *cobra.Command, args []string) error {
		// Stop the server if it is running (ignore error — it may not be running)
		_ = server.Stop()

		reader := bufio.NewReader(os.Stdin)

		fmt.Printf("Also delete all your learning modules and settings (%s)? (y/N) ", config.TutorDir())
		resp, _ := reader.ReadString('\n')
		deleteAll := strings.TrimSpace(strings.ToLower(resp)) == "y"

		if deleteAll {
			if err := os.RemoveAll(config.TutorDir()); err != nil {
				return fmt.Errorf("failed to remove %s: %w", config.TutorDir(), err)
			}
			fmt.Println("Open Tutor has been fully uninstalled.")
		} else {
			// Remove only the app and cache; keep modules and config
			for _, dir := range []string{config.AppDir(), config.CacheDir()} {
				if err := os.RemoveAll(dir); err != nil {
					return fmt.Errorf("failed to remove %s: %w", dir, err)
				}
			}
			fmt.Println("Open Tutor has been uninstalled. Your modules and settings were kept.")
			fmt.Printf("Run `tutor install` at any time to reinstall the web app.\n")
		}

		return nil
	},
}
