#!/bin/bash -eu

THIS_DIR="$(cd -P "$(dirname "$(readlink -f "$0")")" && pwd)"
DOCKERFILE="${THIS_DIR}/Dockerfile"
DOCKER_IMAGE_TAG="ac9f4e30a1e52710c7168fd2b0b4f101"

docker build -f "${DOCKERFILE}" -t "${DOCKER_IMAGE_TAG}" "${THIS_DIR}" && \
docker run --rm -it \
    -h video-on-demand-on-aws \
    -v "${HOME}/.aws:/root/.aws" \
    -v "${THIS_DIR}:/root/workspace" \
    "${DOCKER_IMAGE_TAG}"
