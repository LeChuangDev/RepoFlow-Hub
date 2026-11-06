#!/usr/bin/env bash
# =============================================================================
# RepoFlow Hub · pre-commit 本地钩子
# 放置位置：<仓库根>/.repoflow/hooks/firmware-checks.sh
# 职责：只编译本次提交涉及的 CMake 子工程；检测到 CTest 目标时运行单元测试。
# 原则：没有 CMakePresets.json 或没有测试目标时明确打印跳过原因，不伪造通过。
# =============================================================================
set -euo pipefail

root="$(git rev-parse --show-toplevel)"
cd "$root"

shopt -s nullglob
presets=(*/CMakePresets.json)
if [ ${#presets[@]} -eq 0 ]; then
  echo "[firmware-checks] 未检测到 CMakePresets.json，跳过编译门禁"
  exit 0
fi

changed="$(git diff --cached --name-only || true)"
targets=()
for f in "${presets[@]}"; do
  p="${f%/*}"
  if [ -z "$changed" ] || grep -q "^${p}/" <<< "$changed"; then
    targets+=("$p")
  fi
done

if [ ${#targets[@]} -eq 0 ]; then
  echo "[firmware-checks] 本次改动不涉及 CMake 子工程，跳过编译"
  exit 0
fi

for p in "${targets[@]}"; do
  echo "[firmware-checks] 编译 $p"
  (cd "$p" && cmake --preset release && cmake --build --preset release)
done

for p in "${targets[@]}"; do
  if [ -f "$p/build/release/CTestTestfile.cmake" ]; then
    echo "[firmware-checks] 运行单元测试 $p"
    ctest --test-dir "$p/build/release" --output-on-failure
  else
    echo "[firmware-checks] $p 未定义 CTest 目标，跳过单元测试"
  fi
done
