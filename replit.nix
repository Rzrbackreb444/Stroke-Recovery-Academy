{pkgs}: {
  deps = [
    pkgs.postgresql16Packages.pgvector
    pkgs.poppler_utils
    pkgs.chromium
  ];
}
