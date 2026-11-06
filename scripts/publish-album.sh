#!/usr/bin/env bash
# Publish album changes to GitHub (CI then deploys to the server).
set -euo pipefail
cd /home/dsbot/blog

git add -A source/album/emotion 2>/dev/null || true
if git diff --cached --quiet; then
  echo "publish: nothing new"
  exit 0
fi

git -c user.name="dsbot" -c user.email="dsbot@local" \
    commit -m "feat(album): add sticker(s) $(date +'%Y-%m-%d %H:%M')" >/dev/null

GIT_SSH_COMMAND="ssh -i /home/dsbot/.ssh/github_repo_push_key -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new" \
  git push origin main 2>&1 | tail -2
echo "publish: pushed"
