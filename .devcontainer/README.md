# Development Container for OpenSVM P2P Exchange

This directory contains the development container configuration for the OpenSVM P2P Exchange project, providing a fully configured environment with all necessary tools preinstalled.

## What's Included

The development container automatically installs and configures:

- **Rust toolchain** with latest stable version
- **Node.js 18** with npm and build tools
- **Anchor 0.31.1** via Anchor Version Manager (AVM)
- **System dependencies** for Solana development (libudev-dev, libssl-dev, etc.)
- **VS Code extensions** for Rust, TypeScript, and Tailwind CSS development
- **Project dependencies** via `npm install --legacy-peer-deps`

## Usage

### With GitHub Codespaces
1. Navigate to the repository on GitHub
2. Click "Code" → "Create codespace on main"
3. Wait ~3-5 minutes for automatic setup to complete
4. Start developing immediately with `npm run dev`

### With VS Code
1. Install the "Dev Containers" extension
2. Open the project in VS Code
3. Command palette: "Dev Containers: Reopen in Container"
4. Wait for setup to complete
5. Start developing with `npm run dev`

### With GitHub Copilot
The development container is automatically detected and used by GitHub Copilot coding agents, providing immediate access to a fully configured environment.

## Configuration Files

- `devcontainer.json`: Main configuration with base image, features, and VS Code settings
- `setup.sh`: Post-creation script that installs project-specific tools and dependencies

## Ports

The container forwards these ports for development:
- `3000`: Next.js development server
- `8899`: Solana local validator (if used)

## Troubleshooting

If setup fails:
1. Check the terminal output during container creation
2. Manually run `.devcontainer/setup.sh` to see detailed error messages
3. Ensure Docker/Podman is running and has sufficient resources (4GB+ RAM recommended)

## Manual Setup Alternative

If you cannot use the development container, refer to the manual setup instructions in `.github/copilot-instructions.md`.