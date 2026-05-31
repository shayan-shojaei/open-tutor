package cmd

import (
	"fmt"
	"os"
	"text/tabwriter"

	"github.com/shayan-shojaei/open-tutor/internal/config"
	gh "github.com/shayan-shojaei/open-tutor/internal/github"
	"github.com/spf13/cobra"
)

var repoCmd = &cobra.Command{
	Use:   "repo",
	Short: "Manage module repositories",
}

var repoAddCmd = &cobra.Command{
	Use:   "add <github-url>",
	Short: "Register a GitHub repo as a module source",
	Args:  cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		repoURL := args[0]
		cfg, err := config.Load()
		if err != nil {
			return err
		}
		for _, r := range cfg.Repos {
			if r.URL == repoURL {
				return fmt.Errorf("repo already registered: %s", repoURL)
			}
		}
		fmt.Printf("Fetching manifest from %s...\n", repoURL)
		manifest, err := gh.FetchManifest(repoURL)
		if err != nil {
			return err
		}
		alias := gh.RepoAlias(repoURL)
		cfg.Repos = append(cfg.Repos, config.Repo{Alias: alias, URL: repoURL})
		if err := cfg.Save(); err != nil {
			return err
		}
		fmt.Printf("Added %q (%s) — %d modules available\n", alias, manifest.Name, len(manifest.Modules))
		return nil
	},
}

var repoListCmd = &cobra.Command{
	Use:   "list",
	Short: "List registered module repositories",
	RunE: func(cmd *cobra.Command, args []string) error {
		cfg, err := config.Load()
		if err != nil {
			return err
		}
		if len(cfg.Repos) == 0 {
			fmt.Println("No repositories registered. Run `tutor repo add <github-url>` to add one.")
			return nil
		}
		w := tabwriter.NewWriter(os.Stdout, 0, 0, 3, ' ', 0)
		fmt.Fprintln(w, "ALIAS\tURL")
		for _, r := range cfg.Repos {
			fmt.Fprintf(w, "%s\t%s\n", r.Alias, r.URL)
		}
		return w.Flush()
	},
}

var repoRemoveCmd = &cobra.Command{
	Use:   "remove <alias-or-url>",
	Short: "Unregister a module repository",
	Args:  cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		target := args[0]
		cfg, err := config.Load()
		if err != nil {
			return err
		}
		filtered := cfg.Repos[:0]
		removed := false
		for _, r := range cfg.Repos {
			if r.Alias == target || r.URL == target {
				removed = true
				continue
			}
			filtered = append(filtered, r)
		}
		if !removed {
			return fmt.Errorf("repo not found: %s", target)
		}
		cfg.Repos = filtered
		if err := cfg.Save(); err != nil {
			return err
		}
		fmt.Printf("Removed repo: %s\n", target)
		return nil
	},
}

var repoUpdateCmd = &cobra.Command{
	Use:   "update",
	Short: "Refresh manifest cache for all registered repositories",
	RunE: func(cmd *cobra.Command, args []string) error {
		cfg, err := config.Load()
		if err != nil {
			return err
		}
		for _, r := range cfg.Repos {
			fmt.Printf("Updating %s...\n", r.Alias)
			if _, err := gh.FetchManifest(r.URL); err != nil {
				fmt.Printf("  warning: %v\n", err)
			} else {
				fmt.Printf("  ok\n")
			}
		}
		return nil
	},
}

func init() {
	repoCmd.AddCommand(repoAddCmd)
	repoCmd.AddCommand(repoListCmd)
	repoCmd.AddCommand(repoRemoveCmd)
	repoCmd.AddCommand(repoUpdateCmd)
}
