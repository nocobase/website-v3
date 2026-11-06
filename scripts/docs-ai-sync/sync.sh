#!/usr/bin/env bash
set -euo pipefail

# Requires bash, git, find, tar and OpenSSH locally; bash, tar and GNU mv
# on the target Linux host. The SSH user must own the dedicated target path.
for name in DOCS_AI_HOST DOCS_AI_USER DOCS_AI_PATH DOCS_AI_SSH_KEY DOCS_AI_KNOWN_HOSTS; do
  if [[ -z "${!name:-}" ]]; then
    echo "::error::$name is required. Configure the production Environment."
    exit 1
  fi
done
port=${DOCS_AI_PORT:-22}
# Restrict values interpolated into remote shell commands to safe characters.
[[ "$DOCS_AI_HOST" =~ ^[a-zA-Z0-9][a-zA-Z0-9.-]*$ ]] || { echo 'Invalid host (use a hostname or IPv4 address).'; exit 1; }
[[ "$DOCS_AI_USER" =~ ^[a-zA-Z_][a-zA-Z0-9_-]*$ ]] || { echo 'Invalid SSH user.'; exit 1; }
[[ "$port" =~ ^[0-9]{1,5}$ ]] && (( 10#$port > 0 && 10#$port <= 65535 )) || { echo 'Invalid SSH port.'; exit 1; }
[[ "$DOCS_AI_PATH" =~ ^(/[a-zA-Z0-9_-][a-zA-Z0-9._-]*){2,}$ ]] || { echo 'Use a dedicated absolute path with at least two components, without spaces or dot segments.'; exit 1; }

scratch=$(mktemp -d)
trap 'rm -rf -- "$scratch"' EXIT
umask 077
printf '%s\n' "$DOCS_AI_SSH_KEY" > "$scratch/key"
printf '%s\n' "$DOCS_AI_KNOWN_HOSTS" > "$scratch/known_hosts"
unset DOCS_AI_SSH_KEY DOCS_AI_KNOWN_HOSTS
ssh-keygen -y -P '' -f "$scratch/key" > /dev/null

sha=$(git rev-parse HEAD)
[[ "$sha" =~ ^[a-f0-9]{40}$ ]] || exit 1
# A unique directory also permits retrying the same commit safely.
release="${sha}-$(date -u +%Y%m%d%H%M%S)-${scratch##*.}"
target="$DOCS_AI_USER@$DOCS_AI_HOST"
ssh_args=(-p "$port" -i "$scratch/key" -o BatchMode=yes -o IdentitiesOnly=yes
  -o StrictHostKeyChecking=yes -o "UserKnownHostsFile=$scratch/known_hosts"
  -o ConnectTimeout=20 -o ServerAliveInterval=15 -o ServerAliveCountMax=3)

# Preserve the original source and every language, including front matter.
# A fresh snapshot ensures deleted/renamed documents disappear from current.
find doc/content -type f -name '*.md' -printf '%P\0' > "$scratch/files"
[[ -s "$scratch/files" ]] || { echo 'No Markdown files found; refusing to publish an empty snapshot.'; exit 1; }
tar -czf "$scratch/content.tar.gz" -C doc/content --null -T "$scratch/files"

ssh "${ssh_args[@]}" "$target" "bash -s -- '$DOCS_AI_PATH' '$release'" <<'REMOTE'
set -euo pipefail
base=$1
release=$2
mkdir -p -- "$base/releases"
if [[ -e "$base/current" && ! -L "$base/current" ]]; then
  echo 'current already exists and is not a symlink; refusing to replace it.' >&2
  exit 1
fi
mkdir -- "$base/releases/$release"
REMOTE

ssh "${ssh_args[@]}" "$target" "tar -xzf - -C '$DOCS_AI_PATH/releases/$release'" < "$scratch/content.tar.gz"
ssh "${ssh_args[@]}" "$target" "bash -s -- '$DOCS_AI_PATH' '$release'" <<'REMOTE'
set -euo pipefail
base=$1
release=$2
ln -s -- "releases/$release" "$base/.current-$release"
mv -Tf -- "$base/.current-$release" "$base/current"
# Keep old snapshots for manual rollback. Retention can be configured once
# the service's indexing and file-reading lifecycle is known.
REMOTE

echo "Markdown snapshot published: $sha"
if [[ -n "${GITHUB_STEP_SUMMARY:-}" ]]; then
  printf 'Markdown source synced from commit `%s`. Read it through the configured path plus `/current`. Index rebuilding is not configured.\n' "$sha" >> "$GITHUB_STEP_SUMMARY"
fi
