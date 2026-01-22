import os
import sys
import subprocess
import json
import shutil
import tempfile
import pytest

ROOT = os.path.dirname(os.path.dirname(__file__))
PY = sys.executable


def run_cmd(args, env=None, timeout=30):
    env = env or os.environ.copy()
    # Ensure required AIRTABLE env vars exist to allow importing main.py
    env.setdefault("AIRTABLE_APP_ID", "test_base")
    env.setdefault("AIRTABLE_API_KEY", "test_key")

    result = subprocess.run(
        args,
        env=env,
        cwd=ROOT,
        capture_output=True,
        text=True,
        timeout=timeout,
    )
    return result


def test_cli_help_shows_usage():
    """CLI: top-level help should include 'Usage:'"""
    res = run_cmd([PY, "main.py", "--help"]) 
    assert res.returncode == 0
    assert "Usage:" in res.stdout or "Usage:" in res.stderr


def test_generate_mermaid_graph_help():
    """CLI: generate-mermaid-graph help should mention 'Generate'"""
    res = run_cmd([PY, "main.py", "generate-mermaid-graph", "--help"]) 
    assert res.returncode == 0
    out = res.stdout + res.stderr
    assert "Generate" in out


def test_eval_formula_simple():
    """CLI: eval-formula should evaluate a simple IF(TRUE, 'yes', 'no')"""
    res = run_cmd([PY, "main.py", "eval-formula", "-f", "IF(TRUE, 'yes', 'no')"]) 
    assert res.returncode == 0
    out = (res.stdout or "") + (res.stderr or "")
    # Expect 'Result' and the string 'yes'
    assert "Result" in out
    assert "yes" in out.lower()


@pytest.mark.skipif(not os.path.exists(os.path.join(ROOT, "demo_base_schema.json")), reason="demo_base_schema.json not available")
def test_generate_postgres_schema_writes_file(tmp_path):
    """CLI: generate-postgres-schema should create an SQL file when given demo schema"""
    out_file = tmp_path / "test_schema.sql"
    res = run_cmd([PY, "main.py", "generate-postgres-schema", "-s", "demo_base_schema.json", "-o", str(out_file)])
    assert res.returncode == 0, f"STDOUT:\n{res.stdout}\nSTDERR:\n{res.stderr}"
    assert out_file.exists()
    content = out_file.read_text()
    assert "CREATE TABLE" in content.upper() or "PostgreSQL" in res.stdout
