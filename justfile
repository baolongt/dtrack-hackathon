import "./just/dfx.just"
import "./just/build.just"
import "./just/demo.just"

ARTIFACTS_DIR := env("ARTIFACTS_DIR", "./target/artifacts")
FRONTEND_DIR := "./src/dtrack_frontend"

# Lists all the available commands
default:
  @just --list
