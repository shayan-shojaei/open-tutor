package cmd

import (
	"fmt"
	"os"

	"github.com/shayan-shojaei/open-tutor/internal/config"
)

// ensureInit checks ~/.tutor/ exists and offers to create it.
func ensureInit() error {
	if _, err := os.Stat(config.TutorDir()); os.IsNotExist(err) {
		return fmt.Errorf("Open Tutor is not initialized. Run `tutor init` first")
	}
	return nil
}
