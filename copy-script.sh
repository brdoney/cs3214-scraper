#!/bin/bash

find ./out/cs3214/fall2023 -type f -regex '.*\.\(pdf\|pptx\|html\)' -exec cp {} ~/Thesis/privateGPT/source_documents/ \;
cp ./files.json ~/Thesis/privateGPT/
