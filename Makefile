SERVICE := buzzhub
TF_VAR_region ?= eu-west-1
MODE ?= plan

ACCOUNT := $(shell aws --output text sts get-caller-identity --query "Account")
VERSION := $(shell git rev-parse --short HEAD)

TF_BACKEND_CFG := -backend-config=bucket=terraform-state-$(ACCOUNT)-$(TF_VAR_region) \
	-backend-config=region=$(TF_VAR_region) \
	-backend-config=key="regional/solutions/$(SERVICE)/terraform.tfstate"

clean ::
	@cd $(WORK_DIR) && rm -rf ./dist/

npm/install ::
	cd $(WORK_DIR) && npm install

npm/test ::
	cd $(WORK_DIR) && npm run test

build ::
	cd $(WORK_DIR) && npm run build

export TF_VAR_region
tf ::
	terraform -chdir=source/terraform/ init -reconfigure -upgrade=true $(TF_BACKEND_CFG)
	terraform -chdir=source/terraform/ $(MODE)

all :: build terraform