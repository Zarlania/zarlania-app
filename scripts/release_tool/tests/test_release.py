import json
import textwrap

import pytest
import release


def test_parse_version_plain():
    assert release.parse_version("1.2.3") == (1, 2, 3)


def test_parse_version_strips_v_prefix_and_suffix():
    assert release.parse_version("v1.2.3") == (1, 2, 3)
    assert release.parse_version("1.2.3-SNAPSHOT") == (1, 2, 3)


def test_parse_version_rejects_garbage():
    with pytest.raises(ValueError):
        release.parse_version("not-a-version")


def test_format_version():
    assert release.format_version((1, 2, 3)) == "1.2.3"


def test_bump_major_minor_patch():
    assert release.bump((1, 2, 3), "major") == (2, 0, 0)
    assert release.bump((1, 2, 3), "minor") == (1, 3, 0)
    assert release.bump((1, 2, 3), "patch") == (1, 2, 4)


def test_bump_rejects_unknown_kind():
    with pytest.raises(ValueError):
        release.bump((1, 2, 3), "huge")


def test_latest_tag_version_empty_is_zero():
    assert release.latest_tag_version([]) == (0, 0, 0)


def test_latest_tag_version_numeric_not_lexical():
    # 0.10.0 must beat 0.2.0 (lexical sort would pick 0.2.0)
    assert release.latest_tag_version(["v0.2.0", "v0.10.0", "v0.9.0"]) == (0, 10, 0)


def test_latest_tag_version_ignores_non_semver_tags():
    assert release.latest_tag_version(["nightly", "v1.0.0", "release-candidate"]) == (1, 0, 0)


def test_expected_version_first_release():
    assert release.expected_version([], "minor") == "0.1.0"
    assert release.expected_version([], "patch") == "0.0.1"
    assert release.expected_version([], "major") == "1.0.0"


def test_expected_version_from_latest_tag():
    assert release.expected_version(["v1.4.2"], "patch") == "1.4.3"


def _manifest(tmp_path, version):
    p = tmp_path / "package.json"
    p.write_text(
        textwrap.dedent(
            f"""\
            {{
              "name": "zarlania-app",
              "version": "{version}",
              "private": true
            }}
            """
        ),
        encoding="utf-8",
    )
    return p


def test_read_manifest_version(tmp_path):
    p = _manifest(tmp_path, "1.2.3")
    assert release.read_manifest_version(p) == "1.2.3"


def test_set_manifest_version_round_trips(tmp_path):
    p = _manifest(tmp_path, "1.2.3")
    release.set_manifest_version(p, "2.0.0")
    assert release.read_manifest_version(p) == "2.0.0"
    # other keys/formatting preserved
    assert '"name": "zarlania-app"' in p.read_text(encoding="utf-8")


def test_read_manifest_version_missing_raises(tmp_path):
    p = tmp_path / "package.json"
    p.write_text('{"name": "x"}\n', encoding="utf-8")
    with pytest.raises(ValueError):
        release.read_manifest_version(p)


def test_parse_version_rejects_four_part():
    with pytest.raises(ValueError):
        release.parse_version("1.2.3.4")


def _lockfile(tmp_path, version):
    p = tmp_path / "package-lock.json"
    p.write_text(
        textwrap.dedent(
            f"""\
            {{
              "name": "zarlania-app",
              "version": "{version}",
              "lockfileVersion": 3,
              "requires": true,
              "packages": {{
                "": {{
                  "name": "zarlania-app",
                  "version": "{version}"
                }}
              }}
            }}
            """
        ),
        encoding="utf-8",
    )
    return p


def test_sync_lockfile_version_updates_both_project_fields(tmp_path):
    _manifest(tmp_path, "1.2.3")
    lock = _lockfile(tmp_path, "1.2.3")
    release.sync_lockfile_version(tmp_path / "package.json", "2.0.0")
    data = json.loads(lock.read_text(encoding="utf-8"))
    assert data["version"] == "2.0.0"
    assert data["packages"][""]["version"] == "2.0.0"
    # dependency-tree structure untouched
    assert data["lockfileVersion"] == 3


def test_sync_lockfile_version_noop_when_lockfile_absent(tmp_path):
    _manifest(tmp_path, "1.2.3")  # no lockfile alongside it
    # must not raise
    release.sync_lockfile_version(tmp_path / "package.json", "2.0.0")
