const { execSync } = require("child_process");
const os = require("os");

function installPlatformDeps() {
  const platform = os.platform();
  const arch = os.arch();

  console.log(
    `Installing platform-specific dependencies for ${platform}-${arch}`,
  );

  try {
    // Install lightningcss platform-specific binary
    if (platform === "darwin") {
      if (arch === "arm64") {
        execSync("npm install --no-save lightningcss-darwin-arm64", {
          stdio: "inherit",
        });
        execSync("npm install --no-save @tailwindcss/oxide-darwin-arm64", {
          stdio: "inherit",
        });
      } else {
        execSync("npm install --no-save lightningcss-darwin-x64", {
          stdio: "inherit",
        });
        execSync("npm install --no-save @tailwindcss/oxide-darwin-x64", {
          stdio: "inherit",
        });
      }
    } else if (platform === "win32") {
      execSync("npm install --no-save lightningcss-win32-x64-msvc", {
        stdio: "inherit",
      });
      execSync("npm install --no-save @tailwindcss/oxide-win32-x64-msvc", {
        stdio: "inherit",
      });
    } else if (platform === "linux") {
      if (arch === "arm64") {
        execSync("npm install --no-save lightningcss-linux-arm64-gnu", {
          stdio: "inherit",
        });
        execSync("npm install --no-save @tailwindcss/oxide-linux-arm64-gnu", {
          stdio: "inherit",
        });
      } else {
        execSync("npm install --no-save lightningcss-linux-x64-gnu", {
          stdio: "inherit",
        });
        execSync("npm install --no-save @tailwindcss/oxide-linux-x64-gnu", {
          stdio: "inherit",
        });
      }
    }

    console.log("Platform-specific dependencies installed successfully");
  } catch (error) {
    console.warn(
      "Warning: Failed to install some platform-specific dependencies:",
      error.message,
    );
    // Don't fail the build, as these are optional
  }
}

// Only run if called directly
if (require.main === module) {
  installPlatformDeps();
}

module.exports = { installPlatformDeps };
