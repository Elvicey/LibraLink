#!/usr/bin/env bash
# Loads .env into the environment, then starts the backend. Spring Boot has no
# dotenv support of its own (no such dependency in pom.xml) - see .env's own
# header comment - so this script is the auto-load step that replaces having
# to `source .env` by hand before every run.
set -euo pipefail
cd "$(dirname "$0")"
set -a
source .env
set +a
exec ./mvnw spring-boot:run "$@"
