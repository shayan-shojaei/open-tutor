package cmd

import (
	"github.com/shayan-shojaei/open-tutor/internal/server"
	"github.com/spf13/cobra"
)

var stopCmd = &cobra.Command{
	Use:   "stop",
	Short: "Stop the running Open Tutor web app",
	RunE: func(cmd *cobra.Command, args []string) error {
		return server.Stop()
	},
}
