"""CLI for the release version workflow. Run via ./scripts/bump-version."""

from __future__ import annotations

import argparse
import subprocess
import sys

import release


def _git_tags() -> list[str]:
    out = subprocess.run(["git", "tag", "--list"], capture_output=True, text=True, check=True)
    tags = [line.strip() for line in out.stdout.splitlines() if line.strip()]
    if not tags:
        shallow = subprocess.run(
            ["git", "rev-parse", "--is-shallow-repository"],
            capture_output=True,
            text=True,
            check=True,
        )
        if shallow.stdout.strip() == "true":
            print(
                "warning: shallow clone with no tags — the release version will be "
                "computed from 0.0.0; use 'fetch-depth: 0' so tags are available.",
                file=sys.stderr,
            )
    return tags


def _cmd_current(args) -> int:
    print(release.read_manifest_version(args.manifest))
    return 0


def _cmd_bump(args) -> int:
    new_version = release.expected_version(_git_tags(), args.kind)
    release.set_manifest_version(args.manifest, new_version)
    print(new_version)
    return 0


def _cmd_verify(args) -> int:
    expected = release.expected_version(_git_tags(), args.kind)
    actual = release.read_manifest_version(args.manifest)
    if actual != expected:
        print(
            f"::error::package.json version {actual} does not match the '{args.kind}' bump "
            f"(expected {expected} relative to the latest release tag). "
            f"Run ./scripts/bump-version bump {args.kind}.",
            file=sys.stderr,
        )
        return 1
    print(f"OK: package.json version {actual} matches the '{args.kind}' bump.")
    return 0


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(prog="bump-version", description="Manage the release version.")
    p.add_argument("--manifest", default="package.json", help="path to package.json")
    sub = p.add_subparsers(dest="cmd", required=True)

    sub.add_parser("current", help="print the package.json version").set_defaults(fn=_cmd_current)

    b = sub.add_parser("bump", help="write the next version into package.json for <kind>")
    b.add_argument("kind", choices=release.BUMP_KINDS)
    b.set_defaults(fn=_cmd_bump)

    v = sub.add_parser("verify", help="assert the package.json version matches the <kind> bump")
    v.add_argument("kind", choices=release.BUMP_KINDS)
    v.set_defaults(fn=_cmd_verify)
    return p


def main(argv=None) -> int:
    args = build_parser().parse_args(argv)
    try:
        return args.fn(args)
    except (ValueError, FileNotFoundError, subprocess.CalledProcessError) as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
