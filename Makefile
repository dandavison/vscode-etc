install: build uninstall
	code --install-extension vscode-etc-*.vsix --force
	code --list-extensions --show-versions | grep vscode-etc

uninstall:
	code --uninstall-extension dandavison.vscode-etc || true
	! code --list-extensions --show-versions | grep vscode-etc

build:
	vsce package > /dev/null
