#!/bin/bash
set -e

repo="https://github.com/kangax/fabric.js.git"
tag="v1.6.7"

# if fabric hasn't been cloned, clone it
echo "Checking that fabric has been cloned"
if [ ! -d "fabric" ]; then
    echo "It hasn't. Cloning now"
    git clone $repo fabric
else
    echo "Already cloned"
fi

# change working directory
cd fabric

# see if we've already build
head -n 1 dist/fabric.js  | egrep "exclude=.*,?gestures" > /dev/null || exit 0

# checkout a specific commit
echo "Switching to commit=$commit"
git checkout .
git checkout tags/$tag

# Run the build
echo "Running build"
npm install
PATH="$PATH:../node_modules/.bin" node build.js modules=ALL minifier=uglifyjs
