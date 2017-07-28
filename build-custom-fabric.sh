#!/bin/bash
set -e

repo="https://github.com/cmac1000/fabric.js.git"
commit="8ce02b600c13"

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

# checkout a specific commit
echo "Switching to commit=$commit"
git checkout $commit

# Run the build
echo "Running build"
npm install
PATH="$PATH:../node_modules/.bin" node build.js modules=ALL minifier=uglifyjs
