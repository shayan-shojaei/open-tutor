package github

import "testing"

func TestParseRepoURL(t *testing.T) {
	cases := []struct {
		input       string
		wantOwner   string
		wantRepo    string
		wantErrFrag string
	}{
		{"https://github.com/shayan-shojaei/modules", "shayan-shojaei", "modules", ""},
		{"https://github.com/shayan-shojaei/modules.git", "shayan-shojaei", "modules", ""},
		{"http://github.com/shayan-shojaei/modules", "shayan-shojaei", "modules", ""},
		{"git@github.com:shayan-shojaei/modules", "shayan-shojaei", "modules", ""},
		{"git@github.com:shayan-shojaei/modules.git", "shayan-shojaei", "modules", ""},
		{"not-a-url", "", "", "invalid"},
		{"git@github.com:onlyowner", "", "", "invalid"},
	}

	for _, tc := range cases {
		owner, repo, err := parseRepoURL(tc.input)
		if tc.wantErrFrag != "" {
			if err == nil {
				t.Errorf("parseRepoURL(%q): expected error, got owner=%q repo=%q", tc.input, owner, repo)
			}
			continue
		}
		if err != nil {
			t.Errorf("parseRepoURL(%q): unexpected error: %v", tc.input, err)
			continue
		}
		if owner != tc.wantOwner || repo != tc.wantRepo {
			t.Errorf("parseRepoURL(%q): got %q/%q, want %q/%q", tc.input, owner, repo, tc.wantOwner, tc.wantRepo)
		}
	}
}
