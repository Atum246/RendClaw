#!/usr/bin/env python3
"""
🎨🦞 RendClaw Workspace Sync
Multi-backend backup: GitHub Gist, S3, HuggingFace Datasets
Optimized for Render (no built-in storage like HF)
"""

import os
import sys
import json
import time
import shutil
import subprocess
import hashlib
from pathlib import Path
from datetime import datetime, timezone
from typing import Optional

# ─── Configuration ─────────────────────────────────────────────
WORKSPACE_PATH = os.environ.get("WORKSPACE_PATH", "/root/.openclaw/workspace")
SYNC_INTERVAL = int(os.environ.get("SYNC_INTERVAL", "180"))
GIT_USER = os.environ.get("WORKSPACE_GIT_USER", "rendclaw@example.com")
GIT_NAME = os.environ.get("WORKSPACE_GIT_NAME", "RendClaw Bot")

# Backup backends
GITHUB_TOKEN = os.environ.get("GITHUB_GIST_TOKEN", "")
GITHUB_GIST_ID = os.environ.get("GITHUB_GIST_ID", "")
HF_TOKEN = os.environ.get("HF_TOKEN", "")
HF_USERNAME = os.environ.get("HF_USERNAME", "")
HF_DATASET = os.environ.get("BACKUP_DATASET_NAME", "rendclaw-backup")
S3_BUCKET = os.environ.get("S3_BACKUP_BUCKET", "")
S3_REGION = os.environ.get("S3_REGION", "us-east-1")

BACKUP_DIR = Path("/tmp/rendclaw-backup")
STATE_FILE = Path("/tmp/rendclaw-sync-state.json")


def log(msg: str, level: str = "INFO"):
    icons = {"INFO": "ℹ️", "OK": "✅", "WARN": "⚠️", "ERROR": "❌", "SYNC": "🔄"}
    ts = datetime.now(timezone.utc).strftime("%H:%M:%S")
    print(f"[{ts}] {icons.get(level, '•')} {msg}", flush=True)


def get_workspace_hash() -> str:
    """Hash workspace contents for change detection."""
    h = hashlib.sha256()
    ws = Path(WORKSPACE_PATH)
    if not ws.exists():
        return ""
    for f in sorted(ws.rglob("*")):
        if f.is_file() and not any(part.startswith('.') for part in f.parts):
            try:
                h.update(str(f.relative_to(ws)).encode())
                h.update(f.read_bytes())
            except (PermissionError, OSError):
                continue
    return h.hexdigest()


def load_state() -> dict:
    if STATE_FILE.exists():
        try:
            return json.loads(STATE_FILE.read_text())
        except json.JSONDecodeError:
            pass
    return {"last_hash": "", "last_sync": 0, "sync_count": 0}


def save_state(state: dict):
    STATE_FILE.write_text(json.dumps(state, indent=2))


# ─── GitHub Gist Backend (Primary for Render) ────────────────
class GistBackend:
    """Primary backup backend for Render — uses GitHub Gists."""
    
    def __init__(self):
        self.available = bool(GITHUB_TOKEN)
        if self.available:
            log("Gist backend: available ✅", "INFO")
        else:
            log("Gist backend: not configured (set GITHUB_GIST_TOKEN)", "INFO")

    def restore(self) -> bool:
        if not self.available or not GITHUB_GIST_ID:
            return False
        try:
            import urllib.request
            log(f"Restoring from GitHub Gist: {GITHUB_GIST_ID}", "SYNC")
            req = urllib.request.Request(
                f"https://api.github.com/gists/{GITHUB_GIST_ID}",
                headers={"Authorization": f"token {GITHUB_TOKEN}"}
            )
            with urllib.request.urlopen(req) as resp:
                data = json.loads(resp.read())

            gist_dir = BACKUP_DIR / "gist"
            gist_dir.mkdir(parents=True, exist_ok=True)

            for filename, file_data in data.get("files", {}).items():
                content = file_data.get("content", "")
                (gist_dir / filename).write_text(content)

            # Restore to workspace
            for item in gist_dir.iterdir():
                dest = Path(WORKSPACE_PATH) / item.name
                dest.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(item, dest)

            log("Gist restore complete! 💾", "OK")
            return True
        except Exception as e:
            log(f"Gist restore failed: {e}", "WARN")
            return False

    def sync(self) -> bool:
        if not self.available:
            return False
        try:
            import urllib.request
            # Collect workspace files
            files = {}
            ws = Path(WORKSPACE_PATH)
            for f in sorted(ws.rglob("*")):
                if f.is_file() and f.stat().st_size < 1_000_000:
                    rel = str(f.relative_to(ws))
                    if any(part.startswith('.') for part in f.parts):
                        continue
                    if any(skip in rel for skip in ['node_modules', '__pycache__', '.git']):
                        continue
                    try:
                        files[rel] = {"content": f.read_text(errors='replace')}
                    except Exception:
                        continue

            payload = json.dumps({
                "description": f"RendClaw backup {datetime.now(timezone.utc).isoformat()}",
                "files": files
            }).encode()

            if GITHUB_GIST_ID:
                url = f"https://api.github.com/gists/{GITHUB_GIST_ID}"
                method = "PATCH"
            else:
                url = "https://api.github.com/gists"
                method = "POST"

            req = urllib.request.Request(url, data=payload, method=method, headers={
                "Authorization": f"token {GITHUB_TOKEN}",
                "Content-Type": "application/json"
            })
            with urllib.request.urlopen(req) as resp:
                result = json.loads(resp.read())
                gist_url = result.get('html_url', '')
                
                # Save gist ID for future syncs
                if not GITHUB_GIST_ID and result.get('id'):
                    log(f"Created new Gist: {gist_url}", "OK")
                else:
                    log(f"Gist sync complete! {gist_url}", "OK")
            return True
        except Exception as e:
            log(f"Gist sync failed: {e}", "WARN")
            return False


# ─── HuggingFace Datasets Backend ────────────────────────────
class HFBackend:
    """Optional backup to HuggingFace Datasets."""
    
    def __init__(self):
        self.repo_id = f"{HF_USERNAME}/{HF_DATASET}" if HF_USERNAME else None
        self.local_dir = BACKUP_DIR / "hf"
        self.available = bool(HF_TOKEN and HF_USERNAME)
        if self.available:
            log("HF backend: available ✅", "INFO")

    def restore(self) -> bool:
        if not self.available:
            return False
        try:
            from huggingface_hub import snapshot_download
            log(f"Restoring from HF: {self.repo_id}", "SYNC")
            snapshot_download(
                repo_id=self.repo_id,
                repo_type="dataset",
                local_dir=str(self.local_dir),
                token=HF_TOKEN
            )
            if self.local_dir.exists():
                for item in self.local_dir.iterdir():
                    if item.name.startswith('.'):
                        continue
                    dest = Path(WORKSPACE_PATH) / item.name
                    if item.is_dir():
                        if dest.exists():
                            shutil.rmtree(dest)
                        shutil.copytree(item, dest)
                    else:
                        shutil.copy2(item, dest)
                log("HF restore complete!", "OK")
                return True
        except Exception as e:
            log(f"HF restore failed: {e}", "WARN")
        return False

    def sync(self) -> bool:
        if not self.available:
            return False
        try:
            from huggingface_hub import HfApi
            api = HfApi(token=HF_TOKEN)

            self.local_dir.mkdir(parents=True, exist_ok=True)
            ws = Path(WORKSPACE_PATH)
            exclude_dirs = {'.git', '__pycache__', 'node_modules', '.cache'}

            for item in ws.iterdir():
                if item.name.startswith('.') and item.name not in {'.env', '.env.example'}:
                    continue
                if item.name in exclude_dirs:
                    continue
                dest = self.local_dir / item.name
                if item.is_dir():
                    if dest.exists():
                        shutil.rmtree(dest)
                    shutil.copytree(item, dest, ignore=shutil.ignore_patterns(*exclude_dirs))
                else:
                    shutil.copy2(item, dest)

            meta = {
                "last_sync": datetime.now(timezone.utc).isoformat(),
                "platform": os.environ.get("NEOCLAW_PLATFORM", "render"),
                "model": os.environ.get("LLM_MODEL", "unknown"),
                "hash": get_workspace_hash()
            }
            (self.local_dir / ".rendclaw-meta.json").write_text(json.dumps(meta, indent=2))

            api.upload_folder(
                folder_path=str(self.local_dir),
                repo_id=self.repo_id,
                repo_type="dataset",
                token=HF_TOKEN,
                commit_message=f"RendClaw auto-sync {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S')}"
            )
            log("HF sync complete!", "OK")
            return True
        except Exception as e:
            log(f"HF sync failed: {e}", "WARN")
            return False


# ─── S3 Backend ──────────────────────────────────────────────
class S3Backend:
    """Optional backup to AWS S3."""
    
    def __init__(self):
        self.available = bool(S3_BUCKET)
        if self.available:
            log("S3 backend: available ✅", "INFO")

    def restore(self) -> bool:
        if not self.available:
            return False
        try:
            log(f"Restoring from S3: {S3_BUCKET}", "SYNC")
            # Create temp archive
            archive = BACKUP_DIR / "s3-backup.tar.gz"
            archive.parent.mkdir(parents=True, exist_ok=True)

            result = subprocess.run(
                ["aws", "s3", "cp", f"s3://{S3_BUCKET}/rendclaw-backup.tar.gz", str(archive)],
                capture_output=True, timeout=60
            )
            if result.returncode == 0:
                subprocess.run(
                    ["tar", "-xzf", str(archive), "-C", WORKSPACE_PATH],
                    capture_output=True
                )
                log("S3 restore complete!", "OK")
                return True
        except Exception as e:
            log(f"S3 restore failed: {e}", "WARN")
        return False

    def sync(self) -> bool:
        if not self.available:
            return False
        try:
            archive = BACKUP_DIR / "rendclaw-backup.tar.gz"
            archive.parent.mkdir(parents=True, exist_ok=True)

            # Create tar of workspace
            subprocess.run(
                ["tar", "-czf", str(archive), "-C", WORKSPACE_PATH, "."],
                capture_output=True, timeout=60
            )

            # Upload to S3
            subprocess.run(
                ["aws", "s3", "cp", str(archive), f"s3://{S3_BUCKET}/rendclaw-backup.tar.gz"],
                capture_output=True, timeout=60
            )
            log("S3 sync complete!", "OK")
            return True
        except Exception as e:
            log(f"S3 sync failed: {e}", "WARN")
            return False


# ─── Sync Manager ─────────────────────────────────────────────
class SyncManager:
    def __init__(self):
        self.backends = []
        # Priority: Gist (best for Render) > HF > S3
        if GITHUB_TOKEN:
            self.backends.append(GistBackend())
        if HF_TOKEN and HF_USERNAME:
            self.backends.append(HFBackend())
        if S3_BUCKET:
            self.backends.append(S3Backend())

        if not self.backends:
            log("No backup backends configured!", "WARN")
            log("Set GITHUB_GIST_TOKEN for GitHub Gist backup", "INFO")
            log("Or set HF_USERNAME + HF_TOKEN for HuggingFace backup", "INFO")

    def restore(self) -> bool:
        for backend in self.backends:
            if backend.restore():
                return True
        return False

    def sync(self) -> bool:
        success = False
        for backend in self.backends:
            if backend.sync():
                success = True
                break
        return success

    def run_daemon(self):
        """Run continuous sync daemon."""
        log(f"Starting sync daemon (interval: {SYNC_INTERVAL}s)")
        log(f"Backends: {[type(b).__name__ for b in self.backends]}")

        state = load_state()

        while True:
            try:
                current_hash = get_workspace_hash()
                if current_hash != state.get("last_hash", ""):
                    log("Changes detected — syncing...", "SYNC")
                    if self.sync():
                        state["last_hash"] = current_hash
                        state["last_sync"] = time.time()
                        state["sync_count"] = state.get("sync_count", 0) + 1
                        save_state(state)
                    else:
                        log("All sync backends failed!", "ERROR")
                else:
                    log("No changes detected", "INFO")
            except Exception as e:
                log(f"Sync error: {e}", "ERROR")

            time.sleep(SYNC_INTERVAL)


# ─── CLI ──────────────────────────────────────────────────────
def main():
    manager = SyncManager()

    if len(sys.argv) > 1:
        cmd = sys.argv[1]
        if cmd == "--restore":
            sys.exit(0 if manager.restore() else 1)
        elif cmd == "--sync":
            sys.exit(0 if manager.sync() else 1)
        elif cmd == "--daemon":
            manager.run_daemon()
        elif cmd == "--status":
            state = load_state()
            print(json.dumps(state, indent=2))
        else:
            print(f"Usage: {sys.argv[0]} [--restore|--sync|--daemon|--status]")
            sys.exit(1)
    else:
        manager.sync()


if __name__ == "__main__":
    main()
