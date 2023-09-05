---
title: Git command: git reset
published: true
date: 2023-09-04 23:07:00
tags: git
description: Explain and usage of git reset command
image: 
---
To begin with this post, let's explore the command using to inspect git's `staging area` first.
```bash
    $ git ls-files -s
    100644 fd84a7bbfc96edac1e356a4a1bd61fe0fbc682c0 0       file_1.txt
```
This command show the detail information of files in staging area including hash and file path.

`git reset` command provide 3 options to interact with commit history and they will affect to different area of git.

- `--soft`: affect to history tree only
- `--mixed` (default mode): affect to history tree and staging area
- `--hard`: affect to history tree, staging area and working directory

## --hard
Syntax:
```bash
    $ git reset --hard HEAD^n
    // or
    $ git reset --hard <commit-hash>
```
This is the most dangerous option because it will discard all your changes pending in staging area and working directory.
```bash
    $ git log
    * 93f0ef4 - (HEAD -> main) commit 1 (4 weeks ago) <ngtam>

    // add 2 commits, 1 file in working area and 1 file in staging area

    $ git log
    * e5db62f - (HEAD -> main) add file 3 (6 minutes ago) <ngtam>
    * 7771298 - add file 2 (7 minutes ago) <ngtam>
    * 93f0ef4 - commit 1 (4 weeks ago) <ngtam>

    $ git status
    On branch main
    Changes to be committed:
        (use "git restore --staged <file>..." to unstage)
            new file:   file_4.txt

    Untracked files:
    (use "git add <file>..." to include in what will be committed)
            file_5.txt
```

With the above status, if we run command 

```bash
    git reset --hard HEAD^2
```

2 recently added commits and 1 pending changes will be discared, the result is:
```bash
    HEAD is now at 93f0ef4 commit 1
    $ git status
    On branch main
        Untracked files:
        (use "git add <file>..." to include in what will be committed)
            file_5.txt
```
`file_5.txt` is still being present because it has not been added to git, git leaves these file untouch.

## --mixed

This option resets the history and staging area to target commit (we could verify the status of staging area by command `git ls-files -s` mentioned above). *Any file which is difference from the state of staging area at target commit will be moved to working directory.*

From the state of git folder after running command in `--hard` part, we add `file_5.txt` to git and create a new commit for this change, then run command `git reset` with `--mixed` option

```bash
    $ git add file_5.txt
    $ git commit -m "add file 5"
    $ git reset --mixed HEAD^1
```

Verify result:
```bash
    $ git status
    On branch main
    Untracked files:
        (use "git add <file>..." to include in what will be committed)
            file_5.txt
    
    nothing added to commit but untracked files present (use "git add" to track)
    $ git ls-files -s
    100644 fd84a7bbfc96edac1e356a4a1bd61fe0fbc682c0 0       file_1.txt
```

The result is very aligned with description above. At commit 1, we did't have file `file_5.txt`, so git detects a difference here and ***remove this file from tracking***, the staging area is **empty** because all files added to this area has already commited. So what will happen if at commit 1, we have committed file `file_5.txt`? The answer is file `file_5.txt` will be put in working directory if it has been changed in the reseted commits, otherwise, nothing happend.

> **Usage:** We could use this option to reset commit and keep all changes from `HEAD^n` commit to `HEAD` (state before applying git reset command) to prepare for new commit, because these changes is put into working area so you could decide which files will be put into next commit.

## --soft

This option reset the commit history to target commit, keep staging area untouched, so the the result is all files commited in range HEAD^n to HEAD will be put in staging area.

We will use the git folder after running git command in `--hard` part again to demonstrate how option `--soft` works.

```bash
    $ git add file_5.txt
    $ git commit -m "add file 5"
    $ git reset --soft HEAD^1
```

The file `file_5.txt` now is added to staging area instead of working area like `--mixed` option.

```bash
    $ git status
    On branch main
    Changes to be committed:
    (use "git restore --staged <file>..." to unstage)
            new file:   file_5.txt
```

> **Usage:** You can reset commit and create new commit or fix previous commit with another message (`-- amend` option).

--
Related knowledge
> :bulb: Another command to reset and create new command is `git rebase -i`

---
**References**

[1] https://www.atlassian.com/git/tutorials/undoing-changes/git-reset

[2] https://git-scm.com/docs/git-reset