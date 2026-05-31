package cmd

import (
	"fmt"

	"github.com/shayan-shojaei/open-tutor/internal/config"
	gh "github.com/shayan-shojaei/open-tutor/internal/github"
	"github.com/spf13/cobra"
)

var installVersion string

var installCmd = &cobra.Command{
	Use:   "install",
	Short: "Download and install the Open Tutor web app",
	RunE: func(cmd *cobra.Command, args []string) error {
		if err := ensureInit(); err != nil {
			return err
		}
		if err := gh.DownloadRelease(installVersion, config.AppDir()); err != nil {
			return err
		}
		fmt.Println("Installation complete. Run `tutor start` to launch.")
		return nil
	},
}

var upgradeCmd = &cobra.Command{
	Use:   "upgrade",
	Short: "Upgrade the web app to the latest release",
	RunE: func(cmd *cobra.Command, args []string) error {
		if err := ensureInit(); err != nil {
			return err
		}
		tag, err := gh.LatestReleaseTag()
		if err != nil {
			return fmt.Errorf("could not fetch latest release: %w", err)
		}
		fmt.Printf("Upgrading to %s...\n", tag)
		if err := gh.DownloadRelease(tag, config.AppDir()); err != nil {
			return err
		}
		fmt.Println("Upgrade complete.")
		return nil
	},
}

func init() {
	installCmd.Flags().StringVar(&installVersion, "version", "", "specific release version to install (e.g. v1.2.0)")
}
