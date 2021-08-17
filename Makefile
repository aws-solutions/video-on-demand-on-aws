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

test :: check-node-version
	./deployment/run-unit-tests.sh

build :: check-node-version
	./deployment/build-s3-dist.sh

export TF_VAR_region
tf ::
	terraform -chdir=source/terraform/ init -reconfigure -upgrade=true $(TF_BACKEND_CFG)
	terraform -chdir=source/terraform/ $(MODE)

all :: build terraform

LAMBDA_NODE_VER=14
CURR_NODE_VER=$(shell node -v)
ifeq ($(patsubst v$(LAMBDA_NODE_VER).%,matched,$(CURR_NODE_VER)), matched)
	NODE_LAMBDA=true
else
	NODE_LAMBDA=false
endif

.PHONY: check-node-version
check-node-version:
	@$(NODE_LAMBDA) || echo Build requires Node v$(LAMBDA_NODE_VER) \('nvm use $(LAMBDA_NODE_VER)'\)
	@$(NODE_LAMBDA) && echo Building using Node v$(LAMBDA_NODE_VER)