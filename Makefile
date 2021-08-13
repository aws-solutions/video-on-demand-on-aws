SERVICE := buzzhub
TF_VAR_region ?= eu-west-1
MODE ?= plan

ACCOUNT = $(shell aws --output text sts get-caller-identity --query "Account")
VERSION = $(shell git rev-parse --short HEAD)

TF_BACKEND_CFG = -backend-config=bucket=terraform-state-$(ACCOUNT)-$(TF_VAR_region) \
	-backend-config=region=$(TF_VAR_region) \
	-backend-config=key="regional/solutions/$(SERVICE)/terraform.tfstate"

clean ::
	@rm -rf ./target

test ::
	./deployment/run-unit-tests.sh

build :: test
	./deployment/build-s3-dist.sh

export TF_VAR_region
tf ::
	terraform -chdir=source/terraform/ init -reconfigure -upgrade=true $(TF_BACKEND_CFG)
	terraform -chdir=source/terraform/ $(MODE)

all :: build terraform