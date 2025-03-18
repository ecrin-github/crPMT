#!/bin/bash

# Source of some of the code: https://medium.com/@wujido20/handling-flags-in-bash-scripts-4b06b4d0ed04

# Default variable values
production=false
verbose=false
build_path="dist/crpmt"
backup_path="dist/crpmt-backup"
target_path="/var/www/crpmt/dist"


usage() {
    echo "Builds and moves the angular app to a target location, and saves previous build."
    echo "Usage: $0 [OPTIONS]"
    echo "Options:"
    echo " -h, --help                   Display this help message"
    echo " -v, --verbose                Enable verbose mode (outputs commands)"
    echo " -p, --production             Build in production mode instead of default dev mode"
    echo " -b, --build_path [path]      Path of angular build result (should match path in angular.json), default: $build_path"
    echo " -s, --backup_path [path]     Path of previous build to be backed up, default: $backup_path"
    echo " -t, --target_path [path]     Path of directory listed in the Nginx config file to move the build to, default: $target_path"
}

build() {
    if [[ "$verbose" = true ]]; then
        set -x
    fi
    if [[ "$production" = true ]]; then
        npm run build_prod
    else
        npm run build_dev
    fi
    sudo rm -rf $backup_path
    if [[ -d $target_path ]]; then
        sudo mkdir -p $backup_path
        sudo mv $target_path $backup_path
        sudo mkdir -p $target_path
    else
    echo "mkdir target path: $target_path"
        sudo mkdir -p $target_path
    fi
    if [[ -d $build_path ]]; then
        sudo mv $build_path $target_path
    else
        echo "Error: build directory ($build_path) does not exist."
        exit 1
    fi
    sudo systemctl restart nginx
}

# Parsing command-line arguments
while [ $# -gt 0 ]; do
    case $1 in
        -h | --help)
            usage
            exit 0
            ;;
        -v | --verbose)
            verbose=true
            ;;
        -p | --production)
            production=true
            ;;
        -b | --build_path)
            build_path=$@
            shift
            ;;
        -s | --backup_path)
            backup_path=$@
            shift
            ;;
        -t | --target_path)
            target_path=$@
            shift
            ;;
        *)
            echo "Invalid option: $1" >&2
            usage
            exit 1
            ;;
    esac
    shift
done

build
