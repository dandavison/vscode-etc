install: clean build uninstall
	code --install-extension vscode-etc-*.vsix --force
	code --list-extensions --show-versions | grep vscode-etc

clean:
	@rm *.vsix 2>/dev/null || true

build:
	yes | vsce package

uninstall:
	code --uninstall-extension dandavison.vscode-etc || true
	! code --list-extensions --show-versions | grep vscode-etc

# Show or bump the version. Default bump is patch; pass any npm version argument:
#   make version                 # 0.0.15
#   make version-bump            # 0.0.15 -> 0.0.16
#   make version-bump V=minor    # 0.0.15 -> 0.1.0
#   make version-bump V=0.1.0-blame.1
version:
	@node -p "require('./package.json').version"

V ?= patch
version-bump:
	npm version --no-git-tag-version $(V)
