#!/bin/bash

mkdir -p ~/Thesis/privateGPT/source_documents/

cp ./full-mappings.json ~/Thesis/privateGPT/

# Copy everything
find ./out/cs3214/fall2023 -type f -not -regex '.*\.\(svg\|tar\|gz\|mp4\|out\)' -exec cp {} ~/Thesis/privateGPT/source_documents/ \;
# Copy just pdfs, pptx, and html
# find ./out/cs3214/fall2023 -type f -regex '.*\.\(pdf\|pptx\|html\)' -exec cp {} ~/Thesis/privateGPT/source_documents/ \;

# Copy code from repos - excludes .git/ files and .gitignore
find ./out/repos -type f -not -path "*.git*" -not -regex '.*\.\(svg\|tar\|gz\|mp4\|out\)' -exec cp {} ~/Thesis/privateGPT/source_documents/ \;
