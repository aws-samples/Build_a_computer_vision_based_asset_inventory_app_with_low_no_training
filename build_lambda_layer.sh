#!/bin/bash
rm -rf ./layer_build
mkdir -p ./layer_build/python

cat <<@EOF > layer_build/requirements.txt
faiss-cpu
pillow
@EOF

pip install -r layer_build/requirements.txt -t ./layer_build/python

cd ./layer_build;zip -q -o -r lambda_layer.zip *

bucket_name=blogpost-asset-inventory-$(uuidgen)
aws s3 mb s3://$bucket_name

aws s3 cp lambda_layer.zip s3://$bucket_name

Lambda_Layer_ARN=$(aws lambda publish-layer-version --layer-name asset-inventory-blog \
    --description "Asset Inventory Blog FAISS and Pillow layer" \
    --content S3Bucket=$bucket_name,S3Key=lambda_layer.zip \
    --compatible-runtimes python3.9 \
    --compatible-architectures "x86_64" --output json | jq ."LayerVersionArn")

aws s3 rm s3://$bucket_name/lambda_layer.zip

aws s3 rb s3://$bucket_name

echo "LAMBA LAYER VERSION ARN: ${Lambda_Layer_ARN}"