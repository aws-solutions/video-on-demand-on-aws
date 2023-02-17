SERVICE := buzzhub
TF_VAR_region ?= eu-west-1
MODE ?= plan
DO_TF_UPGRADE ?= false

ACCOUNT = $(eval ACCOUNT := $$(shell aws --output text sts get-caller-identity --query "Account"))$(ACCOUNT)
VERSION = $(eval VERSION := $$(shell git rev-parse --short HEAD))$(VERSION)

TF_BACKEND_CFG = $(eval TF_BACKEND_CFG := -backend-config=bucket=terraform-state-$(ACCOUNT)-$(TF_VAR_region) \
	-backend-config=region=$(TF_VAR_region) \
	-backend-config=key="regional/solutions/$(SERVICE)/terraform.tfstate")$(TF_BACKEND_CFG)

all :: build terraform

clean ::
	@rm -rf ./target

test :: check-node-version
	./deployment/run-unit-tests.sh

build :: check-node-version clean
	# node_modules may contain dev dependencies, so clean them first.
	find . -name node_modules -type d -prune -exec rm -fr {} \;
	./deployment/build-s3-dist.sh

export TF_VAR_region
tf ::
	rm -f source/terraform/.terraform/terraform.tfstate || true
	terraform -chdir=source/terraform init -upgrade=$(DO_TF_UPGRADE) $(TF_BACKEND_CFG)
	if [ "true" == "$(DO_TF_UPGRADE)" ]; then terraform -chdir=source/terraform providers lock -platform=darwin_amd64 -platform=linux_amd64; fi
	terraform -chdir=source/terraform $(MODE)

LAMBDA_NODE_VER=14
CURR_NODE_VER=$(shell node -v)
ifeq ($(patsubst v$(LAMBDA_NODE_VER).%,matched,$(CURR_NODE_VER)), matched)
	NODE_LAMBDA=true
else
	NODE_LAMBDA=false
endif

.PHONY: check-node-version
check-node-version: ## Checks node version compatibility
	@$(NODE_LAMBDA) || echo Build requires Node v$(LAMBDA_NODE_VER) \('nvm use $(LAMBDA_NODE_VER)'\)
	@$(NODE_LAMBDA) && echo Building using Node v$(LAMBDA_NODE_VER)