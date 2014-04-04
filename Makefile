TESTS             = $(shell find tests -type f -name test-*)

-COVERAGE_DIR    := out/test/
-RELEASE_DIR     := out/release/

-RELEASE_COPY    := lib tests node_modules
-COVERAGE_COPY   := lib tests node_modules

-BIN_MOCHA       := ./node_modules/.bin/mocha
-BIN_JSCOVER     := ./node_modules/.bin/jscover
-BIN_COFFEE      := ./node_modules/coffee-script/bin/coffee

-TESTS           := $(sort $(TESTS))

-COFFEE_LIB      := $(shell find lib -type f -name '*.coffee')
-COFFEE_TEST     := $(shell find tests -type f -name 'test-*.coffee')

-COFFEE_COVERAGE := $(-COFFEE_LIB)
-COFFEE_COVERAGE += $(-COFFEE_TEST)

-COFFEE_RELEASE  := $(addprefix $(-RELEASE_DIR),$(-COFFEE_COVERAGE) )
-COFFEE_COVERAGE := $(addprefix $(-COVERAGE_DIR),$(-COFFEE_COVERAGE) )

-COVERAGE_FILE   := coverage.html

-COVERAGE_TESTS  := $(addprefix $(-COVERAGE_DIR),$(-TESTS))
-COVERAGE_TESTS  := $(-COVERAGE_TESTS:.coffee=.js)

-RELEASE_TESTS   := $(addprefix $(-RELEASE_DIR),$(-TESTS))
-RELEASE_TESTS   := $(-RELEASE_TESTS:.coffee=.js)

-TESTS_ENV       := tests/env.js
-COVERAGE_ENV    := $(addprefix $(-COVERAGE_DIR),$(-TESTS_ENV))
-RELEASE_ENV     := $(addprefix $(-RELEASE_DIR),$(-TESTS_ENV))

-LOGS_DIR        := logs

default: dev

-common-pre: clean -npm-install -logs

dev: -common-pre
	@$(-BIN_MOCHA) \
		--colors \
		--ignore-leaks  \
		--reporter spec \
		--growl \
		$(-TESTS)

test: -common-pre
	@$(-BIN_MOCHA) \
		--no-colors \
		--ignore-leaks \
		--reporter tap \
		$(-TESTS)

-pre-test-cov: -common-pre
	@-rm $(-COVERAGE_FILE)
	@echo 'copy files'
	@mkdir -p $(-COVERAGE_DIR)

	@if [ `echo $$OSTYPE | grep -c 'darwin'` -eq 1 ]; then \
		cp -r $(-COVERAGE_COPY) $(-COVERAGE_DIR); \
	else \
		cp -rL $(-COVERAGE_COPY) $(-COVERAGE_DIR); \
	fi

	@echo "compile coffee-script files"
	# @$(-BIN_COFFEE) -cb $(-COFFEE_COVERAGE)
	# @rm -f $(-COFFEE_COVERAGE)

	@echo "generate coverage files"
	@$(-BIN_JSCOVER) $(-COVERAGE_DIR)/lib $(-COVERAGE_DIR)/lib

	@echo "run coverage test"
	@$(-BIN_MOCHA) \
		--no-colors \
		--ignore-leaks \
		--reporter tap \
		--require $(-COVERAGE_ENV) \
		$(-COVERAGE_TESTS)

test-rel: -release-pre
	@mkdir -p $(-RELEASE_DIR)/run
	@echo "run release test"
	@echo $$PWD
	@$(-BIN_COFFEE) -cb $(-COFFEE_RELEASE)
	@$(-BIN_MOCHA) \
		--no-colors \
		--reporter tap \
		--require $(-RELEASE_ENV) \
		$(-RELEASE_TESTS)

test-cov: -pre-test-cov
	@echo "make coverage report"
	@touch $(-COVERAGE_FILE)
	@-$(-BIN_MOCHA) \
		--no-colors \
		--ignore-leaks \
		--reporter html-cov \
		--require $(-COVERAGE_ENV) \
		$(-COVERAGE_TESTS) > $(-COVERAGE_FILE)

	@echo "test report saved \"$(-COVERAGE_FILE)\""
	@if [ `echo $$OSTYPE | grep -c 'darwin'` -eq 1 ]; then open $(-COVERAGE_FILE); else gnome-open $(-COVERAGE_FILE); fi

-release-pre : -common-pre
	@echo 'copy files'
	@mkdir -p $(-RELEASE_DIR)

	@if [ `echo $$OSTYPE | grep -c 'darwin'` -eq 1 ]; then \
		cp -r $(-RELEASE_COPY) $(-RELEASE_DIR); \
	else \
		cp -rL $(-RELEASE_COPY) $(-RELEASE_DIR); \
	fi

	@cd $(-RELEASE_DIR)
	@cp package.json $(-RELEASE_DIR)

	@cd $(-RELEASE_DIR) && PYTHON=`which python2.6` npm --color=false --registry=http://registry.npmjs.org install --production


release: -release-pre
	@rm -fr $(-RELEASE_DIR)/tests
	@echo "all codes in \"$(-RELEASE_DIR)\""

.-PHONY: default

-npm-install:
	@npm --color=false --registry=http://registry.npmjs.org install

clean:
	@echo 'clean'
	@-rm -fr out
	@-rm -fr $(-LOGS_DIR)

-logs:
	@mkdir -p $(-LOGS_DIR)