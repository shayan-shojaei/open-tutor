package main

import (
	"os"

	"github.com/shayan-shojaei/open-tutor/cmd"
)

func main() {
	if err := cmd.Execute(); err != nil {
		os.Exit(1)
	}
}
