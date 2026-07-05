{
  description = "USB reverse-engineering mini-lab series (usbmon + Wireshark + web dashboard)";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";

  outputs = { self, nixpkgs }:
    let
      systems = [ "x86_64-linux" "aarch64-linux" ];
      forAll = f: nixpkgs.lib.genAttrs systems (system: f nixpkgs.legacyPackages.${system});
    in {
      devShells = forAll (pkgs: {
        default = pkgs.mkShell {
          packages = [
            pkgs.wireshark-cli   # tshark
            pkgs.nodejs_20
            (pkgs.python3.withPackages (ps: [ ps.pyusb ]))
            pkgs.usbutils         # lsusb
          ];
          shellHook = ''
            echo "USB Labs dev shell. Run ./scripts/check-env.sh to verify capture setup."
            echo "Note: usbmon still needs 'sudo modprobe usbmon' (kernel module)."
          '';
        };
      });
    };
}
