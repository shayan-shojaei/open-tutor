package cmd

import (
	"fmt"

	"github.com/shayan-shojaei/open-tutor/internal/config"
	"github.com/shayan-shojaei/open-tutor/internal/server"
	"github.com/spf13/cobra"
)

var startPort int
var startForeground bool

var startCmd = &cobra.Command{
	Use:   "start",
	Short: "Start the Open Tutor web app",
	RunE: func(cmd *cobra.Command, args []string) error {
		if err := ensureInit(); err != nil {
			return err
		}
		cfg, err := config.Load()
		if err != nil {
			return err
		}
		port := cfg.Port
		if cmd.Flags().Changed("port") {
			port = startPort
		}

		port = findAvailablePort(port)
		fmt.Printf("Starting on port %d...\n", port)
		
		return server.Start(config.AppDir(), config.ModulesDir(), port, !startForeground, func() {
			openBrowser(fmt.Sprintf("http://localhost:%d", port))
		})
	},
}

func init() {
	startCmd.Flags().IntVar(&startPort, "port", 3000, "port to serve on")
	startCmd.Flags().BoolVarP(&startForeground, "foreground", "f", false, "run in the foreground (don't detach)")
}
