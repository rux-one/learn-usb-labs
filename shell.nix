# Fallback for non-flake Nix users:  nix-shell
{ pkgs ? import <nixpkgs> {} }:
pkgs.mkShell {
  packages = [
    pkgs.wireshark-cli
    pkgs.nodejs_20
    (pkgs.python3.withPackages (ps: [ ps.pyusb ]))
    pkgs.usbutils
  ];
  shellHook = ''
    echo "USB Labs dev shell. Run ./scripts/check-env.sh to verify capture setup."
    echo "Note: usbmon still needs 'sudo modprobe usbmon' (kernel module)."
  '';
}
