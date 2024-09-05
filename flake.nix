{
  description = "keg-scale developmen environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-24.05";

    pio-nixpkgs.url = "https://github.com/NixOS/nixpkgs/archive/3592b10a67b518700002f1577e301d73905704fe.tar.gz";

    pre-commit-hooks = {
      url = "github:cachix/pre-commit-hooks.nix";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs = {
    self,
    nixpkgs,
    pio-nixpkgs,
    pre-commit-hooks,
    ...
  }: let
    system = "x86_64-linux";
    pkgs = nixpkgs.legacyPackages.${system};
    pio-pkgs = import pio-nixpkgs {
      inherit system;
      config.allowUnfree = true;
    };
  in {
    formatter.${system} = pkgs.alejandra;

    checks.${system} = {
      pre-commit-check = pre-commit-hooks.lib.${system}.run {
        src = ./.;
        hooks = {
          alejandra.enable = true; # formatter
          deadnix.enable = true; # detect unused variable bindings in `*.nix`
          statix.enable = true; # lints and suggestions for Nix code
        };
      };
    };

    devShells.${system}.default = let
      pio-python = pio-pkgs.python3.withPackages (ps:
        with ps; [
          pip
          setuptools
          platformio
          pyserial
        ]);
    in
      (pkgs.buildFHSUserEnv {
        name = "keg-scale-dev-shell";
        targetPkgs = pkgs: (with pkgs; [
          esptool
          nodejs_20
          openocd
          pio-python
          platformio-core
        ]);
        runScript = ''
          zsh -c "export DIRENV_DISABLE=1; exec zsh"
          ${self.checks.${system}.pre-commit-check.shellHook}
        '';
      })
      .env;
  };
}
