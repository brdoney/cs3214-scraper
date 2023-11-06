#!/bin/bash

OUT_DIR="./out/repos"

mkdir -p $OUT_DIR
cd $OUT_DIR

while IFS="" read -r line || [ -n "$line" ]
do
    # Replace http access with ssh
    repo=$(echo "$line" | sed 's/https:\/\//git@/' | sed 's/\//:/' )
    echo "$repo"
    git clone $repo
done < ../../repos.txt
