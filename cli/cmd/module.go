package cmd

import (
	"bufio"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"text/tabwriter"

	"github.com/shayan-shojaei/open-tutor/internal/config"
	gh "github.com/shayan-shojaei/open-tutor/internal/github"
	"github.com/spf13/cobra"
)

var moduleCmd = &cobra.Command{
	Use:   "module",
	Short: "Manage installed modules",
}

var moduleListCmd = &cobra.Command{
	Use:   "list",
	Short: "List installed modules",
	RunE: func(cmd *cobra.Command, args []string) error {
		type row struct{ kind, id, title, lang string }
		var rows []row

		for _, kind := range []string{"courses", "flashcards", "quizzes"} {
			dir := filepath.Join(config.ModulesDir(), kind)
			entries, err := os.ReadDir(dir)
			if err != nil {
				continue
			}
			for _, e := range entries {
				if !e.IsDir() {
					continue
				}
				cfgPath := filepath.Join(dir, e.Name(), "config.json")
				data, err := os.ReadFile(cfgPath)
				if err != nil {
					continue
				}
				var meta struct {
					Title    string `json:"title"`
					Language string `json:"language"`
				}
				if err := json.Unmarshal(data, &meta); err != nil {
					continue
				}
				rows = append(rows, row{strings.TrimSuffix(kind, "s"), e.Name(), meta.Title, meta.Language})
			}
		}

		if len(rows) == 0 {
			fmt.Println("No modules installed. Run `tutor module install <repo> <id>` to install one.")
			return nil
		}
		w := tabwriter.NewWriter(os.Stdout, 0, 0, 3, ' ', 0)
		fmt.Fprintln(w, "TYPE\tID\tTITLE\tLANG")
		for _, r := range rows {
			fmt.Fprintf(w, "%s\t%s\t%s\t%s\n", r.kind, r.id, r.title, r.lang)
		}
		return w.Flush()
	},
}

var moduleForce bool

var moduleInstallCmd = &cobra.Command{
	Use:   "install <repo-alias-or-url> <module-id>",
	Short: "Install a module from a registered repository",
	Args:  cobra.ExactArgs(2),
	RunE: func(cmd *cobra.Command, args []string) error {
		repoRef, moduleID := args[0], args[1]

		cfg, err := config.Load()
		if err != nil {
			return err
		}

		// Resolve alias to URL
		repoURL := repoRef
		for _, r := range cfg.Repos {
			if r.Alias == repoRef {
				repoURL = r.URL
				break
			}
		}

		manifest, err := gh.FetchManifest(config.CacheDir(), repoURL)
		if err != nil {
			return err
		}

		var found *gh.ModuleEntry
		for i := range manifest.Modules {
			if manifest.Modules[i].ID == moduleID {
				found = &manifest.Modules[i]
				break
			}
		}
		if found == nil {
			return fmt.Errorf("module %q not found in %s", moduleID, repoURL)
		}

		typeDir := found.Type + "s"
		destDir := filepath.Join(config.ModulesDir(), typeDir, moduleID)

		if _, err := os.Stat(destDir); err == nil && !moduleForce {
			return fmt.Errorf("module %q is already installed (use --force to overwrite)", moduleID)
		}

		if err := os.MkdirAll(destDir, 0755); err != nil {
			return err
		}
		if err := gh.DownloadModule(config.CacheDir(), repoURL, found.Type, moduleID, destDir); err != nil {
			return err
		}

		fmt.Printf("Installed %s %q: %s\n", found.Type, moduleID, found.Title)
		return nil
	},
}

var moduleRemoveCmd = &cobra.Command{
	Use:   "remove <module-id>",
	Short: "Remove an installed module",
	Args:  cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		moduleID := args[0]
		var found string
		for _, kind := range []string{"courses", "flashcards", "quizzes"} {
			p := filepath.Join(config.ModulesDir(), kind, moduleID)
			if _, err := os.Stat(p); err == nil {
				found = p
				break
			}
		}
		if found == "" {
			return fmt.Errorf("module %q not found", moduleID)
		}
		fmt.Printf("Remove module %q? (y/N) ", moduleID)
		reader := bufio.NewReader(os.Stdin)
		resp, _ := reader.ReadString('\n')
		if strings.TrimSpace(strings.ToLower(resp)) != "y" {
			fmt.Println("Cancelled.")
			return nil
		}
		if err := os.RemoveAll(found); err != nil {
			return err
		}
		fmt.Printf("Removed %s\n", moduleID)
		return nil
	},
}

var moduleSearchCmd = &cobra.Command{
	Use:   "search <query>",
	Short: "Search for modules across registered repositories",
	Args:  cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		query := strings.ToLower(args[0])
		cfg, err := config.Load()
		if err != nil {
			return err
		}
		if len(cfg.Repos) == 0 {
			fmt.Println("No repositories registered. Run `tutor repo add <github-url>` first.")
			return nil
		}

		w := tabwriter.NewWriter(os.Stdout, 0, 0, 3, ' ', 0)
		fmt.Fprintln(w, "REPO\tTYPE\tID\tTITLE")
		found := 0
		for _, r := range cfg.Repos {
			manifest, err := gh.FetchManifest(config.CacheDir(), r.URL)
			if err != nil {
				fmt.Fprintf(os.Stderr, "warning: could not fetch %s: %v\n", r.Alias, err)
				continue
			}
			for _, m := range manifest.Modules {
				if strings.Contains(strings.ToLower(m.Title), query) ||
					strings.Contains(strings.ToLower(m.Description), query) ||
					strings.Contains(strings.ToLower(m.ID), query) {
					fmt.Fprintf(w, "%s\t%s\t%s\t%s\n", r.Alias, m.Type, m.ID, m.Title)
					found++
				}
			}
		}
		w.Flush()
		if found == 0 {
			fmt.Printf("No modules found matching %q\n", args[0])
		}
		return nil
	},
}

func init() {
	moduleInstallCmd.Flags().BoolVar(&moduleForce, "force", false, "overwrite if already installed")
	moduleCmd.AddCommand(moduleListCmd)
	moduleCmd.AddCommand(moduleInstallCmd)
	moduleCmd.AddCommand(moduleRemoveCmd)
	moduleCmd.AddCommand(moduleSearchCmd)
}
