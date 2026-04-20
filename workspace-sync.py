#!/usr/bin/env python3
"""
🎨🦞 RendClaw Workspace Sync
Multi-backend backup: GitHub Gist, S3, HuggingFace Datasets
Optimized for Render (no built-in storage like HF)

v2 — Fixed: nested path handling, GIST_ID persistence, robust restore
"""

import os
import sys
import json
import time
import shutil
import subprocess
import hashlib
import base64
import tarfile
import io
from pathlib import Path
from datetime import datetime, timezone
from typing import Optional

# ─── Configuration ─────────────────────────────────────────────
WORKSPACE_PATH = os.environ.get("WORKSPACE_PATH", "/root/.openclaw/workspace")
SYNC_INTERVAL = int(os.environ.get("SYNC_INTERVAL", "120"))

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

# Persistent GIST_ID storage — survives restarts within same deploy
GIST_ID_FILE = Path("/root/.openclaw/.rendclaw-gist-id")


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


def get_persisted_gist_id() -> str:
    """Get GIST_ID from env, state file, or workspace file (in that priority)."""
    # 1. Environment variable (highest priority)
    if GITHUB_GIST_ID:
        return GITHUB_GIST_ID
    # 2. Persistent file in workspace
    if GIST_ID_FILE.exists():
        try:
            return GIST_ID_FILE.read_text().strip()
        except Exception:
            pass
    # 3. State file
    state = load_state()
    return state.get("gist_id", "")


def persist_gist_id(gist_id: str):
    """Save GIST_ID to both file and state so it survives restarts."""
    try:
        GIST_ID_FILE.parent.mkdir(parents=True, exist_ok=True)
        GIST_ID_FILE.write_text(gist_id)
    except Exception as e:
        log(f"Could not persist GIST_ID to file: {e}", "WARN")
    
    state = load_state()
    state["gist_id"] = gist_id
    save_state(state)


# ─── GitHub Gist Backend (Primary for Render) ────────────────
class GistBackend:
    """Primary backup backend for Render — uses GitHub Gists.
    
    Gists are flat (no real directories), so we handle nested paths by:
    - On sync: flatten paths like 'memory/2026-04-20.md' → gist filename 'memory/2026-04-20.md'
      (GitHub API supports slashes in gist filenames natively!)
    - On restore: recreate directory structure from gist filenames
    - For large workspaces: pack into a single .tar.gz base64 blob as fallback
    """
    
    def __init__(self):
        self.available = bool(GITHUB_TOKEN)
        self.gist_id = get_persisted_gist_id()
        if self.available:
            log(f"Gist backend: available ✅ (GIST_ID: {self.gist_id or 'new'})", "INFO")
        else:
            log("Gist backend: not configured (set GITHUB_GIST_TOKEN)", "INFO")

    def restore(self) -> bool:
        if not self.available:
            return False
        
        gist_id = get_persisted_gist_id()
        if not gist_id:
            log("No GIST_ID found — nothing to restore from", "INFO")
            return False
            
        try:
            import urllib.request
            log(f"Restoring from GitHub Gist: {gist_id}", "SYNC")
            req = urllib.request.Request(
                f"https://api.github.com/gists/{gist_id}",
                headers={"Authorization": f"token {GITHUB_TOKEN}"}
            )
            with urllib.request.urlopen(req) as resp:
                data = json.loads(resp.read())

            files = data.get("files", {})
            if not files:
                log("Gist is empty — nothing to restore", "WARN")
                return False

            ws = Path(WORKSPACE_PATH)
            
            # Check if we have a tar.gz archive (our preferred format)
            if "workspace.tar.gz.b64" in files:
                log("Found archived workspace — extracting...", "SYNC")
                b64_content = files["workspace.tar.gz.b64"].get("content", "")
                tar_bytes = base64.b64decode(b64_content)
                tar_buffer = io.BytesIO(tar_bytes)
                with tarfile.open(fileobj=tar_buffer, mode="r:gz") as tar:
                    tar.extractall(path=str(ws))
                log("Archive restore complete! 💾", "OK")
                return True

            # Fallback: restore individual files (preserves directory structure)
            # GitHub API supports slashes in gist filenames, so paths like
            # 'memory/2026-04-20.md' work natively — mkdir recreates dirs.
            restored_count = 0
            for filename, fdata in files.items():
                # Skip metadata/backup files
                if filename.startswith('.rendclaw'):
                    continue
                if filename == "workspace.tar.gz.b64":
                    continue
                content = fdata.get("content", "")
                dest = ws / filename
                dest.parent.mkdir(parents=True, exist_ok=True)
                dest.write_text(content)
                restored_count += 1

            log(f"Restored {restored_count} files from Gist! 💾", "OK")
            return True
        except urllib.error.HTTPError as e:
            if e.code == 404:
                log(f"Gist {gist_id} not found (404) — may have been deleted", "WARN")
            else:
                log(f"Gist restore failed: HTTP {e.code}", "WARN")
            return False
        except Exception as e:
            log(f"Gist restore failed: {e}", "WARN")
            return False

    def sync(self) -> bool:
        if not self.available:
            return False
        try:
            import urllib.request
            
            ws = Path(WORKSPACE_PATH)
            
            # Pack workspace into tar.gz for reliable nested path handling
            tar_buffer = io.BytesIO()
            with tarfile.open(fileobj=tar_buffer, mode="w:gz") as tar:
                for f in sorted(ws.rglob("*")):
                    if f.is_file():
                        rel = str(f.relative_to(ws))
                        # Skip hidden dirs, git, node_modules, etc.
                        parts = f.relative_to(ws).parts
                        if any(p.startswith('.') for p in parts):
                            continue
                        if any(skip in rel for skip in ['node_modules', '__pycache__', '.git']):
                            continue
                        # Skip large files (>500KB)
                        try:
                            if f.stat().st_size > 500_000:
                                continue
                            tar.add(str(f), arcname=rel)
                        except (PermissionError, OSError):
                            continue
            
            tar_bytes = tar_buffer.getvalue()
            b64_content = base64.b64encode(tar_bytes).decode()
            
            # Also keep individual files as fallback (small workspaces)
            individual_files = {}
            for f in sorted(ws.rglob("*")):
                if f.is_file() and f.stat().st_size < 100_000:
                    rel = str(f.relative_to(ws))
                    parts = f.relative_to(ws).parts
                    if any(p.startswith('.') for p in parts):
                        continue
                    if any(skip in rel for skip in ['node_modules', '__pycache__', '.git']):
                        continue
                    try:
                        individual_files[rel] = {"content": f.read_text(errors='replace')}
                    except Exception:
                        continue

            # Build gist payload — archive as primary, individual files as reference
            files = {
                "workspace.tar.gz.b64": {"content": b64_content}
            }
            
            # Add key workspace files individually for easy browsing
            for key_file in ["AGENTS.md", "SOUL.md", "USER.md", "IDENTITY.md", 
                             "TOOLS.md", "HEARTBEAT.md", "MEMORY.md"]:
                if key_file in individual_files:
                    files[key_file] = individual_files[key_file]

            # Add metadata
            meta = {
                "last_sync": datetime.now(timezone.utc).isoformat(),
                "platform": os.environ.get("NEOCLAW_PLATFORM", "render"),
                "file_count": len(individual_files),
                "hash": get_workspace_hash(),
                "gist_version": 2
            }
            files[".rendclaw-meta.json"] = {"content": json.dumps(meta, indent=2)}

            payload = json.dumps({
                "description": f"🦞 RendClaw workspace backup — {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}",
                "files": files
            }).encode()

            gist_id = get_persisted_gist_id()
            if gist_id:
                url = f"https://api.github.com/gists/{gist_id}"
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
                new_id = result.get('id', '')
                
                if not gist_id and new_id:
                    persist_gist_id(new_id)
                    log(f"Created new Gist: {gist_url} (ID: {new_id})", "OK")
                    log(f"GIST_ID persisted to {GIST_ID_FILE}", "INFO")
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

            subprocess.run(
                ["tar", "-czf", str(archive), "-C", WORKSPACE_PATH, "."],
                capture_output=True, timeout=60
            )

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
        """Try all backends in priority order until one succeeds."""
        for backend in self.backends:
            try:
                if backend.restore():
                    return True
            except Exception as e:
                log(f"{type(backend).__name__} restore error: {e}", "WARN")
                continue
        return False

    def sync(self) -> bool:
        """Sync to all backends (best-effort, at least one must succeed)."""
        success = False
        for backend in self.backends:
            try:
                if backend.sync():
                    success = True
                    # Don't break — sync to ALL configured backends for redundancy
            except Exception as e:
                log(f"{type(backend).__name__} sync error: {e}", "WARN")
        return success

    def run_daemon(self):
        """Run continuous sync daemon."""
        log(f"Starting sync daemon (interval: {SYNC_INTERVAL}s)")
        log(f"Backends: {[type(b).__name__ for b in self.backends]}")

        state = load_state()
        consecutive_failures = 0

        while True:
            try:
                current_hash = get_workspace_hash()
                if current_hash and current_hash != state.get("last_hash", ""):
                    log("Changes detected — syncing...", "SYNC")
                    if self.sync():
                        state["last_hash"] = current_hash
                        state["last_sync"] = time.time()
                        state["sync_count"] = state.get("sync_count", 0) + 1
                        save_state(state)
                        consecutive_failures = 0
                    else:
                        consecutive_failures += 1
                        log(f"All sync backends failed! (attempt {consecutive_failures})", "ERROR")
                        if consecutive_failures >= 5:
                            log("5 consecutive failures — will keep retrying but check your config!", "ERROR")
                else:
                    # No changes, but do a periodic full sync every 10 cycles
                    # (handles edge cases like gist ID recovery)
                    if state.get("sync_count", 0) % 10 == 0 and state.get("sync_count", 0) > 0:
                        log("Periodic full sync...", "SYNC")
                        self.sync()
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
            state["gist_id"] = get_persisted_gist_id()
            state["backends"] = [type(b).__name__ for b in manager.backends]
            print(json.dumps(state, indent=2))
        elif cmd == "--reset-gist":
            if GIST_ID_FILE.exists():
                GIST_ID_FILE.unlink()
                log("Gist ID file removed", "OK")
            state = load_state()
            state.pop("gist_id", None)
            save_state(state)
            log("Gist ID removed from state", "OK")
        else:
            print(f"Usage: {sys.argv[0]} [--restore|--sync|--daemon|--status|--reset-gist]")
            sys.exit(1)
    else:
        manager.sync()


if __name__ == "__main__":
    main()
